# FPTIC Phase 5 — Responsive quiz UX (desktop + mobile) — design

**Date:** 2026-06-02
**Status:** approved (design), pending spec review
**Branch (when implementing):** `phase5-responsive-quiz`

## Problem
The quiz uses one mobile-first layout for every viewport: a `max-w-md` (~448px) column,
**vertically centered** (`min-h-screen justify-center`). Consequences:
- **Desktop** wastes ~70% of the viewport (a phone-width strip in empty space), offers no keyboard
  input, and stacks the backbone rank+map tall when there's room for a grid.
- **Mobile** centers tall backbone cards so the prompt floats above the fold and Continue is a
  scroll away; reorder is tap-tedious (`↑/↓` one step at a time); the primary action isn't in the
  thumb zone.

## Decisions (confirmed)
- **Adaptive layout:** mobile = single column; **desktop = contexts×responses matrix** for backbone.
- **Drag-to-reorder** via **@dnd-kit** (`↑/↓` retained as keyboard/fallback).
- Engine/scoring/reducer **unchanged**; this is presentation + input only.

## Design

### 1. Responsive shell — `QuizFlow`
Replace the centered single column with a 3-zone shell:
- **Sticky header** (`sticky top-0`): `← Back` · "Question n of N" · progress bar. Always visible.
- **Scrollable main** (`flex-1`, **top-aligned**, not screen-centered → fixes overflow-centering):
  holds the prompt + the question body. Width: `max-w-md` → `md:max-w-2xl` (flavor) /
  `md:max-w-3xl` (backbone matrix).
- **Sticky footer** (`sticky bottom-0`, `pb-[env(safe-area-inset-bottom)]`): the primary action in
  the thumb zone — backbone → **Continue**; flavor → the **`＋ it depends`** affordance + the
  desktop key hint. (Flavor options live in main and tap-to-advance, so they need no footer button.)
- **Continue moves out of `DependsCard` up to this footer** (shell owns the chrome). `DependsCard`
  exposes the rank+map body + same-for-all only; QuizFlow's footer button calls `COMMIT_DEPENDS`.

### 2. Backbone adaptive layout — `DependsCard` (one component, two layouts)
Driven by the same state (`cases`, `options`, `ranking`, `mapping`); switches on Tailwind `md:`.
- **Mobile (`< md`):** vertical stack of context cards — drag handle `⠿` + index + label, then the
  response chips (existing `role=radio` group, roving-tabindex from Phase 3), bigger targets.
- **Desktop (`md:`):** a **grid** — a header row (empty corner + response labels) then one row per
  context (drag handle + context label + one **radio cell per response column**). CSS grid
  `grid-template-columns: auto 1fr repeat(N, minmax(0,1fr))` (N = `options.length`). Whole question
  visible at once, no scroll.
- "Same for everyone" stays as a quick-fill control **above the rank+map body, within `DependsCard`** (Continue is the only thing in the shell footer).

### 3. Drag-to-reorder — @dnd-kit
- `DndContext` + `SortableContext` over `ranking` (the context ids). Each context row is a
  `useSortable` item with a drag handle. Sensors: Pointer + Touch + **Keyboard** (accessible drag).
- `onDragEnd(active, over)` → a pure `reorder(ranking, activeId, overId)` → `onReorder(next)`
  (dispatches `SET_RANK_ORDER`). The existing `↑/↓` buttons stay as an explicit fallback.
- Respect `prefers-reduced-motion` (disable dnd-kit drop animation when reduced).

### 4. Keyboard (desktop / fine-pointer)
- Flavor: number chips **1…N** replace the A/B/C chips and **actually work** — a `keydown` listener
  (active during the `single` phase) maps `1…9` → select that option (→ advance). Fixes today's
  dead "implied shortcut" affordance.
- Backbone: `Enter` commits when `canCommit`; arrow keys already move within a context (Phase 3).
- Hints (`1–3 · ⏎`) render only under `@media (pointer: fine)` (hidden on touch).

### 5. Mobile ergonomics (falls out of 1–3)
Sticky thumb-zone action; top-aligned scroll; ≥44px targets; drag instead of tap-tap; progress
always visible (sticky header). Coach-mark stays above the rank+map body on first backbone.

## Components & deps
- Touched: `QuizFlow.tsx` (shell + header/footer + keyboard + Continue), `DependsCard.tsx`
  (adaptive matrix/stack + dnd-kit sortable + drag handle; Continue removed), `OptionList.tsx`
  (number chips + key hint), `QuestionCard.tsx` (hint), `Coachmark` (placement), `index.css`
  (safe-area inset). Possibly a small `SortableRow` helper.
- New deps: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

## Testing (TDD where logic exists)
- Pure `reorder(ranking, activeId, overId)` helper — unit-tested.
- QuizFlow: number key selects+advances a flavor option; `Enter` commits a completed backbone;
  Back still works. (Fire `keydown` on the document.)
- `DependsCard`: renders a drag handle per context + the radiogroups (roles unchanged, so the
  Phase-1/3 role-based assertions hold); same-for-all still fills.
- Move the Continue assertions from `DependsCard.test` to `QuizFlow.test` (footer).
- Not unit-testable (verify via build + `npm run dev`): the `md:` matrix vs stack, sticky
  header/footer, real drag gestures, breakpoint behavior.
- Gate: full `npm test` (target: 114 + new, all green) + `npm run build` clean.

## Out of scope
Landing / computing / result screens (Phases 2–4 own those); content/wording; the scoring model.

## Verification caveat
Responsive + gesture behavior is confirmed by running it (`npm run dev`) at phone and desktop
widths; jsdom has no real viewport, so those are manual checks, not unit tests.
