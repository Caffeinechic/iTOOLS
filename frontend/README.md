# iTools Frontend

Next.js 16 application for the iTools executive committee dashboard.

For setup, environment variables, and Docker instructions, see the [root README](../README.md).

For folder structure and import conventions, see [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).

## Commands

```bash
npm run dev            # http://localhost:3000
npm run build          # production build
npm run check-types    # TypeScript
npm run lint           # ESLint
npm run build:wordmark # regenerate public/iTOOLS-wordmark.png
```

## Structure (summary)

```
app/           → Next.js routes and layouts
components/    → Shared UI (ui/, patterns/, brand/, auth/)
features/      → Domain modules (sidebar, kanban, members)
lib/           → API client, auth helpers, design tokens
public/        → Static assets
```
