import { describe, it, expect } from 'vitest'
import { CONTENT } from './index'

describe('6x6 Grid Cell Coverage', () => {
  it('every situation x behaviour cell has at least 2 base questions', () => {
    const base = CONTENT.questions.filter(q => !q.reserve)
    const grid: Record<string, Record<string, number>> = {}
    for (const a of CONTENT.axes) {
      grid[a.id] = {}
      for (const d of CONTENT.dims) grid[a.id][d.id] = 0
    }

    for (const q of base) {
      if (!q.axis) continue
      const dims = new Set<string>()
      for (const o of q.options) {
        for (const d of Object.keys(o.vector)) dims.add(d)
      }
      for (const d of dims) grid[q.axis][d]++
    }

    for (const a of CONTENT.axes) {
      for (const d of CONTENT.dims) {
        const count = grid[a.id][d.id]
        expect(count, `Cell ${a.id} x ${d.id} should have >= 2 questions, but had ${count}`).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('every case across all base questions has a defined setting', () => {
    const base = CONTENT.questions.filter(q => !q.reserve)
    for (const q of base) {
      for (const c of q.cases ?? []) {
        expect(c.setting, `Question ${q.id} case ${c.id} must have setting`).toBeDefined()
        expect(['romance', 'work', 'social', 'family']).toContain(c.setting)
      }
    }
  })
})
