import { describe, it, expect } from 'vitest'
import { computeProfile, describeContingency } from './scoring'
import { makeTestContent, vaultAnswer } from './testFixtures'
import type { Answer } from './types'

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

  it('gives zero confidence for an empty answer set (no evidence)', () => {
    const p = computeProfile([], content)
    expect(p.flexibility).toBe(0)
    expect(p.archetype.confidence).toBe(0)
    expect(typeof p.archetype.id).toBe('string')
  })

  it('surfaces negative-slope contingencies for a reverse pattern', () => {
    const reverse: Answer = {
      questionId: 'q_close', mode: 'depends',
      ranking: ['c_best', 'c_mid', 'c_far'],
      mapping: { c_best: 'C', c_mid: 'B', c_far: 'A' },
    }
    const p = computeProfile([reverse], content)
    expect(p.topContingencies.some(c => c.slope < 0)).toBe(true)
  })
})
