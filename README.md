ADHD Exoskeleton — Supabase migration notes

This repository has been migrated to use Supabase as the backend. The legacy Express backend has been removed and all data access should now go through the Supabase JS client from the frontend.

Environment variables (frontend):
- VITE_SUPABASE_URL — your Supabase project URL
- VITE_SUPABASE_ANON_KEY — your Supabase anon public key

Server-side secrets (Supabase project settings / Edge Function):
- SUPABASE_SERVICE_ROLE_KEY — service_role key (only used in the Edge Function; never put this in frontend files)
- In Postgres, set a coach email as a DB setting: run `SELECT set_config('supabase.coach_email', 'coach@example.com', false);` in the SQL editor (replace with real coach email).

Quick manual steps (Supabase dashboard) before deploy:
1. Run the SQL in `supabase/schema.sql` in the Supabase SQL editor to create tables, trigger and RLS policies.
2. In Project Settings → API, copy `SUPABASE_URL` and add it to your `.env` as `VITE_SUPABASE_URL`.
3. In Project Settings → API, copy the anon key and add it to `.env` as `VITE_SUPABASE_ANON_KEY`.
4. Add the service-role key to your project secrets and name it `SUPABASE_SERVICE_ROLE_KEY` (used by the Edge Function only).
5. In the SQL editor run:
	`SELECT set_config('supabase.coach_email', 'coach@example.com', false);` replacing the email.
6. Deploy the Edge Function `invite-patient` via the Supabase CLI or the dashboard, setting environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the function.

Notes:
- The frontend initializes a single Supabase client in `src/lib/supabaseClient.js` and should be imported where needed.
- Input validation constants are in `src/lib/constants.js`. All string inputs must be sanitized with `dompurify` before writes.
- The Edge Function `invite-patient` handles patient invites and links patients to coaches. It uses the service role key and must not be bundled into frontend code.

Removed backend:
- The previous Express backend has been deleted; Supabase now provides DB, Auth and Admin APIs.

**Deployment (GitHub Pages)**

- **Live URL:** https://mollzilla.github.io/adhd_exoesqueleto/
- **Required GitHub Secrets:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **How to trigger a deploy:** push to the `main` branch. The workflow builds the frontend and deploys to `gh-pages`.
- **Manual GitHub Pages step (one-time):**
	1. Go to https://github.com/mollzilla/adhd_exoesqueleto/settings/pages
	2. Under "Source" select "Deploy from a branch"
	3. Under "Branch" select `gh-pages` and `/ (root)`
	4. Click Save

- **Local development:** copy `.env.example` (if present) to `.env` in `frontend/` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Then run:

```bash
cd frontend
npm ci
npm run dev
```


