# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Presenter is a lyrics/text presentation tool built for live performance settings (churches, events). It features a slide editor with drag-and-drop, lyrics import with smart splitting, and a dual-view presenter system (audience fullscreen + presenter control panel) synchronized via BroadcastChannel API.

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npx prisma migrate dev` — Run database migrations
- `npx prisma generate` — Regenerate Prisma client after schema changes
- `npx prisma studio` — Open database GUI

No test runner or linter is configured.

## Tech Stack

- **Next.js 16** (App Router) with React 19, TypeScript 5
- **Prisma** ORM with PostgreSQL
- **Tailwind CSS 4** — dark theme throughout (gray-950 base)
- **@dnd-kit** — drag-and-drop slide reordering in editor
- **BroadcastChannel API** — cross-window sync between audience and presenter views (no server needed)
- **SWR** — available for client-side data fetching

Path alias: `@/*` maps to `./src/*`

## Architecture

### Routes

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Server | Library — lists all presentations |
| `/presentations/new` | Client | Create new presentation |
| `/presentations/[id]/edit` | Client | Slide editor (useReducer state machine) |
| `/presentations/[id]/present` | Client | Audience view (fullscreen, keyboard nav) |
| `/presentations/[id]/present/control` | Client | Presenter view (controls, timer, previews) |

### API Routes

- `GET/POST /api/presentations` — list all / create
- `GET/PUT/DELETE /api/presentations/[id]` — CRUD single presentation; PUT uses `$transaction()` for atomic slide upsert

### Key Modules

- `src/lib/slide-config.ts` — Centralized slide appearance: fonts, colors, 6 preset gradient backgrounds, `resolveBackground()` helper
- `src/lib/lyrics-splitter.ts` — `splitLyrics(text)`: splits raw text by stanzas, groups lines (max 4 per slide)
- `src/lib/broadcast.ts` — BroadcastChannel message types (GOTO, STATE, PING, PONG) for presenter sync
- `src/lib/prisma.ts` — Prisma client singleton

### Presenter Sync Model

Two browser windows communicate via BroadcastChannel (channel: `presentation-{id}`):
- **Audience view** broadcasts STATE on slide change, listens for GOTO from presenter
- **Presenter view** sends GOTO to audience, listens for STATE updates
- No server involvement in real-time sync

### Data Model

- **Presentation** → has many **Slides** (cascading delete)
- Slides have: `text`, `order` (position), `background` (preset key or image URL)
- Composite index on `[presentationId, order]`
