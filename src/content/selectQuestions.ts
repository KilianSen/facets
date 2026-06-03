import type { Content, Question } from '../engine/types'

export type RunMode = 'short' | 'deep'

export interface SelectOptions {
  /** Approximate number of questions for a short run. */
  target?: number
  /** Minimum questions per axis in a short run. */
  minPerAxis?: number
}

/**
 * Pick the questions for a run. Reserve (parallel sharpen) questions are NEVER part of a base run —
 * they're drawn on demand by `pickSharpenQuestions`.
 * - `deep`  → the whole base bank, in authored order.
 * - `short` → all backbone questions + a random sample of flavor up to `target`,
 *             guaranteeing every axis has at least `minPerAxis` questions.
 * `rng` is injectable so callers/tests can make selection deterministic.
 */
export function selectQuestions(
  content: Content,
  mode: RunMode,
  rng: () => number = Math.random,
  opts: SelectOptions = {},
): Question[] {
  const base = content.questions.filter(q => !q.reserve)
  if (mode === 'deep') return base

  const target = opts.target ?? 24
  const minPerAxis = opts.minPerAxis ?? 2

  const backbone = base.filter(q => q.kind === 'backbone')
  const flavor = base.filter(q => q.kind !== 'backbone')

  const chosen: Question[] = [...backbone]
  const chosenIds = new Set(chosen.map(q => q.id))

  const shuffled = (() => {
    const a = [...flavor]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  })()

  const axisCount = (axisId: string) => chosen.filter(q => q.axis === axisId).length

  // 1. Top up each axis to minPerAxis from the flavor pool.
  for (const axis of content.axes) {
    for (const q of shuffled) {
      if (axisCount(axis.id) >= minPerAxis) break
      if (q.axis === axis.id && !chosenIds.has(q.id)) {
        chosen.push(q)
        chosenIds.add(q.id)
      }
    }
  }

  // 2. Fill the rest up to target with remaining flavor.
  for (const q of shuffled) {
    if (chosen.length >= target) break
    if (!chosenIds.has(q.id)) {
      chosen.push(q)
      chosenIds.add(q.id)
    }
  }

  return chosen
}

/**
 * Draw up to `n` parallel "sharpen" reserve questions for one axis, skipping any already asked.
 * These are the purpose-built, dim-isolating items the adaptive deep-dive appends on demand; a
 * shuffle keeps the order fresh across runs without affecting which items are comparable.
 */
export function pickSharpenQuestions(
  content: Content,
  axisId: string,
  askedIds: Set<string>,
  n: number,
  rng: () => number = Math.random,
): Question[] {
  const pool = content.questions.filter(q => q.reserve && q.axis === axisId && !askedIds.has(q.id))
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.max(0, n))
}
