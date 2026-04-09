# StudioPortal

A full-stack client portal for freelance design businesses. Clients log in to track their projects, submit design requests, and view deliverables. Admins manage all clients, projects, and requests from a single dashboard.

---

## Features

- **Role-based access** — `admin` sees everything; `client` sees only their own data
- **Project management** — create, track, and update design projects with status stages
- **Design requests** — clients submit new requests; admins triage and respond
- **File attachments** — upload and download files per project
- **Comments** — per-project threaded commenting between client and studio
- **Activity feed** — real-time log of recent actions across the portal
- **Dashboard stats** — at-a-glance counts for projects, requests, and clients
- **Session-based auth** — secure HTTP-only cookies, 7-day sessions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Wouter, TanStack Query, shadcn/ui, Tailwind CSS |
| Backend | Express 5, express-session, Pino logger |
| Database | PostgreSQL, Drizzle ORM |
| API contract | OpenAPI 3.1 spec → Orval codegen (hooks + Zod schemas) |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
/
├── artifacts/
│   ├── api-server/          # Express 5 REST API (port 8080)
│   └── client-portal/       # React + Vite frontend (port from $PORT)
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 source spec (openapi.yaml)
│   ├── api-client-react/    # Orval-generated TanStack Query hooks
│   ├── api-zod/             # Orval-generated Zod validation schemas
│   └── db/                  # Drizzle ORM schema + client
└── scripts/                 # Seed and utility scripts
```

---

## Database Schema

| Table | Description |
|---|---|
| `users` | Accounts with `admin` or `client` role |
| `projects` | Design projects linked to a client |
| `requests` | Design requests submitted by clients |
| `files` | File attachments linked to projects |
| `comments` | Per-project comments between client and studio |
| `activity` | Audit log of portal actions |

---

## API Routes

All routes are prefixed with `/api`.

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/auth/login` | Log in | Public |
| POST | `/auth/logout` | Log out | Any |
| GET | `/auth/me` | Current user | Any |
| POST | `/auth/register` | Create account | Public |
| GET | `/dashboard/stats` | Summary counts | Any |
| GET | `/dashboard/activity` | Recent activity | Any |
| GET | `/projects` | List projects | Any |
| POST | `/projects` | Create project | Admin |
| GET | `/projects/:id` | Project detail | Any |
| DELETE | `/projects/:id` | Delete project | Admin |
| GET | `/requests` | List requests | Any |
| POST | `/requests` | Submit a request | Any |
| GET | `/requests/:id` | Request detail | Any |
| PATCH | `/requests/:id` | Update request | Any |
| GET | `/projects/:id/files` | List files | Any |
| POST | `/projects/:id/files` | Upload file | Any |
| GET | `/projects/:id/comments` | List comments | Any |
| POST | `/projects/:id/comments` | Post a comment | Any |
| GET | `/clients` | List clients | Admin |
| GET | `/clients/:id` | Client detail | Admin |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database (connection string in `DATABASE_URL`)

### Install dependencies

```bash
pnpm install
```

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret key for signing session cookies |

### Push database schema

```bash
pnpm --filter @workspace/db run db:push
```

### Seed demo data

```bash
pnpm --filter @workspace/db run db:seed
```

### Start development servers

```bash
# API server
pnpm --filter @workspace/api-server run dev

# Frontend
pnpm --filter @workspace/client-portal run dev
```

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@designstudio.com` | `admin123` |
| Client | `sarah@techcorp.com` | `client123` |
| Client | `marcus@brandlab.io` | `client123` |
| Client | `emily@startup.co` | `client123` |

---

## Code Generation

The API client and Zod schemas are generated from the OpenAPI spec. Run this after modifying `lib/api-spec/openapi.yaml`:

```bash
pnpm --filter @workspace/api-client-react run generate
```

---

## Authentication Notes

- Sessions are stored in memory (suitable for single-instance deployments; swap for a Redis store for multi-instance)
- Cookies are `httpOnly`, `SameSite: none` in production and `SameSite: lax` in development
- Password hashing uses SHA-256 with a fixed salt — consider upgrading to bcrypt for production use
