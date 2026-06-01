# FPTIC Phase 1 — Conditional ("It Depends") Personality Test — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a takeable, client-side web personality test whose every question offers an "It depends" path (rank context cases → map a response per case), scored as a CAPS behavioural signature and reported as an archetype + signature + dimension ranges.

**Architecture:** A pure, content-agnostic TypeScript scoring engine (`src/engine`) consumes typed content data (`src/content`). A thin React UI (`src/quiz`, `src/result`) collects `Answer[]` via a reducer-driven state machine and renders the computed `Profile`. No backend; answers persist to `localStorage`. The result is derived purely from `answers + content`, so it is reproducible.

**Tech Stack:** Vite · React 18 · TypeScript · Tailwind CSS v3 · Vitest · React Testing Library · jsdom.

**Source of truth:** `docs/superpowers/specs/2026-06-02-fptic-phase1-conditional-personality-test-design.md`.

**Engine note (refinement of spec):** the spec wrote `AxisId`/`DimId` as literal unions; to keep the engine content-agnostic they are `string` in the engine, and the concrete ids live in `src/content`. For Phase-1 scoring, **only `depends`-mode answers drive the signature**; `single`-tap answers are recorded for future use but do not affect the score (backbone questions are always-conditional, guaranteeing signal).

---

## File Structure

```
package.json, vite.config.ts, tsconfig.json, tsconfig.node.json,
tailwind.config.js, postcss.config.js, index.html
src/
  main.tsx                      # React entry
  index.css                     # Tailwind directives
  test/setup.ts                 # RTL + jest-dom setup
  engine/
    types.ts                    # all shared types + isDependsAnswer guard
    rules.ts                    # extractRules, rankWeight
    signature.ts                # weightedSlope, computeSignature
    match.ts                    # signatureDistance, matchArchetype
    scoring.ts                  # describeContingency, computeProfile
    index.ts                    # re-exports
    testFixtures.ts             # tiny Content + answer builders for engine unit tests
  content/
    axes.ts                     # 6 situation axes
    dimensions.ts               # 6 behavioural dimensions
    archetypes.ts               # 6 prototype-signature archetypes
    questions.ts                # 8 questions (6 backbone + 2 flavor)
    validate.ts                 # validateContent()
    index.ts                    # assembles + validates content (the production Content)
    goldenPersonas.ts           # persona answer fixtures + expected archetype ids
  quiz/
    useQuizState.ts             # reducer + localStorage persistence
    OptionList.tsx
    QuestionCard.tsx
    DependsRanker.tsx
    CaseMapper.tsx
    QuizFlow.tsx
  result/
    ArchetypeHeader.tsx         # A
    SignatureMap.tsx            # C
    DimensionRanges.tsx         # B
    ResultPage.tsx
  app/
    App.tsx                     # landing → quiz → result view switch
```

Tests are colocated as `*.test.ts` / `*.test.tsx` next to each source file.

---

## Task 1: Project scaffold (Vite + React + TS + Tailwind + Vitest)

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/index.css`, `src/test/setup.ts`, `src/App.smoke.test.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "fptic",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vite": "^5.4.3",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "useDefineForClassFields": true,
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Create `vite.config.ts`** (includes Vitest config)

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

- [ ] **Step 5: Create `tailwind.config.js`, `postcss.config.js`, `src/index.css`**

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

`postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: dark; }
body { @apply bg-neutral-950 text-white antialiased; }
```

- [ ] **Step 6: Create `index.html`, `src/main.tsx`, `src/test/setup.ts`**

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <title>FPTIC</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { App } from './app/App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Create the smoke test `src/App.smoke.test.ts`**

```ts
import { describe, it, expect } from 'vitest'

describe('toolchain', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 8: Install and verify the test runner**

Run: `npm install`
Then: `npx vitest run src/App.smoke.test.ts`
Expected: 1 passed. (`src/app/App.tsx` does not exist yet — `main.tsx` will fail to build until Task 14; that is expected and not exercised by this test.)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest"
```

---

## Task 2: Engine types

**Files:**
- Create: `src/engine/types.ts`
- Test: `src/engine/types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { isDependsAnswer, type Answer } from './types'

describe('isDependsAnswer', () => {
  it('narrows depends answers', () => {
    const single: Answer = { questionId: 'q', mode: 'single', optionId: 'a' }
    const depends: Answer = { questionId: 'q', mode: 'depends', ranking: ['c1'], mapping: { c1: 'a' } }
    expect(isDependsAnswer(single)).toBe(false)
    expect(isDependsAnswer(depends)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/types.test.ts`
Expected: FAIL — cannot find module `./types`.

- [ ] **Step 3: Write `src/engine/types.ts`**

```ts
export type AxisId = string
export type DimId = string

export interface SituationAxis { id: AxisId; name: string; lowLabel: string; highLabel: string }
export interface BehaviorDim { id: DimId; name: string; lowLabel: string; highLabel: string }

export type Vector = Record<DimId, number>

export interface Option { id: string; label: string; vector: Vector }
export interface Case { id: string; label: string; axisLevel: number } // 0..1
export type QuestionKind = 'backbone' | 'flavor'

export interface Question {
  id: string
  prompt: string
  options: Option[]
  kind: QuestionKind
  axis?: AxisId
  cases?: Case[]
}

export interface Archetype {
  id: string
  code: string
  name: string
  tagline: string
  copy: string
  /** expected slope per axis per dim — the prototype shape */
  signature: Record<AxisId, Record<DimId, number>>
}

export interface Content {
  axes: SituationAxis[]
  dims: BehaviorDim[]
  questions: Question[]
  archetypes: Archetype[]
}

export interface SingleAnswer { questionId: string; mode: 'single'; optionId: string }
export interface DependsAnswer {
  questionId: string
  mode: 'depends'
  ranking: string[]               // case ids, most-true first
  mapping: Record<string, string> // caseId -> optionId
}
export type Answer = SingleAnswer | DependsAnswer

export interface Rule { axis: AxisId; axisLevel: number; vector: Vector; weight: number }

export interface AxisDimCell { slope: number; levels: { level: number; value: number }[] }
export type Signature = Record<AxisId, Record<DimId, AxisDimCell>>

export interface Contingency { axis: AxisId; dim: DimId; slope: number; text: string }
export interface ArchetypeMatch { id: string; confidence: number; runnerUpId?: string }

export interface Profile {
  archetype: ArchetypeMatch
  signature: Signature
  topContingencies: Contingency[]
  dimensionRanges: Record<DimId, { min: number; max: number; typical: number }>
  flexibility: number
}

export function isDependsAnswer(a: Answer): a is DependsAnswer {
  return a.mode === 'depends'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/types.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/types.ts src/engine/types.test.ts
git commit -m "feat(engine): add core types and isDependsAnswer guard"
```

---

## Task 3: Engine test fixtures + rules extraction

**Files:**
- Create: `src/engine/testFixtures.ts`, `src/engine/rules.ts`
- Test: `src/engine/rules.test.ts`

- [ ] **Step 1: Create the shared test fixture `src/engine/testFixtures.ts`**

```ts
import type { Content, Answer } from './types'

// Tiny content: 1 axis (closeness), 2 dims (warmth, approach), 1 backbone question, 2 archetypes.
export function makeTestContent(): Content {
  return {
    axes: [{ id: 'closeness', name: 'Closeness', lowLabel: "it's a stranger", highLabel: "it's someone close" }],
    dims: [
      { id: 'warmth', name: 'Warmth', lowLabel: 'stay cool', highLabel: 'get warm' },
      { id: 'approach', name: 'Approach', lowLabel: 'pull back', highLabel: 'lean in' },
    ],
    questions: [
      {
        id: 'q_close',
        prompt: 'A friend is going through something rough. You…',
        kind: 'backbone',
        axis: 'closeness',
        cases: [
          { id: 'c_best', label: 'your best friend', axisLevel: 1 },
          { id: 'c_mid', label: 'a monthly friend', axisLevel: 0.5 },
          { id: 'c_far', label: 'a friend-of-a-friend', axisLevel: 0 },
        ],
        options: [
          { id: 'A', label: 'show up at their door', vector: { warmth: 2, approach: 2 } },
          { id: 'B', label: 'a caring text, then space', vector: { warmth: 1, approach: 0 } },
          { id: 'C', label: 'like the post, move on', vector: { warmth: -1, approach: -2 } },
        ],
      },
    ],
    archetypes: [
      { id: 'vault', code: 'VAULT', name: 'The Vault', tagline: 'selective', copy: '',
        signature: { closeness: { warmth: 3, approach: 3 } } },
      { id: 'constant', code: 'CONSTANT', name: 'The Constant', tagline: 'unchanging', copy: '',
        signature: {} },
    ],
  }
}

// Vault-shaped answer: warm+approach high when close, cold when distant.
export const vaultAnswer: Answer = {
  questionId: 'q_close', mode: 'depends',
  ranking: ['c_best', 'c_mid', 'c_far'],
  mapping: { c_best: 'A', c_mid: 'B', c_far: 'C' },
}

// Constant-shaped answer: same option for every case (flat).
export const constantAnswer: Answer = {
  questionId: 'q_close', mode: 'depends',
  ranking: ['c_best', 'c_mid', 'c_far'],
  mapping: { c_best: 'B', c_mid: 'B', c_far: 'B' },
}
```

- [ ] **Step 2: Write the failing test `src/engine/rules.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { extractRules, rankWeight } from './rules'
import { makeTestContent, vaultAnswer } from './testFixtures'

describe('rankWeight', () => {
  it('gives most-true (index 0) the highest weight', () => {
    expect(rankWeight(0, 3)).toBe(3)
    expect(rankWeight(2, 3)).toBe(1)
  })
})

describe('extractRules', () => {
  it('produces one rule per mapped case with axis level and vector', () => {
    const rules = extractRules([vaultAnswer], makeTestContent())
    expect(rules).toHaveLength(3)
    const best = rules.find(r => r.axisLevel === 1)!
    expect(best.axis).toBe('closeness')
    expect(best.vector).toEqual({ warmth: 2, approach: 2 })
    expect(best.weight).toBe(3) // ranked first
  })

  it('ignores single-mode answers', () => {
    const rules = extractRules(
      [{ questionId: 'q_close', mode: 'single', optionId: 'A' }],
      makeTestContent(),
    )
    expect(rules).toHaveLength(0)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/engine/rules.test.ts`
Expected: FAIL — cannot find module `./rules`.

- [ ] **Step 4: Write `src/engine/rules.ts`**

```ts
import { type Answer, type Content, type Rule, isDependsAnswer } from './types'

/** Most-true (index 0) gets the highest weight: weight = total - index. */
export function rankWeight(index: number, total: number): number {
  return total - index
}

export function extractRules(answers: Answer[], content: Content): Rule[] {
  const qById = new Map(content.questions.map(q => [q.id, q]))
  const rules: Rule[] = []

  for (const a of answers) {
    if (!isDependsAnswer(a)) continue
    const q = qById.get(a.questionId)
    if (!q || q.axis === undefined || !q.cases) continue

    const total = a.ranking.length
    for (const c of q.cases) {
      const optionId = a.mapping[c.id]
      if (optionId === undefined) continue
      const opt = q.options.find(o => o.id === optionId)
      if (!opt) continue
      const rank = a.ranking.indexOf(c.id)
      const weight = rank >= 0 ? rankWeight(rank, total) : 1
      rules.push({ axis: q.axis, axisLevel: c.axisLevel, vector: opt.vector, weight })
    }
  }
  return rules
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/engine/rules.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/engine/testFixtures.ts src/engine/rules.ts src/engine/rules.test.ts
git commit -m "feat(engine): extract weighted if-then rules from depends answers"
```

---

## Task 4: Signature computation (slopes + flexibility)

**Files:**
- Create: `src/engine/signature.ts`
- Test: `src/engine/signature.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { weightedSlope, computeSignature } from './signature'
import { extractRules } from './rules'
import { makeTestContent, vaultAnswer, constantAnswer } from './testFixtures'

describe('weightedSlope', () => {
  it('is positive when y rises with x', () => {
    expect(weightedSlope([{ x: 0, y: -1, w: 1 }, { x: 1, y: 1, w: 1 }])).toBeGreaterThan(0)
  })
  it('is zero when all y equal', () => {
    expect(weightedSlope([{ x: 0, y: 2, w: 1 }, { x: 1, y: 2, w: 3 }])).toBe(0)
  })
  it('is zero when all x equal (no spread)', () => {
    expect(weightedSlope([{ x: 1, y: 1, w: 1 }, { x: 1, y: 5, w: 1 }])).toBe(0)
  })
})

describe('computeSignature', () => {
  const content = makeTestContent()

  it('produces positive slopes for a vault-shaped answer', () => {
    const { signature, flexibility } = computeSignature(extractRules([vaultAnswer], content), content)
    expect(signature.closeness.warmth.slope).toBeGreaterThan(0)
    expect(signature.closeness.approach.slope).toBeGreaterThan(0)
    expect(flexibility).toBeGreaterThan(0)
    // levels are sorted ascending by axis level
    expect(signature.closeness.warmth.levels.map(l => l.level)).toEqual([0, 0.5, 1])
  })

  it('produces zero slopes and zero flexibility for a flat answer', () => {
    const { signature, flexibility } = computeSignature(extractRules([constantAnswer], content), content)
    expect(signature.closeness.warmth.slope).toBe(0)
    expect(signature.closeness.approach.slope).toBe(0)
    expect(flexibility).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/signature.test.ts`
Expected: FAIL — cannot find module `./signature`.

- [ ] **Step 3: Write `src/engine/signature.ts`**

```ts
import { type Content, type Rule, type Signature, type AxisDimCell } from './types'

interface Pt { x: number; y: number; w: number }

/** Weighted least-squares slope of y over x. Returns 0 if no x-spread or no weight. */
export function weightedSlope(points: Pt[]): number {
  const W = points.reduce((s, p) => s + p.w, 0)
  if (W === 0) return 0
  const xbar = points.reduce((s, p) => s + p.w * p.x, 0) / W
  const ybar = points.reduce((s, p) => s + p.w * p.y, 0) / W
  let num = 0, den = 0
  for (const p of points) {
    num += p.w * (p.x - xbar) * (p.y - ybar)
    den += p.w * (p.x - xbar) * (p.x - xbar)
  }
  return den === 0 ? 0 : num / den
}

export function computeSignature(rules: Rule[], content: Content): { signature: Signature; flexibility: number } {
  const signature: Signature = {}
  const slopeMagnitudes: number[] = []

  for (const axis of content.axes) {
    signature[axis.id] = {}
    const axisRules = rules.filter(r => r.axis === axis.id)

    for (const dim of content.dims) {
      const points: Pt[] = axisRules
        .filter(r => dim.id in r.vector)
        .map(r => ({ x: r.axisLevel, y: r.vector[dim.id], w: r.weight }))

      const slope = weightedSlope(points)

      const byLevel = new Map<number, { sw: number; swy: number }>()
      for (const p of points) {
        const e = byLevel.get(p.x) ?? { sw: 0, swy: 0 }
        e.sw += p.w
        e.swy += p.w * p.y
        byLevel.set(p.x, e)
      }
      const levels = [...byLevel.entries()]
        .map(([level, e]) => ({ level, value: e.sw ? e.swy / e.sw : 0 }))
        .sort((a, b) => a.level - b.level)

      const cell: AxisDimCell = { slope, levels }
      signature[axis.id][dim.id] = cell
      if (points.length > 0) slopeMagnitudes.push(Math.abs(slope))
    }
  }

  const flexibility = slopeMagnitudes.length
    ? slopeMagnitudes.reduce((s, v) => s + v, 0) / slopeMagnitudes.length
    : 0

  return { signature, flexibility }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/signature.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/signature.ts src/engine/signature.test.ts
git commit -m "feat(engine): compute behavioural signature (weighted slopes + flexibility)"
```

---

## Task 5: Archetype matching

**Files:**
- Create: `src/engine/match.ts`
- Test: `src/engine/match.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { matchArchetype } from './match'
import { computeSignature } from './signature'
import { extractRules } from './rules'
import { makeTestContent, vaultAnswer, constantAnswer } from './testFixtures'
import type { Signature } from './types'

describe('matchArchetype', () => {
  const content = makeTestContent()

  it('matches a vault-shaped signature to the vault archetype', () => {
    const { signature } = computeSignature(extractRules([vaultAnswer], content), content)
    const match = matchArchetype(signature, content)
    expect(match.id).toBe('vault')
    expect(match.runnerUpId).toBe('constant')
    expect(match.confidence).toBeGreaterThan(0.5)
  })

  it('matches a flat signature to the constant archetype', () => {
    const { signature } = computeSignature(extractRules([constantAnswer], content), content)
    expect(matchArchetype(signature, content).id).toBe('constant')
  })

  it('breaks ties deterministically by catalog order', () => {
    // empty signature: distance to vault and constant differ, but force a tie via two identical archetypes
    const tied = {
      ...content,
      archetypes: [
        { id: 'first', code: 'F', name: 'First', tagline: '', copy: '', signature: {} },
        { id: 'second', code: 'S', name: 'Second', tagline: '', copy: '', signature: {} },
      ],
    }
    const flat: Signature = { closeness: { warmth: { slope: 0, levels: [] }, approach: { slope: 0, levels: [] } } }
    expect(matchArchetype(flat, tied).id).toBe('first')
  })

  it('throws when no archetypes are defined', () => {
    expect(() => matchArchetype({}, { ...content, archetypes: [] })).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/match.test.ts`
Expected: FAIL — cannot find module `./match`.

- [ ] **Step 3: Write `src/engine/match.ts`**

```ts
import { type Content, type Signature, type ArchetypeMatch } from './types'

/** Euclidean distance between a user signature and a prototype signature over all axis×dim slopes. */
export function signatureDistance(
  sig: Signature,
  proto: Record<string, Record<string, number>>,
  content: Content,
): number {
  let sum = 0
  for (const axis of content.axes) {
    const protoAxis = proto[axis.id] ?? {}
    for (const dim of content.dims) {
      const userSlope = sig[axis.id]?.[dim.id]?.slope ?? 0
      const protoSlope = protoAxis[dim.id] ?? 0
      const d = userSlope - protoSlope
      sum += d * d
    }
  }
  return Math.sqrt(sum)
}

export function matchArchetype(sig: Signature, content: Content): ArchetypeMatch {
  if (content.archetypes.length === 0) throw new Error('No archetypes defined in content')

  const scored = content.archetypes.map((a, idx) => ({
    id: a.id,
    idx,
    dist: signatureDistance(sig, a.signature, content),
  }))
  scored.sort((a, b) => a.dist - b.dist || a.idx - b.idx) // nearest; tiebreak by catalog order

  const best = scored[0]
  const runnerUp = scored[1]

  let confidence = 1
  if (runnerUp) {
    const denom = best.dist + runnerUp.dist
    confidence = denom === 0 ? 0.5 : Math.max(0, Math.min(1, (runnerUp.dist - best.dist) / denom + 0.5))
  }

  return { id: best.id, confidence, runnerUpId: runnerUp?.id }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/match.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/match.ts src/engine/match.test.ts
git commit -m "feat(engine): nearest-prototype-signature archetype matching"
```

---

## Task 6: computeProfile + contingency readout + index

**Files:**
- Create: `src/engine/scoring.ts`, `src/engine/index.ts`
- Test: `src/engine/scoring.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { computeProfile, describeContingency } from './scoring'
import { makeTestContent, vaultAnswer } from './testFixtures'

describe('describeContingency', () => {
  it('reads high-pole behaviour for a positive slope', () => {
    const text = describeContingency('closeness', 'warmth', 2, makeTestContent())
    expect(text).toContain('someone close')
    expect(text).toContain('get warm')
  })
  it('flips poles for a negative slope', () => {
    const text = describeContingency('closeness', 'warmth', -2, makeTestContent())
    expect(text).toContain('someone close')
    expect(text).toContain('stay cool')
  })
})

describe('computeProfile', () => {
  const content = makeTestContent()

  it('returns the full profile for a vault answer', () => {
    const p = computeProfile([vaultAnswer], content)
    expect(p.archetype.id).toBe('vault')
    expect(p.flexibility).toBeGreaterThan(0)
    expect(p.topContingencies.length).toBeGreaterThan(0)
    // strongest contingency is sorted first by |slope|
    const slopes = p.topContingencies.map(c => Math.abs(c.slope))
    expect(slopes).toEqual([...slopes].sort((a, b) => b - a))
    // dimension ranges present for both dims
    expect(p.dimensionRanges.warmth.max).toBeGreaterThanOrEqual(p.dimensionRanges.warmth.min)
  })

  it('is deterministic (same input → same output)', () => {
    expect(computeProfile([vaultAnswer], content)).toEqual(computeProfile([vaultAnswer], content))
  })

  it('handles an empty answer set without throwing', () => {
    const p = computeProfile([], content)
    expect(p.flexibility).toBe(0)
    expect(typeof p.archetype.id).toBe('string')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/scoring.test.ts`
Expected: FAIL — cannot find module `./scoring`.

- [ ] **Step 3: Write `src/engine/scoring.ts`**

```ts
import { type Answer, type Content, type Profile, type Contingency } from './types'
import { extractRules } from './rules'
import { computeSignature } from './signature'
import { matchArchetype } from './match'

export function describeContingency(axisId: string, dimId: string, slope: number, content: Content): string {
  const axis = content.axes.find(a => a.id === axisId)!
  const dim = content.dims.find(d => d.id === dimId)!
  const highBehaviour = slope >= 0 ? dim.highLabel : dim.lowLabel
  const lowBehaviour = slope >= 0 ? dim.lowLabel : dim.highLabel
  return `When ${axis.highLabel}, you ${highBehaviour}; when ${axis.lowLabel}, you ${lowBehaviour}.`
}

export function computeProfile(answers: Answer[], content: Content): Profile {
  const rules = extractRules(answers, content)
  const { signature, flexibility } = computeSignature(rules, content)
  const archetype = matchArchetype(signature, content)

  const dimensionRanges: Profile['dimensionRanges'] = {}
  for (const dim of content.dims) {
    const vals: number[] = []
    for (const axis of content.axes) {
      for (const lvl of signature[axis.id][dim.id].levels) vals.push(lvl.value)
    }
    dimensionRanges[dim.id] = vals.length
      ? { min: Math.min(...vals), max: Math.max(...vals), typical: vals.reduce((s, v) => s + v, 0) / vals.length }
      : { min: 0, max: 0, typical: 0 }
  }

  const cells: Contingency[] = []
  for (const axis of content.axes) {
    for (const dim of content.dims) {
      const slope = signature[axis.id][dim.id].slope
      if (slope !== 0) {
        cells.push({ axis: axis.id, dim: dim.id, slope, text: describeContingency(axis.id, dim.id, slope, content) })
      }
    }
  }
  cells.sort((a, b) => Math.abs(b.slope) - Math.abs(a.slope))

  return { archetype, signature, topContingencies: cells.slice(0, 5), dimensionRanges, flexibility }
}
```

- [ ] **Step 4: Write `src/engine/index.ts`**

```ts
export * from './types'
export { extractRules, rankWeight } from './rules'
export { computeSignature, weightedSlope } from './signature'
export { matchArchetype, signatureDistance } from './match'
export { computeProfile, describeContingency } from './scoring'
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/engine/scoring.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/engine/scoring.ts src/engine/index.ts src/engine/scoring.test.ts
git commit -m "feat(engine): computeProfile pipeline + contingency readout"
```

---

## Task 7: Content — axes & dimensions

**Files:**
- Create: `src/content/axes.ts`, `src/content/dimensions.ts`
- Test: `src/content/axes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { AXES } from './axes'
import { DIMS } from './dimensions'

describe('content primitives', () => {
  it('defines 6 axes with unique ids and labels', () => {
    expect(AXES).toHaveLength(6)
    expect(new Set(AXES.map(a => a.id)).size).toBe(6)
    for (const a of AXES) { expect(a.name).toBeTruthy(); expect(a.lowLabel).toBeTruthy(); expect(a.highLabel).toBeTruthy() }
  })
  it('defines 6 dimensions with unique ids and labels', () => {
    expect(DIMS).toHaveLength(6)
    expect(new Set(DIMS.map(d => d.id)).size).toBe(6)
    for (const d of DIMS) { expect(d.name).toBeTruthy(); expect(d.lowLabel).toBeTruthy(); expect(d.highLabel).toBeTruthy() }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/content/axes.test.ts`
Expected: FAIL — cannot find module `./axes`.

- [ ] **Step 3: Write `src/content/axes.ts`**

```ts
import type { SituationAxis } from '../engine/types'

// highLabel / lowLabel are clauses that read after "When …".
export const AXES: SituationAxis[] = [
  { id: 'closeness',  name: 'Closeness',  lowLabel: "it's a stranger",          highLabel: "it's someone close" },
  { id: 'stakes',     name: 'Stakes',     lowLabel: "it's trivial",             highLabel: 'the stakes are high' },
  { id: 'audience',   name: 'Audience',   lowLabel: "it's just you",            highLabel: "you're being watched" },
  { id: 'energy',     name: 'Energy',     lowLabel: "you're drained",           highLabel: "you're energized" },
  { id: 'power',      name: 'Power',      lowLabel: "you've got no leverage",   highLabel: 'you hold the power' },
  { id: 'initiative', name: 'Initiative', lowLabel: 'they came to you',         highLabel: 'you make the first move' },
]
```

- [ ] **Step 4: Write `src/content/dimensions.ts`**

```ts
import type { BehaviorDim } from '../engine/types'

// highLabel / lowLabel are verb phrases that read after "you …".
export const DIMS: BehaviorDim[] = [
  { id: 'warmth',     name: 'Warmth',     lowLabel: 'stay cool',       highLabel: 'get warm' },
  { id: 'approach',   name: 'Approach',   lowLabel: 'pull back',       highLabel: 'lean in' },
  { id: 'directness', name: 'Directness', lowLabel: 'stay diplomatic', highLabel: 'get blunt' },
  { id: 'boldness',   name: 'Boldness',   lowLabel: 'play it safe',    highLabel: 'take the risk' },
  { id: 'lead',       name: 'Lead',       lowLabel: 'follow',          highLabel: 'take charge' },
  { id: 'composure',  name: 'Composure',  lowLabel: 'get rattled',     highLabel: 'stay calm' },
]
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/content/axes.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/content/axes.ts src/content/dimensions.ts src/content/axes.test.ts
git commit -m "feat(content): define 6 situation axes and 6 behavioural dimensions"
```

---

## Task 8: Content validation

**Files:**
- Create: `src/content/validate.ts`
- Test: `src/content/validate.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { validateContent } from './validate'
import type { Content } from '../engine/types'

const base: Content = {
  axes: [{ id: 'closeness', name: 'Closeness', lowLabel: 'lo', highLabel: 'hi' }],
  dims: [{ id: 'warmth', name: 'Warmth', lowLabel: 'lo', highLabel: 'hi' }],
  questions: [{
    id: 'q1', prompt: 'p', kind: 'backbone', axis: 'closeness',
    cases: [{ id: 'c1', label: 'c', axisLevel: 1 }],
    options: [{ id: 'A', label: 'a', vector: { warmth: 1 } }],
  }],
  archetypes: [{ id: 'x', code: 'X', name: 'X', tagline: '', copy: '', signature: { closeness: { warmth: 1 } } }],
}

describe('validateContent', () => {
  it('passes valid content', () => {
    expect(validateContent(base)).toEqual([])
  })
  it('flags a backbone question missing axis/cases', () => {
    const bad = { ...base, questions: [{ ...base.questions[0], axis: undefined, cases: undefined }] }
    expect(validateContent(bad).join(' ')).toMatch(/backbone/i)
  })
  it('flags an option vector referencing an unknown dim', () => {
    const bad = { ...base, questions: [{ ...base.questions[0], options: [{ id: 'A', label: 'a', vector: { ghost: 1 } }] }] }
    expect(validateContent(bad).join(' ')).toMatch(/ghost/)
  })
  it('flags an archetype signature referencing an unknown axis', () => {
    const bad = { ...base, archetypes: [{ ...base.archetypes[0], signature: { nope: { warmth: 1 } } }] }
    expect(validateContent(bad).join(' ')).toMatch(/nope/)
  })
  it('flags an axis with no backbone coverage', () => {
    const bad = { ...base, axes: [...base.axes, { id: 'stakes', name: 'Stakes', lowLabel: 'l', highLabel: 'h' }] }
    expect(validateContent(bad).join(' ')).toMatch(/stakes/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/content/validate.test.ts`
Expected: FAIL — cannot find module `./validate`.

- [ ] **Step 3: Write `src/content/validate.ts`**

```ts
import type { Content } from '../engine/types'

/** Returns an array of human-readable problems. Empty array = valid. */
export function validateContent(content: Content): string[] {
  const errors: string[] = []
  const axisIds = new Set(content.axes.map(a => a.id))
  const dimIds = new Set(content.dims.map(d => d.id))

  const backboneAxes = new Set<string>()

  for (const q of content.questions) {
    if (q.kind === 'backbone') {
      if (q.axis === undefined || !q.cases || q.cases.length < 2) {
        errors.push(`backbone question "${q.id}" must have an axis and >=2 cases`)
      }
      if (q.axis) backboneAxes.add(q.axis)
    }
    if (q.axis && !axisIds.has(q.axis)) errors.push(`question "${q.id}" references unknown axis "${q.axis}"`)
    for (const o of q.options) {
      for (const dimId of Object.keys(o.vector)) {
        if (!dimIds.has(dimId)) errors.push(`question "${q.id}" option "${o.id}" references unknown dim "${dimId}"`)
      }
    }
  }

  for (const a of content.archetypes) {
    for (const axisId of Object.keys(a.signature)) {
      if (!axisIds.has(axisId)) errors.push(`archetype "${a.id}" references unknown axis "${axisId}"`)
      for (const dimId of Object.keys(a.signature[axisId])) {
        if (!dimIds.has(dimId)) errors.push(`archetype "${a.id}" references unknown dim "${dimId}"`)
      }
    }
  }

  for (const axis of content.axes) {
    if (!backboneAxes.has(axis.id)) errors.push(`axis "${axis.id}" has no backbone question covering it`)
  }

  return errors
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/content/validate.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/content/validate.ts src/content/validate.test.ts
git commit -m "feat(content): validateContent integrity checker"
```

---

## Task 9: Content — archetype catalog (6)

**Files:**
- Create: `src/content/archetypes.ts`
- Test: `src/content/archetypes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { ARCHETYPES } from './archetypes'

describe('ARCHETYPES', () => {
  it('defines 6 archetypes with unique ids and codes and non-empty copy', () => {
    expect(ARCHETYPES).toHaveLength(6)
    expect(new Set(ARCHETYPES.map(a => a.id)).size).toBe(6)
    expect(new Set(ARCHETYPES.map(a => a.code)).size).toBe(6)
    for (const a of ARCHETYPES) { expect(a.name).toBeTruthy(); expect(a.tagline).toBeTruthy(); expect(a.copy).toBeTruthy() }
  })
  it('includes the constant archetype with a flat (empty) signature', () => {
    const constant = ARCHETYPES.find(a => a.id === 'constant')!
    expect(constant.signature).toEqual({})
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/content/archetypes.test.ts`
Expected: FAIL — cannot find module `./archetypes`.

- [ ] **Step 3: Write `src/content/archetypes.ts`**

```ts
import type { Archetype } from '../engine/types'

export const ARCHETYPES: Archetype[] = [
  {
    id: 'vault', code: 'VAULT', name: 'The Vault', tagline: 'selective · loyal-coded',
    copy: 'You go all in for your inner circle and ration warmth sharply by distance. Not cold — selective.',
    signature: { closeness: { warmth: 3, approach: 3 } },
  },
  {
    id: 'constant', code: 'CONSTANT', name: 'The Constant', tagline: 'same with everyone',
    copy: 'Context barely moves you. People always know what they are getting — steady, unbothered, consistent.',
    signature: {},
  },
  {
    id: 'performer', code: 'PERFORMER', name: 'The Performer', tagline: 'comes alive with eyes on you',
    copy: 'Your dial spikes when watched. Private you and public you are different people — and you know it.',
    signature: { audience: { warmth: 3, boldness: 3 } },
  },
  {
    id: 'clutch', code: 'CLUTCH', name: 'The Clutch', tagline: 'rises to pressure',
    copy: 'Low stakes barely register; when it actually matters you get calm, decisive, and take the wheel.',
    signature: { stakes: { composure: 3, lead: 2, boldness: 2 } },
  },
  {
    id: 'operator', code: 'OPERATOR', name: 'The Operator', tagline: 'reads the room for leverage',
    copy: 'With the upper hand you say exactly what you think and steer. Without it you go diplomatic and patient.',
    signature: { power: { directness: 3, lead: 2 } },
  },
  {
    id: 'spark', code: 'SPARK', name: 'The Spark', tagline: 'ignites when it is on you',
    copy: 'When someone has to make the first move, it is you — bold, forward, leading. When it lands in your lap, less so.',
    signature: { initiative: { approach: 2, boldness: 3, lead: 2 } },
  },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/content/archetypes.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/content/archetypes.ts src/content/archetypes.test.ts
git commit -m "feat(content): 6-archetype starter catalog as prototype signatures"
```

---

## Task 10: Content — question bank (8) + assembled index

**Files:**
- Create: `src/content/questions.ts`, `src/content/index.ts`
- Test: `src/content/index.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { CONTENT } from './index'
import { validateContent } from './validate'

describe('assembled CONTENT', () => {
  it('passes validateContent (every axis covered, all refs valid)', () => {
    expect(validateContent(CONTENT)).toEqual([])
  })
  it('has one backbone question per axis (6) plus flavor', () => {
    const backbone = CONTENT.questions.filter(q => q.kind === 'backbone')
    expect(backbone).toHaveLength(6)
    expect(new Set(backbone.map(q => q.axis)).size).toBe(6)
    expect(CONTENT.questions.length).toBeGreaterThanOrEqual(8)
  })
  it('every case axisLevel is within [0,1]', () => {
    for (const q of CONTENT.questions) for (const c of q.cases ?? []) {
      expect(c.axisLevel).toBeGreaterThanOrEqual(0)
      expect(c.axisLevel).toBeLessThanOrEqual(1)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/content/index.test.ts`
Expected: FAIL — cannot find module `./index`.

- [ ] **Step 3: Write `src/content/questions.ts`**

```ts
import type { Question } from '../engine/types'

export const QUESTIONS: Question[] = [
  // ---- Backbone: closeness ----
  {
    id: 'q_close', prompt: 'A friend is going through something rough. You…', kind: 'backbone', axis: 'closeness',
    cases: [
      { id: 'best', label: 'your ride-or-die best friend', axisLevel: 1 },
      { id: 'monthly', label: 'a good friend you see monthly', axisLevel: 0.5 },
      { id: 'foaf', label: 'a friend-of-a-friend', axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: 'show up at their door with food', vector: { warmth: 2, approach: 2 } },
      { id: 'B', label: 'a caring text, then give them space', vector: { warmth: 1, approach: 0 } },
      { id: 'C', label: 'like the post and move on', vector: { warmth: -1, approach: -2 } },
    ],
  },
  // ---- Backbone: stakes ----
  {
    id: 'q_stakes', prompt: 'A group decision is going sideways. You…', kind: 'backbone', axis: 'stakes',
    cases: [
      { id: 'matters', label: 'it actually matters', axisLevel: 1 },
      { id: 'real', label: "it's a real plan", axisLevel: 0.5 },
      { id: 'trivial', label: "it's just where to eat", axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: 'take charge and call it', vector: { lead: 2, boldness: 2, composure: 1 } },
      { id: 'B', label: 'nudge it gently', vector: { lead: 1, boldness: 0, composure: 1 } },
      { id: 'C', label: 'stay out of it', vector: { lead: -1, boldness: -1, composure: 0 } },
    ],
  },
  // ---- Backbone: audience ----
  {
    id: 'q_audience', prompt: 'You have a take you believe in. You…', kind: 'backbone', axis: 'audience',
    cases: [
      { id: 'public', label: 'posting it publicly', axisLevel: 1 },
      { id: 'group', label: 'in the group chat', axisLevel: 0.5 },
      { id: 'dm', label: 'in a 1:1 DM', axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: 'say it loud, with flair', vector: { warmth: 1, boldness: 2 } },
      { id: 'B', label: 'say it plainly', vector: { warmth: 0, boldness: 0 } },
      { id: 'C', label: 'keep it low-key', vector: { warmth: -1, boldness: -1 } },
    ],
  },
  // ---- Backbone: energy ----
  {
    id: 'q_energy', prompt: 'Plans pop up last-minute. You…', kind: 'backbone', axis: 'energy',
    cases: [
      { id: 'buzzing', label: "you're buzzing", axisLevel: 1 },
      { id: 'soso', label: "you're so-so", axisLevel: 0.5 },
      { id: 'empty', label: "you're running on empty", axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: "send it — you're in", vector: { approach: 2, boldness: 2 } },
      { id: 'B', label: 'maybe, depends', vector: { approach: 0, boldness: 0 } },
      { id: 'C', label: 'hard pass, recharge', vector: { approach: -2, boldness: -1 } },
    ],
  },
  // ---- Backbone: power ----
  {
    id: 'q_power', prompt: 'There is friction with someone. You…', kind: 'backbone', axis: 'power',
    cases: [
      { id: 'cards', label: 'you hold the cards', axisLevel: 1 },
      { id: 'equal', label: "you're equals", axisLevel: 0.5 },
      { id: 'theirs', label: 'they hold the cards', axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: 'say exactly what you think', vector: { directness: 2, lead: 2 } },
      { id: 'B', label: 'raise it carefully', vector: { directness: 0, lead: 1 } },
      { id: 'C', label: 'let it slide', vector: { directness: -2, lead: -1 } },
    ],
  },
  // ---- Backbone: initiative ----
  {
    id: 'q_initiative', prompt: 'You are into someone new. You…', kind: 'backbone', axis: 'initiative',
    cases: [
      { id: 'youstart', label: "you'd have to start it", axisLevel: 1 },
      { id: 'mutual', label: 'mutual vibe', axisLevel: 0.5 },
      { id: 'theystart', label: 'they texted you first', axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: 'make the move, confidently', vector: { approach: 2, boldness: 2, lead: 2 } },
      { id: 'B', label: 'test the waters', vector: { approach: 1, boldness: 0, lead: 0 } },
      { id: 'C', label: 'wait and see', vector: { approach: -1, boldness: -1, lead: -1 } },
    ],
  },
  // ---- Flavor: extra closeness coverage ----
  {
    id: 'f_cringe', prompt: 'A friend posts something kind of cringe. You…', kind: 'flavor', axis: 'closeness',
    cases: [
      { id: 'close', label: 'your close friend', axisLevel: 1 },
      { id: 'barely', label: 'someone you barely know', axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: 'comment something supportive', vector: { warmth: 2, approach: 1 } },
      { id: 'B', label: 'say nothing', vector: { warmth: 0, approach: 0 } },
      { id: 'C', label: 'screenshot it to the group chat', vector: { warmth: -2, approach: 0 } },
    ],
  },
  // ---- Flavor: extra stakes coverage ----
  {
    id: 'f_disagree', prompt: 'You disagree with the plan. You…', kind: 'flavor', axis: 'stakes',
    cases: [
      { id: 'high', label: 'it really matters', axisLevel: 1 },
      { id: 'low', label: "it's no big deal", axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: 'speak up firmly', vector: { directness: 2, lead: 1 } },
      { id: 'B', label: 'go with the flow', vector: { directness: -1, lead: -1 } },
    ],
  },
]
```

- [ ] **Step 4: Write `src/content/index.ts`**

```ts
import type { Content } from '../engine/types'
import { AXES } from './axes'
import { DIMS } from './dimensions'
import { ARCHETYPES } from './archetypes'
import { QUESTIONS } from './questions'

export const CONTENT: Content = {
  axes: AXES,
  dims: DIMS,
  archetypes: ARCHETYPES,
  questions: QUESTIONS,
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/content/index.test.ts`
Expected: PASS (3 tests). If `validateContent` reports an axis without coverage, ensure all 6 backbone axes are present.

- [ ] **Step 6: Commit**

```bash
git add src/content/questions.ts src/content/index.ts src/content/index.test.ts
git commit -m "feat(content): 8-question bank + assembled validated CONTENT"
```

---

## Task 11: Golden persona regression tests

**Files:**
- Create: `src/content/goldenPersonas.ts`
- Test: `src/content/goldenPersonas.test.ts`

- [ ] **Step 1: Write `src/content/goldenPersonas.ts`**

```ts
import type { Answer } from '../engine/types'

/** Helper: answer a backbone/flavor question by mapping each case id to an option id, in a fixed rank order. */
function depends(questionId: string, ordered: [string, string][]): Answer {
  return {
    questionId, mode: 'depends',
    ranking: ordered.map(([caseId]) => caseId),
    mapping: Object.fromEntries(ordered),
  }
}

// Maps every backbone case to the SAME option B — produces flat slopes on that axis.
const flat = {
  q_close: depends('q_close', [['best', 'B'], ['monthly', 'B'], ['foaf', 'B']]),
  q_stakes: depends('q_stakes', [['matters', 'B'], ['real', 'B'], ['trivial', 'B']]),
  q_audience: depends('q_audience', [['public', 'B'], ['group', 'B'], ['dm', 'B']]),
  q_energy: depends('q_energy', [['buzzing', 'B'], ['soso', 'B'], ['empty', 'B']]),
  q_power: depends('q_power', [['cards', 'B'], ['equal', 'B'], ['theirs', 'B']]),
  q_initiative: depends('q_initiative', [['youstart', 'B'], ['mutual', 'B'], ['theystart', 'B']]),
}

export interface GoldenPersona { name: string; expectedArchetypeId: string; answers: Answer[] }

export const GOLDEN_PERSONAS: GoldenPersona[] = [
  {
    name: 'vault', expectedArchetypeId: 'vault',
    answers: [
      depends('q_close', [['best', 'A'], ['monthly', 'B'], ['foaf', 'C']]), // warm/approach rise with closeness
      flat.q_stakes, flat.q_audience, flat.q_energy, flat.q_power, flat.q_initiative,
    ],
  },
  {
    name: 'clutch', expectedArchetypeId: 'clutch',
    answers: [
      depends('q_stakes', [['matters', 'A'], ['real', 'B'], ['trivial', 'C']]), // composure/lead/boldness rise with stakes
      flat.q_close, flat.q_audience, flat.q_energy, flat.q_power, flat.q_initiative,
    ],
  },
  {
    name: 'constant', expectedArchetypeId: 'constant',
    answers: [flat.q_close, flat.q_stakes, flat.q_audience, flat.q_energy, flat.q_power, flat.q_initiative],
  },
]
```

- [ ] **Step 2: Write the failing test `src/content/goldenPersonas.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { computeProfile } from '../engine'
import { CONTENT } from './index'
import { GOLDEN_PERSONAS } from './goldenPersonas'

describe('golden personas → expected archetype', () => {
  for (const persona of GOLDEN_PERSONAS) {
    it(`${persona.name} maps to ${persona.expectedArchetypeId}`, () => {
      const profile = computeProfile(persona.answers, CONTENT)
      expect(profile.archetype.id).toBe(persona.expectedArchetypeId)
    })
  }
})
```

- [ ] **Step 3: Run test to verify it fails (then passes)**

Run: `npx vitest run src/content/goldenPersonas.test.ts`
Expected: initially may FAIL if any archetype shape is ambiguous. Because each persona is constructed to be non-flat on exactly one axis (or flat everywhere for `constant`), the nearest prototype signature should be unambiguous. If a persona fails, adjust that archetype's prototype slopes in `archetypes.ts` so the intended shape is the clear nearest match, then re-run. Final expected: PASS (3 tests).

- [ ] **Step 4: Commit**

```bash
git add src/content/goldenPersonas.ts src/content/goldenPersonas.test.ts
git commit -m "test(content): golden persona regression tests for archetype mapping"
```

---

## Task 12: Quiz state reducer + localStorage persistence

**Files:**
- Create: `src/quiz/useQuizState.ts`
- Test: `src/quiz/useQuizState.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { quizReducer, initQuizState, STORAGE_KEY, type QuizState } from './useQuizState'
import type { Question } from '../engine/types'

const q1: Question = {
  id: 'q1', prompt: 'p1', kind: 'backbone', axis: 'closeness',
  cases: [{ id: 'a', label: 'A', axisLevel: 1 }, { id: 'b', label: 'B', axisLevel: 0 }],
  options: [{ id: 'X', label: 'x', vector: {} }, { id: 'Y', label: 'y', vector: {} }],
}
const q2: Question = { id: 'q2', prompt: 'p2', kind: 'flavor', options: [{ id: 'Z', label: 'z', vector: {} }] }
const questions = [q1, q2]

describe('quizReducer', () => {
  let s: QuizState
  beforeEach(() => { localStorage.clear(); s = initQuizState(questions) })

  it('starts at question 0 in question phase', () => {
    expect(s.index).toBe(0)
    expect(s.phase).toBe('question')
  })

  it('records a single answer and advances', () => {
    s = quizReducer(s, { type: 'ANSWER_SINGLE', optionId: 'X' }, questions)
    expect(s.answers[0]).toEqual({ questionId: 'q1', mode: 'single', optionId: 'X' })
    expect(s.index).toBe(1)
    expect(s.phase).toBe('question')
  })

  it('runs the depends flow: rank → map all cases → commit advances', () => {
    s = quizReducer(s, { type: 'START_DEPENDS' }, questions)
    expect(s.phase).toBe('ranking')
    s = quizReducer(s, { type: 'SET_RANKING', ranking: ['b', 'a'] }, questions)
    expect(s.phase).toBe('mapping')
    s = quizReducer(s, { type: 'MAP_CASE', caseId: 'b', optionId: 'Y' }, questions)
    s = quizReducer(s, { type: 'MAP_CASE', caseId: 'a', optionId: 'X' }, questions)
    expect(s.canCommit).toBe(true)
    s = quizReducer(s, { type: 'COMMIT_DEPENDS' }, questions)
    expect(s.answers[0]).toEqual({ questionId: 'q1', mode: 'depends', ranking: ['b', 'a'], mapping: { b: 'Y', a: 'X' } })
    expect(s.index).toBe(1)
  })

  it('cannot commit until all cases are mapped', () => {
    s = quizReducer(s, { type: 'START_DEPENDS' }, questions)
    s = quizReducer(s, { type: 'SET_RANKING', ranking: ['a', 'b'] }, questions)
    s = quizReducer(s, { type: 'MAP_CASE', caseId: 'a', optionId: 'X' }, questions)
    expect(s.canCommit).toBe(false)
  })

  it('reaches done phase after the last question', () => {
    s = quizReducer(s, { type: 'ANSWER_SINGLE', optionId: 'X' }, questions) // q1 -> index 1
    s = quizReducer(s, { type: 'ANSWER_SINGLE', optionId: 'Z' }, questions) // q2 -> done
    expect(s.phase).toBe('done')
  })

  it('persists answers to localStorage and reloads them', () => {
    s = quizReducer(s, { type: 'ANSWER_SINGLE', optionId: 'X' }, questions)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).answers).toHaveLength(1)
    const reloaded = initQuizState(questions)
    expect(reloaded.answers).toHaveLength(1)
    expect(reloaded.index).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/quiz/useQuizState.test.ts`
Expected: FAIL — cannot find module `./useQuizState`.

- [ ] **Step 3: Write `src/quiz/useQuizState.ts`**

```ts
import { useReducer } from 'react'
import type { Answer, Question } from '../engine/types'

export const STORAGE_KEY = 'fptic.quiz.v1'

export type QuizPhase = 'question' | 'ranking' | 'mapping' | 'done'

export interface QuizState {
  index: number
  phase: QuizPhase
  answers: Answer[]
  draftRanking: string[]
  draftMapping: Record<string, string>
  canCommit: boolean
}

export type QuizAction =
  | { type: 'ANSWER_SINGLE'; optionId: string }
  | { type: 'START_DEPENDS' }
  | { type: 'SET_RANKING'; ranking: string[] }
  | { type: 'MAP_CASE'; caseId: string; optionId: string }
  | { type: 'COMMIT_DEPENDS' }
  | { type: 'RESET' }

function persist(answers: Answer[], index: number): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, index })) } catch { /* ignore */ }
}

function load(): { answers: Answer[]; index: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.answers)) return { answers: parsed.answers, index: parsed.index ?? parsed.answers.length }
    }
  } catch { /* ignore */ }
  return { answers: [], index: 0 }
}

function freshDraft(): Pick<QuizState, 'draftRanking' | 'draftMapping' | 'canCommit'> {
  return { draftRanking: [], draftMapping: {}, canCommit: false }
}

function phaseFor(index: number, questions: Question[]): QuizPhase {
  return index >= questions.length ? 'done' : 'question'
}

export function initQuizState(questions: Question[]): QuizState {
  const { answers, index } = load()
  return { index, phase: phaseFor(index, questions), answers, ...freshDraft() }
}

function advance(state: QuizState, answer: Answer, questions: Question[]): QuizState {
  const answers = [...state.answers.filter(a => a.questionId !== answer.questionId), answer]
  const index = state.index + 1
  persist(answers, index)
  return { ...state, answers, index, phase: phaseFor(index, questions), ...freshDraft() }
}

export function quizReducer(state: QuizState, action: QuizAction, questions: Question[]): QuizState {
  const current = questions[state.index]
  switch (action.type) {
    case 'ANSWER_SINGLE':
      if (!current) return state
      return advance(state, { questionId: current.id, mode: 'single', optionId: action.optionId }, questions)

    case 'START_DEPENDS':
      if (!current?.cases) return state
      return { ...state, phase: 'ranking', ...freshDraft() }

    case 'SET_RANKING':
      return { ...state, phase: 'mapping', draftRanking: action.ranking }

    case 'MAP_CASE': {
      if (!current?.cases) return state
      const draftMapping = { ...state.draftMapping, [action.caseId]: action.optionId }
      const canCommit = current.cases.every(c => draftMapping[c.id] !== undefined)
      return { ...state, draftMapping, canCommit }
    }

    case 'COMMIT_DEPENDS': {
      if (!current?.cases || !state.canCommit) return state
      return advance(state, {
        questionId: current.id, mode: 'depends',
        ranking: state.draftRanking, mapping: state.draftMapping,
      }, questions)
    }

    case 'RESET':
      persist([], 0)
      return { index: 0, phase: phaseFor(0, questions), answers: [], ...freshDraft() }

    default:
      return state
  }
}

/** React hook wrapper binding the reducer to the question list. */
export function useQuizState(questions: Question[]) {
  const [state, rawDispatch] = useReducer(
    (s: QuizState, a: QuizAction) => quizReducer(s, a, questions),
    questions,
    initQuizState,
  )
  return { state, dispatch: rawDispatch }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/quiz/useQuizState.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/quiz/useQuizState.ts src/quiz/useQuizState.test.ts
git commit -m "feat(quiz): reducer state machine with localStorage persistence"
```

---

## Task 13: Quiz presentational components (OptionList, QuestionCard, DependsRanker, CaseMapper)

> Styling is intentionally minimal here; visual polish (the beam/glow aesthetic) is applied during execution with the frontend-design skill. Tests assert behaviour and structure, not appearance.

**Files:**
- Create: `src/quiz/OptionList.tsx`, `src/quiz/QuestionCard.tsx`, `src/quiz/DependsRanker.tsx`, `src/quiz/CaseMapper.tsx`
- Test: `src/quiz/QuestionCard.test.tsx`, `src/quiz/DependsRanker.test.tsx`, `src/quiz/CaseMapper.test.tsx`

- [ ] **Step 1: Write `src/quiz/OptionList.tsx`**

```tsx
import type { Option } from '../engine/types'

export function OptionList({ options, onSelect }: { options: Option[]; onSelect: (optionId: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onSelect(o.id)}
          className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-4 text-left hover:bg-white/10"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold">
            {String.fromCharCode(65 + i)}
          </span>
          <span className="text-sm leading-snug text-white/80">{o.label}</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write `src/quiz/QuestionCard.tsx`**

```tsx
import type { Question } from '../engine/types'
import { OptionList } from './OptionList'

export function QuestionCard({
  question, onSingle, onDepends,
}: {
  question: Question
  onSingle: (optionId: string) => void
  onDepends: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-medium text-white">{question.prompt}</h2>
      <OptionList options={question.options} onSelect={onSingle} />
      {question.cases && (
        <button type="button" onClick={onDepends} className="self-start text-sm text-sky-300 hover:text-sky-200">
          ＋ It depends
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write `src/quiz/DependsRanker.tsx`** (drag-free ↑↓ reorder for accessibility/touch)

```tsx
import { useState } from 'react'
import type { Case } from '../engine/types'

export function DependsRanker({ cases, onConfirm }: { cases: Case[]; onConfirm: (rankedCaseIds: string[]) => void }) {
  const [order, setOrder] = useState<Case[]>(cases)

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= order.length) return
    const next = [...order]
    ;[next[i], next[j]] = [next[j], next[i]]
    setOrder(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/70">Drag the most-true to the top.</p>
      <ul className="flex flex-col gap-2">
        {order.map((c, i) => (
          <li key={c.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <span className="text-sm text-white/80">{c.label}</span>
            <span className="flex gap-1">
              <button type="button" aria-label={`move ${c.label} up`} onClick={() => move(i, -1)} className="px-2 text-white/60 hover:text-white">↑</button>
              <button type="button" aria-label={`move ${c.label} down`} onClick={() => move(i, 1)} className="px-2 text-white/60 hover:text-white">↓</button>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => onConfirm(order.map(c => c.id))} className="self-start rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
        Next
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Write `src/quiz/CaseMapper.tsx`**

```tsx
import type { Case, Option } from '../engine/types'

export function CaseMapper({
  cases, options, mapping, onMap, canCommit, onCommit,
}: {
  cases: Case[]
  options: Option[]
  mapping: Record<string, string>
  onMap: (caseId: string, optionId: string) => void
  canCommit: boolean
  onCommit: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      {cases.map(c => (
        <div key={c.id} className="flex flex-col gap-2">
          <p className="text-sm font-medium text-white/90">{c.label}</p>
          <div className="flex flex-wrap gap-2">
            {options.map(o => (
              <button
                key={o.id}
                type="button"
                aria-pressed={mapping[c.id] === o.id}
                onClick={() => onMap(c.id, o.id)}
                className={`rounded-lg px-3 py-2 text-sm ${mapping[c.id] === o.id ? 'bg-sky-400/30 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button type="button" disabled={!canCommit} onClick={onCommit} className="self-start rounded-xl bg-white/10 px-4 py-2 text-sm enabled:hover:bg-white/20 disabled:opacity-40">
        See result for this question
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Write component tests**

`src/quiz/QuestionCard.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionCard } from './QuestionCard'
import type { Question } from '../engine/types'

const q: Question = {
  id: 'q', prompt: 'How do you react?', kind: 'backbone', axis: 'closeness',
  cases: [{ id: 'a', label: 'A', axisLevel: 1 }],
  options: [{ id: 'X', label: 'Option X', vector: {} }],
}

describe('QuestionCard', () => {
  it('fires onSingle when an option is clicked', async () => {
    const onSingle = vi.fn()
    render(<QuestionCard question={q} onSingle={onSingle} onDepends={() => {}} />)
    await userEvent.click(screen.getByText('Option X'))
    expect(onSingle).toHaveBeenCalledWith('X')
  })
  it('shows "It depends" only when the question has cases, and fires onDepends', async () => {
    const onDepends = vi.fn()
    render(<QuestionCard question={q} onSingle={() => {}} onDepends={onDepends} />)
    await userEvent.click(screen.getByText(/It depends/))
    expect(onDepends).toHaveBeenCalled()
  })
})
```

`src/quiz/DependsRanker.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DependsRanker } from './DependsRanker'

describe('DependsRanker', () => {
  it('reorders and confirms the ranked case ids', async () => {
    const onConfirm = vi.fn()
    render(<DependsRanker cases={[{ id: 'a', label: 'Alpha', axisLevel: 1 }, { id: 'b', label: 'Beta', axisLevel: 0 }]} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByLabelText('move Beta up')) // Beta to top
    await userEvent.click(screen.getByText('Next'))
    expect(onConfirm).toHaveBeenCalledWith(['b', 'a'])
  })
})
```

`src/quiz/CaseMapper.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CaseMapper } from './CaseMapper'

const cases = [{ id: 'a', label: 'Case A', axisLevel: 1 }]
const options = [{ id: 'X', label: 'Resp X', vector: {} }]

describe('CaseMapper', () => {
  it('maps a case to an option', async () => {
    const onMap = vi.fn()
    render(<CaseMapper cases={cases} options={options} mapping={{}} onMap={onMap} canCommit={false} onCommit={() => {}} />)
    await userEvent.click(screen.getByText('Resp X'))
    expect(onMap).toHaveBeenCalledWith('a', 'X')
  })
  it('disables commit until canCommit is true', () => {
    const { rerender } = render(<CaseMapper cases={cases} options={options} mapping={{}} onMap={() => {}} canCommit={false} onCommit={() => {}} />)
    expect(screen.getByText(/See result/)).toBeDisabled()
    rerender(<CaseMapper cases={cases} options={options} mapping={{ a: 'X' }} onMap={() => {}} canCommit onCommit={() => {}} />)
    expect(screen.getByText(/See result/)).toBeEnabled()
  })
})
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/quiz/QuestionCard.test.tsx src/quiz/DependsRanker.test.tsx src/quiz/CaseMapper.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**

```bash
git add src/quiz/OptionList.tsx src/quiz/QuestionCard.tsx src/quiz/DependsRanker.tsx src/quiz/CaseMapper.tsx src/quiz/*.test.tsx
git commit -m "feat(quiz): question, ranker, and case-mapper components"
```

---

## Task 14: QuizFlow orchestrator

**Files:**
- Create: `src/quiz/QuizFlow.tsx`
- Test: `src/quiz/QuizFlow.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuizFlow } from './QuizFlow'
import type { Question } from '../engine/types'

const questions: Question[] = [
  { id: 'q1', prompt: 'First question?', kind: 'flavor',
    options: [{ id: 'X', label: 'Pick X', vector: {} }] },
]

describe('QuizFlow', () => {
  beforeEach(() => localStorage.clear())

  it('calls onComplete with collected answers after the last question', async () => {
    const onComplete = vi.fn()
    render(<QuizFlow questions={questions} onComplete={onComplete} />)
    await userEvent.click(screen.getByText('Pick X'))
    expect(onComplete).toHaveBeenCalledWith([{ questionId: 'q1', mode: 'single', optionId: 'X' }])
  })

  it('progresses through the depends flow', async () => {
    const onComplete = vi.fn()
    const withCases: Question[] = [{
      id: 'q1', prompt: 'Depends?', kind: 'backbone', axis: 'closeness',
      cases: [{ id: 'a', label: 'Case A', axisLevel: 1 }, { id: 'b', label: 'Case B', axisLevel: 0 }],
      options: [{ id: 'X', label: 'Resp X', vector: {} }, { id: 'Y', label: 'Resp Y', vector: {} }],
    }]
    render(<QuizFlow questions={withCases} onComplete={onComplete} />)
    await userEvent.click(screen.getByText(/It depends/))
    await userEvent.click(screen.getByText('Next')) // confirm default ranking
    await userEvent.click(screen.getAllByText('Resp X')[0]) // map case A
    await userEvent.click(screen.getAllByText('Resp Y')[1]) // map case B
    await userEvent.click(screen.getByText(/See result/))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0][0][0].mode).toBe('depends')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/quiz/QuizFlow.test.tsx`
Expected: FAIL — cannot find module `./QuizFlow`.

- [ ] **Step 3: Write `src/quiz/QuizFlow.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import type { Answer, Question } from '../engine/types'
import { useQuizState } from './useQuizState'
import { QuestionCard } from './QuestionCard'
import { DependsRanker } from './DependsRanker'
import { CaseMapper } from './CaseMapper'

export function QuizFlow({ questions, onComplete }: { questions: Question[]; onComplete: (answers: Answer[]) => void }) {
  const { state, dispatch } = useQuizState(questions)
  const completed = useRef(false)

  useEffect(() => {
    if (state.phase === 'done' && !completed.current) {
      completed.current = true
      onComplete(state.answers)
    }
  }, [state.phase, state.answers, onComplete])

  if (state.phase === 'done') return null
  const current = questions[state.index]
  if (!current) return null

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <span className="text-xs font-medium tabular-nums text-white/50">
        {state.index + 1} / {questions.length}
      </span>

      {state.phase === 'question' && (
        <QuestionCard
          question={current}
          onSingle={optionId => dispatch({ type: 'ANSWER_SINGLE', optionId })}
          onDepends={() => dispatch({ type: 'START_DEPENDS' })}
        />
      )}

      {state.phase === 'ranking' && current.cases && (
        <DependsRanker cases={current.cases} onConfirm={ranking => dispatch({ type: 'SET_RANKING', ranking })} />
      )}

      {state.phase === 'mapping' && current.cases && (
        <CaseMapper
          cases={current.cases}
          options={current.options}
          mapping={state.draftMapping}
          onMap={(caseId, optionId) => dispatch({ type: 'MAP_CASE', caseId, optionId })}
          canCommit={state.canCommit}
          onCommit={() => dispatch({ type: 'COMMIT_DEPENDS' })}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/quiz/QuizFlow.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/quiz/QuizFlow.tsx src/quiz/QuizFlow.test.tsx
git commit -m "feat(quiz): QuizFlow orchestrator wiring the state machine to components"
```

---

## Task 15: Result components (ArchetypeHeader, SignatureMap, DimensionRanges)

**Files:**
- Create: `src/result/ArchetypeHeader.tsx`, `src/result/SignatureMap.tsx`, `src/result/DimensionRanges.tsx`
- Test: `src/result/ResultComponents.test.tsx`

- [ ] **Step 1: Write `src/result/ArchetypeHeader.tsx`**

```tsx
import type { Archetype } from '../engine/types'

export function ArchetypeHeader({ archetype, confidence }: { archetype: Archetype; confidence: number }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl bg-gradient-to-br from-fuchsia-500/20 to-blue-500/20 px-6 py-10 text-center">
      <span className="text-xs uppercase tracking-widest text-white/60">You are</span>
      <h1 className="text-3xl font-bold">{archetype.code}</h1>
      <p className="text-sm text-white/80">{archetype.name} · {archetype.tagline}</p>
      <p className="mt-3 max-w-prose text-sm text-white/70">{archetype.copy}</p>
      <span className="mt-2 text-xs text-white/40">{Math.round(confidence * 100)}% match</span>
    </div>
  )
}
```

- [ ] **Step 2: Write `src/result/SignatureMap.tsx`**

```tsx
import type { Contingency } from '../engine/types'

export function SignatureMap({ contingencies }: { contingencies: Contingency[] }) {
  if (contingencies.length === 0) {
    return <p className="text-sm text-white/60">You stay remarkably consistent across situations.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm uppercase tracking-widest text-white/50">Your tells</h2>
      <ul className="flex flex-col gap-2">
        {contingencies.map(c => (
          <li key={`${c.axis}.${c.dim}`} className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white/85">
            {c.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 3: Write `src/result/DimensionRanges.tsx`**

```tsx
import type { BehaviorDim, Profile } from '../engine/types'

export function DimensionRanges({ dims, ranges }: { dims: BehaviorDim[]; ranges: Profile['dimensionRanges'] }) {
  // Map a [-2, 2] value onto a [0, 100]% scale for display.
  const pct = (v: number) => Math.max(0, Math.min(100, ((v + 2) / 4) * 100))
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm uppercase tracking-widest text-white/50">Under the hood</h2>
      {dims.map(d => {
        const r = ranges[d.id] ?? { min: 0, max: 0, typical: 0 }
        const left = pct(r.min)
        const width = Math.max(2, pct(r.max) - pct(r.min))
        return (
          <div key={d.id} className="text-xs">
            <span className="text-white/70">{d.name}</span>
            <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
              <div className="h-1.5 rounded-full bg-sky-400/70" style={{ marginLeft: `${left}%`, width: `${width}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Write `src/result/ResultComponents.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArchetypeHeader } from './ArchetypeHeader'
import { SignatureMap } from './SignatureMap'
import { DimensionRanges } from './DimensionRanges'
import type { Archetype, BehaviorDim } from '../engine/types'

const arch: Archetype = { id: 'vault', code: 'VAULT', name: 'The Vault', tagline: 'selective', copy: 'Selective warmth.', signature: {} }

describe('result components', () => {
  it('ArchetypeHeader renders code, name, and confidence', () => {
    render(<ArchetypeHeader archetype={arch} confidence={0.82} />)
    expect(screen.getByText('VAULT')).toBeInTheDocument()
    expect(screen.getByText(/82% match/)).toBeInTheDocument()
  })
  it('SignatureMap renders contingency sentences', () => {
    render(<SignatureMap contingencies={[{ axis: 'closeness', dim: 'warmth', slope: 3, text: 'When close, you get warm.' }]} />)
    expect(screen.getByText('When close, you get warm.')).toBeInTheDocument()
  })
  it('SignatureMap shows a consistency message when empty', () => {
    render(<SignatureMap contingencies={[]} />)
    expect(screen.getByText(/consistent/)).toBeInTheDocument()
  })
  it('DimensionRanges renders a bar per dimension', () => {
    const dims: BehaviorDim[] = [{ id: 'warmth', name: 'Warmth', lowLabel: 'lo', highLabel: 'hi' }]
    render(<DimensionRanges dims={dims} ranges={{ warmth: { min: -1, max: 2, typical: 0.5 } }} />)
    expect(screen.getByText('Warmth')).toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/result/ResultComponents.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/result/ArchetypeHeader.tsx src/result/SignatureMap.tsx src/result/DimensionRanges.tsx src/result/ResultComponents.test.tsx
git commit -m "feat(result): archetype header, signature map, dimension ranges"
```

---

## Task 16: ResultPage + App wiring (landing → quiz → result)

**Files:**
- Create: `src/result/ResultPage.tsx`, `src/app/App.tsx`
- Test: `src/app/App.test.tsx`

- [ ] **Step 1: Write `src/result/ResultPage.tsx`**

```tsx
import type { Content, Profile } from '../engine/types'
import { ArchetypeHeader } from './ArchetypeHeader'
import { SignatureMap } from './SignatureMap'
import { DimensionRanges } from './DimensionRanges'

export function ResultPage({ profile, content, onRestart }: { profile: Profile; content: Content; onRestart: () => void }) {
  const archetype = content.archetypes.find(a => a.id === profile.archetype.id)!
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-5 py-12">
      <ArchetypeHeader archetype={archetype} confidence={profile.archetype.confidence} />
      <SignatureMap contingencies={profile.topContingencies} />
      <DimensionRanges dims={content.dims} ranges={profile.dimensionRanges} />
      <button type="button" onClick={onRestart} className="self-center text-sm text-white/50 hover:text-white/80">
        Take it again
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Write `src/app/App.tsx`**

```tsx
import { useState } from 'react'
import { computeProfile, type Answer, type Profile } from '../engine'
import { CONTENT } from '../content'
import { QuizFlow } from '../quiz/QuizFlow'
import { ResultPage } from '../result/ResultPage'
import { STORAGE_KEY } from '../quiz/useQuizState'

type View = 'landing' | 'quiz' | 'result'

export function App() {
  const [view, setView] = useState<View>('landing')
  const [profile, setProfile] = useState<Profile | null>(null)

  function handleComplete(answers: Answer[]) {
    setProfile(computeProfile(answers, CONTENT))
    setView('result')
  }

  function restart() {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setProfile(null)
    setView('landing')
  }

  if (view === 'landing') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
        <h1 className="text-3xl font-bold">The personality test that lets you say "it depends."</h1>
        <p className="text-sm text-white/70">Every question has a depends path. Answer honestly — context and all.</p>
        <button type="button" onClick={() => setView('quiz')} className="rounded-2xl bg-white/10 px-6 py-3 text-sm hover:bg-white/20">
          Start the test
        </button>
      </div>
    )
  }

  if (view === 'quiz') return <QuizFlow questions={CONTENT.questions} onComplete={handleComplete} />

  return <ResultPage profile={profile!} content={CONTENT} onRestart={restart} />
}
```

- [ ] **Step 3: Write the failing test `src/app/App.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'

describe('App', () => {
  beforeEach(() => localStorage.clear())

  it('shows the landing page and starts the quiz', async () => {
    render(<App />)
    expect(screen.getByText(/it depends/i)).toBeInTheDocument()
    await userEvent.click(screen.getByText('Start the test'))
    expect(screen.getByText('1 / 8')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run test to verify it fails, then passes**

Run: `npx vitest run src/app/App.test.tsx`
Expected: after creating the files, PASS (1 test). (`1 / 8` reflects the 8-question bank; adjust the assertion if the bank size changes.)

- [ ] **Step 5: Commit**

```bash
git add src/result/ResultPage.tsx src/app/App.tsx src/app/App.test.tsx
git commit -m "feat(app): landing → quiz → result wiring with computeProfile"
```

---

## Task 17: Full suite, build, manual QA, and "feels accurate" pass

**Files:**
- Modify: none (verification task)
- Create: `docs/superpowers/qa/2026-06-02-phase1-feels-accurate-checklist.md`

- [ ] **Step 1: Run the entire test suite**

Run: `npm test`
Expected: all tests pass (engine, content, golden personas, quiz, result, app). Fix any failure before proceeding.

- [ ] **Step 2: Type-check and production build**

Run: `npm run build`
Expected: `tsc -b` reports no errors and Vite emits `dist/`. Fix any type errors.

- [ ] **Step 3: Manual run-through**

Run: `npm run dev`, open the local URL.
Verify: landing → start → answer some questions via single-tap and some via "It depends" (rank + map) → reach a result with an archetype, "your tells", and dimension bars. Refresh mid-quiz and confirm progress resumes. "Take it again" resets.

- [ ] **Step 4: Write the "feels accurate" QA checklist**

Create `docs/superpowers/qa/2026-06-02-phase1-feels-accurate-checklist.md`:
```markdown
# Phase 1 — "Feels Accurate" QA

Take the test deliberately as each persona and confirm the result reads true.

- [ ] **Vault run:** answer the closeness question all-in-for-close / cold-for-distant; answer every other backbone the SAME across its cases. Expect archetype THE VAULT; top "tell" mentions closeness + warmth.
- [ ] **Clutch run:** vary only the stakes question (decisive when it matters); flat elsewhere. Expect THE CLUTCH.
- [ ] **Constant run:** answer every case of every backbone identically. Expect THE CONSTANT; signature map shows the consistency message.
- [ ] **Mixed run:** answer naturally. Confirm the archetype + tells feel plausible and non-random; note any contingency sentence that reads awkwardly (content tuning follow-up).
- [ ] **Readability:** every contingency sentence is grammatical with the current axis/dim labels.
```

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/qa/2026-06-02-phase1-feels-accurate-checklist.md
git commit -m "docs(qa): phase 1 feels-accurate checklist; verify full suite + build"
```

---

## Self-Review (completed by plan author)

**Spec coverage:**
- Positioning (hybrid) → reflected in tone/result design (Tasks 9, 15, 16). ✓
- CAPS model: axes, dims, contingencies, signature, archetype-as-prototype, dimension ranges → Tasks 2, 4, 5, 6, 7, 9. ✓
- Mechanic (single OR depends → rank → map; ranking-as-weight) → Tasks 3 (rankWeight), 12 (reducer), 13–14 (UI). ✓
- Content model + two question kinds + validation + ~8–12 backbone (6 here, one per axis, expandable) → Tasks 7–10. ✓ (Backbone count is at the lower end of the 8–12 range for the MVP starter bank; expanding is pure content work — add more `kind:'backbone'` entries in `questions.ts`, covered by the same validation/golden tests.)
- Engine pipeline + Profile output → Tasks 3–6. ✓
- Result A/C/B → Task 15–16. ✓
- Architecture, state machine, localStorage, reproducibility → Tasks 12, 14, 16. ✓
- Testing strategy (engine TDD, golden personas, content validation, RTL, manual QA) → Tasks 2–17. ✓

**Placeholder scan:** No TBD/TODO; all code shown in full; the only "expand later" note (more backbone/flavor questions, more archetypes) is explicitly scoped content work with a concrete pattern and is not on any required code path. ✓

**Type consistency:** `Answer`, `Content`, `Profile`, `Signature`, `Rule` used identically across tasks. Reducer action names (`ANSWER_SINGLE`, `START_DEPENDS`, `SET_RANKING`, `MAP_CASE`, `COMMIT_DEPENDS`, `RESET`) consistent between Task 12 definition and Task 14 usage. `STORAGE_KEY` shared (Tasks 12, 16). `computeProfile`, `describeContingency`, `matchArchetype`, `computeSignature`, `extractRules` signatures consistent across definitions and call sites. ✓

**Known calibration risk:** Task 11 golden personas depend on archetype prototype slopes (Task 9) being the clear nearest match. The personas are built to be non-flat on exactly one axis, making the nearest prototype unambiguous; Task 11 Step 3 instructs adjusting prototype slopes if any persona mis-maps. This is the one place execution may need a small numeric tweak.
