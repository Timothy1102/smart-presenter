# Presenter View Feature

## Overview

The presenter view is a two-window presentation system inspired by PowerPoint's Presenter View and ProPresenter's stage display. When presenting, you open two separate browser windows:

- **Audience View** — the clean, fullscreen slide display shown on the projector or screen facing the audience.
- **Presenter View** — a control dashboard shown on your own laptop/monitor, giving you context and control without the audience seeing it.

The two windows stay in sync in real time using the browser's `BroadcastChannel` API. Navigating in either window updates both simultaneously.

---

## How to Use

### Starting a presentation

From the **Library** or the **Editor toolbar**, you have two buttons:

| Button | Opens | Purpose |
|---|---|---|
| ▶ Audience View | `/presentations/[id]/present` | The display shown to the audience |
| 🖥 Presenter View | `/presentations/[id]/present/control` | Your private control panel |

The typical workflow:
1. Open **Presenter View** on your laptop screen.
2. Open **Audience View** on the projector/external display (or share that tab/window).
3. Click "Click to start (fullscreen)" on the Audience View to enter fullscreen.
4. Control the presentation from the Presenter View — the audience display follows automatically.

> Both windows must be open in the **same browser on the same device** for the sync to work, as `BroadcastChannel` is a same-device, same-browser API.

---

## Audience View (`/present`)

A minimal, distraction-free slide display.

### Splash screen

When the page opens, it shows a splash screen instead of jumping straight into the presentation. This is intentional — browsers require a direct user click to grant fullscreen permission. The splash screen displays:
- The presentation title
- The slide count
- A "Click to start (fullscreen)" button

Clicking anywhere on the splash triggers fullscreen and begins the presentation.

### Navigation

| Input | Action |
|---|---|
| Click anywhere | Next slide |
| `→` `↓` `Space` | Next slide |
| `←` `↑` | Previous slide |
| Hover left edge | Show ‹ button (previous) |
| Hover right edge | Show › button (next) |
| `Esc` | Exit fullscreen (browser native) |

### Display

Slide text is rendered using the appearance settings from `src/lib/slide-config.ts` (font, size, color, shadow). The background is either a preset gradient or a custom image URL. A subtle slide counter (`1 / 8`) appears in the bottom-right corner.

### Fullscreen behavior

- Fullscreen is requested via `document.documentElement.requestFullscreen()` on the user's first click.
- On iOS Safari (where the fullscreen API is unavailable), the presentation runs without fullscreen — the page still fills `100dvh`.
- Pressing `Esc` exits fullscreen but keeps the presentation running.

---

## Presenter View (`/present/control`)

A dashboard-style control panel for the presenter.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Title                      Presenter View    ⏱ 05:23  4 / 8  │
├────────────────────────────────┬────────────────────────────────┤
│                                │                                 │
│   CURRENT SLIDE                │   NEXT SLIDE                   │
│   (large preview, blue border) │   (smaller preview)            │
│                                │                                 │
│                                ├─────────────────────────────── │
│                                │   Slide text (plain text)      │
│                                │   readable at a glance         │
│                                │                                 │
├────────────────────────────────┴────────────────────────────────┤
│            [← Previous]    4 / 8    [Next →]                   │
├─────────────────────────────────────────────────────────────────┤
│  [1][2][3][4][5][6][7][8]  ← thumbnail strip (scrollable)     │
└─────────────────────────────────────────────────────────────────┘
```

### Elements

**Current slide preview** — A large 16:9 preview of the slide currently being shown to the audience. Highlighted with a blue border so it's always obvious which slide is active.

**Next slide preview** — A smaller 16:9 preview of the slide coming up next. Shows "End of presentation" when on the last slide.

**Slide text panel** — The raw text of the current slide displayed as plain text. Useful for reading lyrics at a glance without squinting at the preview.

**Timer** — Counts up from `00:00` when the Presenter View page is opened. Useful for tracking how long a song or segment has been running. Format: `MM:SS`.

**Slide counter** — Always shows current position (e.g., "Slide 4 / 8") in the top-right of the header.

**Navigation buttons** — Previous and Next buttons at the bottom. Clicking them updates both the Presenter View and the Audience View simultaneously.

**Thumbnail strip** — A scrollable horizontal row of all slide thumbnails at the bottom. Click any thumbnail to jump directly to that slide. The active slide's thumbnail is highlighted with a blue border and slightly scaled up. The strip auto-scrolls to keep the current thumbnail visible.

### Keyboard navigation

The same keyboard shortcuts work in Presenter View (when not focused on a text input):

| Key | Action |
|---|---|
| `→` `↓` `Space` | Next slide |
| `←` `↑` | Previous slide |

---

## Sync Architecture

The two windows communicate via the browser's [`BroadcastChannel` API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel). Each presentation uses a unique channel named `smart-presenter-{presentationId}`.

### Message types

| Message | Direction | Meaning |
|---|---|---|
| `GOTO { index }` | Presenter → Audience | Jump to this slide index |
| `STATE { index }` | Audience → Presenter | Audience navigated to this index |
| `PING` | Presenter → Audience | "What slide are you on?" |
| `PONG { index }` | Audience → Presenter | "I'm on this slide" |

### Sync flow

1. **Presenter View opens** → sends `PING` to ask the audience display for its current state.
2. **Audience display** responds with `PONG { index }` → Presenter View jumps to that slide.
3. **Presenter navigates** (button, keyboard, thumbnail click) → sends `GOTO { index }` → Audience display jumps to that slide.
4. **Audience navigates** (keyboard, click) → sends `STATE { index }` → Presenter View follows.

### Without an audience window

The Presenter View works standalone — you can open it without the Audience View. Navigate with buttons or keyboard. When the Audience View is opened later, it will receive the next `GOTO` message and sync up.

### Limitations

- **Same browser, same device only.** `BroadcastChannel` does not work across different devices, different browsers, or incognito/regular window pairs.
- **No persistence.** If either window is refreshed, the slide index resets to 0. The next navigation action will re-sync both windows.

---

## Relevant Files

| File | Role |
|---|---|
| [src/lib/broadcast.ts](../src/lib/broadcast.ts) | BroadcastChannel types and channel factory |
| [src/components/presenter/PresentationView.tsx](../src/components/presenter/PresentationView.tsx) | Audience display — splash screen, fullscreen, BroadcastChannel listener |
| [src/components/presenter/PresenterView.tsx](../src/components/presenter/PresenterView.tsx) | Presenter dashboard — slide previews, timer, strip, controls |
| [src/components/presenter/SlideDisplay.tsx](../src/components/presenter/SlideDisplay.tsx) | Pure slide renderer used by both views |
| [src/app/presentations/[id]/present/page.tsx](../src/app/presentations/%5Bid%5D/present/page.tsx) | Audience view route (server component, fetches slides) |
| [src/app/presentations/[id]/present/control/page.tsx](../src/app/presentations/%5Bid%5D/present/control/page.tsx) | Presenter view route (server component, fetches slides) |
