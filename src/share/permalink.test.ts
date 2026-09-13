import { describe, it, expect } from 'vitest'
import { encodeAnswers, decodeAnswers, shareUrl, sameAnswers } from './permalink'
import { CONTENT } from '../content'
import { selectQuestions, pickSharpenQuestions } from '../content/selectQuestions'
import { motiveQuestionId } from '../engine'
import type { Answer, Question } from '../engine/types'

const answers: Answer[] = [
  { questionId: 'closeness_1', mode: 'single', optionId: 'A' },
  { questionId: 'stakes_1', mode: 'depends', ranking: ['a', 'b', 'c'], mapping: { a: 'A', b: 'B', c: 'C' } },
]

// Deterministic RNG so the "realistic run" is the same every time.
function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
}

/** A full realistic run: base questions (some flavor promoted to depends), a sharpen round, and motives. */
function realisticRun(mode: 'short' | 'deep', seed: number): Answer[] {
  const r = rng(seed)
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)]
  const answerOf = (q: Question): Answer => {
    if (q.cases && (q.kind === 'backbone' || r() < 0.3)) {
      const ranking = [...q.cases.map(c => c.id)].sort(() => r() - 0.5)
      const mapping: Record<string, string> = {}
      for (const c of q.cases) mapping[c.id] = pick(q.options).id
      return { questionId: q.id, mode: 'depends', ranking, mapping }
    }
    return { questionId: q.id, mode: 'single', optionId: pick(q.options).id }
  }
  const base = selectQuestions(CONTENT, mode, r).map(answerOf)
  const sharpen = pickSharpenQuestions(CONTENT, 'closeness', new Set(), 4, r).map(answerOf)
  const why: Answer[] = [
    { questionId: motiveQuestionId('closeness'), mode: 'single', optionId: 'trust' },
    { questionId: motiveQuestionId('stakes'), mode: 'single', optionId: 'control' },
  ]
  return [...base, ...sharpen, ...why]
}

const legacyEncode = (a: Answer[]) =>
  btoa(encodeURIComponent(JSON.stringify(a))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

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
    expect(decodeAnswers('2.!!')).toBeNull()
  })

  it('builds a /r/<archetype>?a= share URL that decodes back to the answers', () => {
    const url = shareUrl('vault', answers, 'https://fptic.test')
    expect(url.startsWith('https://fptic.test/r/vault?a=')).toBe(true)
    const a = new URL(url).searchParams.get('a')!
    expect(decodeAnswers(a)).toEqual(answers)
  })
})

describe('compact (v2) encoding', () => {
  it('losslessly round-trips realistic runs (short and deep, with sharpen + motives)', () => {
    for (let seed = 1; seed <= 25; seed++) {
      for (const mode of ['short', 'deep'] as const) {
        const run = realisticRun(mode, seed)
        const encoded = encodeAnswers(run)
        expect(encoded.startsWith('2.')).toBe(true)
        expect(sameAnswers(decodeAnswers(encoded)!, run)).toBe(true)
      }
    }
  })

  it('is small: a deep run fits in a few hundred characters, ~25x under the legacy form', () => {
    const run = realisticRun('deep', 7)
    const encoded = encodeAnswers(run)
    expect(encoded.length).toBeLessThan(500)
    expect(legacyEncode(run).length / encoded.length).toBeGreaterThan(20)
  })

  it('still decodes legacy (v1) links', () => {
    const run = realisticRun('short', 3)
    expect(decodeAnswers(legacyEncode(run))).toEqual(run)
  })

  it('rejects a truncated or padded link instead of decoding a partial run', () => {
    const encoded = encodeAnswers(realisticRun('short', 4))
    for (const cut of [1, 2, 5, 20]) expect(decodeAnswers(encoded.slice(0, -cut))).toBeNull()
    expect(decodeAnswers(`${encoded}A`)).toBeNull()
  })

  it('falls back to the lossless legacy form for answers outside the content', () => {
    const odd: Answer[] = [{ questionId: 'not_a_question', mode: 'single', optionId: 'Z' }]
    const encoded = encodeAnswers(odd)
    expect(encoded.startsWith('2.')).toBe(false)
    expect(decodeAnswers(encoded)).toEqual(odd)
  })

  it('falls back for a partial ranking, which v2 cannot express', () => {
    const partial: Answer[] = [{
      questionId: 'closeness_1', mode: 'depends',
      ranking: ['closeness_1_c0'], mapping: { closeness_1_c0: 'A' },
    }]
    expect(decodeAnswers(encodeAnswers(partial))).toEqual(partial)
  })

  it('encodes unmapped cases', () => {
    const gappy: Answer[] = [{
      questionId: 'closeness_1', mode: 'depends',
      ranking: ['closeness_1_c2', 'closeness_1_c0', 'closeness_1_c1'], mapping: { closeness_1_c0: 'C' },
    }]
    const encoded = encodeAnswers(gappy)
    expect(encoded.startsWith('2.')).toBe(true)
    expect(decodeAnswers(encoded)).toEqual(gappy)
  })
})

describe('sameAnswers', () => {
  it('ignores mapping key order but not ranking order', () => {
    const a: Answer = { questionId: 'q', mode: 'depends', ranking: ['x', 'y'], mapping: { x: 'A', y: 'B' } }
    expect(sameAnswers([a], [{ ...a, mapping: { y: 'B', x: 'A' } }])).toBe(true)
    expect(sameAnswers([a], [{ ...a, ranking: ['y', 'x'] }])).toBe(false)
  })
})
