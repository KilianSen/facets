import { type Answer, type Content, type Rule, type Vector, type DimId, type Question, isDependsAnswer } from './types'

/** Most-true (index 0) gets the highest weight: weight = total - index. */
export function rankWeight(index: number, total: number): number {
  return total - index
}

/** The behaviours a question measures: every dim any of its options moves. */
export function measuredDims(q: Question): DimId[] {
  return [...new Set(q.options.flatMap(o => Object.keys(o.vector)))]
}

/**
 * An option's full reading on its question's behaviours: a behaviour the option leaves out counts as 0. A neutral
 * pick is a real answer ("no change here"), not missing data — dropping it hides exactly the one-directional
 * shifts people report most ("only my best friend gets the warm version": A, B, B would otherwise read as flat).
 */
export function readOption(q: Question, vector: Vector): Vector {
  return Object.fromEntries(measuredDims(q).map(d => [d, vector[d] ?? 0]))
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
      // A mapped case missing from `ranking` is treated as least-important (weight 1).
      const weight = rank >= 0 ? rankWeight(rank, total) : 1
      rules.push({ axis: q.axis, axisLevel: c.axisLevel, vector: readOption(q, opt.vector), weight })
    }
  }
  return rules
}

/**
 * The user's context-independent behavioural baseline: the mean option reading per dim across all answers
 * (neutral picks count as 0 on the behaviours their question measures). A single answer contributes its chosen
 * option directly; a depends answer contributes the mean of its mapped options (its level, separate from its
 * slope). Dims with no data are 0.
 */
export function extractBaseline(answers: Answer[], content: Content): Record<DimId, number> {
  const qById = new Map(content.questions.map(q => [q.id, q]))
  const sums: Record<DimId, number> = {}
  const counts: Record<DimId, number> = {}

  const add = (vec: Vector) => {
    for (const dim of content.dims) {
      if (dim.id in vec) {
        sums[dim.id] = (sums[dim.id] ?? 0) + vec[dim.id]
        counts[dim.id] = (counts[dim.id] ?? 0) + 1
      }
    }
  }

  for (const a of answers) {
    const q = qById.get(a.questionId)
    if (!q) continue
    if (a.mode === 'single') {
      const opt = q.options.find(o => o.id === a.optionId)
      if (opt) add(readOption(q, opt.vector))
    } else {
      const vecs: Vector[] = []
      for (const c of q.cases ?? []) {
        const opt = q.options.find(o => o.id === a.mapping[c.id])
        if (opt) vecs.push(readOption(q, opt.vector))
      }
      if (vecs.length) {
        const mean: Vector = {}
        for (const dim of content.dims) {
          const vals = vecs.filter(v => dim.id in v).map(v => v[dim.id])
          if (vals.length) mean[dim.id] = vals.reduce((s, v) => s + v, 0) / vals.length
        }
        add(mean)
      }
    }
  }

  const baseline: Record<DimId, number> = {}
  for (const dim of content.dims) baseline[dim.id] = counts[dim.id] ? sums[dim.id] / counts[dim.id] : 0
  return baseline
}
