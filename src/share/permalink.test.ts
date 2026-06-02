import { describe, it, expect } from 'vitest'
import { encodeAnswers, decodeAnswers } from './permalink'
import type { Answer } from '../engine/types'

const answers: Answer[] = [
  { questionId: 'closeness_1', mode: 'single', optionId: 'A' },
  { questionId: 'stakes_1', mode: 'depends', ranking: ['a', 'b', 'c'], mapping: { a: 'A', b: 'B', c: 'C' } },
]

describe('permalink', () => {
  it('round-trips answers through encode/decode', () => {
    expect(decodeAnswers(encodeAnswers(answers))).toEqual(answers)
  })

  it('produces a URL-safe string (no whitespace)', () => {
    expect(encodeAnswers(answers)).not.toMatch(/\s/)
  })

  it('returns null for malformed input instead of throwing', () => {
    expect(decodeAnswers('not-valid-base64-!!')).toBeNull()
    expect(decodeAnswers('')).toBeNull()
  })
})
