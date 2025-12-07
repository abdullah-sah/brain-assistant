import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/app/utils/supabase/server';

export async function GET() {
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

		// Fetch all tasks for the current user (RLS will automatically filter by user_id)
		// Ordered by due_date (nulls last), then by created_at
		const { data: tasks, error } = await supabase
			.from('tasks')
			.select('*')
			.order('due_date', { ascending: true, nullsFirst: false })
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching tasks:', error);
			return NextResponse.json(
				{ error: 'Failed to fetch tasks', details: error.message },
				{ status: 500 }
			);
		}

		// Calculate if tasks are overdue
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const tasksWithOverdue = tasks.map((task) => {
			let isOverdue = false;
			if (task.due_date) {
				const dueDate = new Date(task.due_date);
				dueDate.setHours(0, 0, 0, 0);
				isOverdue = dueDate < today && task.status !== 'completed';
			}

			return {
				...task,
				isOverdue,
			};
		});

		return NextResponse.json({ tasks: tasksWithOverdue }, { status: 200 });
	} catch (error) {
		console.error('Unexpected error in /api/tasks:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

export async function PATCH(request: Request) {
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

		const body = await request.json();
		const { id, completed } = body;

		if (!id || typeof completed !== 'boolean') {
			return NextResponse.json(
				{ error: 'id and completed (boolean) are required' },
				{ status: 400 }
			);
		}

		// Update task status (RLS will automatically verify user owns this task)
		const { data: task, error } = await supabase
			.from('tasks')
			.update({ status: completed ? 'completed' : 'todo' })
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Error updating task:', error);
			return NextResponse.json(
				{ error: 'Failed to update task', details: error.message },
				{ status: 500 }
			);
		}

		return NextResponse.json({ task }, { status: 200 });
	} catch (error) {
		console.error('Unexpected error in /api/tasks PATCH:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
