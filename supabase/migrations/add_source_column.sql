-- Migration: Add source column to tasks table
-- Date: 2025-12-07
-- Description: Adds a source column to track where tasks were extracted from (meeting, email, message, note)

-- Add source column with default value 'other'
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'other';

-- Update existing tasks to have source = 'note' (better default than 'other')
UPDATE tasks SET source = 'note' WHERE source IS NULL;
