# Personal Habit Tracker + Journal (Multi-Person)

A production-ready Next.js (App Router) + TypeScript + TailwindCSS app powered by Supabase Postgres. The app uses server-side route handlers to read/write data and keeps the Supabase service role key private.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Supabase (Postgres)
- Recharts (insights)

## Local Development
### 1) Create Supabase project
1. Create a project in Supabase.
2. Open the SQL Editor.
3. Run `supabase_schema.sql` to create tables and indexes.
4. Run `supabase_seed.sql` to insert seed data.

### 2) Configure environment
Create `.env.local`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_NAME=Routine Tracker
```

### 3) Install + run
```
npm install
npm run dev
```

Open http://localhost:3000

## Vercel Deployment
1. Push this repo to GitHub.
2. Create a new Vercel project and import the repo.
3. Set environment variables in Vercel Project Settings:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_NAME` (optional)
4. Ensure Node.js 18+ or 20 is selected.
5. Deploy.

## Notes
- All Supabase operations are performed inside Next.js route handlers (`/app/api/*`), never in the client.
- The active person is stored in a secure httpOnly cookie (`active_person_id`).
- The date picker supports backfilling and the insights page aggregates based on range and anchor date.
