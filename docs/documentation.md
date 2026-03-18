# Smart Presenter — Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [File Structure](#7-file-structure)
8. [Key Modules](#8-key-modules)
9. [Configuration](#9-configuration)
10. [Setup & Running Locally](#10-setup--running-locally)

---

## 1. Project Overview

**Smart Presenter** is a lightweight, web-based lyrics presentation tool — think a simplified version of [ProPresenter](https://renewedvision.com/propresenter/) that runs entirely in the browser.

The core use case is worship/church settings: a song leader or operator creates a presentation from song lyrics, then displays the slides on a screen so the congregation can read and sing along.

### Design Philosophy

- **Simplicity first.** No unnecessary complexity. The editor does one thing well: turn lyrics into slides.
- **Fast to use.** Paste lyrics, click "Split into slides", present. That's the core flow.
- **Opinionated appearance.** Font size, color, and layout are fixed in a config file — operators configure the look once per deployment, not per song.
- **No account required.** Single-user, no authentication. All presentations are stored in one shared database.

---

## 2. Features

### Library
- View all saved presentations in a card grid, sorted by most recently updated.
- Each card shows the presentation title, slide count, and last-updated date.
- One-click access to edit or present any saved presentation.
- Delete a presentation (with confirmation prompt).

### Slide Editor
- **Lyrics importer** — paste raw lyrics text into a textarea and click "Split into slides". The app automatically chunks the text into slides based on blank lines and a configurable max-lines-per-slide limit.
- **Slide list sidebar** — see all slides at a glance with thumbnail previews. Drag to reorder. Click to select.
- **Slide text editor** — edit the text of any selected slide in a textarea. A live preview shows exactly how the slide will look when presented.
- **Background picker** — choose from 6 preset dark gradient backgrounds, or paste any image URL for a custom background.
- **Add blank slide** — insert an empty slide anywhere (via drag-after-add).
- **Unsaved changes indicator** — the toolbar shows "Unsaved changes" when there are pending edits, and warns before navigating away.
- **Save** — one button saves the title and all slides to the database in a single request.

### Presentation Mode
- Opens in a new browser tab (so the editor tab stays open).
- Requests browser fullscreen automatically on load.
- Click anywhere or press `→` / `Space` / `↓` to advance to the next slide.
- Press `←` / `↑` to go back.
- Press `Escape` to exit fullscreen (browser native behavior).
- Slide counter shown in the bottom-right corner.
- Graceful degradation on iOS Safari where fullscreen API is unavailable.

---

## 3. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) | Full-stack React with server components, API routes, and file-based routing in one project |
| Language | TypeScript | Type safety across frontend and backend |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS, fast to write, no stylesheet bloat |
| Database | PostgreSQL via [Supabase](https://supabase.com/) | Managed Postgres with a free tier, no infrastructure to run |
| ORM | [Prisma v6](https://www.prisma.io/) | Type-safe DB queries, schema migrations, clear data model |
| Drag & Drop | [@dnd-kit](https://dndkit.com/) | Lightweight, accessible, works with React 18 and App Router |
| Server state | [SWR](https://swr.vercel.app/) | Available but not heavily used — the editor loads once and saves explicitly |
| Font | Inter (Google Fonts) | Clean, readable at large sizes for presentation text |

---

## 4. Architecture

### Server / Client Boundary

Next.js App Router distinguishes between server and client components. This app uses both:

- **Server components** (no `"use client"` directive): `app/page.tsx` (library), `app/presentations/[id]/present/page.tsx`. These fetch data directly from the database using Prisma and render HTML — no client-side JavaScript for data fetching.
- **Client components** (`"use client"`): The editor page and all interactive components (slide list, editor, background picker, lyrics importer, delete button). These run in the browser and handle user interactions.

### Data Flow in the Editor

```
User action
  → dispatch(EditorAction) via useReducer
    → local state updates immediately (optimistic UI)
      → user clicks Save
        → PUT /api/presentations/[id] with full slides array
          → Prisma transaction: delete removed slides, upsert rest
            → response with fresh slides (DB-assigned IDs)
              → dispatch(SAVE_SUCCESS) — state synced with DB
```

All editor state lives in a single `useReducer`. There is no auto-save. The user explicitly saves.

### New vs Existing Slides

New slides (added locally but not yet saved) are assigned a `crypto.randomUUID()` as a temporary ID. UUID v4 IDs contain hyphens; Prisma-generated CUIDs do not. At save time, the app detects new slides by checking `id.includes("-")` and omits the `id` field from those slides in the PUT body, causing the API to `INSERT` them as new rows.

---

## 5. Database Schema

```prisma
model Presentation {
  id        String   @id @default(cuid())
  title     String
  slides    Slide[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Slide {
  id             String       @id @default(cuid())
  order          Int
  text           String
  background     String       @default("dark-default")
  presentationId String
  presentation   Presentation @relation(fields: [presentationId], references: [id], onDelete: Cascade)

  @@index([presentationId, order])
}
```

### Notes

- **`Slide.background`** stores either a preset key (e.g. `"dark-blue"`) or a raw image URL. The `resolveBackground()` function in `src/lib/slide-config.ts` converts a key to its CSS gradient at render time.
- **`Slide.order`** is always rewritten as sequential integers (0, 1, 2…) on every save. The database never stores gaps.
- **`onDelete: Cascade`** — deleting a `Presentation` automatically deletes all its `Slide` rows.
- **No User model** — there is no authentication. All data is shared under one implicit user.

---

## 6. API Reference

All API routes live under `/api/presentations`.

---

### `GET /api/presentations`

Returns all presentations, ordered by `updatedAt` descending, with a slide count.

**Response** `200 OK`
```json
[
  {
    "id": "cjld2cjxh0000qzrmn831i7rn",
    "title": "Amazing Grace",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "_count": { "slides": 8 }
  }
]
```

---

### `POST /api/presentations`

Creates a new presentation with no slides.

**Request body**
```json
{ "title": "Amazing Grace" }
```

**Response** `201 Created`
```json
{
  "id": "cjld2cjxh0000qzrmn831i7rn",
  "title": "Amazing Grace",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**Errors**: `400` if title is missing or blank.

---

### `GET /api/presentations/[id]`

Returns one presentation with all slides ordered by `order` ascending.

**Response** `200 OK`
```json
{
  "id": "cjld2cjxh0000qzrmn831i7rn",
  "title": "Amazing Grace",
  "createdAt": "...",
  "updatedAt": "...",
  "slides": [
    {
      "id": "cjld2cyuq0001qzrg4e3f3n2m",
      "order": 0,
      "text": "Amazing grace, how sweet the sound\nThat saved a wretch like me",
      "background": "dark-default",
      "presentationId": "cjld2cjxh0000qzrmn831i7rn"
    }
  ]
}
```

**Errors**: `404` if not found.

---

### `PUT /api/presentations/[id]`

Full save of a presentation — title and all slides. Runs in a single database transaction.

**Request body**
```json
{
  "title": "Amazing Grace",
  "slides": [
    {
      "id": "cjld2cyuq0001qzrg4e3f3n2m",
      "text": "Amazing grace, how sweet the sound",
      "background": "dark-blue",
      "order": 0
    },
    {
      "text": "I once was lost, but now am found",
      "background": "dark-default",
      "order": 1
    }
  ]
}
```

- Slides **with** an `id` that exists in the DB are **updated**.
- Slides **without** an `id` (or with an unknown `id`) are **inserted** as new rows.
- Slides that exist in the DB but are **absent** from this array are **deleted**.
- `order` is reassigned sequentially (0, 1, 2…) based on array position.

**Response** `200 OK` — the updated presentation with all slides.

**Errors**: `500` on database failure.

---

### `DELETE /api/presentations/[id]`

Deletes a presentation and all its slides (cascaded by the database).

**Response** `200 OK`
```json
{ "success": true }
```

---

## 7. File Structure

```
smart-presenter/
├── docs/
│   └── documentation.md          ← you are here
├── prisma/
│   └── schema.prisma             ← Prisma data model
├── public/                       ← static assets (empty by default)
├── src/
│   ├── app/
│   │   ├── globals.css           ← global styles (minimal)
│   │   ├── layout.tsx            ← root HTML layout, Inter font
│   │   ├── page.tsx              ← / (library view, server component)
│   │   ├── api/
│   │   │   └── presentations/
│   │   │       ├── route.ts      ← GET all, POST create
│   │   │       └── [id]/
│   │   │           └── route.ts  ← GET one, PUT update, DELETE
│   │   └── presentations/
│   │       ├── new/
│   │       │   └── page.tsx      ← create presentation form
│   │       └── [id]/
│   │           ├── edit/
│   │           │   └── page.tsx  ← slide editor (client component)
│   │           └── present/
│   │               └── page.tsx  ← presentation mode (server component)
│   ├── components/
│   │   ├── library/
│   │   │   ├── PresentationCard.tsx
│   │   │   ├── PresentationList.tsx
│   │   │   └── DeleteButton.tsx
│   │   ├── editor/
│   │   │   ├── BackgroundPicker.tsx
│   │   │   ├── LyricsImporter.tsx
│   │   │   ├── SlideEditor.tsx
│   │   │   ├── SlideItem.tsx
│   │   │   └── SlideList.tsx
│   │   └── presenter/
│   │       ├── PresentationView.tsx
│   │       └── SlideDisplay.tsx
│   ├── lib/
│   │   ├── prisma.ts             ← Prisma client singleton
│   │   ├── lyrics-splitter.ts    ← auto-split algorithm
│   │   └── slide-config.ts       ← appearance config + preset backgrounds
│   └── types/
│       └── index.ts              ← shared TypeScript interfaces
├── .env.local                    ← DATABASE_URL (not committed)
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

---

## 8. Key Modules

### `src/lib/slide-config.ts`

The single source of truth for slide appearance and preset backgrounds. Referenced by both the editor (preview) and presentation mode (display). **To change how slides look globally, only edit this file.**

```typescript
export const SLIDE_CONFIG = {
  maxLinesPerSlide: 4,    // used by the lyrics splitter
  fontFamily: "...",
  fontSize: "3.5rem",
  fontWeight: "600",
  lineHeight: "1.35",
  textColor: "#ffffff",
  textShadow: "...",
  textAlign: "center",
  padding: "4rem",
  presetBackgrounds: [ ... ],
};
```

Also exports `resolveBackground(value: string): string` which converts a preset key or URL into a CSS `background` value.

---

### `src/lib/lyrics-splitter.ts`

Converts raw lyrics text into an array of slide strings.

**Algorithm:**
1. Normalize line endings (`\r\n` and `\r` → `\n`).
2. Split on two or more consecutive newlines (`\n\n+`) to identify stanzas (verses, choruses).
3. Trim and discard empty stanzas.
4. For each stanza: if the line count is ≤ `maxLinesPerSlide`, emit it as one slide. If longer, chunk it into groups of `maxLinesPerSlide` lines and emit each chunk as a separate slide.

This handles the two most common worship lyric formats:
- Stanzas separated by blank lines (standard verse/chorus structure)
- Long sections that need splitting (e.g., an 8-line bridge at 4 lines per slide → 2 slides)

---

### `src/lib/prisma.ts`

A Prisma client singleton that prevents multiple instances in Next.js development mode (hot reload creates new module instances on every save; without the singleton pattern, this exhausts database connections).

---

### `src/app/presentations/[id]/edit/page.tsx`

The most complex file. It is a client component that manages all editor state with `useReducer`. Key responsibilities:

- Fetches the presentation from the API on mount.
- Manages `slides`, `title`, `selectedId`, `isDirty`, and `isSaving` state.
- Dispatches actions: `ADD_SLIDES` (from lyrics importer), `ADD_BLANK_SLIDE`, `UPDATE_SLIDE`, `DELETE_SLIDE`, `REORDER_SLIDES`, `SELECT_SLIDE`, `SAVE_START`, `SAVE_SUCCESS`.
- Serializes state and sends a single `PUT` request on save.
- Registers a `beforeunload` listener to warn about unsaved changes.

---

### `src/components/editor/SlideList.tsx`

Wraps the slide list with `DndContext` and `SortableContext` from dnd-kit. Each `SlideItem` uses the `useSortable` hook. On drag end, uses `arrayMove` from `@dnd-kit/sortable` to compute the new order and dispatches `REORDER_SLIDES` to the parent reducer.

---

### `src/components/presenter/PresentationView.tsx`

Client component that:
- Calls `document.documentElement.requestFullscreen()` on mount.
- Listens for `keydown` events: arrow keys and space advance/retreat slides.
- Tracks `currentIndex` in local state.
- Renders `SlideDisplay` with the current slide's data and the `SLIDE_CONFIG` styles.

---

## 9. Configuration

### Slide Appearance

Edit `src/lib/slide-config.ts` to change how slides look. Changes apply to both the editor preview and the presentation mode.

| Property | Default | Effect |
|---|---|---|
| `maxLinesPerSlide` | `4` | Max lines before the auto-splitter starts a new slide |
| `fontSize` | `3.5rem` | Font size of slide text |
| `fontWeight` | `600` | Font weight (semibold) |
| `lineHeight` | `1.35` | Line spacing |
| `textColor` | `#ffffff` | Text color |
| `textShadow` | (dark blur) | Shadow behind text for readability on images |
| `textAlign` | `center` | Text alignment |
| `padding` | `4rem` | Padding inside the slide |

### Preset Backgrounds

The `presetBackgrounds` array in `slide-config.ts` defines the palette shown in the background picker. Each entry has:

```typescript
{ key: string, label: string, css: string }
```

- `key` — stored in the database (e.g., `"dark-blue"`).
- `label` — shown as a tooltip on the swatch.
- `css` — any valid CSS `background` value (gradient, solid color, etc.).

To add a new preset: add an entry to the array. To remove one: delete the entry (existing slides with that key will fall back to rendering it as a URL, showing a broken image — so consider migrating the key in the DB first).

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Supabase URI format) |

Set in `.env.local`. This file is gitignored.

---

## 10. Setup & Running Locally

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com/) project (free tier is sufficient)

### Steps

**1. Clone and install dependencies**
```bash
git clone <repo-url>
cd smart-presenter
npm install
```

**2. Set up the database connection**

Copy your connection string from Supabase: **Project Settings → Database → Connection string → URI**

Create `.env.local`:
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

**3. Push the schema to the database**
```bash
npx prisma db push
```

This creates the `Presentation` and `Slide` tables. No migration files are generated — `db push` syncs the schema directly (suitable for development and simple deployments).

**4. Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

The app can be deployed to any platform that supports Node.js — Vercel, Railway, Render, etc. Set `DATABASE_URL` as an environment variable in your hosting platform's settings.

### Useful Prisma Commands

```bash
# Inspect your database in a browser GUI
npx prisma studio

# Re-sync schema after changes to schema.prisma
npx prisma db push

# Regenerate the Prisma client after schema changes
npx prisma generate
```
