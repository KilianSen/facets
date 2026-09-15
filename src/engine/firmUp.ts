import type { Answer, Archetype, AxisId, Content, DimId, Profile, Question } from './types'

/**
 * Firm-up round. A quick read asks ~30 questions, and a flavor question only measures a slope when someone taps
 * "It depends" — so part of what a quick read concludes can rest on a single ranked answer. After the base run,
 * every situation × behaviour cell the read actually leans on (the headline type, co-stars, the runner-up, and
 * shifts no type explains) that has fewer than FIRM_UP_MIN ranked answers gets a few more questions, always
 * asked ranked. A deep run, or a quick read that's already covered, gets none.
 */

/** Ranked answers a cell the read leans on needs before it counts as measured. */
export const FIRM_UP_MIN = 2
/** Most extra questions one run can get. */
export const FIRM_UP_CAP = 6

const cellKey = (axisId: AxisId, dimId: DimId) => `${axisId}:${dimId}`

function cellsOf(a: Archetype): string[] {
  const out: string[] = []
  for (const table of [a.signature, a.curve ?? {}]) {
    for (const [axisId, dims] of Object.entries(table)) {
      for (const [dimId, v] of Object.entries(dims)) if (v) out.push(cellKey(axisId, dimId))
    }
  }
  return out
}

const cellsMeasuredBy = (q: Question): string[] =>
  q.axis ? [...new Set(q.options.flatMap(o => Object.keys(o.vector)))].map(d => cellKey(q.axis!, d)) : []

function rankedCounts(answers: Answer[], content: Content): Map<string, number> {
  const byId = new Map(content.questions.map(q => [q.id, q]))
  const counts = new Map<string, number>()
  for (const a of answers) {
    const q = byId.get(a.questionId)
    if (a.mode !== 'depends' || !q || q.reserve) continue
    for (const c of cellsMeasuredBy(q)) counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  return counts
}

/** The cells the read leans on that have fewer than FIRM_UP_MIN ranked answers behind them. */
export function thinCells(profile: Profile, answers: Answer[], content: Content): string[] {
  const byId = new Map(content.archetypes.map(a => [a.id, a]))
  const typeIds = [profile.archetype.id, ...(profile.facets ?? []).map(f => f.archetypeId), profile.archetype.runnerUpId]
  const cells = new Set(typeIds.flatMap(id => {
    const a = id ? byId.get(id) : undefined
    return a ? cellsOf(a) : []
  }))
  for (const u of profile.unexplained ?? []) cells.add(cellKey(u.axis, u.dim))
  const counts = rankedCounts(answers, content)
  return [...cells].filter(c => (counts.get(c) ?? 0) < FIRM_UP_MIN)
}

/** Ask a question as a ranked "it depends" item, whatever its authored kind. */
export function asRanked(q: Question): Question {
  return q.kind === 'backbone' ? q : { ...q, kind: 'backbone' }
}

/**
 * Unasked base questions covering the thin cells — greedily, the one filling the most still-thin cells first
 * (ties to bank order) — returned as ranked items. Empty when nothing is thin or nothing left can help.
 */
export function pickFirmUpQuestions(profile: Profile, answers: Answer[], content: Content, cap = FIRM_UP_CAP): Question[] {
  const thin = new Set(thinCells(profile, answers, content))
  if (thin.size === 0) return []
  const counts = rankedCounts(answers, content)
  const asked = new Set(answers.map(a => a.questionId))
  const pool = content.questions.filter(q => !q.reserve && q.axis && q.cases && !asked.has(q.id))
  const picked: Question[] = []

  while (picked.length < cap) {
    let best: Question | null = null
    let bestScore = 0
    for (const q of pool) {
      if (picked.includes(q)) continue
      const score = cellsMeasuredBy(q).filter(c => thin.has(c) && (counts.get(c) ?? 0) < FIRM_UP_MIN).length
      if (score > bestScore) { best = q; bestScore = score }
    }
    if (!best) break
    picked.push(best)
    for (const c of cellsMeasuredBy(best)) counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  return picked.map(asRanked)
}
