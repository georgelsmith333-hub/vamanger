# VA eBay Client Manager

## Overview

pnpm workspace monorepo using TypeScript. A premium eBay VA Client Manager dashboard web app with full CRUD for all entities, live KPIs, admin panel, and audit logging.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild
- **Frontend**: React + Vite, shadcn/ui, TanStack Query, wouter routing
- **Styling**: Tailwind CSS, dark theme

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

### Packages

- `artifacts/api-server` — Express 5 API server (port 8080), all REST routes, proxied at `/api/`
- `artifacts/va-dashboard` — React+Vite frontend, proxied at `/`
- `lib/db` — Drizzle ORM schema + client (PostgreSQL)
- `lib/api-spec` — OpenAPI spec file
- `lib/api-zod` — Generated Zod schemas from spec (`export * from "./generated/api"`)
- `lib/api-client-react` — Generated TanStack Query hooks from spec

### Key Files

- `artifacts/api-server/src/routes/` — All API route handlers
- `artifacts/api-server/src/lib/audit.ts` — `logAudit()` helper for tracking changes
- `artifacts/api-server/src/lib/serialize.ts` — `serializeDates()` for Date→ISO string
- `artifacts/va-dashboard/src/App.tsx` — Routes, admin guard
- `artifacts/va-dashboard/src/components/layout.tsx` — Main layout with live badges
- `artifacts/va-dashboard/src/pages/admin/` — Admin panel UI (6 pages + manual)
- `artifacts/va-dashboard/src/lib/admin-api.ts` — Admin fetch helpers

### DB Tables

- `clients`, `ebayAccounts`, `wiseCards`, `bankAccounts`, `invoices`, `violations`, `tasks`
- `earnings`, `expenses`, `recoveryEntries` (`recoveryEntriesTable`), `dailyLogins` (`dailyLoginsTable`)
- `activity` — Activity feed
- `auditLog` — Audit trail with previous/new data for undo support
- `settings` — System configuration key-value store

## Features

### Main App Pages (all with real CRUD + live data)
- **Dashboard** — KPI cards, recent activity, alert badges
- **Clients** — Full CRUD with toast notifications + audit logging
- **eBay Accounts** — Account health, status badges
- **Wise Cards** — Payment cards management
- **Bank Accounts** — Banking details
- **Invoices** — Billing, Mark Paid, overdue highlighting, toast notifications + audit logging
- **Violations** — Policy violations, Resolve action, toast notifications + audit logging
- **Tasks** — Task management with priority/status, toggle done, toast notifications + audit logging
- **Earnings** — Monthly revenue tracking
- **Expenses** — Expense management
- **Recovery & 2FA** — Recovery credentials store
- **Daily Logins** — Login tracking

### Admin Panel (`/admin`)
- **Overview** — Real-time stats: clients, eBay accounts, invoices, violations, tasks, revenue, expenses, net profit
- **Audit Log** — Every data change tracked; undo for CREATE/UPDATE/DELETE actions
- **Settings** — Configurable system settings (bulk delete, audit retention, card expiry warning, admin email, company name)
- **Data Export** — CSV downloads for all 11 entities including audit log

### UX Features
- Toast notifications on all CRUD operations (create, update, delete) for Clients, Invoices, Tasks, Violations
- Live sidebar badges showing overdue invoices, open violations, pending tasks
- Alert count badge in header
- Overdue row highlighting in tables
- Days overdue indicators on invoices

## Important Notes

- API server: build with `pnpm --filter @workspace/api-server run build` then restart workflow after route changes
- DB table name: `recoveryEntriesTable` (NOT `recoveryTable`), `dailyLoginsTable`, `wiseCardsTable`, `bankAccountsTable`
- `lib/api-zod/src/index.ts` must stay as single line: `export * from "./generated/api";`
- Admin API uses direct fetch (not codegen) — see `artifacts/va-dashboard/src/lib/admin-api.ts`
- Cloudflare deployment: `wrangler.toml` at root, `artifacts/va-dashboard/public/_routes.json`
