import { describe, it, expect, beforeEach } from 'vitest'
import { compareUrl, parseCompare, cleanName, savePending, loadPending, clearPending, PENDING_COMPARE_KEY, MAX_NAME } from './compareLink'
import { encodeAnswers } from '../share/permalink'
import type { Answer } from '../engine/types'

const a = encodeAnswers([{ questionId: 'closeness_1', mode: 'single', optionId: 'A' }] as Answer[])
const b = encodeAnswers([{ questionId: 'stakes_1', mode: 'single', optionId: 'C' }] as Answer[])

beforeEach(() => localStorage.clear())

describe('compareUrl / parseCompare', () => {
  it('round-trips both answer sets and names', () => {
    const url = compareUrl({ a, an: 'Sam', b, bn: 'Alex' }, 'https://facets.test')
    expect(url.startsWith('https://facets.test/compare?')).toBe(true)
    expect(parseCompare(new URL(url).search)).toEqual({ a, an: 'Sam', b, bn: 'Alex' })
  })

  it('builds an invite with only one side', () => {
    expect(parseCompare(new URL(compareUrl({ a }, 'https://x.test')).search)).toEqual({ a, an: undefined, b: undefined, bn: undefined })
  })

  it('rejects a missing or corrupt `a`, and drops a corrupt `b`', () => {
    expect(parseCompare('')).toBeNull()
    expect(parseCompare('?a=garbage')).toBeNull()
    expect(parseCompare(`?a=${a}&b=garbage`)?.b).toBeUndefined()
  })
})

describe('cleanName', () => {
  it('collapses whitespace and caps the length', () => {
    expect(cleanName('  Sam   Lee ')).toBe('Sam Lee')
    expect(cleanName('x'.repeat(100))).toHaveLength(MAX_NAME)
    expect(cleanName(null)).toBe('')
  })
})

describe('pending invite', () => {
  it('saves, loads and clears', () => {
    savePending({ a, an: 'Sam' })
    expect(loadPending()).toEqual({ a, an: 'Sam', bn: undefined })
    clearPending()
    expect(loadPending()).toBeNull()
  })

  it('ignores a corrupt stored invite', () => {
    localStorage.setItem(PENDING_COMPARE_KEY, JSON.stringify({ a: 'garbage' }))
    expect(loadPending()).toBeNull()
  })
})
