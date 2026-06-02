import { type Answer, type Content, type Rule, type Vector, type DimId, isDependsAnswer } from './types'

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
      // A mapped case missing from `ranking` is treated as least-important (weight 1).
      const weight = rank >= 0 ? rankWeight(rank, total) : 1
      rules.push({ axis: q.axis, axisLevel: c.axisLevel, vector: opt.vector, weight })
    }
  }
  return rules
}

/**
 * The user's context-independent behavioural baseline: the mean option-vector value per dim
 * across all answers. A single answer contributes its chosen option's vector directly; a
 * depends answer contributes the mean of its mapped options (its level, separate from its slope).
 * Dims with no data are 0.
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
      if (opt) add(opt.vector)
    } else {
      const vecs: Vector[] = []
      for (const c of q.cases ?? []) {
        const opt = q.options.find(o => o.id === a.mapping[c.id])
        if (opt) vecs.push(opt.vector)
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
