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
      // A mapped case missing from `ranking` is treated as least-important (weight 1).
      const weight = rank >= 0 ? rankWeight(rank, total) : 1
      rules.push({ axis: q.axis, axisLevel: c.axisLevel, vector: opt.vector, weight })
    }
  }
  return rules
}
