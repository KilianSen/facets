# FPTIC Phase 2 — Direction B: Bookends (teach + reframe payoff) — design

**Date:** 2026-06-02
**Status:** approved, in implementation
**Branch:** `phase2-bookends` (off `main` after Phase 1)

## Context
Phase 1 made flavor single-tap and backbone a folded rank+map card, and added a baseline
(`Profile.baseline`), runner-up (`archetype.runnerUpId`), and `flexibility` that the result page
does not yet surface. This phase teaches the mechanic on first use and reframes the result so it is
comprehensible and rewarding.

## Decisions (confirmed)
- **Onboarding = inline coach-mark on the first backbone (depends) question**, first-run only,
  dismissible, persisted (`fptic.coach.v1`).
- **Match strength = qualitative band only** (no percentage).

## Scope

### Teach
- `Coachmark` component: a dismissible hint shown above the folded card the first time a `depends`
  phase renders ("Order these by how much each is you, pick what you'd do in each, then Continue").
  "Got it" dismisses and sets `fptic.coach.v1` so it never reappears. Wired in `QuizFlow`.

### Reframe the result
- **`matchBand(confidence)`** pure helper → "Strong match" / "Solid match" / "Slight lean".
- **`ArchetypeHeader`**: human **name** becomes the `<h1>` hero; **code** demoted to a small mono
  badge; replace "NN% match" with the **band**; add a runner-up line ("with a streak of <name>")
  when `runnerUpName` is provided.
- **`SignatureMap`**: add the premise framing line "You don't have one mode — here's how you shift."
  above the tells (empty-state consistency message preserved).
- **`BaselineReadout`** (new): describes the user's baseline leans (top dims by |value|, via the
  dim high/low labels) + a flexibility descriptor ("highly context-driven" / "situational" /
  "steady across situations"). Surfaces the Phase-1 baseline + flexibility.
- **`DimensionRanges`**: render the existing `lowLabel`/`highLabel` endpoints and a `typical`
  marker, so each bar is interpretable.
- **`ResultPage`**: resolve `runnerUpId` → name and pass to the header; add `BaselineReadout`.
- **Computing interstitial**: `App` shows a brief "reading your signature…" view between
  completion and the result (computeProfile is instant; a short timed beat rewards the effort).

## Testing (TDD)
- `matchBand` thresholds; `ArchetypeHeader` (name heading, code badge, band text, runner-up line);
  `SignatureMap` premise line; `BaselineReadout` (lean descriptors + flexibility label);
  `DimensionRanges` endpoint labels; `Coachmark` show/dismiss/persist via `QuizFlow`.
- Update `ResultComponents.test` (drop the `% match` assertion → band + name heading).
- Gate: full `npm test` green + `npm run build` clean, then a short adversarial review.

## Out of scope (Phase 3)
Design tokens, motion/animation, polished components, shareable result card + permalink.
