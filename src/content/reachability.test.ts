import { describe, it, expect } from 'vitest'
import { computeProfile } from '../engine'
import type { Answer, Archetype, Question } from '../engine/types'
import { CONTENT } from './index'
import { ARCHETYPES } from './archetypes'

/**
 * Synthesize the "ideal" answerer for an archetype: for each conditional question on
 * an axis the archetype cares about, pick — per case — the option that best aligns the
 * archetype's desired dim direction with the case's axis level. On questions the
 * archetype is indifferent to, pick a single fixed option (flat, no slope).
 * This proves every archetype is *reachable* from real questions.
 */
function inCharacterAnswers(archetype: Archetype, questions: Question[]): Answer[] {
  const answers: Answer[] = []
  for (const q of questions) {
    if (!q.cases || !q.axis) continue
    const axisSig = archetype.signature[q.axis] // Record<dim, slope> | undefined
    const ranking = q.cases.map(c => c.id)
    const mapping: Record<string, string> = {}

    for (const c of q.cases) {
      let best = q.options[0]
      if (axisSig) {
        let bestScore = -Infinity
        for (const opt of q.options) {
          let score = 0
          for (const dim of Object.keys(axisSig)) {
            score += Math.sign(axisSig[dim]) * (opt.vector[dim] ?? 0) * (c.axisLevel - 0.5)
          }
          if (score > bestScore) { bestScore = score; best = opt }
        }
      } else {
        // Indifferent → pick the lowest-magnitude (most neutral) option, same for every case.
        let bestMag = Infinity
        for (const opt of q.options) {
          const mag = Object.values(opt.vector).reduce((s, v) => s + Math.abs(v), 0)
          if (mag < bestMag) { bestMag = mag; best = opt }
        }
      }
      mapping[c.id] = best.id
    }
    answers.push({ questionId: q.id, mode: 'depends', ranking, mapping })
  }
  return answers
}

describe('every archetype is reachable from the question bank', () => {
  for (const archetype of ARCHETYPES) {
    it(`${archetype.code}: its ideal answerer maps to ${archetype.id}`, () => {
      const profile = computeProfile(inCharacterAnswers(archetype, CONTENT.questions), CONTENT)
      expect(profile.archetype.id).toBe(archetype.id)
    })
  }
})

describe('uniform answers map to the constant archetype', () => {
  it('picking the same option for every case yields constant (no slopes)', () => {
    const answers: Answer[] = CONTENT.questions
      .filter(q => q.cases && q.cases.length > 0)
      .map((q): Answer => ({
        questionId: q.id,
        mode: 'depends',
        ranking: q.cases!.map(c => c.id),
        mapping: Object.fromEntries(q.cases!.map(c => [c.id, q.options[0].id])),
      }))
    const profile = computeProfile(answers, CONTENT)
    expect(profile.archetype.id).toBe('constant')
  })
})
