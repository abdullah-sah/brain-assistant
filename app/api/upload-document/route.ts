import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/app/utils/supabase/server';
import { parseDocument } from '@/app/utils/parseDocument';
import { extractTasks } from '@/app/utils/extractTasks';
import { parseDate, formatDateForDB } from '@/app/utils/parseDate';

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

const ALLOWED_MIME_TYPES = [
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/heic',
	'text/plain',
	'text/markdown',
];

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

		// Parse multipart/form-data
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const source = (formData.get('source') as string) || 'other';

		// Validate file
		if (!file) {
			return NextResponse.json(
				{ error: 'No file provided' },
				{ status: 400 }
			);
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{ error: 'File too large', details: `Maximum file size is 200MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.` },
				{ status: 400 }
			);
		}

		// Validate MIME type
		if (!ALLOWED_MIME_TYPES.includes(file.type)) {
			return NextResponse.json(
				{
					error: 'Unsupported file type',
					details: `Allowed types: PDF, DOCX, TXT, MD, JPG, PNG, HEIC. You uploaded: ${file.type}`,
				},
				{ status: 400 }
			);
		}

		// Validate source
		const validSources = ['meeting', 'email', 'message', 'note', 'other'];
		if (source && !validSources.includes(source)) {
			return NextResponse.json(
				{ error: `Invalid source. Must be one of: ${validSources.join(', ')}` },
				{ status: 400 }
			);
		}

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Parse document to extract text
		const { text, error: parseError } = await parseDocument(buffer, file.type);

		if (parseError || !text) {
			return NextResponse.json(
				{
					error: 'Text extraction failed',
					details: parseError || 'No text could be extracted from the document',
				},
				{ status: 400 }
			);
		}

		// Insert note into notes table
		const { data: note, error: noteError } = await supabase
			.from('notes')
			.insert({ raw_text: text, user_id: user.id })
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
		const extractedTasks = await extractTasks(text);

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
		console.error('Unexpected error in /api/upload-document:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
