import type { Content, Question } from '../engine/types'

export type RunMode = 'short' | 'deep'

export interface SelectOptions {
  /** Approximate number of questions for a short run. */
  target?: number
  /** Minimum questions per axis in a short run. */
  minPerAxis?: number
}

/**
 * Pick the questions for a run.
 * - `deep`  → the whole bank, in authored order.
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
  if (mode === 'deep') return [...content.questions]

  const target = opts.target ?? 24
  const minPerAxis = opts.minPerAxis ?? 2

  const backbone = content.questions.filter(q => q.kind === 'backbone')
  const flavor = content.questions.filter(q => q.kind !== 'backbone')

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
