import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Define the schema for a single extracted task
const taskSchema = z.object({
	title: z.string().describe('A concise title for the task'),
	description: z.string().nullable().describe('Optional detailed description of the task'),
	due_date_raw: z.string().nullable().describe('The due date in natural language format (e.g., "tomorrow", "next Monday", "2025-12-15", or null if no date mentioned)'),
});

// Define the schema for the response containing multiple tasks
const tasksResponseSchema = z.object({
	tasks: z.array(taskSchema).describe('Array of tasks extracted from the text'),
});

export type ExtractedTask = z.infer<typeof taskSchema>;

/**
 * Extracts tasks and due dates from raw text using OpenAI's GPT-4o-mini
 * @param rawText - The text to extract tasks from
 * @returns Array of extracted tasks with title, description, and raw due date
 */
export async function extractTasks(rawText: string): Promise<ExtractedTask[]> {
	// Get user name and identifiers from environment variables
	const userName = process.env.USER_NAME || 'the user';
	const userIdentifiers = process.env.USER_IDENTIFIERS
		? process.env.USER_IDENTIFIERS.split(',').map((id) => id.trim())
		: [];

	// Build the identity section of the prompt
	const identitySection =
		userIdentifiers.length > 0
			? `**User Identity:**
${userName} may be referred to as:
${userIdentifiers.map((id) => `- ${id}`).join('\n')}
- "I" or "I'll" when spoken by ${userName} in a transcript`
			: `**User Identity:**
The user may be referred to as "I" or "I'll" in first-person transcripts`;

	try {
		const { object } = await generateObject({
			model: openai('gpt-4o-mini'),
			schema: tasksResponseSchema,
			prompt: `You are a personal task extraction assistant${userName !== 'the user' ? ` for ${userName}` : ''}.

Your job is to extract ONLY the tasks and commitments that ${userName} personally agrees to do. Do NOT extract tasks for other people.

${identitySection}

**What to extract:**
- Tasks where ${userName} explicitly commits to doing something
- Look for phrases like: "I will", "I'll", "Let me", "I can", "I'll handle", "I'll take care of", "I need to"
- Action items explicitly assigned to ${userName}
- Follow-up items ${userName} agrees to do

**What NOT to extract:**
- Tasks assigned to other people
- General team goals or discussions unless ${userName} specifically commits
- Questions or suggestions that aren't commitments
- Tasks where ${userName} is just mentioned but doesn't commit

**Task Details:**
- Provide a concise, actionable title from ${userName}'s perspective (e.g., "Send report to Sarah", not "Sarah needs report")
- Add a description only if there's additional context worth capturing
- Extract due dates in their original format (e.g., "tomorrow", "next Friday", "15th December", "2025-12-15")
- If no due date is mentioned, set due_date_raw to null

**If the text contains no commitments from ${userName}, return an empty array.**

Text to analyse:
${rawText}`,
		});

		return object.tasks;
	} catch (error) {
		console.error('Error extracting tasks with OpenAI:', error);
		// Return empty array on error rather than throwing
		// This allows the note to still be saved even if LLM fails
		return [];
	}
}
