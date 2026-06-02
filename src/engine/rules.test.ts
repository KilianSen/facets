import { describe, it, expect } from 'vitest'
import { extractRules, rankWeight } from './rules'
import { makeTestContent, vaultAnswer } from './testFixtures'
import type { Answer } from './types'

describe('rankWeight', () => {
  it('gives most-true (index 0) the highest weight', () => {
    expect(rankWeight(0, 3)).toBe(3)
    expect(rankWeight(2, 3)).toBe(1)
  })
})

describe('extractRules', () => {
  it('produces one rule per mapped case with axis level and vector', () => {
    const rules = extractRules([vaultAnswer], makeTestContent())
    expect(rules).toHaveLength(3)
    const best = rules.find(r => r.axisLevel === 1)!
    expect(best.axis).toBe('closeness')
    expect(best.vector).toEqual({ warmth: 2, approach: 2 })
    expect(best.weight).toBe(3) // ranked first
  })

  it('ignores single-mode answers', () => {
    const rules = extractRules(
      [{ questionId: 'q_close', mode: 'single', optionId: 'A' }],
      makeTestContent(),
    )
    expect(rules).toHaveLength(0)
  })

  it('skips cases with an unknown mapped option and cases left unmapped', () => {
    const content = makeTestContent()
    const a: Answer = {
      questionId: 'q_close', mode: 'depends',
      ranking: ['c_best', 'c_mid', 'c_far'],
      mapping: { c_best: 'NOPE', c_mid: 'B' }, // c_best -> nonexistent option, c_far unmapped
    }
    const rules = extractRules([a], content)
    expect(rules).toHaveLength(1)
    expect(rules[0].axisLevel).toBe(0.5)
  })
})
