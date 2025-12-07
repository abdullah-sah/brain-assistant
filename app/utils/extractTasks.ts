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
	try {
		const { object } = await generateObject({
			model: openai('gpt-4o-mini'),
			schema: tasksResponseSchema,
			prompt: `You are a task extraction assistant. Analyse the following text and extract all actionable tasks with their due dates (if mentioned).

Rules:
- Only extract clear, actionable tasks (things to do, not just statements or thoughts)
- For each task, provide a concise title
- Add a description only if there's additional context worth capturing
- Extract due dates in their original format (e.g., "tomorrow", "next Friday", "15th December", "2025-12-15")
- If no due date is mentioned for a task, set due_date_raw to null
- If the text contains no actionable tasks, return an empty array

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
