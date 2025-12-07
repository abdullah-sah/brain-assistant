-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	raw_text TEXT NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
	title TEXT NOT NULL,
	description TEXT,
	due_date DATE,
	status TEXT DEFAULT 'todo',
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on note_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_note_id ON tasks(note_id);

-- Create index on due_date for sorting
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
