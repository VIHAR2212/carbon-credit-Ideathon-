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

## Setting up the CarbonChain application database (not just keep-alive)

The keep-alive migration (`001`) is only the first of ten. Run the rest,
**in this exact numeric order**, in the Supabase SQL Editor:

```
002_core_schema.sql
003_mrv_schema.sql
004_verification_schema.sql
005_registry_schema.sql
006_marketplace_audit_schema.sql
007_rls_policies.sql
008_seed_demo_data.sql
009_atomic_functions.sql
010_reconciliation.sql
```

Paste each file's full contents and click Run before moving to the next
one -- later files reference tables, types, and functions created by
earlier ones.

`008_seed_demo_data.sql` creates demo organizations and one demo plant,
clearly labeled `(DEMO)`. It does NOT create user accounts, because
`auth.users` rows can only be created through Supabase's Auth API, not
plain SQL.

## Seeding demo accounts

For each role you want to be able to log in and demo:

1. Supabase -> Authentication -> Users -> Add User. Create with an email
   and password, e.g. `entity@demo.carbonchain`.
2. Copy the generated user's UUID.
3. In the SQL Editor, insert a matching profile row:

```sql
insert into profiles (id, full_name, role, organization_id) values
('paste-the-auth-user-uuid-here', 'Demo Entity User', 'OBLIGATED_ENTITY', '11111111-1111-1111-1111-111111111111');
```

Organization IDs from the seed data:

| Organization | ID | Matching role |
|---|---|---|
| ABC Cement Infrastructure Ltd. (DEMO) | `11111111-1111-1111-1111-111111111111` | `OBLIGATED_ENTITY` |
| Bureau Veritas India (DEMO) | `22222222-2222-2222-2222-222222222222` | `VERIFIER` |
| GreenFuture Capital Funds (DEMO) | `33333333-3333-3333-3333-333333333333` | `TRADER` |
| CCTS Registry Administrator (DEMO) | `44444444-4444-4444-4444-444444444444` | `REGISTRY_ADMIN` |

Create at least one user for `OBLIGATED_ENTITY`, `VERIFIER`, and
`REGISTRY_ADMIN` to walk through the full demo lifecycle end-to-end.
An `AUDITOR` role user can use any organization_id, since auditors read
across the whole registry.

## API routes

All routes are prefixed with `/api` and require `Authorization: Bearer
<supabase-access-token>` except `/api/health` and `/api/keep-alive`.

| Prefix | Purpose |
|---|---|
| `/api/auth/me` | Current user's profile |
| `/api/plants` | Create/list plants, data sources |
| `/api/mrv` | CSV upload, calculation, anomalies, submission |
| `/api/verifications` | Assign, checklist, approve/reject |
| `/api/issuance` | Request, approve (mints CCCs), reject |
| `/api/registry` | List, detail + provenance, freeze/unfreeze |
| `/api/market` | Order book, place/cancel/match orders, trades |
| `/api/retirements` | Retire a credit, list retirement history |
| `/api/audit` | Append-only audit log, paginated |
| `/api/integrity` | Reconciliation snapshot, integrity checks/alerts |
| `/api/organizations/verifier-agencies` | Lookup list for assigning verifiers |

## Remaining gaps (honest accounting)

**Complete:**
- Auth, RBAC (server-enforced on every route), organization isolation (RLS + application checks)
- MRV upload/validation/calculation/anomaly detection
- Verification workflow with conflict-of-interest DB trigger
- Controlled issuance with atomic CCC minting
- Registry with real provenance chain
- Marketplace with atomic trade settlement
- Permanent, DB-enforced retirement
- Append-only audit log
- Reconciliation and integrity check functions

**Partial / demo-scope:**
- Anomaly detection uses 4 rules, not an exhaustive rule set
- Order matching is single-best-counterparty per API call, not a continuous matching engine
- Freeze/unfreeze event hashing is simplified (`"pending"` placeholder) rather than using the same chained-hash function as the atomic RPC paths

**Not implemented (would need real-world integration):**
- Blockchain anchoring: schema and routes are scaffolded (`blockchain_anchors` table) but no actual testnet transaction is submitted yet
- Evidence document upload (PDFs/certificates) -- only structured CSV data ingestion exists
- Rate limiting, CSRF protection, request size limits beyond the 2mb JSON body cap
- Email verification, MFA
- Merkle-tree batch anchoring (architecture allows for it via `merkle_root` columns, not implemented)

This prototype demonstrates the full lifecycle end-to-end with real
enforcement at the database and API layers. It is not connected to any
official CCTS/BEE system and issues simulated, demonstration-only CCCs.
