'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';

interface Task {
	id: string;
	title: string;
	description?: string;
	due_date?: string;
	source: 'meeting' | 'email' | 'message' | 'note';
	completed: boolean;
	isOverdue?: boolean;
}

export default function Home() {
	const [transcript, setTranscript] = useState('');
	const [source, setSource] = useState<'meeting' | 'email' | 'message' | 'note'>('meeting');
	const [processing, setProcessing] = useState(false);
	const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentView, setCurrentView] = useState<'active' | 'completed'>('active');

	// Fetch tasks on mount
	const fetchTasks = async () => {
		try {
			const response = await fetch('/api/tasks');
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to fetch tasks');
			}

			// Map database tasks to UI format
			const mappedTasks = (data.tasks || []).map((task: any) => ({
				id: task.id,
				title: task.title,
				description: task.description,
				due_date: task.due_date,
				source: task.source || 'note',
				completed: task.status === 'completed',
				isOverdue: task.isOverdue,
			}));

			setTasks(mappedTasks);
		} catch (error) {
			console.error('Error fetching tasks:', error);
		} finally {
			setLoading(false);
		}
	};

	// Fetch tasks on component mount
	useEffect(() => {
		fetchTasks();
	}, []);

	const handleProcess = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!transcript.trim()) {
			setMessage({ type: 'error', text: 'Please enter some text to process' });
			return;
		}

		setProcessing(true);
		setMessage(null);

		try {
			const response = await fetch('/api/process', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ raw_text: transcript, source }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to process text');
			}

			setMessage({
				type: 'success',
				text: `Successfully processed! Extracted ${data.tasks_count} task${data.tasks_count !== 1 ? 's' : ''}.`,
			});
			setTranscript('');
			// Refetch tasks to show newly created ones
			await fetchTasks();
		} catch (error) {
			setMessage({
				type: 'error',
				text: error instanceof Error ? error.message : 'An unexpected error occurred',
			});
		} finally {
			setProcessing(false);
		}
	};

	const toggleTask = async (id: string) => {
		const task = tasks.find((t) => t.id === id);
		if (!task) return;

		// Optimistic update
		setTasks((prev) =>
			prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
		);

		try {
			const response = await fetch('/api/tasks', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, completed: !task.completed }),
			});

			if (!response.ok) {
				// Revert optimistic update on error
				setTasks((prev) =>
					prev.map((t) => (t.id === id ? { ...t, completed: task.completed } : t))
				);
				throw new Error('Failed to update task');
			}
		} catch (error) {
			console.error('Error toggling task:', error);
		}
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return null;
		const date = new Date(dateString);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		if (date.toDateString() === today.toDateString()) return 'Today';
		if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

		return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	};

	const getSourceColor = (source: Task['source']) => {
		const colors = {
			meeting: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
			email: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
			message: 'bg-green-500/10 text-green-400 border-green-500/20',
			note: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
		};
		return colors[source];
	};

	// Filter tasks based on current view
	const activeTasks = tasks.filter((task) => !task.completed);
	const completedTasks = tasks.filter((task) => task.completed);
	const displayedTasks = currentView === 'active' ? activeTasks : completedTasks;

	// Logout handler
	const handleLogout = async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		window.location.href = '/login';
	};

	return (
		<div className="min-h-screen bg-bg-primary text-text-primary">
			<div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
				{/* Header */}
				<header className="mb-8">
					<div className="flex items-start justify-between">
						<div>
							<h1 className="text-[length:var(--font-size-xl)] font-semibold leading-tight tracking-tight">
								Brain Assistant
							</h1>
							<p className="mt-2 text-[length:var(--font-size-base)] leading-relaxed text-text-secondary">
								A memory prosthetic for commitments made in conversation.
							</p>
						</div>
						<button
							onClick={handleLogout}
							className="rounded-lg border border-border-input bg-bg-secondary px-3 py-2 text-[length:var(--font-size-sm)] font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
						>
							Logout
						</button>
					</div>
				</header>

				{/* Input Section */}
				<section className="mb-12">
					<form onSubmit={handleProcess} className="space-y-4">
						{/* Source Selector */}
						<div>
							<label className="mb-2 block text-[length:var(--font-size-sm)] font-medium text-text-secondary">
								Source Type
							</label>
							<div className="flex gap-2">
								{(['meeting', 'email', 'message', 'note'] as const).map((type) => (
									<button
										key={type}
										type="button"
										onClick={() => setSource(type)}
										className={`flex-1 rounded-lg border px-3 py-2 text-[length:var(--font-size-sm)] font-medium capitalize transition-colors ${
											source === type
												? 'border-white bg-white text-black'
												: 'border-border-input bg-bg-secondary text-text-secondary hover:border-border-hover hover:text-text-primary'
										}`}
									>
										{type}
									</button>
								))}
							</div>
						</div>

						<div>
							<label htmlFor="transcript" className="sr-only">
								Paste meeting transcript, email, or message
							</label>
							<textarea
								id="transcript"
								value={transcript}
								onChange={(e) => setTranscript(e.target.value)}
								placeholder="Paste meeting transcript, email, or message..."
								rows={8}
								className="w-full resize-none rounded-lg border border-border-input bg-bg-secondary px-4 py-3 text-[length:var(--font-size-base)] leading-relaxed text-text-primary placeholder-text-tertiary transition-colors focus:border-border-hover focus:outline-none focus:ring-2 focus:ring-white/10"
							/>
						</div>

						<button
							type="submit"
							disabled={processing || !transcript.trim()}
							className="w-full rounded-lg bg-white px-4 py-2.5 text-[length:var(--font-size-base)] font-medium text-black transition-colors hover:bg-interactive-primary-hover disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-6"
						>
							{processing ? 'Processing...' : 'Process'}
						</button>

						{/* Feedback Messages */}
						{message && (
							<div
								className={`rounded-lg border px-4 py-3 text-[length:var(--font-size-sm)] ${
									message.type === 'success'
										? 'border-status-success-border bg-status-success-bg text-status-success-text'
										: 'border-status-error-border bg-status-error-bg text-status-error-text'
								}`}
							>
								{message.text}
							</div>
						)}
					</form>
				</section>

				{/* Task List Section */}
				{loading ? (
					<div className="text-center text-text-tertiary">Loading tasks...</div>
				) : (
					<section>
						{/* Segment Control */}
						<div className="mb-6">
							<div className="flex items-center gap-1 rounded-lg border border-border-default bg-bg-primary p-1">
								<button
									onClick={() => setCurrentView('active')}
									className={`rounded-md px-4 py-2 text-[length:var(--font-size-sm)] font-medium tracking-wide transition-colors duration-150 ${
										currentView === 'active'
											? 'bg-bg-secondary text-white'
											: 'bg-transparent text-text-tertiary hover:bg-bg-hover-subtle hover:text-text-secondary'
									}`}
								>
									Active {activeTasks.length > 0 && `(${activeTasks.length})`}
								</button>
								<button
									onClick={() => setCurrentView('completed')}
									className={`rounded-md px-4 py-2 text-[length:var(--font-size-sm)] font-medium tracking-wide transition-colors duration-150 ${
										currentView === 'completed'
											? 'bg-bg-secondary text-white'
											: 'bg-transparent text-text-tertiary hover:bg-bg-hover-subtle hover:text-text-secondary'
									}`}
								>
									Completed {completedTasks.length > 0 && `(${completedTasks.length})`}
								</button>
							</div>
						</div>

						{/* Task List */}
						{displayedTasks.length > 0 ? (
							<div className="space-y-2">
								{displayedTasks.map((task) => (
								<div
									key={task.id}
									className={`group rounded-lg border bg-bg-secondary p-4 transition-colors hover:bg-bg-hover ${
										task.isOverdue ? 'border-status-warning/30' : 'border-border-default'
									}`}
								>
									<div className="flex items-start gap-3">
										<button
											onClick={() => toggleTask(task.id)}
											className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded border-2 transition-colors ${
												task.completed
													? 'border-status-completed bg-status-completed'
													: 'border-border-hover hover:border-border-focus'
											}`}
											aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
										>
											{task.completed && (
												<svg
													className="h-full w-full text-black"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													strokeWidth={3}
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M5 13l4 4L19 7"
													/>
												</svg>
											)}
										</button>

										<div className="min-w-0 flex-1">
											<div className="flex items-start justify-between gap-3">
												<h3
													className={`text-[length:var(--font-size-base)] leading-relaxed ${
														task.completed ? 'text-text-tertiary line-through' : 'text-text-primary'
													}`}
												>
													{task.title}
												</h3>
												{task.due_date && (
													<span
														className={`flex-shrink-0 text-[length:var(--font-size-sm)] ${
															task.isOverdue ? 'font-medium text-status-warning' : 'text-text-secondary'
														}`}
													>
														{formatDate(task.due_date)}
													</span>
												)}
											</div>

											{task.description && (
												<p className="mt-1 text-[length:var(--font-size-sm)] leading-relaxed text-text-secondary">
													{task.description}
												</p>
											)}

											<div className="mt-2">
												<span
													className={`inline-flex items-center rounded border px-2 py-0.5 text-[length:var(--font-size-xs)] font-medium uppercase tracking-wide ${getSourceColor(
														task.source
													)}`}
												>
													{task.source}
												</span>
											</div>
										</div>
									</div>
								</div>
							))}
							</div>
						) : (
							/* Empty State */
							<div className="flex flex-col items-center justify-center px-4 py-16">
								<div className="space-y-2 text-center text-sm text-text-tertiary">
									{currentView === 'active' ? (
										<>
											<p className="font-medium">No active commitments</p>
											<p className="text-xs text-text-muted">
												Tasks appear here when created or restored
											</p>
										</>
									) : (
										<>
											<p className="font-medium">No completed tasks yet</p>
											<p className="text-xs text-text-muted">Completed tasks will appear here</p>
										</>
									)}
								</div>
							</div>
						)}
					</section>
				)}
			</div>
		</div>
	);
}
