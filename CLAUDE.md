# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Brain is a personal assistant MVP that turns messages or documents into clear tasks and deadlines. The current v0 scope is minimal: paste text, click "Process", save to Supabase, extract tasks (currently stub), and display sorted by due date.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Package Manager**: npm (package-lock.json present, also has pnpm-lock.yaml)

## Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Building
npm run build            # Production build
npm start                # Start production server

# Code quality
npm run lint             # Run ESLint

# Database setup
npx tsx scripts/setup-db.ts  # Run database schema (requires .env.local)
```

## Environment Setup

1. Copy `.env.local.example` to `.env.local`
2. Add your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` (from Supabase dashboard → Settings → API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase dashboard → Settings → API)
3. Run `supabase/schema.sql` in your Supabase SQL Editor to create tables

Note: The actual environment variable name in use is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, not `NEXT_PUBLIC_SUPABASE_ANON_KEY` (check app/utils/supabase/*.ts).

## Architecture

### Database Schema

Two main tables defined in `supabase/schema.sql`:

- **notes**: Stores raw text input
  - `id` (UUID), `raw_text` (TEXT), `created_at` (TIMESTAMP)
- **tasks**: Extracted tasks linked to notes via `note_id`
  - `id` (UUID), `note_id` (FK), `title`, `description`, `due_date` (DATE), `status` (default: 'todo'), `created_at`
  - Indexed on: `note_id`, `due_date`, `status`

### Supabase Client Pattern

The app uses Supabase SSR with separate client creation for different contexts:

- **Server Components/API Routes**: `app/utils/supabase/server.ts` → `createClient(cookies())`
  - Handles cookie-based session management
  - Used in API routes (see `app/api/process/route.ts`)
- **Client Components**: `app/utils/supabase/client.ts` → `createClient()`
  - Browser-based client for client components

Both use environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.

### API Routes

- **POST /api/process**: Main processing endpoint
  - Accepts `{ raw_text: string }`
  - Creates note record, then creates stub task linked to note
  - Returns both note and task data
  - Currently creates a "Stub task" placeholder (LLM integration pending)

### Key Files

- `app/page.tsx`: Main UI (textarea + Process button)
- `app/api/process/route.ts`: Note + task creation logic
- `supabase/schema.sql`: Database schema definition
- `scripts/setup-db.ts`: Database setup helper (may need manual SQL execution)

## Code Style & Conventions

From `.cursorrules`:

- Use British English for all text and comments
- Keep components simple and focused
- Follow React best practices
- Use Tailwind CSS for all styling
- Path alias: `@/*` maps to project root

## Current State

The MVP currently:
- Accepts text input via textarea
- Saves to `notes` table
- Creates a stub task (title: "Stub task") in `tasks` table
- Does NOT yet call an LLM to extract real tasks/due dates
- Does NOT yet display the tasks list

Out of scope for v0: integrations, multi-user auth, notifications, fancy UI/animations.
