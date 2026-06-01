import { describe, it, expect } from 'vitest'
import { weightedSlope, computeSignature } from './signature'
import { extractRules } from './rules'
import { makeTestContent, vaultAnswer, constantAnswer } from './testFixtures'

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
    expect(flexibility).toBe(0)
  })
})
