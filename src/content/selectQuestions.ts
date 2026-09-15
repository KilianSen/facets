import type { Content, Question } from '../engine/types'

export interface SelectOptions {
  /** Approximate number of questions for a short run. */
  target?: number
  /** Minimum questions per axis in a short run. */
  minPerAxis?: number
}

/**
 * Pick the questions for a run: the quick read (a deep dive opens with it too, then adds its chapters). Held-out items
 * (sharpen, across-your-life) are never part of it; later rounds draw them on demand. All backbone questions, then
 * flavor up to `target`, guaranteeing every axis at least `minPerAxis` questions. `rng` is injectable so
 * callers/tests can make selection deterministic.
 */
function questionDims(q: Question): Set<string> {
  const set = new Set<string>()
  for (const o of q.options) {
    for (const d of Object.keys(o.vector)) set.add(d)
  }
  return set
}

export function selectQuestions(
  content: Content,
  rng: () => number = Math.random,
  opts: SelectOptions = {},
): Question[] {
  const base = content.questions.filter(q => !q.reserve)

  const target = opts.target ?? 30
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

  const cellCount = (axis: string, dim: string) => {
    let c = 0
    for (const q of chosen) {
      if (q.axis === axis && questionDims(q).has(dim)) c++
    }
    return c
  }

  // 1. Top up each axis to minPerAxis from the flavor pool.
  for (const axis of content.axes) {
    for (const q of shuffled) {
      if (chosen.length >= target) break
      if (axisCount(axis.id) >= minPerAxis) break
      if (q.axis === axis.id && !chosenIds.has(q.id)) {
        chosen.push(q)
        chosenIds.add(q.id)
      }
    }
  }

  // 2. Cell top-up: prioritize flavor questions that cover deficit cells required by archetypes.
  const requiredCells = new Set<string>()
  for (const a of content.archetypes) {
    for (const [axisId, dims] of Object.entries(a.signature)) {
      for (const [dimId, slope] of Object.entries(dims)) {
        if (slope !== 0) requiredCells.add(`${axisId}:${dimId}`)
      }
    }
  }

  let cellDeficit = true
  while (cellDeficit && chosen.length < target) {
    cellDeficit = false
    const deficitCells = new Set<string>()
    for (const cell of requiredCells) {
      const [ax, dim] = cell.split(':')
      if (cellCount(ax, dim) < 2) deficitCells.add(cell)
    }
    if (deficitCells.size === 0) break

    let bestQ: Question | null = null
    let bestScore = 0

    for (const q of shuffled) {
      if (chosenIds.has(q.id)) continue
      let score = 0
      const dims = questionDims(q)
      for (const d of dims) {
        if (deficitCells.has(`${q.axis}:${d}`)) score++
      }
      if (score > bestScore) {
        bestScore = score
        bestQ = q
      }
    }

    if (bestQ && bestScore > 0) {
      chosen.push(bestQ)
      chosenIds.add(bestQ.id)
      cellDeficit = true
    }
  }

  // 3. Fill the rest up to target with remaining flavor.
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
  const pool = content.questions.filter(q => q.reserve && !q.acrossSettings && q.axis === axisId && !askedIds.has(q.id))
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.max(0, n))
}
