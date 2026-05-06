# ADHD Helper

A self-hosted web app designed for ADHD-friendly productivity. Manage tasks, run focus timers, plan your day, track habits, and brain dump ideas — all in one place.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

## Features

- **Tasks & Reminders** — Create, prioritize, and track tasks with due dates and reminder times
- **Focus Timer** — Pomodoro-style timer with focus, short break, and long break modes. Browser + in-app notifications when sessions complete
- **Daily Planner** — Time-block your day with a visual schedule
- **Habit Tracker** — Track daily habits with streak counters and a 7-day visual log
- **Brain Dump** — Quick-capture notes with pinning and search

## Screenshots

> Add screenshots here once the app is running

## Tech Stack

- [Next.js 16](https://nextjs.org/) — App Router, React 19, TypeScript
- [Material UI v9](https://mui.com/) — Dark theme, responsive layout
- [Drizzle ORM](https://orm.drizzle.team/) + SQLite — Local, zero-config database

## Getting Started

### Prerequisites

- Node.js 20+
- npm (or yarn / pnpm)

### Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd adhd-helper

# 2. Install dependencies
npm install

# 3. Generate database migrations
npm run db:generate

# 4. Apply migrations (creates adhd-helper.db)
npm run db:migrate

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (http://localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations to SQLite |

## Deployment

### Self-Hosted

```bash
npm run build
npm run start
```

### Docker (coming soon)

A `Dockerfile` will be added for easy container deployment.

## Project Structure

```
adhd-helper/
├── app/                    # Next.js pages & API routes
│   ├── api/                # REST API (tasks, habits, notes, etc.)
│   ├── focus/              # Focus timer page
│   ├── planner/            # Daily planner page
│   ├── habits/             # Habit tracker page
│   └── notes/              # Brain dump page
├── db/                     # Drizzle schema & migrations
├── components/             # Shared MUI components
├── lib/                    # Utilities & theme config
└── adhd-helper.db          # SQLite database (auto-created, gitignored)
```

## License

MIT
