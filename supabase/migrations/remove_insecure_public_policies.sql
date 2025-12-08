-- Migration: Remove insecure public access RLS policies
-- These policies allowed any authenticated user to access all data
-- They conflicted with the user-specific policies, causing security issues
-- NOTE: Already executed via Supabase MCP on 2025-12-08, this file is for migration history

-- Drop insecure public access policies for notes table
DROP POLICY IF EXISTS "Allow public delete access to notes" ON notes;
DROP POLICY IF EXISTS "Allow public insert access to notes" ON notes;
DROP POLICY IF EXISTS "Allow public read access to notes" ON notes;
DROP POLICY IF EXISTS "Allow public update access to notes" ON notes;

-- Drop insecure public access policies for tasks table
DROP POLICY IF EXISTS "Allow public delete access to tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public insert access to tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public read access to tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public update access to tasks" ON tasks;
