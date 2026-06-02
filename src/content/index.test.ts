import { describe, it, expect } from 'vitest'
import { CONTENT } from './index'
import { validateContent } from './validate'

describe('assembled CONTENT', () => {
  it('passes validateContent (every axis covered, all refs valid)', () => {
    expect(validateContent(CONTENT)).toEqual([])
  })
  it('has backbone coverage for every axis plus a deep bank', () => {
    const backbone = CONTENT.questions.filter(q => q.kind === 'backbone')
    expect(new Set(backbone.map(q => q.axis)).size).toBe(6) // every axis has >=1 backbone
    expect(backbone.length).toBeGreaterThanOrEqual(6)
    expect(CONTENT.questions.length).toBeGreaterThanOrEqual(50)
  })
  it('every question is conditional (has >=2 cases) with axisLevels in [0,1]', () => {
    for (const q of CONTENT.questions) {
      expect((q.cases ?? []).length).toBeGreaterThanOrEqual(2)
      for (const c of q.cases ?? []) {
        expect(c.axisLevel).toBeGreaterThanOrEqual(0)
        expect(c.axisLevel).toBeLessThanOrEqual(1)
      }
    }
  })
})
