import { describe, it, expect } from 'vitest'
import { CONTENT } from './index'
import { validateContent } from './validate'

describe('assembled CONTENT', () => {
  it('passes validateContent (every axis covered, all refs valid)', () => {
    expect(validateContent(CONTENT)).toEqual([])
  })
  it('has one backbone question per axis (6) plus flavor', () => {
    const backbone = CONTENT.questions.filter(q => q.kind === 'backbone')
    expect(backbone).toHaveLength(6)
    expect(new Set(backbone.map(q => q.axis)).size).toBe(6)
    expect(CONTENT.questions.length).toBeGreaterThanOrEqual(8)
  })
  it('every case axisLevel is within [0,1]', () => {
    for (const q of CONTENT.questions) for (const c of q.cases ?? []) {
      expect(c.axisLevel).toBeGreaterThanOrEqual(0)
      expect(c.axisLevel).toBeLessThanOrEqual(1)
    }
  })
})
