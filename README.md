# Brain

**A memory prosthetic for commitments made in conversation.**

Brain solves a simple problem: things people say to you in meetings, emails, and messages contain commitments you make, and those commitments evaporate unless you manually capture them. Brain intercepts those sources and extracts actionable items before they disappear.

## Vision

Build a personal assistant that prevents you from:
- Losing track of things mentioned in conversations & meetings
- Forgetting email follow-ups
- Having notes scattered and disorganised
- Not remembering what you agreed to do
- Missing commitments because no one followed up

**Long-term integrations:** Message history, document/note access, email context, voice interface (nice-to-have)

## Current Focus: Meeting Memory System

Starting with meeting transcripts because that's where most commitments are made and forgotten. The workflow:
1. Get meeting transcript (Zoom/Google Meet auto-generates)
2. Paste into Brain
3. Review extracted tasks
4. Track and complete commitments

Once this works for meetings, the same extraction logic applies to emails and messages.

## v0 Status (MVP)

**Completed:**
- ✅ Paste text into a textarea
- ✅ Click "Process"
- ✅ Brain saves the text, calls an LLM (GPT-4o-mini) to extract tasks + due dates
- ✅ Natural language date parsing ("tomorrow", "next Friday", etc.)
- ✅ Tasks stored in Supabase with proper structure

**In Progress:**
- 🔄 Show all tasks in a simple list, sorted by due date
- 🔄 Deploy to Vercel with basic auth
- 🔄 Add task completion tracking
- 🔄 Add source tracking (meeting/email/message)

**Out of scope for v0:**
- API integrations (Gmail, Slack, etc.)
- Multi-user auth
- Notifications
- Fancy UI/animations
- Voice interface
- Real-time automation

## Supabase Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project (or use an existing one)
3. Wait for the project to finish provisioning

### 2. Get Your Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

### 3. Set Up Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and add the required values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key-here
   OPENAI_API_KEY=sk-proj-your-openai-api-key-here

   # Personal identifiers for task extraction (optional but recommended)
   USER_NAME=Your Full Name
   USER_IDENTIFIERS=Your Full Name,username,nickname,other-names
   ```

   Notes:
   - Get your OpenAI API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - `USER_NAME` and `USER_IDENTIFIERS` help Brain extract only YOUR commitments from meeting transcripts (not everyone's)
   - List all variations of your name separated by commas in `USER_IDENTIFIERS`

### 4. Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the contents of `supabase/schema.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Verify the tables were created by going to **Table Editor** → you should see `notes` and `tasks` tables

### 5. Test the Connection

The Supabase client is now configured and ready to use. Import it in your code:

```typescript
import { supabase } from '@/lib/supabase';
```

You can test the connection by running the dev server and checking the browser console for any connection errors.
