import { describe, it, expect } from 'vitest'
import { computeProfile, describeContingency } from './scoring'
import { makeTestContent, vaultAnswer } from './testFixtures'

describe('describeContingency', () => {
  it('reads high-pole behaviour for a positive slope', () => {
    const text = describeContingency('closeness', 'warmth', 2, makeTestContent())
    expect(text).toContain('someone close')
    expect(text).toContain('get warm')
  })
  it('flips poles for a negative slope', () => {
    const text = describeContingency('closeness', 'warmth', -2, makeTestContent())
    expect(text).toContain('someone close')
    expect(text).toContain('stay cool')
  })
})

describe('computeProfile', () => {
  const content = makeTestContent()

  it('returns the full profile for a vault answer', () => {
    const p = computeProfile([vaultAnswer], content)
    expect(p.archetype.id).toBe('vault')
    expect(p.flexibility).toBeGreaterThan(0)
    expect(p.topContingencies.length).toBeGreaterThan(0)
    const slopes = p.topContingencies.map(c => Math.abs(c.slope))
    expect(slopes).toEqual([...slopes].sort((a, b) => b - a))
    expect(p.dimensionRanges.warmth.max).toBeGreaterThanOrEqual(p.dimensionRanges.warmth.min)
  })

  it('is deterministic (same input → same output)', () => {
    expect(computeProfile([vaultAnswer], content)).toEqual(computeProfile([vaultAnswer], content))
  })

  it('handles an empty answer set without throwing', () => {
    const p = computeProfile([], content)
    expect(p.flexibility).toBe(0)
    expect(typeof p.archetype.id).toBe('string')
  })
})
