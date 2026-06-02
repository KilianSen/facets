import { describe, it, expect } from 'vitest'
import { validateContent } from './validate'
import type { Content } from '../engine/types'

const base: Content = {
  axes: [{ id: 'closeness', name: 'Closeness', lowLabel: 'lo', highLabel: 'hi' }],
  dims: [{ id: 'warmth', name: 'Warmth', lowLabel: 'lo', highLabel: 'hi' }],
  questions: [{
    id: 'q1', prompt: 'p', kind: 'backbone', axis: 'closeness',
    cases: [{ id: 'c1', label: 'c', axisLevel: 1 }],
    options: [{ id: 'A', label: 'a', vector: { warmth: 1 } }],
  }],
  archetypes: [{ id: 'x', code: 'X', name: 'X', tagline: '', copy: '', signature: { closeness: { warmth: 1 } } }],
}

describe('validateContent', () => {
  it('passes valid content', () => {
    expect(validateContent(base)).toEqual([])
  })
  it('flags a backbone question missing axis/cases', () => {
    const bad = { ...base, questions: [{ ...base.questions[0], axis: undefined, cases: undefined }] }
    expect(validateContent(bad).join(' ')).toMatch(/backbone/i)
  })
  it('flags an option vector referencing an unknown dim', () => {
    const bad = { ...base, questions: [{ ...base.questions[0], options: [{ id: 'A', label: 'a', vector: { ghost: 1 } }] }] }
    expect(validateContent(bad).join(' ')).toMatch(/ghost/)
  })
  it('flags an archetype signature referencing an unknown axis', () => {
    const bad = { ...base, archetypes: [{ ...base.archetypes[0], signature: { nope: { warmth: 1 } } }] }
    expect(validateContent(bad).join(' ')).toMatch(/nope/)
  })
  it('flags an axis with no backbone coverage', () => {
    const bad = { ...base, axes: [...base.axes, { id: 'stakes', name: 'Stakes', lowLabel: 'l', highLabel: 'h' }] }
    expect(validateContent(bad).join(' ')).toMatch(/stakes/)
  })
})
