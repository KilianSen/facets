import { describe, it, expect } from 'vitest'
import { selectObserverQuestions, computeObserverReport, OBSERVER_QUESTIONS_PER_AXIS } from './observer'
import { selectQuestions } from '../content/selectQuestions'
import { CONTENT } from '../content'
import type { Answer } from './types'

/** A ranked "it depends" answer picking `picks[i]` for case i (c0 = level 1, c1 = 0.5, c2 = 0). */
const depends = (questionId: string, picks: [string, string, string]): Answer => ({
  questionId, mode: 'depends',
  ranking: [0, 1, 2].map(i => `${questionId}_c${i}`),
  mapping: Object.fromEntries(picks.map((p, i) => [`${questionId}_c${i}`, p])),
})

// closeness_1: A = warm + lean in, C = cool + pull back. closeness_2: A = diplomatic + calm, C = blunt + rattled.
const self: Answer[] = [depends('closeness_1', ['A', 'B', 'C']), depends('closeness_2', ['C', 'B', 'A'])]

describe('selectObserverQuestions', () => {
  it('asks two backbone questions per situation, which every short run also asks the subject', () => {
    const questions = selectObserverQuestions(CONTENT)
    expect(questions).toHaveLength(CONTENT.axes.length * OBSERVER_QUESTIONS_PER_AXIS)
    expect(questions.every(q => q.kind === 'backbone' && !q.reserve)).toBe(true)
    for (const axis of CONTENT.axes) expect(questions.filter(q => q.axis === axis.id)).toHaveLength(OBSERVER_QUESTIONS_PER_AXIS)

    let seed = 1
    const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    for (let run = 0; run < 20; run++) {
      const asked = new Set(selectQuestions(CONTENT, rng).map(q => q.id))
      expect(questions.every(q => asked.has(q.id))).toBe(true)
    }
  })
})

describe('computeObserverReport', () => {
  it('finds no blind spots when the observer answers exactly like the subject', () => {
    const report = computeObserverReport(self, self, CONTENT, 'Sam', 'Alex')
    expect(report.measuredCells).toBe(4)
    expect(report.blindSpots).toEqual([])
    expect(report.congruence).toBe(1)
  })

  it('reports a reversed read as an opposite gap, and a shared read as a mirror', () => {
    const observer = [depends('closeness_1', ['C', 'B', 'A']), depends('closeness_2', ['C', 'B', 'A'])]
    const report = computeObserverReport(self, observer, CONTENT, 'Sam', 'Alex')

    expect(report.blindSpots.map(b => b.dimId).sort()).toEqual(['approach', 'warmth'])
    expect(report.blindSpots.every(b => b.kind === 'opposite' && b.axisId === 'closeness')).toBe(true)
    const warmth = report.blindSpots.find(b => b.dimId === 'warmth')!
    expect(warmth.headline).toBe('Warmth up close')
    expect(warmth.explanation).toBe(
      'Alex’s read: When it\'s someone close, you stay cool; when it\'s a stranger, you get warm. ' +
      'Sam’s own read: When it\'s someone close, you get warm; when it\'s a stranger, you stay cool.',
    )
    expect(report.clearMirror.map(m => m.dimId).sort()).toEqual(['composure', 'directness'])
  })

  it('only compares questions both people answered', () => {
    // The subject's run covers far more than the observer's two questions; none of it may count as a gap.
    const fullSelf = [...self, depends('stakes_1', ['A', 'B', 'C']), depends('closeness_11', ['A', 'B', 'C']), depends('power_1', ['A', 'B', 'C'])]
    const report = computeObserverReport(fullSelf, self, CONTENT, 'Sam', 'Alex')
    expect(report.measuredCells).toBe(4)
    expect(report.blindSpots).toEqual([])
  })

  it('says so when nothing overlaps', () => {
    const report = computeObserverReport(self, [depends('stakes_1', ['A', 'B', 'C'])], CONTENT, 'Sam', 'Alex')
    expect(report.measuredCells).toBe(0)
    expect(report.congruence).toBeNull()
    expect(report.summary).toMatch(/nothing to line up/)
  })
})
