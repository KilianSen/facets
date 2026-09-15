import { describe, it, expect } from 'vitest'
import { thinCells, pickFirmUpQuestions, asRanked, FIRM_UP_CAP, FIRM_UP_MIN } from './firmUp'
import { computeProfile } from './scoring'
import { CONTENT } from '../content'
import type { Answer, Question } from './types'

/** Every case gets its own option in order (A, B, C…), ranked top to bottom. */
const ranked = (q: Question): Answer => ({
  questionId: q.id, mode: 'depends',
  ranking: q.cases!.map(c => c.id),
  mapping: Object.fromEntries(q.cases!.map((c, i) => [c.id, q.options[i % q.options.length].id])),
})

const measures = (q: Question, cell: string) =>
  q.options.some(o => Object.keys(o.vector).some(d => `${q.axis}:${d}` === cell))

describe('firm-up round', () => {
  it('asks nothing extra when every cell was answered ranked (a deep run)', () => {
    const answers = CONTENT.questions.filter(q => !q.reserve).map(ranked)
    const profile = computeProfile(answers, CONTENT)
    expect(thinCells(profile, answers, CONTENT)).toEqual([])
    expect(pickFirmUpQuestions(profile, answers, CONTENT)).toEqual([])
  })

  it('tops up the cells a read rests on with unasked questions, asked ranked', () => {
    // Warm up close from one question: The Vault, resting on a single ranked answer for warmth and approach.
    const closeness1 = CONTENT.questions.find(q => q.id === 'closeness_1')!
    const answers = [ranked(closeness1)]
    const profile = computeProfile(answers, CONTENT)
    expect(profile.archetype.id).toBe('vault')
    expect(thinCells(profile, answers, CONTENT)).toEqual(expect.arrayContaining(['closeness:warmth', 'closeness:approach']))

    const extra = pickFirmUpQuestions(profile, answers, CONTENT)
    expect(extra.length).toBeGreaterThan(0)
    expect(extra.length).toBeLessThanOrEqual(FIRM_UP_CAP)
    expect(extra.every(q => q.kind === 'backbone' && !q.reserve && q.id !== 'closeness_1')).toBe(true)
    for (const cell of ['closeness:warmth', 'closeness:approach']) {
      expect(1 + extra.filter(q => measures(q, cell)).length).toBeGreaterThanOrEqual(FIRM_UP_MIN)
    }
  })

  it('never asks more than the cap', () => {
    const answers = [ranked(CONTENT.questions.find(q => q.id === 'closeness_1')!)]
    expect(pickFirmUpQuestions(computeProfile(answers, CONTENT), answers, CONTENT, 1)).toHaveLength(1)
  })

  it('asks a flavor question ranked without changing the bank', () => {
    const flavor = CONTENT.questions.find(q => q.kind === 'flavor')!
    expect(asRanked(flavor).kind).toBe('backbone')
    expect(flavor.kind).toBe('flavor')
  })
})
