import { describe, it, expect } from 'vitest'
import { computeSettingOffsets, SETTING_MIN_QUESTIONS } from './settings'
import { CONTENT } from '../content'
import type { Answer, CaseSetting, Content, Question } from './types'

// Power questions measuring lead only: A = take charge (+2), B = neutral, C = follow (−2).
function question(id: string, setting: CaseSetting): Question {
  return {
    id, prompt: id, kind: 'backbone', axis: 'power',
    cases: [1, 0.5, 0].map((axisLevel, i) => ({ id: `${id}_c${i}`, label: `${id} ${axisLevel}`, axisLevel, setting })),
    options: [
      { id: 'A', label: 'take charge', vector: { lead: 2 } },
      { id: 'B', label: 'neutral', vector: {} },
      { id: 'C', label: 'follow', vector: { lead: -2 } },
    ],
  }
}

/** `work[i]` / `social[i]` = the option picked for every case of that setting's i-th question. */
function run(work: string[], social: string[]) {
  const content: Content = {
    axes: CONTENT.axes.filter(a => a.id === 'power'),
    dims: CONTENT.dims.filter(d => d.id === 'lead'),
    questions: [...work.map((_, i) => question(`work_${i}`, 'work')), ...social.map((_, i) => question(`social_${i}`, 'social'))],
    archetypes: [],
  }
  const picks = [...work, ...social]
  const answers: Answer[] = content.questions.map((q, i) => ({
    questionId: q.id, mode: 'depends',
    ranking: q.cases!.map(c => c.id),
    mapping: Object.fromEntries(q.cases!.map(c => [c.id, picks[i]])),
  }))
  return computeSettingOffsets(answers, content)
}

describe('computeSettingOffsets', () => {
  it('reports every setting, empty when nothing was answered', () => {
    const reports = computeSettingOffsets([], CONTENT)
    for (const s of ['romance', 'work', 'social', 'family'] as const) {
      expect(reports[s]).toMatchObject({ setting: s, sampleSize: 0, questions: 0, claims: [] })
    }
  })

  it('claims an offset when several questions agree, in plain words', () => {
    // Same situations, but take charge at work and follow with friends: the situation alone can't explain either.
    const reports = run(['A', 'A', 'A', 'A'], ['C', 'C', 'C', 'C'])
    expect(reports.work.claims).toEqual([
      { dimId: 'lead', offset: 4, questions: 4, text: 'At work, you take charge more than you do elsewhere in the same situations.' },
    ])
    expect(reports.social.claims[0].text).toBe('With friends, you follow more than you do elsewhere in the same situations.')
    expect(reports.work.sampleSize).toBe(12)
  })

  it('sees a setting effect against neutral answers elsewhere', () => {
    // The signature fit skips neutral picks; the setting comparison must not, or this contrast vanishes.
    const reports = run(['A', 'A', 'A', 'A'], ['B', 'B', 'B', 'B'])
    expect(reports.work.claims.map(c => [c.dimId, c.offset])).toEqual([['lead', 2]])
  })

  it('makes no claim from too few questions, however big the offset', () => {
    const reports = run(Array(SETTING_MIN_QUESTIONS - 1).fill('A'), Array(SETTING_MIN_QUESTIONS - 1).fill('C'))
    expect(reports.work.offsets.lead).toBe(4)
    expect(reports.work.claims).toEqual([])
  })

  it('makes no claim when the questions disagree', () => {
    const reports = run(['A', 'A', 'A', 'C'], ['C', 'C', 'C', 'A'])
    expect(reports.work.offsets.lead).toBe(2)
    expect(reports.work.claims).toEqual([])
    expect(reports.social.claims).toEqual([])
  })

  it('has nothing to say when a situation was only ever answered in one setting', () => {
    const reports = run(['A', 'A', 'A', 'A'], [])
    expect(reports.work.offsets.lead).toBe(0)
    expect(reports.work.claims).toEqual([])
  })
})
