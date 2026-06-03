import { describe, it, expect } from 'vitest'
import { axisStability, axisSwing, sharpenVerdict, sharpenConfident, sharpenReadout, MIXED_BAND, SHARPEN_CAP } from './stability'
import { computeSignature } from './signature'
import { extractRules } from './rules'
import { makeTestContent, vaultAnswer, constantAnswer } from './testFixtures'
import type { Answer, Content, Question } from './types'

describe('axisSwing (big-swing trigger)', () => {
  it('is large for a strong contingency and ~0 for a flat one', () => {
    const tc = makeTestContent()
    const strong = computeSignature(extractRules([vaultAnswer], tc), tc).signature
    const flat = computeSignature(extractRules([constantAnswer], tc), tc).signature
    expect(axisSwing(strong, tc).closeness).toBeGreaterThan(axisSwing(flat, tc).closeness)
    expect(axisSwing(flat, tc).closeness).toBeCloseTo(0)
  })
})

// Replication fixture: TWO backbone questions on the same axis, both measuring warmth+approach at
// the same levels — so within-level inconsistency is measurable.
const opts = [
  { id: 'W', label: 'warm', vector: { warmth: 2, approach: 2 } },
  { id: 'N', label: 'neutral', vector: { warmth: 0, approach: 0 } },
  { id: 'C', label: 'cold', vector: { warmth: -2, approach: -2 } },
]
const q = (id: string) => ({
  id, kind: 'backbone' as const, axis: 'closeness', prompt: 'p',
  cases: [{ id: `${id}a`, label: 'a', axisLevel: 1 }, { id: `${id}b`, label: 'b', axisLevel: 0.5 }, { id: `${id}c`, label: 'c', axisLevel: 0 }],
  options: opts,
})
const content: Content = {
  axes: [{ id: 'closeness', name: 'Closeness', lowLabel: 'cool', highLabel: 'warm' }],
  dims: [{ id: 'warmth', name: 'Warmth', lowLabel: 'cool', highLabel: 'warm' }, { id: 'approach', name: 'Approach', lowLabel: 'pull', highLabel: 'lean' }],
  questions: [q('q1'), q('q2')],
  archetypes: [],
}
const depends = (id: string, m: Record<string, string>): Answer => ({ questionId: id, mode: 'depends', ranking: [`${id}a`, `${id}b`, `${id}c`], mapping: { [`${id}a`]: m.a, [`${id}b`]: m.b, [`${id}c`]: m.c } })

describe('axisStability (within-level inconsistency)', () => {
  it('rates a consistent answerer (both questions agree per level) as more stable than an inconsistent one', () => {
    const consistent = [depends('q1', { a: 'W', b: 'N', c: 'C' }), depends('q2', { a: 'W', b: 'N', c: 'C' })]
    const inconsistent = [depends('q1', { a: 'W', b: 'N', c: 'C' }), depends('q2', { a: 'C', b: 'N', c: 'W' })] // reversed
    const cs = axisStability(extractRules(consistent, content), content)
    const ns = axisStability(extractRules(inconsistent, content), content)
    expect(cs.closeness.instability).toBeLessThan(ns.closeness.instability)
    expect(cs.closeness.coverage).toBeGreaterThan(0)
  })

  it('needs replication: a single question (one point per level) yields no coverage', () => {
    const s = axisStability(extractRules([depends('q1', { a: 'W', b: 'N', c: 'C' })], content), content)
    expect(s.closeness.coverage).toBe(0)
    expect(s.closeness.instability).toBe(0)
  })

  it('reports zero coverage when there is no depends data (single-tap only)', () => {
    const tc = makeTestContent()
    const s = axisStability(extractRules([{ questionId: 'q_close', mode: 'single', optionId: 'A' }], tc), tc)
    expect(s.closeness.coverage).toBe(0)
  })
})

describe('sharpen verdict + adaptive stopping', () => {
  it('reads below the band as solid, at/above as mixed', () => {
    expect(sharpenVerdict(0)).toBe('solid')
    expect(sharpenVerdict(MIXED_BAND - 0.01)).toBe('solid')
    expect(sharpenVerdict(MIXED_BAND)).toBe('mixed')
    expect(sharpenVerdict(0.5)).toBe('mixed')
  })

  it('stops early when clearly mixed (>= 2 items)', () => {
    expect(sharpenConfident(0.5, 1)).toBe(false) // too few
    expect(sharpenConfident(0.5, 2)).toBe(true)  // clearly mixed, enough items
  })

  it('does NOT commit to solid early — keeps asking to the cap', () => {
    // A low reading at low N could be coincidence; solid is only trusted with the full set.
    expect(sharpenConfident(0, 2)).toBe(false)
    expect(sharpenConfident(0, 3)).toBe(false)
    expect(sharpenConfident(0, SHARPEN_CAP)).toBe(true)
  })

  it('is NOT confident right at the borderline (keeps adding)', () => {
    expect(sharpenConfident(MIXED_BAND, 2)).toBe(false)
    expect(sharpenConfident(MIXED_BAND, 3)).toBe(false)
  })

  it('always stops at the cap, even when borderline', () => {
    expect(sharpenConfident(MIXED_BAND, SHARPEN_CAP)).toBe(true)
  })
})

describe('sharpenReadout (verdict from the parallel answers in a run)', () => {
  const reserveContent: Content = { ...content, questions: [{ ...q('q1'), reserve: true }, { ...q('q2'), reserve: true }] }

  it('reads consistent parallel answers as solid', () => {
    const ans = [depends('q1', { a: 'W', b: 'N', c: 'C' }), depends('q2', { a: 'W', b: 'N', c: 'C' })]
    const r = sharpenReadout(ans, reserveContent)
    expect(r).toHaveLength(1)
    expect(r[0].axisId).toBe('closeness')
    expect(r[0].verdict).toBe('solid')
    expect(r[0].n).toBe(2)
  })

  it('reads contradictory parallel answers as mixed', () => {
    const ans = [depends('q1', { a: 'W', b: 'N', c: 'C' }), depends('q2', { a: 'C', b: 'N', c: 'W' })]
    expect(sharpenReadout(ans, reserveContent)[0].verdict).toBe('mixed')
  })

  it('reads a flat round (you never actually shifted) as mixed, not solid', () => {
    const flat = [depends('q1', { a: 'W', b: 'W', c: 'W' }), depends('q2', { a: 'W', b: 'W', c: 'W' })]
    const r = sharpenReadout(flat, reserveContent)
    expect(r).toHaveLength(1)
    expect(r[0].verdict).toBe('mixed') // consistent within levels, but no slope reproduced
  })

  it('withholds a verdict entirely when the picks carry no measurable evidence', () => {
    const blank = [{ id: 'Z', label: 'neutral', vector: {} }]
    const zq = (id: string): Question => ({
      id, kind: 'backbone', axis: 'closeness', prompt: 'p', reserve: true,
      cases: [{ id: `${id}a`, label: 'a', axisLevel: 1 }, { id: `${id}b`, label: 'b', axisLevel: 0.5 }, { id: `${id}c`, label: 'c', axisLevel: 0 }],
      options: blank,
    })
    const blankContent: Content = { ...content, questions: [zq('z1'), zq('z2')] }
    const zAns = (id: string): Answer => ({ questionId: id, mode: 'depends', ranking: [`${id}a`, `${id}b`, `${id}c`], mapping: { [`${id}a`]: 'Z', [`${id}b`]: 'Z', [`${id}c`]: 'Z' } })
    expect(sharpenReadout([zAns('z1'), zAns('z2')], blankContent)).toEqual([])
  })

  it('omits an axis with fewer than the minimum parallel answers', () => {
    expect(sharpenReadout([depends('q1', { a: 'W', b: 'N', c: 'C' })], reserveContent)).toEqual([])
  })

  it('ignores answers to non-reserve questions', () => {
    const ans = [depends('q1', { a: 'W', b: 'N', c: 'C' }), depends('q2', { a: 'W', b: 'N', c: 'C' })]
    expect(sharpenReadout(ans, content)).toEqual([]) // same answers, but these questions aren't reserve
  })
})
