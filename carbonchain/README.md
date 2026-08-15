# CarbonChain Frontend

Next.js + TypeScript + Tailwind v4 frontend for CarbonChain, wired to a real
backend (Express on Render) and Supabase Auth/Postgres — no mock data.

## Prerequisites

Before this frontend will work, you need:
1. The `carbonchain-backend` project deployed (see its own README)
2. All Supabase migrations run (`carbonchain-backend/migrations/002` through `010`, in order)
3. At least one real user account created (Supabase Auth user + matching `profiles` row — see backend README "Seeding demo accounts")

## Local development

```bash
cp .env.example .env.local   # fill in real values
npm install
npm run dev
```

Required environment variables (`.env.local` for dev, Vercel dashboard for prod):

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase -> Project Settings -> API -> Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase -> Project Settings -> API -> anon public key |
| `NEXT_PUBLIC_API_BASE_URL` | Your deployed Render backend URL, no trailing slash |

## Deploying to Vercel

1. Import this repo into Vercel.
2. Framework preset: Next.js (auto-detected).
3. Add the three environment variables above under Project Settings -> Environment Variables.
4. Deploy.

## What's real vs. what's still limited

This is a functioning full-stack app, not a mockup -- every button calls a real API:

- **Auth**: real Supabase email/password login, session persisted, role loaded from `profiles`
- **MRV**: CSV upload -> server-side validation -> deterministic emissions calculation -> automatic rule-based anomaly detection
- **Verification**: registry admin assigns a verifier agency (conflict-of-interest blocked at the database level) -> verifier works an evidence checklist -> approve/reject with a recorded signature hash
- **Issuance**: obligated entity requests issuance against an approved verification -> registry admin approves -> CCCs are minted atomically with unique serials (a Postgres function, not sequential app code, so it can't partially fail)
- **Registry**: real paginated credit list, full provenance chain built from actual event rows, freeze/unfreeze
- **Marketplace**: placing a SELL order locks real owned credits immediately; matching executes an atomic trade (ownership transfer, trade record, settlement record, audit event -- all-or-nothing)
- **Retirement**: permanent, database-enforced; a retired credit cannot be moved again by any code path
- **Audit trail**: every mutating action writes an append-only log entry, visible per-role

Known scope limits (see the backend README "Remaining Gaps" section for the full honest breakdown):
- Blockchain anchoring tables/routes exist in the schema but aren't yet wired to an actual testnet transaction
- Matching engine is single-best-counterparty per call, not continuous/streaming
- File upload for evidence documents (PDFs, certificates) isn't implemented -- CSV data upload is
- Rate limiting and CSRF protection are not yet added to the API

## Role-based navigation

The sidebar only shows sections relevant to the logged-in user's role
(OBLIGATED_ENTITY, VERIFIER, TRADER, AUDITOR, REGISTRY_ADMIN,
SYSTEM_ADMIN). This is a UX convenience -- the actual enforcement happens
server-side in the backend on every request, so hiding a button here is
never the only thing standing between a role and an action it shouldn't
be able to take.
