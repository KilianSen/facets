import { describe, it, expect } from 'vitest'
import { LIFE_QUESTIONS } from './lifeQuestions'
import { CONTENT } from './index'
import { selectQuestions, pickSharpenQuestions } from './selectQuestions'
import { computeProfile, computeSettingOffsets } from '../engine'
import { encodeAnswers, decodeAnswers } from '../share/permalink'
import type { Answer, Question } from '../engine/types'

/** Picks `work` for the work case and `elsewhere` for every other setting. */
const answer = (q: Question, work: string, elsewhere: string): Answer => ({
  questionId: q.id, mode: 'depends',
  ranking: q.cases!.map(c => c.id),
  mapping: Object.fromEntries(q.cases!.map(c => [c.id, c.setting === 'work' ? work : elsewhere])),
})

describe('across-your-life questions', () => {
  it('ask one situation in every setting, at a single level, for every situation', () => {
    for (const q of LIFE_QUESTIONS) {
      expect(q.id).toMatch(/_lf\d+$/)
      expect(q.cases!.map(c => c.setting)).toEqual(['work', 'romance', 'social', 'family'])
      expect(new Set(q.cases!.map(c => c.axisLevel)).size).toBe(1)
    }
    for (const axis of CONTENT.axes) expect(LIFE_QUESTIONS.filter(q => q.axis === axis.id).length).toBeGreaterThanOrEqual(3)
  })

  it('stay out of quick reads, sharpen draws and the signature', () => {
    const ids = new Set(LIFE_QUESTIONS.map(q => q.id))
    expect(selectQuestions(CONTENT).some(q => ids.has(q.id))).toBe(false)
    for (const axis of CONTENT.axes) {
      expect(pickSharpenQuestions(CONTENT, axis.id, new Set(), 99).some(q => ids.has(q.id))).toBe(false)
    }
    const profile = computeProfile(LIFE_QUESTIONS.map(q => answer(q, 'A', 'C')), CONTENT)
    expect(profile.topContingencies).toEqual([])
  })

  it('round-trip through a compact permalink', () => {
    const answers = LIFE_QUESTIONS.slice(0, 4).map(q => answer(q, 'A', 'B'))
    const encoded = encodeAnswers(answers)
    expect(encoded.startsWith('2.')).toBe(true)
    expect(decodeAnswers(encoded)).toEqual(answers)
  })

  it('give the setting read what it needs: three agreeing questions make a claim', () => {
    const closeness = LIFE_QUESTIONS.filter(q => q.axis === 'closeness')
    const reports = computeSettingOffsets(closeness.map(q => answer(q, 'A', 'B')), CONTENT)
    expect(reports.work.claims.map(c => c.text)).toContain('At work, you get warm more than you do elsewhere in the same situations.')
    expect(reports.romance.claims.every(c => c.offset < 0)).toBe(true)
  })
})
