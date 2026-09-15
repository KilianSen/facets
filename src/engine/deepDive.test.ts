import { describe, it, expect } from 'vitest'
import { rivalsOf, pickDuelQuestions, pickLifeQuestions, pickCollideDilemmas, headToHead, DUEL_CAP, LIFE_PER_AXIS, LIFE_STEADY_AXES, LIFE_STORY_ITEMS } from './deepDive'
import { axesOf } from './cast'
import { computeProfile } from './scoring'
import { CONTENT } from '../content'
import type { Answer } from './types'

/** A ranked answer for a 3-case base question: case i (c0 = level 1 … c2 = level 0) picks `picks[i]`. */
const ranked = (questionId: string, picks: [string, string, string]): Answer => ({
  questionId, mode: 'depends',
  ranking: [0, 1, 2].map(i => `${questionId}_c${i}`),
  mapping: Object.fromEntries(picks.map((p, i) => [`${questionId}_c${i}`, p])),
})
const q = (id: string) => CONTENT.questions.find(x => x.id === id)!

// Warm and leaning in with people close, cool with strangers: The Vault, with a big closeness swing.
const warmUpClose = [ranked('closeness_1', ['A', 'B', 'C'])]

describe('rivalsOf', () => {
  it('finds the closest other types on the same situations', () => {
    const profile = computeProfile(warmUpClose, CONTENT)
    const rivals = rivalsOf(profile, 'vault', CONTENT)
    expect(rivals).toHaveLength(2)
    expect(rivals.every(r => r.id !== 'vault' && axesOf(r).has('closeness'))).toBe(true)
  })
})

describe('pickDuelQuestions', () => {
  it('asks unasked questions on the headline’s situations, ranked, where it and its rivals would answer differently', () => {
    const profile = computeProfile(warmUpClose, CONTENT)
    const duel = pickDuelQuestions(profile, warmUpClose, CONTENT)
    expect(duel.length).toBeGreaterThan(0)
    expect(duel.length).toBeLessThanOrEqual(DUEL_CAP)
    for (const d of duel) {
      expect(d.axis).toBe('closeness')
      expect(d.kind).toBe('backbone')
      expect(d.reserve).toBeFalsy()
      expect(d.id).not.toBe('closeness_1')
    }
  })

  it('has nothing to settle for someone who doesn’t shift', () => {
    const flat = [ranked('closeness_1', ['B', 'B', 'B'])]
    expect(pickDuelQuestions(computeProfile(flat, CONTENT), flat, CONTENT)).toEqual([])
  })
})

describe('headToHead', () => {
  it('puts the headline next to its closest look-alikes on its own situations', () => {
    const result = headToHead(computeProfile(warmUpClose, CONTENT), CONTENT)!
    expect(result.axes).toEqual(['closeness'])
    expect(result.lead.archetype.id).toBe('vault')
    expect(result.lead.share).toBeGreaterThan(0.9)
    expect(result.rivals).toHaveLength(2)
    for (const r of result.rivals) expect(r.share).toBeLessThan(result.lead.share)
  })

  it('has nothing to compare for a flat read', () => {
    const flat = [ranked('closeness_1', ['B', 'B', 'B'])]
    expect(headToHead(computeProfile(flat, CONTENT), CONTENT)).toBeNull()
  })
})

describe('pickLifeQuestions', () => {
  it('asks about your biggest swing first, then mostly where you’re steady', () => {
    const life = pickLifeQuestions(computeProfile(warmUpClose, CONTENT), warmUpClose, CONTENT)
    expect(life.every(x => x.acrossSettings)).toBe(true)
    // The story: your biggest swing (closeness)…
    expect(life.slice(0, LIFE_STORY_ITEMS).map(x => x.axis)).toEqual(['closeness'])
    // …then the steady situations, where a setting's pull can actually show.
    const steady = life.slice(LIFE_STORY_ITEMS)
    expect(steady).toHaveLength(LIFE_STEADY_AXES * LIFE_PER_AXIS)
    expect(steady.some(x => x.axis === 'closeness')).toBe(false)
    expect(new Set(steady.map(x => x.axis)).size).toBe(LIFE_STEADY_AXES)
  })

  it('skips what was already asked, and has no story for someone who doesn’t shift', () => {
    const first = pickLifeQuestions(computeProfile(warmUpClose, CONTENT), warmUpClose, CONTENT)
    const answered: Answer[] = [...warmUpClose, { questionId: first[0].id, mode: 'depends', ranking: first[0].cases!.map(c => c.id), mapping: {} }]
    expect(pickLifeQuestions(computeProfile(answered, CONTENT), answered, CONTENT).map(x => x.id)).not.toContain(first[0].id)

    const flat = [ranked('closeness_1', ['B', 'B', 'B'])]
    expect(pickLifeQuestions(computeProfile(flat, CONTENT), flat, CONTENT)).toHaveLength(LIFE_STEADY_AXES * LIFE_PER_AXIS)
  })
})

describe('pickCollideDilemmas', () => {
  it('offers the crossroads for situations that both swing, once', () => {
    const answers = [...warmUpClose, ranked('audience_1', ['A', 'B', 'C'])]
    expect(q('audience_1').axis).toBe('audience')
    const dilemmas = pickCollideDilemmas(computeProfile(answers, CONTENT), answers, CONTENT)
    expect(dilemmas.map(d => [...d.axes].sort())).toEqual([['audience', 'closeness']])

    const after: Answer[] = [...answers, { questionId: dilemmas[0].id, mode: 'single', optionId: 'A' }]
    expect(pickCollideDilemmas(computeProfile(after, CONTENT), after, CONTENT)).toEqual([])
  })

  it('needs two swinging situations', () => {
    expect(pickCollideDilemmas(computeProfile(warmUpClose, CONTENT), warmUpClose, CONTENT)).toEqual([])
  })
})
