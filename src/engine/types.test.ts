import { describe, it, expect } from 'vitest'
import { isDependsAnswer, type Answer } from './types'

describe('isDependsAnswer', () => {
  it('narrows depends answers', () => {
    const single: Answer = { questionId: 'q', mode: 'single', optionId: 'a' }
    const depends: Answer = { questionId: 'q', mode: 'depends', ranking: ['c1'], mapping: { c1: 'a' } }
    expect(isDependsAnswer(single)).toBe(false)
    expect(isDependsAnswer(depends)).toBe(true)
  })
})
