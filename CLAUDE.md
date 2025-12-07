# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Brain** is a memory prosthetic for commitments made in conversation. It solves the problem of forgetting what you agreed to do in meetings, emails, and messages by using LLM to extract actionable tasks with due dates.

**Production URL:** https://brain-assistant.vercel.app

**Current Focus:** Meeting Memory System - paste meeting transcripts after calls to extract personal commitments.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with GitHub OAuth
- **LLM**: OpenAI GPT-4o-mini via Vercel AI SDK
- **Date Parsing**: chrono-node
- **Package Manager**: pnpm (also has npm lock files)

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

Required environment variables in `.env.local` and Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
OPENAI_API_KEY=sk-proj-your-key
USER_NAME=Your Full Name
USER_IDENTIFIERS=Your Name,username,nickname,variations
```

**Important:**
- `USER_NAME` and `USER_IDENTIFIERS` enable personal task filtering (extracts only your commitments from meeting transcripts)
- These are kept in `.env.local` (not committed to GitHub) for privacy
- Must be set in Vercel environment variables for production

## Architecture

### Database Schema

Two main tables in `supabase/schema.sql`:

- **notes**: Stores raw text input
  - `id` (UUID), `raw_text` (TEXT), `created_at` (TIMESTAMP)
  - **⚠️ TODO:** Add `user_id` column + RLS (Phase 2 of auth)

- **tasks**: Extracted tasks linked to notes
  - `id` (UUID), `note_id` (FK), `title` (TEXT), `description` (TEXT), `due_date` (DATE), `status` (TEXT, default: 'todo'), `source` (TEXT, default: 'other'), `created_at` (TIMESTAMP)
  - Indexed on: `note_id`, `due_date`, `status`
  - `source` values: 'meeting', 'email', 'message', 'note', 'other'
  - **⚠️ TODO:** Add `user_id` column + RLS (Phase 2 of auth)

### Supabase Client Pattern

The app uses Supabase SSR with separate client creation for different contexts:

- **Server Components/API Routes**: `app/utils/supabase/server.ts` → `createClient(cookies())`
  - Handles cookie-based session management
  - Used in API routes (see `app/api/process/route.ts`)
- **Client Components**: `app/utils/supabase/client.ts` → `createClient()`
  - Browser-based client for client components

Both use environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.

### API Routes

- **POST /api/process**: Main text processing endpoint
  - Accepts: `{ raw_text: string, source?: 'meeting' | 'email' | 'message' | 'note' }`
  - Creates note record in database
  - Calls LLM to extract tasks (using `app/utils/extractTasks.ts`)
  - Parses due dates with chrono-node (using `app/utils/parseDate.ts`)
  - Creates multiple task records linked to note
  - Returns: `{ note, tasks, tasks_count }`

- **GET /api/tasks**: Fetch all tasks
  - Returns all tasks sorted by due_date (nulls last)
  - Calculates `isOverdue` flag based on current date
  - **⚠️ TODO:** Filter by `user_id` (Phase 2)

- **PATCH /api/tasks**: Update task completion status
  - Accepts: `{ id: string, completed: boolean }`
  - Updates task status to 'completed' or 'todo'
  - **⚠️ TODO:** Verify user owns task (Phase 2)

### Authentication

- **GET /login**: Login page with GitHub OAuth button
- **GET /auth/callback**: OAuth callback route (exchanges code for session)
- **middleware.ts**: Protects all routes except `/login` and `/auth/*`
  - Redirects unauthenticated users to `/login`
  - Checks session with `supabase.auth.getUser()`

### Key Files

- `app/page.tsx`: Main UI (textarea, source selector, task list with Active/Completed tabs)
- `app/login/page.tsx`: Login page with GitHub OAuth
- `app/auth/callback/route.ts`: OAuth callback handler
- `middleware.ts`: Route protection
- `app/api/process/route.ts`: Text processing + LLM extraction
- `app/api/tasks/route.ts`: Task fetching and updates
- `app/utils/extractTasks.ts`: LLM task extraction using Vercel AI SDK
- `app/utils/parseDate.ts`: Natural language date parsing
- `supabase/schema.sql`: Database schema
- `supabase/migrations/add_source_column.sql`: Migration for source field

## Code Style & Conventions

From `.cursorrules`:

- Use British English for all text and comments
- Keep components simple and focused
- Follow React best practices
- Use Tailwind CSS for all styling
- Path alias: `@/*` maps to project root

## Current State (December 2025)

### ✅ Completed Features

**Core Functionality:**
- LLM-powered task extraction from meeting transcripts (GPT-4o-mini)
- Personal identifier filtering (extracts only user's commitments, not everyone's)
- Natural language date parsing ("tomorrow", "next Friday", "Dec 15")
- Source tracking (Meeting/Email/Message/Note selector)
- Task list with Active/Completed tabs
- Task completion tracking with checkboxes
- Overdue task highlighting

**UI/UX:**
- Professional dark-first design (#0a0a0a background)
- Mobile-responsive (primary use case: paste transcripts from phone)
- Segment control for Active/Completed task views
- Source badges with color coding
- Empty states for both Active and Completed views
- Logout button in header

**Infrastructure:**
- Deployed to Vercel at https://brain-assistant.vercel.app
- GitHub OAuth authentication (Phase 1 complete)
- Session persistence across devices
- Middleware protecting all routes

### ⚠️ In Progress / TODO

**Phase 2 - Database User Isolation (Issue #7):**
- [ ] Add `user_id` column to `notes` and `tasks` tables
- [ ] Migrate existing data to authenticated user
- [ ] Enable Row Level Security (RLS) on both tables
- [ ] Create RLS policies (SELECT/INSERT/UPDATE/DELETE check user_id)
- [ ] Update API routes to set `user_id` from session
- [ ] Verify data isolation works correctly

**Current Limitation:**
Authentication is working, but all tasks are globally accessible (no user isolation). Anyone logged in can see all tasks. Phase 2 will fix this by adding proper data isolation via RLS.

### Out of Scope for v0

- API integrations (Gmail, Slack, Calendar)
- Multi-user support (designed for single user)
- Notifications
- Voice interface (nice-to-have for later)
- Real-time automation
