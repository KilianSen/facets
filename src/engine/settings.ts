import type { Answer, CaseSetting, Content, DimId } from './types'

/**
 * Setting offsets: does a setting (dating, work, friends, family) move you beyond what the situation explains?
 * Each tagged case is compared with how you answered the OTHER settings at the same situation level on the same
 * behaviour — the situation is held fixed and only the setting differs. A neutral pick counts as 0 on the
 * behaviours its question measures: the signature fit skips neutral picks, which would hide exactly the contrast
 * this needs ("takes charge at work, stays neutral elsewhere"). Leftovers are averaged per question first, since
 * a setting is mostly fixed per question, and a claim needs several questions that agree.
 */

export const SETTINGS: CaseSetting[] = ['romance', 'work', 'social', 'family']
/** A claim needs at least this many different questions behind it… */
export const SETTING_MIN_QUESTIONS = 3
/** …an average leftover at least this big (on the ±2 option scale)… */
export const SETTING_MIN_OFFSET = 1
/**
 * …that stands out from question-to-question spread: |mean| / standard error ≥ this. Calibrated on simulated deep
 * dives: at 3, 2–3% of people with no setting effect got a claim; at 3.25, ~1%, still catching ~35–70% of real
 * effects; at 3.5 none, but three perfectly agreeing across-your-life questions (t ≈ 3.46) could no longer claim.
 */
export const SETTING_MIN_T = 3.25
/** Floor on that spread, so a few identical leftovers can't claim certainty. */
const SPREAD_FLOOR = 1

const LEAD_IN: Record<CaseSetting, string> = {
  romance: 'When dating', work: 'At work', social: 'With friends', family: 'With family',
}

export interface SettingClaim {
  dimId: DimId
  offset: number
  /** questions behind the claim */
  questions: number
  text: string
}

export interface SettingOffsetReport {
  setting: CaseSetting
  /** tagged cases answered with "it depends" */
  sampleSize: number
  /** distinct questions behind them */
  questions: number
  /** mean per-question leftover per behaviour vs. other settings (0 = no difference, or nothing to compare) */
  offsets: Record<DimId, number>
  /** offsets that clear every bar, strongest first */
  claims: SettingClaim[]
}

export type SettingOffsets = Record<CaseSetting, SettingOffsetReport>

interface Pick { setting: CaseSetting; questionId: string; value: number }

export function computeSettingOffsets(answers: Answer[], content: Content): SettingOffsets {
  const qById = new Map(content.questions.map(q => [q.id, q]))
  // One stratum per situation × level × behaviour: every tagged pick that lands there.
  const strata = new Map<string, { dimId: DimId; picks: Pick[] }>()
  const cases = new Map(SETTINGS.map(s => [s, 0]))
  const questions = new Map(SETTINGS.map(s => [s, new Set<string>()]))

  for (const a of answers) {
    const q = qById.get(a.questionId)
    // Sharpen items carry no settings; across-your-life items exist for exactly this read.
    if (a.mode !== 'depends' || !q?.axis || !q.cases || (q.reserve && !q.acrossSettings)) continue
    const measured = new Set(q.options.flatMap(o => Object.keys(o.vector)))
    for (const c of q.cases) {
      const option = q.options.find(o => o.id === a.mapping[c.id])
      if (!option || !c.setting) continue
      cases.set(c.setting, cases.get(c.setting)! + 1)
      questions.get(c.setting)!.add(q.id)
      for (const dimId of measured) {
        const key = `${q.axis}|${c.axisLevel}|${dimId}`
        const stratum = strata.get(key) ?? { dimId, picks: [] }
        strata.set(key, stratum)
        stratum.picks.push({ setting: c.setting, questionId: q.id, value: option.vector[dimId] ?? 0 })
      }
    }
  }

  // setting → behaviour → question → [sum of leftovers, count]
  const leftovers = new Map(SETTINGS.map(s => [s, new Map<DimId, Map<string, [number, number]>>()]))
  for (const { dimId, picks } of strata.values()) {
    for (const s of SETTINGS) {
      const elsewhere = picks.filter(p => p.setting !== s)
      if (elsewhere.length === 0) continue // nothing else in this situation to compare against
      const reference = elsewhere.reduce((sum, p) => sum + p.value, 0) / elsewhere.length
      const byDim = leftovers.get(s)!
      for (const p of picks) {
        if (p.setting !== s) continue
        const byQuestion = byDim.get(dimId) ?? new Map<string, [number, number]>()
        byDim.set(dimId, byQuestion)
        const [sum, n] = byQuestion.get(p.questionId) ?? [0, 0]
        byQuestion.set(p.questionId, [sum + p.value - reference, n + 1])
      }
    }
  }

  const reports = {} as SettingOffsets
  for (const s of SETTINGS) {
    const offsets: Record<DimId, number> = {}
    const claims: SettingClaim[] = []
    for (const dim of content.dims) {
      const means = [...(leftovers.get(s)!.get(dim.id)?.values() ?? [])].map(([sum, n]) => sum / n)
      const n = means.length
      const mean = n ? means.reduce((x, y) => x + y, 0) / n : 0
      offsets[dim.id] = Math.round(mean * 100) / 100
      if (n < SETTING_MIN_QUESTIONS || Math.abs(mean) < SETTING_MIN_OFFSET) continue
      const sd = Math.sqrt(means.reduce((x, m) => x + (m - mean) ** 2, 0) / (n - 1))
      if (Math.abs(mean) / (Math.max(sd, SPREAD_FLOOR) / Math.sqrt(n)) < SETTING_MIN_T) continue
      claims.push({
        dimId: dim.id,
        offset: offsets[dim.id],
        questions: n,
        text: `${LEAD_IN[s]}, you ${mean > 0 ? dim.highLabel : dim.lowLabel} more than you do elsewhere in the same situations.`,
      })
    }
    claims.sort((x, y) => Math.abs(y.offset) - Math.abs(x.offset))
    reports[s] = { setting: s, sampleSize: cases.get(s)!, questions: questions.get(s)!.size, offsets, claims }
  }
  return reports
}
