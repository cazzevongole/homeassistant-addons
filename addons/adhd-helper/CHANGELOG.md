# Changelog

## 1.2.1
- Fix hash-based routing to prevent 404s in HAOS ingress
- Move all pages to client-side components (no server routes)
- Add focus session delete feature
- Fix timezone handling for reminder dates

## 1.1.4
- Fix Docker build with standalone output mode
- Proper Next.js routing in Home Assistant ingress
- Add new logo and PWA icons

## 1.1.3
- Fix HAOS ingress redirect issue (tasks moved to root)
- Update addon logo and PWA icons

## 1.1.2
- Fix Docker base image (node:22-alpine with npm)

## 1.1.1
- Add `.gitignore` to addon repo
- Sync app files to addon repo

## 1.1.0
- Add HA addon `build.yaml` for `aarch64`
- Update navigation to `/tasks` route
- Add `manifest.json` screenshots and protocol handlers

## 1.0.0
- Initial release
- Tasks & Reminders with background polling
- Focus Timer with session history
- Daily Planner
- Habit Tracker with streaks
- Brain Dump Notes
- PWA support (installable on mobile/desktop)
- SQLite database persistence via `/data`
