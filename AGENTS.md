# AGENTS.md — ADHD Helper

## Project Overview
Self-hosted Next.js webapp for ADHD productivity: tasks/reminders, focus timer, daily planner, habit tracker, and brain dump notes.

## Stack
- **Framework**: Next.js 16 with App Router, TypeScript
- **UI**: Material UI (MUI) v9
- **Database**: SQLite via Drizzle ORM
- **Testing**: Playwright (integration tests)
- **Styling**: MUI sx prop, Emotion (MUI default)

## Commands
```
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply migrations to SQLite
npm run test         # Run Playwright integration tests
npm run test:ui      # Run Playwright tests with UI
```

## Architecture
- `app/` — Next.js App Router pages and API routes (no src/ prefix)
- `db/` — Drizzle schema, migrations, DB connection
- `components/` — Reusable MUI-based React components
- `lib/` — Shared utilities, theme config
- `tests/` — Playwright integration tests (one spec per feature)

## Key Conventions
- SQLite file lives at project root as `adhd-helper.db` (gitignored)
- API routes use `GET` for reads, `POST` for creates, `PATCH` for updates, `DELETE` for deletes
- Server components preferred; `"use client"` only for interactive components (timers, forms)
- Drizzle generates types from schema — never hand-write DB types
- MUI v9 uses `slotProps` instead of `InputLabelProps`, `SelectProps`, etc.
- Mobile-first design; all pages responsive with xs/sm breakpoints
- Tests clean up database via API before each test using `beforeEach`
