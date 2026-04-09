# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (wouter routing, TanStack Query, shadcn/ui, Tailwind CSS)
- **API framework**: Express 5 + express-session (session-based auth)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Application: Design Studio Client Portal

A full-stack client portal for a freelance design business.

### Features
- **Authentication**: Session-based login/register for admin and client roles
- **Projects**: Full CRUD with status tracking (pending, in_progress, review, completed, cancelled)
- **Requests**: Clients submit project requests; admin approves/rejects them
- **Files**: Upload and manage files per project
- **Comments**: Threaded comments per project
- **Clients**: Admin can view and manage all client accounts
- **Dashboard**: Real-time stats, activity feed, and status breakdown

### Demo Accounts
- **Admin**: `admin@designstudio.com` / `admin123`
- **Client**: `sarah@techcorp.com` / `client123`
- **Client**: `marcus@brandlab.io` / `client123`
- **Client**: `emily@startup.co` / `client123`

### Architecture
- `artifacts/client-portal/` — React + Vite frontend, served at `/`
- `artifacts/api-server/` — Express 5 API server, served at `/api`
- `lib/db/` — Drizzle ORM schema and DB client
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
