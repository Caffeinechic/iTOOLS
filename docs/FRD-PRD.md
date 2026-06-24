# iTools — FRD / PRD

**Product:** Executive Committee Operating System (Silver Oak University IEEE Student Branch)  
**Stack:** FastAPI + MongoDB · Next.js  
**Last updated:** 2026-06-24

---

## 1. Product goal

Give EC members one workspace for tasks, roster, communications, and committee operations — with role-based access across 7 committees/chapters.

---

## 2. Module inventory

| # | Module | Status | Backend | Frontend | Notes |
|---|--------|--------|---------|----------|-------|
| 1 | **Authentication** | Done | `/auth/login`, `/auth/register`, `/auth/me` | `/login`, `/register` | JWT in cookie; refresh token httpOnly |
| 2 | **Members** | Done | `GET/POST /users` | `/dashboard/members` | Scoped by committee; OPERATIONS can read roster |
| 3 | **Pipelines & Tasks** | Done | `/pipelines`, `/tasks` | `/dashboard/pipelines`, kanban | TODO → IN_PROGRESS → REVIEW → DONE |
| 4 | **Communications** | Done | `/communications` | `/dashboard/communications` | Announcements, minutes, discussions |
| 5 | **Notifications** | Done | `/notifications` | `/dashboard/notifications` | Task/system alerts; socket rooms |
| 6 | **System settings** | Done | `/system-settings` | `/dashboard/settings` | MASTER only; Fernet-encrypted secrets in DB |
| 7 | **Budget & finance** | **Planned** | — | — | See §3 — **study this next** |
| 8 | **Reports & analytics** | Planned | — | — | `viewReports` permission exists in seed; no UI yet |

---

## 3. Module to study: Budget & Finance

**Priority:** High  
**Why now:** Seed data already defines Treasurer roles with `manageBudget` and responsibilities (“Budget planning”, “Expense tracking”, “Financial audits”), but no API or dashboard exists.

### 3.1 Problem statement

Treasurers (Main SB + chapter treasurers) track income, expenses, and reimbursements outside the portal (spreadsheets). Chairs and executive leads lack a single view of committee spend vs. allocated budget.

### 3.2 Users & permissions

| Role | Tier | Access |
|------|------|--------|
| Executive Chair | MASTER | View all committees; approve large expenses |
| Chairperson / Vice Chair | LEADERSHIP | View own committee budget; approve requests |
| Treasurer | OPERATIONS | `manageBudget` — CRUD transactions, submit reports |
| Secretary / others | OPERATIONS | Read-only summary (optional v1) |

Reuse existing `require_role` / `require_auth` patterns from `users.py` and committee scoping (same as members list).

### 3.3 Core entities (MongoDB)

```
budgets
  _id, committeeId, fiscalYear, allocatedAmount, currency, createdAt

transactions
  _id, committeeId, budgetId, type (INCOME|EXPENSE|REIMBURSEMENT)
  amount, category, description, receiptUrl?, status (PENDING|APPROVED|REJECTED)
  createdBy, approvedBy?, transactionDate, createdAt

categories (optional seed)
  Travel, Events, Merchandise, Sponsorship, Misc
```

### 3.4 API sketch

| Method | Route | Who | Purpose |
|--------|-------|-----|---------|
| GET | `/budgets?committeeId=` | Auth + scoped | List budgets for committee/year |
| POST | `/budgets` | LEADERSHIP, MASTER | Set annual allocation |
| GET | `/transactions?committeeId=&status=` | Auth + scoped | Ledger list |
| POST | `/transactions` | Treasurer (`manageBudget`) | Log expense/income |
| PATCH | `/transactions/{id}/approve` | LEADERSHIP+ | Approve/reject pending |
| GET | `/budgets/summary` | Auth + scoped | Totals: allocated, spent, remaining |

### 3.5 Frontend pages

- `/dashboard/budget` — overview cards (allocated / spent / remaining), recent transactions
- Filters: committee tab (reuse members pattern), fiscal year, status
- Forms: add transaction, upload receipt (v2)
- Approval queue for leadership

### 3.6 Integrations

- **Notifications:** notify chair when reimbursement is submitted or approved
- **Communications:** optional monthly treasurer report post (link to summary)
- **System settings:** no new secrets required for v1

### 3.7 Acceptance criteria (MVP)

1. Treasurer can log an expense against their committee budget.
2. Leadership sees pending items and can approve/reject.
3. Dashboard shows remaining budget = allocated − approved expenses.
4. Data scoped: chapter treasurer sees only their chapter unless MASTER/main SB.
5. Matches existing navy UI (`PageHeader`, `cardClass`, `btnPrimary`).

### 3.8 Out of scope (v1)

- Bank API sync, multi-currency, PDF export, audit log UI

### 3.9 Implementation order

1. `backend/app/routes/budgets.py` + `transactions` collection + seed sample data  
2. Register router in `main.py`  
3. Zustand store + `/dashboard/budget/page.tsx`  
4. Sidebar nav item (Treasurer + Leadership + MASTER)  
5. Wire notification on `PENDING` → approve flow  

---

## 4. Cross-cutting requirements

- **Auth:** Bearer JWT; tier in token payload  
- **Committee model:** 7 committees in seed (Exec, Main SB, Coordination, CS, SPS, WIE, SIGHT)  
- **Bootstrap env only:** `MONGO_URI`, `SETTINGS_ENCRYPTION_KEY`, `PORT`, `NODE_ENV`  
- **Realtime:** Socket.IO rooms `committee:{id}`, `user:{id}`  

---

## 5. References in codebase

| Area | Path |
|------|------|
| Role permissions (incl. `manageBudget`) | `backend/seed.py` |
| Auth tiers | `backend/app/auth.py` |
| Committee scoping example | `backend/app/routes/users.py` |
| Dashboard shell | `frontend/app/dashboard/layout.tsx` |
| Shared UI primitives | `frontend/components/dashboard/ui.tsx` |
