# FPTIC Phase 0 — UX Hygiene & Free Wins (design)

**Date:** 2026-06-02
**Status:** approved, in implementation
**Branch:** `phase0-ux-hygiene`

## Context

A multi-area audit of the user-interaction flow (see the session that produced this doc)
surfaced six cross-cutting themes and three strategic directions (A: right-size the core
mechanic; B: strengthen the bookends; C: design system + virality). The agreed roadmap is
to ship those three directions in sequence, preceded by a **Phase 0** of low-risk,
decision-free fixes that de-risk the larger phases and deliver immediate value.

Phase 0 changes *no* scoring/engine logic and makes no strategic bets. It is pure hygiene.

## Goals

1. Stop losing the computed result on a page refresh.
2. Make the first decision (mode) and in-quiz orientation legible.
3. Fix the worst accessibility gaps on the most-reused interactive elements.
4. Correct misleading microcopy.
5. Restore the page-shell basics (favicon, meta/OG, pinch-zoom).

Out of scope (deferred to later phases): reinstating the fast single-tap path, ranking
redesign, back/edit navigation, mid-quiz resume, onboarding/demo, result reframing,
design-token system, motion, sharing/permalink.

## Changes

### 1. Page shell — `index.html` (config; no unit test)
- Drop `maximum-scale=1.0` from the viewport meta → restore pinch-zoom.
- Add `<meta name="description">` and Open Graph tags (`og:title`, `og:description`,
  `og:type`). `og:image` deferred to Phase 3 (needs the share card).
- Descriptive `<title>`; inline-SVG data-URI favicon (no binary asset).

### 2. Microcopy
- Landing subtitle (`App.tsx`): plain-language value statement (keeps the literal phrase
  "it depends" so existing copy assertions hold).
- Ranking instruction (`DependsRanker.tsx`): "Order these from most to least like you —
  most on top."
- Mapper commit button (`CaseMapper.tsx`): "See result for this question" → "Continue".

### 3. Mode buttons — `App.tsx`
Each mode button shows a second line: count + estimated time (+ "sharper result" for deep).
Estimates reflect the *current* rank→map-every-question flow and will be revisited in Phase 1.

### 4. Accessibility + tap feedback
- `OptionList`: container `role="group"` labelled by the prompt heading; letter chips
  `aria-hidden`; `focus-visible` ring + `transition-colors` + `active:` state. (Dead path
  today, revived as the fast path in Phase 1 — so polish now pays off.)
- `CaseMapper`: each case is a `role="radiogroup"` (labelled by the case) of `role="radio"`
  options with `aria-checked` reflecting the mapping; focus rings.
- `DependsRanker`: ≥44px ↑/↓ targets + focus rings.

### 5. Progress — `QuizFlow.tsx`
- Replace the dim `n / N` text with a `role="progressbar"`
  (`aria-valuenow=<completed>`, `aria-valuemin=0`, `aria-valuemax=<total>`) plus a visible
  "Question {n} of {N}" label.
- Move focus to the question prompt heading on each new question.

### 6. Persist the result — `App.tsx`
- Export `RESULT_STORAGE_KEY`. On `handleComplete`, cache the `Profile` JSON.
- On mount, if a cached profile exists, boot directly into the result view (so a refresh on
  the result page keeps it). `start()` and `restart()` clear the cached result.
- A returning visitor who finished earlier lands on their last result with "Take it again"
  available (approved behavior; Phase 2 adds richer entry logic). Mid-quiz refresh behavior
  is unchanged (still returns to landing) — only the *result* is made durable here.

## Testing

TDD. New/updated tests:
- `App.test`: `Question 1 of 24` / `Question 1 of 60`; mode meta text; cached-profile
  restore-on-mount; "Take it again" clears the cache and returns to landing.
- `QuizFlow.test`: labelled `progressbar`; commit label → `Continue`.
- `CaseMapper.test`: commit label → `Continue`; radiogroup/radio + `aria-checked`.
- `QuestionCard.test`: options grouped under the prompt; option accessible name excludes the
  letter chip.
- `DependsRanker.test`: instruction copy present.

`index.html` and pure focus-ring styling are treated as the TDD config/styling exception.
Done = full `npm test` green (baseline 81) + `npm run build` clean.
