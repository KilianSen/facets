import { describe, it, expect } from 'vitest'
import { encodeAnswers, decodeAnswers, shareUrl } from './permalink'
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

  it('builds a /r/<archetype>?a= share URL that decodes back to the answers', () => {
    const url = shareUrl('vault', answers, 'https://fptic.test')
    expect(url.startsWith('https://fptic.test/r/vault?a=')).toBe(true)
    const a = new URL(url).searchParams.get('a')!
    expect(decodeAnswers(a)).toEqual(answers)
  })
})
