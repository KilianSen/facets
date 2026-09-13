import { describe, it, expect } from 'vitest'
import { extractBaseline } from './rules'
import { matchArchetype } from './match'
import type { Content, Signature } from './types'

// 1 axis, 1 dim, two archetypes with identical (flat) slopes but opposite baselines.
function content(): Content {
  return {
    axes: [{ id: 'closeness', name: 'Closeness', lowLabel: 'cool', highLabel: 'warm' }],
    dims: [{ id: 'warmth', name: 'Warmth', lowLabel: 'stay cool', highLabel: 'get warm' }],
    questions: [{
      id: 'q', prompt: 'p', kind: 'flavor', axis: 'closeness',
      cases: [{ id: 'c0', label: 'a', axisLevel: 1 }, { id: 'c1', label: 'b', axisLevel: 0 }],
      options: [
        { id: 'WARM', label: 'warm', vector: { warmth: 2 } },
        { id: 'COOL', label: 'cool', vector: { warmth: -2 } },
      ],
    }],
    archetypes: [
      { id: 'warm_type', code: 'WARM', name: 'Warm', tagline: '', copy: '', signature: {}, baseline: { warmth: 2 } },
      { id: 'cool_type', code: 'COOL', name: 'Cool', tagline: '', copy: '', signature: {}, baseline: { warmth: -2 } },
    ],
  }
}

describe('extractBaseline', () => {
  it('uses a single answer option vector directly', () => {
    const b = extractBaseline([{ questionId: 'q', mode: 'single', optionId: 'WARM' }], content())
    expect(b.warmth).toBeCloseTo(2)
  })

  it('uses the mean of the mapped options for a depends answer', () => {
    const b = extractBaseline(
      [{ questionId: 'q', mode: 'depends', ranking: ['c0', 'c1'], mapping: { c0: 'WARM', c1: 'COOL' } }],
      content(),
    )
    expect(b.warmth).toBeCloseTo(0) // mean of +2 and -2
  })

  it('is 0 for dims with no data', () => {
    const b = extractBaseline([], content())
    expect(b.warmth).toBe(0)
  })
})

describe('baseline-aware matchArchetype', () => {
  it('disambiguates archetypes with identical slopes by the baseline (so single answers count)', () => {
    const flat: Signature = { closeness: { warmth: { slope: 0, curvature: 0, levels: [] } } }
    expect(matchArchetype(flat, { warmth: 2 }, content()).id).toBe('warm_type')
    expect(matchArchetype(flat, { warmth: -2 }, content()).id).toBe('cool_type')
  })
})
