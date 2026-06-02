import { describe, it, expect } from 'vitest'
import { axisStability, axisSwing } from './stability'
import { computeSignature } from './signature'
import { extractRules } from './rules'
import { makeTestContent, vaultAnswer, constantAnswer } from './testFixtures'
import type { Answer, Content } from './types'

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
