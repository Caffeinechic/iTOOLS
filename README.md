# iTools

**Executive Committee Operating System** — a unified workspace for IEEE Student Branch executive committees to run day-to-day operations without juggling spreadsheets, group chats, and disconnected tools.

iTools brings task pipelines, member roster, communications, notifications, and finance workflows into one role-aware portal. Each committee member sees only what their position allows, while leadership gets a single place to coordinate across chapters and groups.

Originally built for [Silver Oak University IEEE SB](https://ieeesb.org), the platform is structured so other student branches can adopt it with their own committee model and branding.

---

## Table of contents

- [Why iTools exists](#why-itools-exists)
- [What it does](#what-it-does)
- [How access works](#how-access-works)
- [Architecture](#architecture)
- [Technology choices](#technology-choices)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Running with Docker](#running-with-docker)
- [Configuration](#configuration)
- [Development workflow](#development-workflow)
- [Extending the platform](#extending-the-platform)
- [Documentation](#documentation)

---

## Why iTools exists

Student branch executive committees coordinate dozens of people across multiple chapters — CS, WIE, SPS, and more — each with its own leads, treasurers, and deliverables. In practice, work gets scattered:

- Tasks live in WhatsApp threads or personal notes
- Rosters are outdated spreadsheets
- Announcements miss people who were not in the right chat
- Budget tracking happens outside any shared system

iTools treats the EC as an **operating system**: one authenticated workspace where every module shares the same identity, committee context, and permission model. When a treasurer logs an expense or a coordinator moves a task on the kanban board, the same rules govern who can see and change it.

---

## What it does

### Live modules

| Area | Purpose |
|------|---------|
| **Authentication** | Secure sign-in with JWT access tokens and httpOnly refresh cookies. Session persists across dashboard navigation. |
| **Executive overview** | At-a-glance stats: open tasks, pipeline health, recent notifications. |
| **Pipelines & tasks** | Committee-scoped kanban boards with drag-and-drop stages (To Do → In Progress → Review → Done). |
| **Members** | Searchable roster with committee filters. Leadership can add members; visibility respects role tier. |
| **Communications** | Central place for announcements, minutes, and committee discussions. |
| **Notifications** | In-app alerts for task updates and system events, with real-time delivery over WebSockets. |
| **Budget & finance** | Committee budget tracking, transactions, and approval workflows for treasurers and leadership. |
| **System settings** | Master-tier configuration for encrypted secrets and runtime settings stored in the database. |

### Planned / in progress

Several sidebar destinations are registered but marked **coming soon** — role-specific dashboards, advanced analytics, automation hooks, and integrations. The navigation registry and permission service are built to activate these without restructuring the app.

---

## How access works

iTools uses a **tier-based permission model** layered on top of committee membership.

### Role tiers

| Tier | Typical roles | Capabilities |
|------|---------------|--------------|
| **MASTER** | Executive Chair | Full visibility across all committees; system settings; approve cross-committee actions. |
| **LEADERSHIP** | Chairperson, Vice Chair, Chapter Chairs | Manage their committee's members, tasks, and budgets; approve pending requests. |
| **OPERATIONS** | Secretary, Treasurer, Coordinators | Day-to-day operations: task updates, roster reads, budget entries, communications. |

Every API request carries the user's tier and `committeeId` in the JWT payload. Route handlers enforce scope — a chapter treasurer sees their chapter's ledger, not the entire organization's.

### Frontend visibility

The sidebar is not a static menu. Modules register with visibility rules (`public`, `role`, `permission`, `coming_soon`) and are filtered at runtime by `PermissionService`. Rail icons, collapsible categories, favorites, and keyboard search (`Ctrl+K` / `Cmd+K`) are all driven from the same registry in `features/sidebar/`.

---

## Architecture

iTools is a **two-app monorepo**: a Python API and a Next.js UI that communicate over REST and Socket.IO. They share no runtime code; the contract is HTTP + WebSocket events.

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Next.js)                    │
│  App Router · Zustand · feature modules · shadcn/ui     │
└───────────────┬─────────────────────┬───────────────────┘
                │ REST /api/v1        │ Socket.IO
                ▼                     ▼
┌───────────────────────────────────────────────────────────┐
│                  FastAPI (Python 3.12)                     │
│  Route modules · JWT auth · committee scoping · Motor     │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   MongoDB     │
                    └───────────────┘
```

**Request flow:** The frontend stores a short-lived access token and attaches it as a Bearer header. The backend decodes the JWT, resolves the user's role tier, and applies committee filters before querying MongoDB. Settings that must not live in `.env` (API keys, integration secrets) are encrypted at rest with Fernet and managed through the System Settings UI.

**Real-time flow:** Socket.IO rooms are scoped per user and per committee (`user:{id}`, `committee:{id}`). Notification counts and task events push to connected clients without polling.

For folder-level detail, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Technology choices

| Layer | Stack | Rationale |
|-------|-------|-----------|
| API | FastAPI, Motor, Pydantic | Async-first Python with automatic OpenAPI docs and native MongoDB support. |
| Auth | PyJWT, HTTP-only refresh cookies | Stateless API with secure token rotation; tier and committee baked into claims. |
| Database | MongoDB | Flexible document model fits committees, tasks, transactions, and settings without heavy migrations. |
| Real-time | python-socketio | Push notifications and live updates without a separate message broker for v1. |
| UI | Next.js 16 App Router | Server and client components, file-based routing, production-ready React framework. |
| Styling | Tailwind CSS, design tokens | Consistent warm cream palette, pill-shaped controls, no gradient dependency. |
| Components | Radix UI / shadcn | Accessible primitives (dialogs, dropdowns, tooltips) with full style control. |
| State | Zustand | Lightweight stores for sidebar preferences, favorites, and client UI state. |
| Drag & drop | @dnd-kit | Kanban board column moves with accessible keyboard support. |

---

## Repository structure

```
iTools/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── main.py          # App entry, CORS, Socket.IO mount
│   │   ├── auth.py          # JWT creation, tier guards
│   │   ├── database.py      # MongoDB lifecycle
│   │   └── routes/          # One module per domain (users, tasks, budgets, …)
│   ├── seed.py              # Initial committees, roles, and demo users
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                # Next.js application (own package.json)
│   ├── app/                 # Routes: login, register, dashboard/*
│   ├── components/          # Shared UI: ui/, patterns/, brand/, auth/
│   ├── features/            # Domain modules: sidebar, kanban, members
│   ├── lib/                 # API client, auth helpers, design tokens
│   ├── public/              # Static assets (wordmark, icons)
│   └── scripts/             # Build-time tooling (wordmark generation)
│
├── docs/                    # Architecture and product requirements
├── docker-compose.yml       # MongoDB + backend + frontend
└── README.md
```

Backend and frontend are **independent applications**. There is no root `package.json` — install and run each from its own directory.

---

## Getting started

### Prerequisites

- Python 3.12+
- Node.js 18+
- MongoDB 6+ (local install or Docker)

### 1. Database

Start MongoDB locally on port `27017`, or use the Docker service mapped to port `27018`:

```bash
docker compose up mongo -d
```

Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI` to match your instance. Generate a `SETTINGS_ENCRYPTION_KEY` (instructions in the example file).

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
python seed.py                  # first run — creates committees, roles, demo accounts
python -m uvicorn app.main:app --reload --port 4000
```

Verify: [http://localhost:4000/health](http://localhost:4000/health)

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

After seeding, sign in with any EC account created by `seed.py` using the default password configured in `backend/.env` (`DEFAULT_PASSWORD`).

---

## Running with Docker

The compose file builds and wires all three services — MongoDB, API, and UI:

```bash
docker compose up -d --build
docker compose exec backend python seed.py   # first run only
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000/api/v1 |
| Health check | http://localhost:4000/health |

Copy `.env.example` to `.env` at the repo root and set `MONGO_ROOT_USERNAME` / `MONGO_ROOT_PASSWORD` before starting.

Stop everything: `docker compose down`

---

## Configuration

### Bootstrap (environment / `.env`)

These are required before the server starts:

| Variable | Service | Purpose |
|----------|---------|---------|
| `MONGO_URI` | backend | MongoDB connection string |
| `SETTINGS_ENCRYPTION_KEY` | backend | Fernet key for encrypting DB-stored secrets |
| `JWT_SECRET` | backend | Signs access and refresh tokens |
| `PORT` | backend | API listen port (default `4000`) |
| `NEXT_PUBLIC_API_URL` | frontend | REST base URL (default `http://localhost:4000/api/v1`) |
| `NEXT_PUBLIC_SOCKET_URL` | frontend | WebSocket origin (default `http://localhost:4000`) |

### Runtime (System Settings UI)

Integration keys, SMTP credentials, and other secrets that should rotate without redeploying are stored encrypted in MongoDB and loaded at startup. Only **MASTER**-tier users can access `/dashboard/settings`.

Never commit `.env` files or real credentials to version control.

---

## Development workflow

### Backend

```bash
cd backend
.venv\Scripts\activate
python -m uvicorn app.main:app --reload --port 4000
```

Route modules live in `backend/app/routes/`. Register new routers in `app/main.py`. Use `require_auth` and `require_role` from `app/auth.py` for endpoint guards.

### Frontend

```bash
cd frontend
npm run dev              # Turbopack dev server on :3000
npm run check-types      # TypeScript validation
npm run lint             # ESLint
npm run build            # Production build
npm run build:wordmark   # Regenerate brand PNG from SVG
```

**Path aliases:** `@/` maps to the frontend root. Import shared UI from `@/components/ui`, page patterns from `@/components/patterns`, and domain code from `@/features/<module>`.

**Adding a dashboard page:**

1. Create `app/dashboard/<name>/page.tsx`
2. Register the route in `features/sidebar/modules/itools-modules.ts` with category, icon, and visibility
3. Add API methods in `lib/api.ts` if a new backend endpoint is needed
4. Use `PageTitle` from `@/components/patterns` for consistent page headers

### Code organization principles

- **`components/`** — reusable, domain-agnostic UI (buttons, cards, page headers)
- **`features/`** — self-contained domain modules with their own components, hooks, and stores
- **`lib/`** — cross-cutting utilities (API client, auth, design tokens)
- **`app/`** — routing and layouts only; keep page files thin

---

## Extending the platform

### Add a new API domain

1. Create `backend/app/routes/<domain>.py` with a FastAPI `APIRouter`
2. Apply `require_auth` / `require_role` and committee scoping consistent with `users.py`
3. Register the router in `app/main.py` under `/api/v1`
4. Add typed fetch helpers in `frontend/lib/api.ts`

### Add a sidebar module

1. Define a `NavModule` entry in `features/sidebar/modules/itools-modules.ts`
2. Set `categoryId`, `visibility`, and optional `permissions` array
3. Create the page under `app/dashboard/`
4. The sidebar registry, rail icons, and search palette pick it up automatically

### Committee scoping pattern

Most list endpoints accept an optional `committeeId` filter. Non-MASTER users are restricted to their own committee server-side — never rely on frontend hiding alone.

---

## Documentation

| Document | Contents |
|----------|----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Detailed folder layout, import conventions, data flow diagrams |
| [docs/FRD-PRD.md](docs/FRD-PRD.md) | Product requirements, module status, acceptance criteria |
| [frontend/README.md](frontend/README.md) | Frontend commands and structure summary |
| [backend/README.md](backend/README.md) | Backend commands and route overview |

---

## License

Internal project for IEEE SOU Student Branch executive committee operations.
