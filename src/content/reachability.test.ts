import { describe, it, expect } from 'vitest'
import { computeProfile } from '../engine'
import type { Answer, Archetype, Question } from '../engine/types'
import { CONTENT } from './index'
import { ARCHETYPES } from './archetypes'

// Reachability is about the BASE bank — what a real run actually serves. Reserve (parallel sharpen)
// items are appended only on demand, so they're excluded here.
const BASE_QUESTIONS = CONTENT.questions.filter(q => !q.reserve)

/**
 * Synthesize the "ideal" answerer for an archetype, MODELLING THE REAL RUN:
 * - backbone questions are answered as `depends` (the only source of axis slopes): per case,
 *   pick the option that best aligns the archetype's desired dim direction with the case level.
 * - flavor questions are answered as single-tap (they contribute only to the baseline): pick the
 *   option whose vector best aligns with the archetype's baseline lean (most neutral if no lean).
 * This proves every archetype is reachable through the routing the app actually uses.
 */
function inCharacterAnswers(archetype: Archetype, questions: Question[]): Answer[] {
  const answers: Answer[] = []
  const base = archetype.baseline ?? {}
  const hasLean = Object.keys(base).length > 0

  for (const q of questions) {
    if (q.kind === 'backbone' && q.cases && q.axis) {
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
          let bestMag = Infinity
          for (const opt of q.options) {
            const mag = Object.values(opt.vector).reduce((s, v) => s + Math.abs(v), 0)
            if (mag < bestMag) { bestMag = mag; best = opt }
          }
        }
        mapping[c.id] = best.id
      }
      answers.push({ questionId: q.id, mode: 'depends', ranking, mapping })
    } else {
      // Flavor → single-tap: align the chosen option with the archetype's baseline lean.
      let best = q.options[0]
      let bestScore = -Infinity
      for (const opt of q.options) {
        const score = hasLean
          ? Object.keys(base).reduce((s, dim) => s + base[dim] * (opt.vector[dim] ?? 0), 0)
          : -Object.values(opt.vector).reduce((s, v) => s + Math.abs(v), 0)
        if (score > bestScore) { bestScore = score; best = opt }
      }
      answers.push({ questionId: q.id, mode: 'single', optionId: best.id })
    }
  }
  return answers
}

describe('every archetype is reachable from the question bank', () => {
  for (const archetype of ARCHETYPES) {
    it(`${archetype.code}: its ideal answerer maps to ${archetype.id}`, () => {
      const profile = computeProfile(inCharacterAnswers(archetype, BASE_QUESTIONS), CONTENT)
      expect(profile.archetype.id).toBe(archetype.id)
    })
  }
})

describe('uniform answers map to the constant archetype', () => {
  it('picking the same option for every case yields constant (no slopes)', () => {
    const answers: Answer[] = BASE_QUESTIONS
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
