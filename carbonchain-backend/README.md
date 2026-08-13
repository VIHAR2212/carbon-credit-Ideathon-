# CarbonChain Backend

Minimal Express API deployed on Render, backed by Supabase Postgres.
Includes a keep-alive mechanism so neither Render nor Supabase's free
tiers pause the project during long periods of inactivity.

## Why this exists

- **Render free tier**: web services spin down after ~15 minutes with no
  incoming HTTP requests, then cold-start (30-60s) on the next request.
- **Supabase free tier**: projects auto-pause after **~7 days** with zero
  API/DB activity. A paused project needs manual reactivation from the
  Supabase dashboard before it works again.

Both problems are solved the same way: something must hit these services
on a schedule, forever, even if you never open your laptop.

## Setup

### 1. Supabase

Run the migration once, in the Supabase SQL Editor:

```
migrations/001_keep_alive_table.sql
```

This creates a tiny `_keep_alive` table used only to reset the
inactivity timer — it never touches your real application tables.

### 2. Render

Deploy this folder as a Web Service on Render:
- Build command: `npm install`
- Start command: `npm start`
- Add environment variables from `.env.example` (real values) in the
  Render dashboard under Environment.

Note your deployed URL, e.g. `https://carbonchain-backend.onrender.com`.

### 3. GitHub Actions (primary keep-alive trigger — free, no card needed)

In your GitHub repo settings:
- **Settings -> Secrets and variables -> Actions -> Secrets**, add:
  - `RENDER_BACKEND_URL` = `https://carbonchain-backend.onrender.com`
  - `KEEP_ALIVE_SECRET` = same value you set on Render
- **Settings -> Secrets and variables -> Actions -> Variables** (optional):
  - `VERCEL_FRONTEND_URL` = your Vercel deployment URL

The workflow in `.github/workflows/keep-alive.yml` runs every 3 days.

**Important limitation:** GitHub disables scheduled workflows on a repo
after 60 days of zero repository activity (any push/PR/etc. resets this;
the scheduled runs themselves do not). If you expect to genuinely not
touch this repo for months:

- Re-enable it anytime from **Actions tab -> Keep Render + Supabase
  Alive -> Enable workflow**, or
- Set up the backup below so you're not relying on GitHub alone.

### 4. Backup trigger: cron-job.org (free, survives any length of inactivity)

As a second, independent trigger with no 60-day rule:

1. Create a free account at [cron-job.org](https://cron-job.org).
2. Add a new cron job:
   - URL: `https://carbonchain-backend.onrender.com/api/keep-alive`
   - Schedule: every 3 days
   - Add a custom header: `x-keep-alive-secret: <your KEEP_ALIVE_SECRET>`
3. Save. This now runs independently of GitHub and will keep pinging
   even if the GitHub Action gets disabled.

Running both is intentional redundancy — if one is disabled or fails
silently, the other still keeps the project alive.

## Endpoints

- `GET /api/health` — plain liveness check, also keeps Render warm by
  virtue of being a real request.
- `GET /api/keep-alive` — requires `x-keep-alive-secret` header; pings
  Supabase to reset its inactivity clock. Returns which ping method
  succeeded (`table_upsert` or `catalog_read`) and timing.

## Local development

```bash
cp .env.example .env   # fill in real values
npm install
npm run dev
```
