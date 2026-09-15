import { describe, it, expect } from 'vitest'
import { CROSSROADS_DILEMMAS, findCrossroadsDilemma, crossroadsQuestionId, isCrossroadsAnswer } from './crossroads'
import { AXES } from './axes'

describe('CROSSROADS_DILEMMAS', () => {
  const validAxes = new Set(AXES.map(a => a.id))

  it('has valid structure and references known axes', () => {
    expect(CROSSROADS_DILEMMAS.length).toBe(15) // 6 * 5 / 2 = 15 pairs
    for (const d of CROSSROADS_DILEMMAS) {
      expect(validAxes.has(d.axes[0])).toBe(true)
      expect(validAxes.has(d.axes[1])).toBe(true)
      expect(d.axes[0]).not.toBe(d.axes[1])
      expect(d.id).toBe(crossroadsQuestionId(d.axes[0], d.axes[1]))
      expect(d.title.length).toBeGreaterThan(0)
      expect(d.prompt.length).toBeGreaterThan(0)
      expect(d.options).toHaveLength(3)

      const favors = d.options.map(o => o.favorsAxis)
      expect(favors).toContain(d.axes[0])
      expect(favors).toContain(d.axes[1])
      expect(favors).toContain('balance')
    }
  })

  it('covers all 15 pairwise combinations of the 6 situation axes', () => {
    const axisIds = AXES.map(a => a.id)
    for (let i = 0; i < axisIds.length; i++) {
      for (let j = i + 1; j < axisIds.length; j++) {
        const d = findCrossroadsDilemma(axisIds[i], axisIds[j])
        expect(d, `Missing dilemma for ${axisIds[i]} × ${axisIds[j]}`).toBeDefined()
      }
    }
  })

  it('finds dilemmas symmetrically', () => {
    const d1 = findCrossroadsDilemma('closeness', 'power')
    const d2 = findCrossroadsDilemma('power', 'closeness')
    expect(d1).toBeDefined()
    expect(d1?.id).toBe(d2?.id)
  })

  it('correctly identifies crossroads answer question IDs', () => {
    expect(isCrossroadsAnswer('crossroads_closeness_power')).toBe(true)
    expect(isCrossroadsAnswer('closeness_1')).toBe(false)
    expect(isCrossroadsAnswer('why_closeness')).toBe(false)
  })
})
