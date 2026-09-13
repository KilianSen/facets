import { describe, it, expect } from 'vitest'
import { weightedSlope, computeSignature } from './signature'
import { extractRules } from './rules'
import { makeTestContent, vaultAnswer, constantAnswer } from './testFixtures'
import type { Content, Answer } from './types'

describe('weightedSlope', () => {
  it('is positive when y rises with x', () => {
    expect(weightedSlope([{ x: 0, y: -1, w: 1 }, { x: 1, y: 1, w: 1 }])).toBeGreaterThan(0)
  })
  it('is zero when all y equal', () => {
    expect(weightedSlope([{ x: 0, y: 2, w: 1 }, { x: 1, y: 2, w: 3 }])).toBe(0)
  })
  it('is zero when all x equal (no spread)', () => {
    expect(weightedSlope([{ x: 1, y: 1, w: 1 }, { x: 1, y: 5, w: 1 }])).toBe(0)
  })
})

describe('computeSignature', () => {
  const content = makeTestContent()

  it('produces positive slopes for a vault-shaped answer', () => {
    const { signature, flexibility } = computeSignature(extractRules([vaultAnswer], content), content)
    expect(signature.closeness.warmth.slope).toBeGreaterThan(0)
    expect(signature.closeness.approach.slope).toBeGreaterThan(0)
    expect(flexibility).toBeGreaterThan(0)
    // levels are sorted ascending by axis level
    expect(signature.closeness.warmth.levels.map(l => l.level)).toEqual([0, 0.5, 1])
  })

  it('produces zero slopes and zero flexibility for a flat answer', () => {
    const { signature, flexibility } = computeSignature(extractRules([constantAnswer], content), content)
    expect(signature.closeness.warmth.slope).toBe(0)
    expect(signature.closeness.approach.slope).toBe(0)
    expect(signature.closeness.warmth.curvature).toBe(0)
    expect(flexibility).toBe(0)
  })

  it('reads curvature for a non-monotonic answer the slope alone misses', () => {
    // Inverted-U warmth: cold at both ends, warm in the middle (concave) ⇒ negative curvature.
    const invertedU: Answer = {
      questionId: 'q_close', mode: 'depends', ranking: ['c_best', 'c_mid', 'c_far'],
      mapping: { c_best: 'C', c_mid: 'A', c_far: 'C' },
    }
    // U warmth: warm at both ends, cold in the middle (convex) ⇒ positive curvature.
    const uShape: Answer = {
      questionId: 'q_close', mode: 'depends', ranking: ['c_best', 'c_mid', 'c_far'],
      mapping: { c_best: 'A', c_mid: 'C', c_far: 'A' },
    }
    const inv = computeSignature(extractRules([invertedU], content), content).signature.closeness.warmth
    const u = computeSignature(extractRules([uShape], content), content).signature.closeness.warmth
    expect(inv.curvature).toBeLessThan(0)
    expect(u.curvature).toBeGreaterThan(0)
    // The blind spot: for a both-ways bend the curvature is the dominant signal — bigger than the
    // residual slope that rank-weighting leaves behind, which is all the old model would have seen.
    expect(Math.abs(inv.curvature)).toBeGreaterThan(Math.abs(inv.slope))
  })

  it('reads ~zero curvature for a clean linear answer', () => {
    // approach runs A(+2)@1 → B(0)@0.5 → C(−2)@0: a straight line.
    const linear: Answer = {
      questionId: 'q_close', mode: 'depends', ranking: ['c_best', 'c_mid', 'c_far'],
      mapping: { c_best: 'A', c_mid: 'B', c_far: 'C' },
    }
    const cell = computeSignature(extractRules([linear], content), content).signature.closeness.approach
    expect(cell.slope).toBeGreaterThan(0)
    expect(Math.abs(cell.curvature)).toBeLessThan(0.5)
  })

  it('ranking weight changes the slope when two cases share an axis level', () => {
    const c: Content = {
      axes: [{ id: 'ax', name: 'Ax', lowLabel: 'lo', highLabel: 'hi' }],
      dims: [{ id: 'd', name: 'D', lowLabel: 'lo', highLabel: 'hi' }],
      questions: [{
        id: 'q', prompt: 'p', kind: 'backbone', axis: 'ax',
        cases: [
          { id: 'hiCase', label: 'hi', axisLevel: 1 },
          { id: 'loA', label: 'loA', axisLevel: 0 },
          { id: 'loB', label: 'loB', axisLevel: 0 },
        ],
        options: [
          { id: 'P', label: 'plus', vector: { d: 2 } },
          { id: 'M', label: 'minus', vector: { d: -2 } },
          { id: 'Z', label: 'zero', vector: { d: 0 } },
        ],
      }],
      archetypes: [{ id: 'x', code: 'X', name: 'X', tagline: '', copy: '', signature: {} }],
    }
    const mapping = { hiCase: 'Z', loA: 'P', loB: 'M' }
    const rankA: Answer = { questionId: 'q', mode: 'depends', ranking: ['loA', 'loB', 'hiCase'], mapping }
    const rankB: Answer = { questionId: 'q', mode: 'depends', ranking: ['loB', 'loA', 'hiCase'], mapping }
    const slopeA = computeSignature(extractRules([rankA], c), c).signature.ax.d.slope
    const slopeB = computeSignature(extractRules([rankB], c), c).signature.ax.d.slope
    expect(slopeA).not.toBeCloseTo(slopeB)
  })
})
