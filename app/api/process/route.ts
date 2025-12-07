import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/app/utils/supabase/server';
import { extractTasks } from '@/app/utils/extractTasks';
import { parseDate, formatDateForDB } from '@/app/utils/parseDate';

export async function POST(request: Request) {
	try {
		const cookieStore = cookies();
		const supabase = createClient(cookieStore);

		// Get authenticated user
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Parse request body
		const body = await request.json();
		const { raw_text, source = 'other' } = body;

		// Validate input
		if (!raw_text || typeof raw_text !== 'string' || raw_text.trim().length === 0) {
			return NextResponse.json(
				{ error: 'raw_text is required and must be a non-empty string' },
				{ status: 400 }
			);
		}

		// Validate source if provided
		const validSources = ['meeting', 'email', 'message', 'note', 'other'];
		if (source && !validSources.includes(source)) {
			return NextResponse.json(
				{ error: `Invalid source. Must be one of: ${validSources.join(', ')}` },
				{ status: 400 }
			);
		}

		// Insert note into notes table
		const { data: note, error: noteError } = await supabase
			.from('notes')
			.insert({ raw_text: raw_text.trim(), user_id: user.id })
			.select()
			.single();

		if (noteError) {
			console.error('Error inserting note:', noteError);
			return NextResponse.json(
				{ error: 'Failed to create note', details: noteError.message },
				{ status: 500 }
			);
		}

		// Extract tasks from the text using LLM
		const extractedTasks = await extractTasks(raw_text.trim());

		// Parse dates and insert tasks into the database
		const tasksToInsert = extractedTasks.map((task) => {
			const parsedDate = parseDate(task.due_date_raw);
			const formattedDate = formatDateForDB(parsedDate);

			return {
				note_id: note.id,
				title: task.title,
				description: task.description,
				due_date: formattedDate,
				status: 'todo',
				source: source,
				user_id: user.id,
			};
		});

		// Insert all tasks at once (or none if extractedTasks is empty)
		let insertedTasks = [];
		if (tasksToInsert.length > 0) {
			const { data: tasks, error: taskError } = await supabase
				.from('tasks')
				.insert(tasksToInsert)
				.select();

			if (taskError) {
				console.error('Error inserting tasks:', taskError);
				return NextResponse.json(
					{
						error: 'Note created but failed to create tasks',
						details: taskError.message,
						note_id: note.id,
					},
					{ status: 500 }
				);
			}

			insertedTasks = tasks || [];
		}

		return NextResponse.json(
			{
				success: true,
				note: {
					id: note.id,
					raw_text: note.raw_text,
					created_at: note.created_at,
				},
				tasks: insertedTasks.map((task) => ({
					id: task.id,
					note_id: task.note_id,
					title: task.title,
					description: task.description,
					due_date: task.due_date,
					status: task.status,
					created_at: task.created_at,
				})),
				tasks_count: insertedTasks.length,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Unexpected error in /api/process:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
