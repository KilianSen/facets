import { describe, it, expect, beforeEach } from 'vitest'
import { quizReducer, initQuizState, STORAGE_KEY, type QuizState } from './useQuizState'
import type { Question } from '../engine/types'

const backbone: Question = {
  id: 'q1', prompt: 'p1', kind: 'backbone', axis: 'closeness',
  cases: [{ id: 'a', label: 'A', axisLevel: 1 }, { id: 'b', label: 'B', axisLevel: 0.5 }, { id: 'c', label: 'C', axisLevel: 0 }],
  options: [{ id: 'X', label: 'x', vector: {} }, { id: 'Y', label: 'y', vector: {} }],
}
// Production flavor questions still carry cases (for the optional "It depends").
const flavor: Question = {
  id: 'q2', prompt: 'p2', kind: 'flavor', axis: 'stakes',
  cases: [{ id: 'd', label: 'D', axisLevel: 1 }, { id: 'e', label: 'E', axisLevel: 0 }],
  options: [{ id: 'Z', label: 'z', vector: {} }, { id: 'W', label: 'w', vector: {} }],
}
const questions = [backbone, flavor]
const act = (s: QuizState, a: Parameters<typeof quizReducer>[1]) => quizReducer(s, a, questions)

/** Answer the backbone in the order c, a, b (the last one auto-opens). */
function commitBackbone(s: QuizState): QuizState {
  s = act(s, { type: 'OPEN_CASE', caseId: 'c' })
  s = act(s, { type: 'MAP_CASE', caseId: 'c', optionId: 'Y' })
  s = act(s, { type: 'OPEN_CASE', caseId: 'a' })
  s = act(s, { type: 'MAP_CASE', caseId: 'a', optionId: 'X' })
  s = act(s, { type: 'MAP_CASE', caseId: 'b', optionId: 'X' })
  return act(s, { type: 'COMMIT_DEPENDS' })
}

describe('quizReducer', () => {
  let s: QuizState
  beforeEach(() => { localStorage.clear(); s = initQuizState(questions) })

  it('a backbone question enters depends with nobody ranked and nobody open', () => {
    expect(s.index).toBe(0)
    expect(s.phase).toBe('depends')
    expect(s.draftRanking).toEqual([])
    expect(s.activeCaseId).toBeNull()
  })

  it('the order people are answered in becomes the ranking', () => {
    s = commitBackbone(s)
    expect(s.answers[0]).toEqual({
      questionId: 'q1', mode: 'depends', ranking: ['c', 'a', 'b'], mapping: { a: 'X', b: 'X', c: 'Y' },
    })
    expect(s.index).toBe(1)
    expect(s.phase).toBe('single') // q2 is flavor → single-tap
  })

  it('OPEN_CASE opens a person, and tapping them again closes it', () => {
    s = act(s, { type: 'OPEN_CASE', caseId: 'b' })
    expect(s.activeCaseId).toBe('b')
    s = act(s, { type: 'OPEN_CASE', caseId: 'b' })
    expect(s.activeCaseId).toBeNull()
  })

  it('after an answer nobody is open until the user picks who is next — except the last person', () => {
    s = act(s, { type: 'MAP_CASE', caseId: 'a', optionId: 'X' })
    expect(s.activeCaseId).toBeNull()
    s = act(s, { type: 'MAP_CASE', caseId: 'c', optionId: 'X' })
    expect(s.activeCaseId).toBe('b') // only b left → opened for them
  })

  it('re-answering someone changes the answer but keeps their place', () => {
    s = act(s, { type: 'MAP_CASE', caseId: 'b', optionId: 'X' })
    s = act(s, { type: 'MAP_CASE', caseId: 'a', optionId: 'X' })
    s = act(s, { type: 'MAP_CASE', caseId: 'b', optionId: 'Y' })
    expect(s.draftRanking).toEqual(['b', 'a'])
    expect(s.draftMapping.b).toBe('Y')
  })

  it('cannot commit until every case is answered', () => {
    s = act(s, { type: 'MAP_CASE', caseId: 'a', optionId: 'X' })
    expect(s.canCommit).toBe(false)
    expect(act(s, { type: 'COMMIT_DEPENDS' }).index).toBe(0)
  })

  it('ignores answers for cases that are not on this question', () => {
    expect(act(s, { type: 'MAP_CASE', caseId: 'zzz', optionId: 'X' })).toBe(s)
  })

  it('FILL_ALL gives everyone one answer and ranks the rest after those already answered', () => {
    s = act(s, { type: 'MAP_CASE', caseId: 'c', optionId: 'Y' })
    s = act(s, { type: 'FILL_ALL', optionId: 'X' })
    expect(s.draftMapping).toEqual({ a: 'X', b: 'X', c: 'X' })
    expect(s.draftRanking).toEqual(['c', 'a', 'b'])
    expect(s.canCommit).toBe(true)
  })

  it('RESET_DEPENDS starts the question over', () => {
    s = act(s, { type: 'MAP_CASE', caseId: 'c', optionId: 'Y' })
    s = act(s, { type: 'RESET_DEPENDS' })
    expect(s.draftRanking).toEqual([])
    expect(s.draftMapping).toEqual({})
  })

  it('a flavor question is single-tap and records a single answer', () => {
    s = commitBackbone(s)
    s = act(s, { type: 'ANSWER_SINGLE', optionId: 'Z' })
    expect(s.answers[1]).toEqual({ questionId: 'q2', mode: 'single', optionId: 'Z' })
    expect(s.index).toBe(2)
    expect(s.phase).toBe('done')
  })

  it('START_DEPENDS promotes a flavor question to depends; CANCEL_DEPENDS returns to single-tap', () => {
    s = commitBackbone(s)
    s = act(s, { type: 'START_DEPENDS' })
    expect(s.phase).toBe('depends')
    expect(s.draftRanking).toEqual([])
    s = act(s, { type: 'CANCEL_DEPENDS' })
    expect(s.phase).toBe('single')
  })

  it('GO_BACK restores a prior depends answer, ranking included', () => {
    s = commitBackbone(s)
    s = act(s, { type: 'GO_BACK' })
    expect(s.index).toBe(0)
    expect(s.phase).toBe('depends')
    expect(s.draftRanking).toEqual(['c', 'a', 'b'])
    expect(s.draftMapping).toEqual({ a: 'X', b: 'X', c: 'Y' })
    expect(s.canCommit).toBe(true)
  })

  it('GO_BACK at the first question is a no-op', () => {
    expect(act(s, { type: 'GO_BACK' }).index).toBe(0)
  })

  it('GO_BACK to a single (flavor) answer preselects the prior option', () => {
    s = commitBackbone(s)
    s = act(s, { type: 'ANSWER_SINGLE', optionId: 'Z' })
    s = act(s, { type: 'GO_BACK' })
    expect(s.index).toBe(1)
    expect(s.phase).toBe('single')
    expect(s.selectedOptionId).toBe('Z')
  })

  it('persists answers + index + questionIds and resumes at the saved index', () => {
    s = commitBackbone(s)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.answers).toHaveLength(1)
    expect(stored.index).toBe(1)
    expect(stored.questionIds).toEqual(['q1', 'q2'])
    const reloaded = initQuizState(questions)
    expect(reloaded.index).toBe(1)
    expect(reloaded.phase).toBe('single')
  })
})
