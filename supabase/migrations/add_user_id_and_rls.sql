-- Migration: Add user_id columns and enable Row Level Security
-- Run this migration in your Supabase SQL Editor

-- Step 1: Add user_id columns to both tables
ALTER TABLE notes
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE tasks
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create indexes on user_id for performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Step 3: Migrate existing data to your user account
-- To find your user ID, run: SELECT id, email FROM auth.users;
UPDATE notes SET user_id = '4587bea1-19bf-405c-9c5b-c8b4966ce45f' WHERE user_id IS NULL;
UPDATE tasks SET user_id = '4587bea1-19bf-405c-9c5b-c8b4966ce45f' WHERE user_id IS NULL;

-- Step 4: Make user_id NOT NULL after migration
ALTER TABLE notes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for notes table
CREATE POLICY "Users can view their own notes"
ON notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
ON notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON notes FOR DELETE
USING (auth.uid() = user_id);

-- Step 7: Create RLS policies for tasks table
CREATE POLICY "Users can view their own tasks"
ON tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
ON tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON tasks FOR DELETE
USING (auth.uid() = user_id);
