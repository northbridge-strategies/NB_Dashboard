# Northbridge Strategies — Operations Dashboard

Internal CRM and operations dashboard for Northbridge Strategies. Built on Next.js 14, Tailwind, NextAuth, and Notion as the data layer.

## Stack

- **Framework:** Next.js 14 (App Router) + TypeScript strict
- **UI:** Tailwind CSS, Inter font, dark mode default (`next-themes`)
- **Auth:** NextAuth credentials provider, bcrypt hashes in `config/users.json`
- **Data:** 10 Notion databases (no separate DB — Notion is the source of truth)
- **Polling:** SWR (10s refresh on `/health`, 60s on the topbar status dot)
- **Charts:** Recharts (revenue by month)
- **Deploy:** Vercel

## Pages

| Path             | Purpose                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `/`              | Home — 6 stat cards (with vs-last-week trend), recent activity feed, system quick actions            |
| `/pipeline`      | Kanban board grouped by Stage with priority/classification filters and slide-over details            |
| `/hot-leads`     | Sortable, filtered table of leads where Pipeline.Priority = Hot                                      |
| `/scores`        | Diagnostic Scores with 5-gate breakdown and HITL approve/reject actions                              |
| `/revenue`       | All payments + monthly bar chart + per-month rollup                                                  |
| `/linkedin`      | LinkedIn Outreach with approve, edit-and-approve, reject; "Needs Attention" tab                      |
| `/brokers`       | Broker Discovery Queue with one-click approve to fire Agent 10                                       |
| `/channels`      | Lead volume + conversion grouped by Traffic Source, with date-range filter                           |
| `/content`       | Content Calendar — Board (grouped by status) and List views; Add Content form                        |
| `/health`        | System Health — pause/resume controls (Admin), severity rollup, auto-refreshing error log            |
| `/manual-review` | Diagnostic Scores rejected to Manual Review, with editable per-record notes                          |
| `/settings`      | Admin only — user list, system config, env-derived API status grid                                   |

## Quick start

```bash
npm install
cp .env.example .env.local       # then fill in NOTION_TOKEN + NEXTAUTH_SECRET
npm run dev
```

Open <http://localhost:3000>. You'll be redirected to `/login`.

## Default development credentials

The seed `config/users.json` ships with a development password for both Doug and Hashir:

- **Email:** `doug@northbridgestrategies.com` or `hashir@northbridgestrategies.com`
- **Password:** `ChangeMe123!`

**Replace these before deploying.** See "Adding or rotating users" below.

## Environment variables

All values live in `.env.local` for development and in the Vercel project settings for production. See [`.env.example`](./.env.example) for the full list. Notion DB IDs are pre-filled — only `NOTION_TOKEN`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` need to be set per-environment.

## Adding or rotating users

1. Generate a bcrypt hash for the new password:
   ```bash
   npm run hash-password -- 'TheNewPassword!'
   ```
2. Edit [`config/users.json`](./config/users.json) and add or update the user record:
   ```json
   {
     "id": "newuser",
     "name": "New User",
     "email": "new@northbridgestrategies.com",
     "role": "Admin",
     "passwordHash": "<paste hash>"
   }
   ```
3. Commit and redeploy. Vercel's filesystem is read-only at runtime, so user changes require a deploy.

Roles: `Admin` | `Staff` | `Client` (Client unused in v1; reserved for the planned client portal in Phase 2).

## Notion schema migration

A one-off migration adds two properties used by the dashboard:

- **Leads → Priority** (rollup over `💰 Pipeline` relation, `Priority` select, `show_original`)
- **Diagnostic Scores → Manual Review Notes** (rich_text)

Already applied to the live workspace. To re-apply (idempotent — safe to re-run):

```bash
PYTHONUTF8=1 python scripts/notion-migrate-v1.py
```

## Scripts

- `npm run dev` — local dev server on port 3000
- `npm run build` — production build (run before pushing to verify)
- `npm run start` — production server (after build)
- `npm run lint` — Next/ESLint
- `npm run typecheck` — strict TypeScript check, no emit
- `npm run hash-password -- '<password>'` — generate a bcrypt hash for `users.json`
- `node scripts/smoke-notion.mjs` — sanity-check all Notion filter shapes the dashboard uses

## Project layout

```
src/
  app/
    (auth)/login/                Login page (Suspense-wrapped)
    (dashboard)/                 Authenticated shell — sidebar + topbar
      <page>/page.tsx            Server component, reads Notion via cached helpers
      <page>/_<...>.tsx          Client components (action buttons, forms, tabs)
    api/
      auth/[...nextauth]/        NextAuth credentials route
      <resource>/[id]/<action>/  One route per write action (zod-validated, role-gated)
      health/snapshot/           Polled by /health every 10s
      system/(pause|resume)/     Admin-only system controls
    error.tsx, loading.tsx, not-found.tsx
  components/
    layout/                      Sidebar, Topbar, ThemeToggle, UserMenu
    ui/                          Reusable primitives (StatCard, DataTable, SlideOver, …)
    pipeline/, scores/, linkedin/, brokers/, content/, health/, home/
  lib/
    auth/                        NextAuth options + session helpers (server-only)
    notion/                      Typed Notion client + per-DB helpers (server-only)
      client.ts, ids.ts, parsers.ts, cache.ts
      leads.ts, scores.ts, pipeline.ts, linkedin.ts, revenue.ts,
      brokers.ts, content.ts, health.ts, config.ts, activity.ts
    types/                       Shared TS types
    utils/                       cn(), cookies, dates, format, revalidate
    constants/                   Nav, design tokens
    hooks/useAction.ts           Optimistic-UI write-action helper
config/users.json                Source of truth for application users
public/logo.png                  Brand logo
scripts/
  notion-migrate-v1.py           One-off Notion schema migration (idempotent)
  smoke-notion.mjs               Read-only smoke test for filter shapes
  hash-password.mjs              Generate bcrypt hashes for users.json
```

## Deployment to Vercel

1. **Push the project to GitHub.** From the project directory:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create northbridge-dashboard --private --source=. --push
   ```
2. **Import into Vercel.** Visit <https://vercel.com/new> and select the repo. Vercel auto-detects Next.js — no build settings to change.
3. **Add environment variables.** In Vercel → Project Settings → Environment Variables, add every key from [`.env.example`](./.env.example):
   - `NOTION_TOKEN` — the Notion integration token
   - All 10 `NOTION_*_DB` IDs (already in `.env.example` — copy the values)
   - `NEXTAUTH_SECRET` — generate a fresh one with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your production URL (e.g. `https://northbridge-dashboard.vercel.app`)
4. **Generate production password hashes** (do NOT use the dev `ChangeMe123!` hash):
   ```bash
   npm run hash-password -- 'doug-real-password'
   npm run hash-password -- 'hashir-real-password'
   ```
   Update `config/users.json`, commit, and push. Vercel will redeploy.
5. **Connect a custom domain** (optional). In Vercel → Project → Domains, add e.g. `ops.northbridgestrategies.com` and follow the DNS instructions.
6. **Smoke-test in production:**
   - Log in with each Admin user.
   - Hit every page in the sidebar nav.
   - Verify the topbar System dot turns green.
   - Approve a test record in `/scores` or `/brokers` and confirm Notion updates.

## Caching & performance

- All Notion reads are wrapped in `unstable_cache` with per-DB tags (default 30s revalidate; 10s for `/health` and `/api/health/snapshot`).
- Write actions call `revalidateTag()` on the affected DBs and on `notion:activity` so the home feed updates immediately.
- Pages with high read fan-out (e.g. Home with 12 parallel queries) use `Promise.allSettled` so a single slow query won't fail the whole page.
- Tables paginate at 50 rows.
- The topbar `SystemHealthDot` polls every 60s; the `/health` log table polls every 10s.

## Phase 2 hooks

- The `Client` role is already part of the `Role` union — adding a `/portal` route that filters everything by `session.user.id` is a small additive change.
- `useAction` is generic; same pattern for any future write route.
- The Notion client layer is structured so a new database is one new file in `lib/notion/`.
