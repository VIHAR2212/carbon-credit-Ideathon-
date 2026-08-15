```
   ██████╗ █████╗ ██████╗ ██████╗  ██████╗ ███╗   ██╗
  ██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔═══██╗████╗  ██║
  ██║     ███████║██████╔╝██████╔╝██║   ██║██╔██╗ ██║
  ██║     ██╔══██║██╔══██╗██╔══██╗██║   ██║██║╚██╗██║
  ╚██████╗██║  ██║██║  ██║██████╔╝╚██████╔╝██║ ╚████║
   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═╝  ╚═══╝
   ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
  ██╔════╝██║  ██║██╔══██╗██║████╗  ██║
  ██║     ███████║███████║██║██╔██╗ ██║
  ██║     ██╔══██║██╔══██║██║██║╚██╗██║
  ╚██████╗██║  ██║██║  ██║██║██║ ╚████║
   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝

        Trusted infrastructure for India's carbon market
```

<div align="center">

**Prototype MRV · Carbon-Credit Registry · Provenance · Marketplace**
_Built around India's emerging Carbon Credit Trading Scheme (CCTS)_

[![Status](https://img.shields.io/badge/status-prototype-orange)]()
[![Frontend](https://img.shields.io/badge/frontend-Next.js%20%2B%20TypeScript-black)]()
[![Backend](https://img.shields.io/badge/backend-Express%20%2B%20Postgres-blue)]()
[![Database](https://img.shields.io/badge/database-Supabase-3ecf8e)]()
[![License](https://img.shields.io/badge/data-demo%20%2F%20simulated-lightgrey)]()

</div>

---

> ⚠️ **This is a hackathon prototype, not an official registry.** All
> organizations, plants, and CCCs in seed/demo data are fictional. This
> project is not affiliated with the Bureau of Energy Efficiency (BEE),
> the Ministry of Power, or any official CCTS/CCTS-compatible scheme.
> Nothing here should be represented as a real carbon credit.

---

## Table of Contents

- [What is CarbonChain?](#what-is-carbonchain)
- [The Core Invariant](#the-core-invariant)
- [System Architecture](#system-architecture)
- [The Full Credit Lifecycle](#the-full-credit-lifecycle)
- [CCC State Machine](#ccc-state-machine)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Role-Based Access](#role-based-access)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [What's Real vs. What's Scoped Out](#whats-real-vs-whats-scoped-out)

---

## What is CarbonChain?

CarbonChain is a full-stack prototype demonstrating what **auditable
carbon-market infrastructure** looks like end-to-end — from a factory's
raw sensor data all the way to a permanently retired compliance credit.

It is built around four pillars:

```
   📡  MRV            Monitoring, reporting & verification pipeline
   🔍  VERIFICATION    Independent third-party sign-off
   🪪  REGISTRY         Unique, traceable certificates with provenance
   💱  MARKETPLACE      Atomic, auditable trading & permanent retirement
```

Every one of those pillars is backed by a **real database, real
authentication, and real server-side enforcement** — not a UI mockup
with hardcoded numbers.

## The Core Invariant

Everything in this system exists to protect one sentence:

> **No CCC can exist without provenance. No ownership change can happen
> without an auditable transaction. No retired CCC can ever return to
> circulation.**

This isn't a design goal we hope holds true — it's enforced at the
database level with Postgres triggers, unique constraints, and atomic
functions, so no bug in the application layer can violate it.

## System Architecture

```
                              ┌──────────────────────┐
                              │        USERS           │
                              │  Entities · Verifiers   │
                              │  Traders · Auditors      │
                              │  Registry Admins          │
                              └───────────┬──────────────┘
                                          │
                                          ▼
                       ┌─────────────────────────────────┐
                       │         FRONTEND (Vercel)         │
                       │   Next.js · TypeScript · Tailwind │
                       │   Role-aware UI · Supabase Auth    │
                       └───────────────┬─────────────────┘
                                       │  HTTPS + Bearer JWT
                                       ▼
                       ┌─────────────────────────────────┐
                       │         BACKEND (Render)          │
                       │   Express API · RBAC middleware   │
                       │   Deterministic calc engine        │
                       │   Anomaly rules · Audit logging     │
                       └───────────────┬─────────────────┘
                                       │  service_role
                                       ▼
                       ┌─────────────────────────────────┐
                       │       DATABASE (Supabase)          │
                       │   Postgres · Row-Level Security     │
                       │   Atomic RPC functions               │
                       │   Status-transition triggers          │
                       │   Append-only event & audit logs       │
                       └─────────────────────────────────────┘
```

**Why this shape matters:** the frontend never talks to the database
directly for writes. Every mutating action goes through the backend,
which re-checks the caller's role and organization before touching
anything — so a hidden or re-enabled UI button can never bypass a
permission check.

## The Full Credit Lifecycle

```
   INDUSTRIAL DATA
         │
         │  CSV / API / simulated IoT
         ▼
   ┌─────────────┐
   │  MONITORING  │  meter readings ingested + validated
   └──────┬──────┘
          │
          ▼
   ┌───────────────────────┐
   │ EMISSIONS CALCULATION  │  deterministic, versioned, reproducible
   └──────────┬────────────┘
              │
              ▼
   ┌─────────────────┐        ┌────────────────────┐
   │    MRV REPORT     │──────▶│  ANOMALY DETECTION   │
   └────────┬─────────┘        └──────────┬─────────┘
            │                            │ flagged → human review
            │ ◀──────────────────────────┘ resolved
            ▼
   ┌─────────────────┐
   │   VERIFICATION    │  independent agency · conflict-of-interest
   └────────┬─────────┘  blocked at the database trigger level
            │ approved
            ▼
   ┌─────────────────┐
   │   ELIGIBILITY      │  one verification → exactly one issuance
   └────────┬─────────┘  (unique constraint prevents double issuance)
            │
            ▼
   ┌─────────────────┐
   │  CCC ISSUANCE      │  atomic Postgres function — mints the whole
   └────────┬─────────┘  batch or none of it, never partially
            │
            ▼
   ┌─────────────────┐
   │    REGISTRY         │  unique serial · full provenance chain
   └────────┬─────────┘
            │
            ▼
   ┌─────────────────┐
   │   OWNERSHIP          │
   └────────┬─────────┘
            │
            ▼
   ┌─────────────────┐
   │  MARKETPLACE         │  SELL locks real owned credits immediately
   └────────┬─────────┘
            │
            ▼
   ┌─────────────────┐
   │   SETTLEMENT          │  atomic trade: ownership + trade record +
   └────────┬─────────┘  audit event, all-or-nothing
            │
            ▼
   ┌───────────────────────┐
   │  SURRENDER / RETIREMENT │  permanent · terminal · database-enforced
   └───────────────────────┘
```

## CCC State Machine

Every carbon credit moves through a strict, database-enforced state
machine. `RETIRED` and `VOID` are terminal — no code path, admin
override, or application bug can move a credit out of them.

```
                    ┌───────────┐
                    │  PENDING   │
                    └─────┬─────┘
                          │ batch minted
                          ▼
                    ┌───────────┐
              ┌────▶│ AVAILABLE  │◀────┐
              │     └─────┬─────┘     │
       unlocked           │ locked     │ unfrozen
       (order cancelled)  ▼            │
              │     ┌───────────┐     │
              └─────│  LOCKED    │     │
                    └─────┬─────┘     │
                          │ trade      │
                          │ executes   │
                          ▼            │
                    ┌───────────┐     │
                    │IN_TRANSFER │     │
                    └─────┬─────┘     │
                          │           │
                          ▼           │
                    ┌───────────┐     │
        registry    │  FROZEN    │────┘
        interlock──▶│ (any state)│
                     └─────┬─────┘
                          │
                          │ owner-initiated, AVAILABLE only
                          ▼
                    ┌───────────┐
                    │  RETIRED   │  ◀── TERMINAL. No further transitions.
                    └───────────┘

                    ┌───────────┐
                    │   VOID     │  ◀── TERMINAL. Issuance error correction.
                    └───────────┘
```

## Repository Structure

```
carbon-credit-Ideathon-/
│
├── carbonchain/                    # Frontend — Next.js + TypeScript
│   ├── app/                        #   routing, layout, global styles
│   ├── components/
│   │   ├── carbonchain-app.tsx     #   sidebar + router shell
│   │   ├── shared/                 #   icons, status badges, search, login
│   │   └── views/                  #   one file per screen
│   └── lib/                        #   auth context, API client, types
│
└── carbonchain-backend/            # Backend — Express + Postgres
    ├── migrations/                 #   001–010, run in order in Supabase
    │   ├── 002_core_schema.sql     #     orgs, plants, users
    │   ├── 003_mrv_schema.sql      #     MRV calculations & reports
    │   ├── 004_verification_...    #     verifier workflow
    │   ├── 005_registry_schema.sql #     CCCs, status triggers
    │   ├── 006_marketplace_...     #     orders, trades, retirement
    │   ├── 007_rls_policies.sql    #     row-level security
    │   ├── 008_seed_demo_data.sql  #     DEMO / SIMULATED org data
    │   ├── 009_atomic_functions.sql#     issuance, trade, retire RPCs
    │   └── 010_reconciliation.sql  #     integrity & supply checks
    └── src/
        ├── routes/                 #   one file per API domain
        ├── middleware/auth.js      #   JWT verification + RBAC
        └── lib/                    #   calc engine, anomaly rules, ids
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 · TypeScript · Tailwind CSS v4 |
| Auth | Supabase Auth (JWT-based sessions) |
| Backend | Node.js · Express |
| Database | PostgreSQL (Supabase) · Row-Level Security |
| Atomicity | Postgres PL/pgSQL functions (not app-layer) |
| Hosting | Vercel (frontend) · Render (backend) |

## Role-Based Access

```
        OBLIGATED_ENTITY        VERIFIER            TRADER
              │                     │                   │
              ▼                     ▼                   ▼
      ┌───────────────┐   ┌────────────────┐   ┌───────────────┐
      │ Upload MRV data │   │ Review evidence  │   │ Place orders    │
      │ Request issuance│   │ Approve / reject │   │ Match trades     │
      │ Retire own CCCs │   │ (never own org)  │   │                  │
      └───────────────┘   └────────────────┘   └───────────────┘

              REGISTRY_ADMIN                    AUDITOR
                    │                              │
                    ▼                              ▼
         ┌────────────────────┐        ┌───────────────────┐
         │ Assign verifiers      │        │ Read-only across    │
         │ Approve issuance        │        │ every organization    │
         │ Freeze / unfreeze CCCs  │        │ Audit trail & alerts   │
         │ Run integrity checks     │        │                        │
         └────────────────────┘        └───────────────────┘
```

Every role restriction is enforced **server-side**, on every request —
the sidebar hides buttons a role can't use as a UX convenience, but
that's never the only thing standing between a role and an action.

## Getting Started

```bash
# 1. Clone and pick your branch
git clone https://github.com/VIHAR2212/carbon-credit-Ideathon-.git
cd carbon-credit-Ideathon-
git checkout full-backend-integration

# 2. Backend
cd carbonchain-backend
cp .env.example .env      # fill in Supabase + secret values
npm install
npm run dev

# 3. Frontend (new terminal)
cd ../carbonchain
cp .env.example .env.local
npm install
npm run dev
```

Full setup — including the 9 required Supabase migrations and demo
account seeding — is documented in each project's own README:

- [`carbonchain/README.md`](./carbonchain/README.md) — frontend setup & deployment
- [`carbonchain-backend/README.md`](./carbonchain-backend/README.md) — database migrations, seeding, API reference

## Deployment

```
   GitHub (this repo)
         │
         ├──────────────┬──────────────────┐
         ▼              ▼                  ▼
    ┌─────────┐   ┌───────────┐   ┌────────────────┐
    │ Vercel   │   │  Render    │   │   Supabase       │
    │(frontend)│   │ (backend)  │   │ (Postgres + Auth)│
    └─────────┘   └───────────┘   └────────────────┘
```

Both Render and Supabase free tiers pause after periods of inactivity.
A GitHub Actions workflow (`carbonchain-backend/.github/workflows/keep-alive.yml`)
pings both on a schedule so the project stays live between demos —
see the backend README for the full explanation and a free backup
option via cron-job.org.

## What's Real vs. What's Scoped Out

**Fully real, no mocks:**

| Capability | How it's enforced |
|---|---|
| Authentication & roles | Supabase Auth JWT, verified on every API request |
| Organization isolation | Postgres Row-Level Security + application checks |
| Deterministic emissions calc | Pure function, versioned, reproducible |
| Anomaly detection | Rule-based engine, human-reviewed, never auto-fraud |
| Conflict-of-interest block | Database trigger — a verifier literally cannot verify its own org |
| Atomic issuance | Postgres function — mints the whole batch or none |
| Atomic trade settlement | Postgres function — ownership + records move together or not at all |
| Permanent retirement | Terminal state, database-enforced, no code path can reverse it |
| Provenance chain | Built from real append-only event rows, not hardcoded strings |
| Audit trail | Append-only, `UPDATE`/`DELETE` revoked at the database grant level |

**Honestly scoped out for now** (see backend README for the full list):

- Blockchain anchoring — schema exists, no live testnet transaction yet
- Continuous order matching — single-best-counterparty per call today
- Evidence file uploads (PDFs/certificates) — CSV data ingestion only
- Rate limiting / CSRF hardening

---

<div align="center">

_CarbonChain is a demonstration registry designed for CCTS-compatible
workflows. It is not an official government system and does not issue
legally recognized carbon credits._

</div>
