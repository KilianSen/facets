# FPTIC — Phase 1 Design: A Conditional ("It Depends") Personality Test

- **Date:** 2026-06-02
- **Status:** Approved design — ready for implementation planning
- **Scope of this spec:** Phase 1 (the MVP). Later phases are sketched at the end for context only.

---

## 1. Context & Problem

MBTI, FPTI (Fae's *Fae Personality Test Indicator*), and SBTI all force a **single answer** to questions whose honest answer is *conditional*. Real behaviour is situational — "I'm warm, but only with people I'm close to"; "I'm direct, but only when the stakes are low." Forcing one answer throws this away and is a core reason such tests feel reductive or inaccurate.

**The fix:** every question offers an **"It depends"** path. Choosing it splits the question into two or more **cases** (the same situation under different contexts). The user **ranks** the cases, then **maps** what they'd actually do in each — capturing how their behaviour bends with context. That bend is the heart of the result.

This is the first product in the `FPTIC` project. The team has studied FPTI/SBTI (see prior research) and saved Fae's live quiz UI as a visual reference (`questions.html` at repo root — a rendered Fae FPTI quiz, used as an aesthetic North Star, not as code).

## 2. Positioning (decided)

**Hybrid: fun + defensible.** Shareable, Gen-Z-flavoured surface like FPTI/Fae, but built on a genuinely sound conditional model so results feel uncannily accurate rather than random. Not a clinical instrument; no validity claims beyond "principled and self-consistent."

## 3. Goals / Non-Goals

**Goals (Phase 1):**
- A complete, takeable web quiz implementing the depends → rank → map mechanic.
- A pure, testable scoring engine that turns conditional answers into a behavioural signature and an archetype.
- A result page: archetype headline (A) + signature depth (C) + dimension ranges under the hood (B).
- Client-side only; no accounts, no backend.

**Non-Goals (Phase 1):** accounts, persistence beyond `localStorage`, sharing/OG images, compatibility/matching, any AI-companion handoff, server infrastructure. (These are Phases 2–5.)

## 4. The Model — CAPS / Behavioural Signatures (decided)

We do **not** compute global trait scores ("Warmth = 72"). Following Mischel & Shoda's *Cognitive-Affective Personality System* (CAPS, 1995), personality is modelled as a stable set of **if-then contingencies**: *if situation has feature X at level L, then behaviour leans this way.* The stable, identifying thing is the **behavioural signature** — the pattern of how behaviour shifts across situations. Two people who would score identically on a trait average can have opposite signatures; capturing that difference is the entire point.

**Pieces:**

- **Situation axes (the "if" space)** — a small, shared set of context features. Starter set (tunable content, not code):
  `closeness · stakes · audience (watched?) · energy · power · initiative`
- **Behavioural dimensions (the "then" vocabulary)** — used to *describe* a response; **never globally averaged** (that discipline is what makes it CAPS, not Big Five). Starter set:
  `warmth · approach · directness · boldness · lead · composure`
- **Contingency** — for one axis × one dimension, the **slope**: how the dimension's value changes as the axis moves (e.g. warmth falls steeply as closeness drops).
- **Signature** — the collection of contingencies across all axes. This *is* the profile (the C result). A scalar **flexibility** = mean |slope| summarises how context-driven the person is overall.
- **Archetype (A)** — defined as a **prototype signature** (an expected pattern of slopes). The user's archetype is the **nearest prototype signature** — about *how they flex*, not how much of a trait they hold. Examples: **THE VAULT** (warmth steep on closeness — all-in up close, sharp drop with distance), **THE CONSTANT** (flat everywhere — same with everyone), **THE PERFORMER** (spikes with audience — public ≠ private self).
- **Dimensions (B)** — survive only as **ranges** shown under the hood ("Warmth: 20→90 by closeness"), derived from the contingencies. No single point is ever shown.

## 5. The Mechanic & Answer Capture (decided)

Every question shows a scenario, 3–4 response options, and an **"It depends"** affordance.

1. **Fast path** — tap one option → done.
2. **Depends path** — the question splits into 2–3 **cases** (the same situation under different levels of one axis). The user:
   - **ranks** the cases (drag, most-true first), then
   - **maps** a response option to each case.

Ranking is **load-bearing, not cosmetic**: a case ranked "most true" weights its mapped response vector more heavily (ranking-as-weight — decided default). The rank spread also contributes to the perceived context-sensitivity.

```ts
type Answer =
  | { questionId: string; mode: 'single';  optionId: string }
  | { questionId: string; mode: 'depends';
      ranking: CaseId[];                       // most-true first  (the "rank")
      mapping: Record<CaseId, OptionId> }      // each case → response (the "map")
```

## 6. Content Model (§2)

All content is **typed data** consumed by a content-agnostic engine. Tuning the test = editing data + re-running engine tests; no engine rewrite.

```ts
type AxisId = 'closeness'|'stakes'|'audience'|'energy'|'power'|'initiative'
type DimId  = 'warmth'|'approach'|'directness'|'boldness'|'lead'|'composure'

interface SituationAxis { id: AxisId; name: string; lowLabel: string; highLabel: string }
interface BehaviorDim   { id: DimId;  name: string; lowLabel: string; highLabel: string }

interface Option   { id: string; label: string; vector: Partial<Record<DimId, number>> } // ints ~ -2..+2
interface Case     { id: string; label: string; axisLevel: number }                       // 0..1 along the axis
interface Question {
  id: string; prompt: string; options: Option[]
  kind: 'backbone' | 'flavor'
  axis?: AxisId            // backbone: which axis the cases span
  cases?: Case[]           // backbone: always present; flavor: shown only if user taps "It depends"
}
interface Archetype {
  id: string; code: string; name: string; tagline: string; copy: string
  signature: Partial<Record<AxisId, Partial<Record<DimId, number>>>>  // expected slopes = the prototype shape
}
```

**Two question kinds:**
- **Backbone (~8–12, decided range)** — *always* conditional. Cases are authored to span one `axis`, directly yielding slope data for it. The skeleton that **guarantees** a usable signature even if the user never voluntarily taps "depends" elsewhere. Coverage target: each axis probed by ≥1 backbone question (ideally 2).
- **Flavor (~10–15)** — single-tap fast path; "depends" optional (expands to a couple of generic context cases if tapped). Adds response texture and keeps the quiz quick for casual users.

**MVP content volume:** ≈ 20 questions · 6 axes · 6 dimensions · 12–16 archetypes (room to grow toward 24+ later).

## 7. The Engine (§3)

`computeProfile(answers, content) → Profile` — pure TypeScript, no React, deterministic.

Pipeline:
1. **Rules** — each mapped case → `{ axis, axisLevel, vector }`, weighted by its rank. Single taps → context-free response data (informs default tendencies, not slopes).
2. **Signature** — for each `axis × dim`, fit a **slope** (high-level mean − low-level mean; least-squares when ≥3 points). Compute global **flexibility** = mean |slope|. Retain per-level values for B ranges and C display.
3. **Match (A)** — distance between the user's signature and each archetype prototype signature over the axis×dim slope space; nearest wins; **deterministic tiebreak by catalog order**; keep a runner-up and a confidence value.
4. **Ranges (B)** — per dimension min / max / typical across contexts.
5. **Readout (C)** — top contingencies by |slope| rendered as if-then sentences ("close → you go all in; distant → you pull back").

```ts
interface Profile {
  archetype: { id: string; confidence: number; runnerUpId?: string }
  signature: Record<AxisId, Record<DimId, { slope: number; levels: { level: number; value: number }[] }>>
  topContingencies: { axis: AxisId; dim: DimId; slope: number; text: string }[]   // C
  dimensionRanges: Record<DimId, { min: number; max: number; typical: number }>   // B
  flexibility: number
}
```

**Edge cases:** insufficient backbone data → lower confidence (and/or gate completion on the backbone); missing dims default neutral; ties resolved deterministically; an all-single-tap run still yields a valid (low-flexibility) profile.

**Defensibility note:** slopes-of-behaviour-across-situation-features is a legitimate operationalisation of CAPS behavioural signatures. We make no clinical-validity claim; the construct is principled and the scoring is deterministic and testable.

## 8. Result Experience (A + C + B) (decided)

- **A — Archetype headline (hero):** named, shareable type + tagline (e.g. *"THE VAULT — selective, loyal-coded"*). Most screenshot-able.
- **C — Behavioural signature (depth):** the if-then map / slope visualisation — the novel core.
- **B — Dimension ranges (under the hood):** each dimension as a range + what shifts it; never a single point.

## 9. Architecture & UI (§4)

**Stack (decided):** Vite + React + TypeScript + Tailwind CSS. Client-side scoring; **no backend in Phase 1**. Test runner: Vitest + React Testing Library.

**Module map** (dependencies point inward to a pure core):

```
src/
  engine/     # pure TS, no React — types · rules · signature · match · scoring · index
  content/    # typed data — axes · dimensions · questions · archetypes · index (assembles + validates)
  quiz/       # React — QuizFlow · QuestionCard · OptionList · DependsRanker · CaseMapper · useQuizState (reducer)
  result/     # React — ResultPage · ArchetypeHeader(A) · SignatureMap(C) · DimensionRanges(B)
  app/        # App · router  (landing → quiz → result)
  styles/     # Tailwind + the dark "beam/glow" aesthetic referenced from questions.html
  main.tsx
```

**Quiz state machine:** `landing → question[i] → (if "it depends") rank cases → map response per case → … → computing → result`. A reducer holds `answers: Answer[]`, `currentIndex`, and transient per-question UI state. Validation gates advance: backbone depends-questions require a complete mapping of all cases. Answers persist to `localStorage` (refresh-safe). On finish → `computeProfile` → result.

**Reproducibility:** the result is derived purely from `answers + content`. This makes Phase-2 sharing nearly free (encode answers → recompute, or encode the Profile).

**UI principles:** mobile-first; dark beam/glow aesthetic (apply the `frontend-design` skill at build time, tastefully); the "It depends" reveal happens inline; drag-to-rank has an ↑↓ button fallback for accessibility and touch; options are keyboard-navigable.

## 10. Testing (§5)

- **Engine via TDD (Vitest)** — crafted answer sets assert: rules extracted correctly, slopes computed correctly, a canonical "Vault" answer pattern yields THE VAULT, determinism (same input → same output), edge cases (all single-tap, minimal data, ties).
- **Golden persona fixtures** — authored answer sets with expected archetypes; guard content + engine together; catch when content tuning breaks intended mappings.
- **Content-validation test** — every backbone has `axis` + `cases`; all `vector`/`signature` keys reference real ids; each axis has enough coverage. Fails CI on malformed content.
- **Component tests (RTL)** — depends-reveal, rank reorder, mapping-gates-advance, localStorage resume.
- **"Feels accurate" QA** — manual: take the test as known personas, sanity-check the readback. A checklist step, not a code gate.

## 11. Open Questions / Deferred Decisions

- Exact final lists of axes, dimensions, and the archetype catalog (12–16) — content work; iterated against golden personas during build.
- Slope fit: simple high−low contrast vs least-squares when ≥3 case levels (engine will support both; default chosen during implementation).
- Drag-and-drop library vs hand-rolled ↑↓ reorder — decided at build time (favor minimal deps).
- Confidence metric formula and the threshold for "insufficient data."

## 12. Roadmap Beyond Phase 1 (context only)

- **Phase 2 — Viral loop:** shareable result links + auto-generated share images (leverages reproducible results).
- **Phase 3 — Accounts & persistence:** auth, saved profiles, retakes, history (first backend).
- **Phase 4 — Social:** compatibility score between two people; match with strangers.
- **Phase 5 — Companion handoff (optional):** profile seeds an AI chat (the Fae angle).

## 13. Decision Log (from brainstorming)

| Decision | Choice |
|---|---|
| Positioning | Hybrid — fun + defensible |
| Mechanic | 3-step: single-tap OR "depends" → rank cases → map response per case |
| Ranking | Load-bearing (ranking-as-weight) |
| Result hero | A (archetype) headline · C (signature) depth · B (dimensions) under the hood |
| Scoring model | Pure if-then / CAPS behavioural signatures |
| Archetypes | Prototype signatures, matched by nearest shape |
| Backbone size | ~8–12 always-conditional questions |
| Build scope | Full product, decomposed; **Phase 1 (this spec) first** |
| Stack | Vite + React + TypeScript + Tailwind; client-side; Vitest + RTL |
