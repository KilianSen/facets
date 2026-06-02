# FPTIC Phase 1 — Direction A: Right-size the core mechanic (design)

**Date:** 2026-06-02
**Status:** approved, in implementation
**Branch:** `phase1-mechanic` (off `main` after Phase 0)

## Context

Audit + roadmap: see `2026-06-02-fptic-phase0-ux-hygiene-design.md` and the `fptic-ux-roadmap`
memory. Question bank is **12 backbone** (2/axis × 6 axes) + **48 flavor** = 60; all currently
carry `cases` and route into rank→map, which is the fatigue bug. Single answers currently
score nothing (`extractRules` skips them); matching is slope-only.

## Decisions (all confirmed with the user)

1. **Routing by kind.** `backbone` → folded depends screen; `flavor` → single-tap with an
   optional `＋ It depends` that promotes that question to the folded screen.
2. **Fold rank+map** into one backbone screen (reorderable case rows that each carry the
   response toggles). Plus a **"Same for all contexts"** one-tap fill.
3. **Navigation:** Back/edit a prior answer; resume an in-progress run after refresh.
4. **Baseline-aware archetype match** (the richest option, chosen knowing it adds a trait
   layer): single answers establish a baseline that affects *which* archetype you get.

## Engine — baseline-aware scoring

- `Archetype` gains `baseline?: Record<DimId, number>` (expected average level per dim; 0 where
  the archetype implies no level tendency).
- New `extractBaseline(answers, content): Record<DimId, number>`: per dim, the mean option-vector
  value across all answers — single answers contribute their option vector directly; depends
  answers contribute the mean of their mapped options' vectors. Dims with no data → 0.
- `Profile` gains `baseline: Record<DimId, number>` (also useful for Phase 2's readout).
- `matchArchetype(sig, baseline, content)`: `dist = slopeDist + λ·baselineDist`, both Euclidean.
  `baselineDist` over the 6 dims (archetype baseline defaults to 0 per dim). **λ defaults to 0.5**
  (slope-primary), tuned only if reachability needs it.
- Confidence formula unchanged initially (12 backbone → full axis sufficiency every run).

### Why this is tractable
- **Separation is automatic:** a user signature built from an archetype's own slopes + own
  baseline has combined distance 0 to itself and >0 to every other (slopes already distinct), so
  `archetypes.test` self-match holds for *any* authored baselines.
- **Reachability is the gate:** the synthesized ideal answerer must still map back. Slopes already
  do this; small λ keeps it true. Where a slope-degenerate pair would flip, adjust that
  archetype's baseline or λ. The reachability generator (`inCharacterAnswers`) is extended so
  flavor questions emit single answers whose option pushes the baseline toward the archetype.

## Interaction — reducer, UI, nav

- **Reducer phases** collapse to `single | depends | done`. `phaseFor` routes by `kind` (backbone
  → `depends`; flavor → `single`). A flavor `START_DEPENDS` (from `＋ It depends`) switches that
  question to `depends`.
- `depends` state holds `draftRanking` + `draftMapping` together (no separate ranking phase).
  New actions: `SET_RANK_ORDER`, `MAP_CASE` (existing), `FILL_ALL` (same response to every case),
  `COMMIT_DEPENDS`, `GO_BACK`. `canCommit` = every case mapped.
- **Folded backbone component** (`DependsCard`, replacing the DependsRanker→CaseMapper two-step):
  reorderable case rows (drag + ↑/↓ fallback) each with the response toggles; "Same for all";
  Continue (disabled until complete). `DependsRanker`/`CaseMapper` are removed or absorbed.
- **Back control** in `QuizFlow`: `GO_BACK` decrements index and rehydrates the draft from the
  stored answer (single → preselect; depends → ranking+mapping restored).
- **Resume:** persist `{answers, index, mode, questionIds}`. `App` mount offers
  "Continue (n/N)" + "Start over" when an in-progress run exists (built on the Phase 0
  persistence; landing entry refined further in Phase 2).

## Testing (TDD)

- Engine: `extractBaseline` cases; combined-distance match; baseline flips a slope-tied
  borderline; λ keeps slope primary. `archetypes.test` separation under combined metric.
  `reachability.test` regenerated for routing + baseline; all 20 still self-map.
- Interaction: flavor → single-tap; backbone → folded screen; "Same for all"; Back prefills;
  resume offers Continue; `useQuizState` reducer transitions.
- Gate: full `npm test` green + `npm run build` clean. Then a parallel adversarial-verification
  workflow (scoring correctness, separation/reachability really hold, folded-screen UX,
  regression) before the phase checkpoint.

## Out of scope (later phases)
Onboarding/teaching the mechanic, result reframing/readout copy, design tokens, motion,
sharing/permalink — Phases 2–3.
