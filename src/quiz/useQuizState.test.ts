import { describe, it, expect, beforeEach } from 'vitest'
import { quizReducer, initQuizState, STORAGE_KEY, type QuizState } from './useQuizState'
import type { Question } from '../engine/types'

const backbone: Question = {
  id: 'q1', prompt: 'p1', kind: 'backbone', axis: 'closeness',
  cases: [{ id: 'a', label: 'A', axisLevel: 1 }, { id: 'b', label: 'B', axisLevel: 0 }],
  options: [{ id: 'X', label: 'x', vector: {} }, { id: 'Y', label: 'y', vector: {} }],
}
// Production flavor questions still carry cases (for the optional "+ It depends").
const flavor: Question = {
  id: 'q2', prompt: 'p2', kind: 'flavor', axis: 'stakes',
  cases: [{ id: 'c', label: 'C', axisLevel: 1 }, { id: 'd', label: 'D', axisLevel: 0 }],
  options: [{ id: 'Z', label: 'z', vector: {} }, { id: 'W', label: 'w', vector: {} }],
}
const questions = [backbone, flavor]

function commitBackbone(s: QuizState): QuizState {
  s = quizReducer(s, { type: 'SET_RANK_ORDER', ranking: ['b', 'a'] }, questions)
  s = quizReducer(s, { type: 'MAP_CASE', caseId: 'a', optionId: 'X' }, questions)
  s = quizReducer(s, { type: 'MAP_CASE', caseId: 'b', optionId: 'Y' }, questions)
  return quizReducer(s, { type: 'COMMIT_DEPENDS' }, questions)
}

describe('quizReducer', () => {
  let s: QuizState
  beforeEach(() => { localStorage.clear(); s = initQuizState(questions) })

  it('a backbone question enters the folded depends phase with the default case order', () => {
    expect(s.index).toBe(0)
    expect(s.phase).toBe('depends')
    expect(s.draftRanking).toEqual(['a', 'b'])
  })

  it('depends flow: reorder + map all cases + commit advances to the next question', () => {
    s = quizReducer(s, { type: 'SET_RANK_ORDER', ranking: ['b', 'a'] }, questions)
    expect(s.phase).toBe('depends') // no separate ranking screen — still folded
    s = quizReducer(s, { type: 'MAP_CASE', caseId: 'a', optionId: 'X' }, questions)
    s = quizReducer(s, { type: 'MAP_CASE', caseId: 'b', optionId: 'Y' }, questions)
    expect(s.canCommit).toBe(true)
    s = quizReducer(s, { type: 'COMMIT_DEPENDS' }, questions)
    expect(s.answers[0]).toEqual({ questionId: 'q1', mode: 'depends', ranking: ['b', 'a'], mapping: { a: 'X', b: 'Y' } })
    expect(s.index).toBe(1)
    expect(s.phase).toBe('single') // q2 is flavor → single-tap
  })

  it('cannot commit until every case is mapped', () => {
    s = quizReducer(s, { type: 'MAP_CASE', caseId: 'a', optionId: 'X' }, questions)
    expect(s.canCommit).toBe(false)
  })

  it('FILL_ALL assigns one response to every case', () => {
    s = quizReducer(s, { type: 'FILL_ALL', optionId: 'X' }, questions)
    expect(s.draftMapping).toEqual({ a: 'X', b: 'X' })
    expect(s.canCommit).toBe(true)
  })

  it('a flavor question is single-tap and records a single answer', () => {
    s = commitBackbone(s)
    expect(s.phase).toBe('single')
    s = quizReducer(s, { type: 'ANSWER_SINGLE', optionId: 'Z' }, questions)
    expect(s.answers[1]).toEqual({ questionId: 'q2', mode: 'single', optionId: 'Z' })
    expect(s.index).toBe(2)
    expect(s.phase).toBe('done')
  })

  it('START_DEPENDS promotes a flavor question to the folded depends phase', () => {
    s = commitBackbone(s)
    s = quizReducer(s, { type: 'START_DEPENDS' }, questions)
    expect(s.phase).toBe('depends')
    expect(s.draftRanking).toEqual(['c', 'd'])
  })

  it('GO_BACK restores a prior depends answer for editing', () => {
    s = commitBackbone(s) // now at q2
    s = quizReducer(s, { type: 'GO_BACK' }, questions)
    expect(s.index).toBe(0)
    expect(s.phase).toBe('depends')
    expect(s.draftRanking).toEqual(['b', 'a'])
    expect(s.draftMapping).toEqual({ a: 'X', b: 'Y' })
    expect(s.canCommit).toBe(true)
  })

  it('GO_BACK at the first question is a no-op', () => {
    s = quizReducer(s, { type: 'GO_BACK' }, questions)
    expect(s.index).toBe(0)
  })

  it('GO_BACK to a single (flavor) answer preselects the prior option', () => {
    s = commitBackbone(s) // at q2 (flavor, single)
    s = quizReducer(s, { type: 'ANSWER_SINGLE', optionId: 'Z' }, questions) // done
    s = quizReducer(s, { type: 'GO_BACK' }, questions)
    expect(s.index).toBe(1)
    expect(s.phase).toBe('single')
    expect(s.selectedOptionId).toBe('Z')
  })

  it('CANCEL_DEPENDS returns a promoted flavor question to single-tap', () => {
    s = commitBackbone(s) // at q2 (flavor, single)
    s = quizReducer(s, { type: 'START_DEPENDS' }, questions)
    expect(s.phase).toBe('depends')
    s = quizReducer(s, { type: 'CANCEL_DEPENDS' }, questions)
    expect(s.phase).toBe('single')
  })

  it('tracks caseIndex and advances automatically on MAP_CASE', () => {
    expect(s.caseIndex).toBe(0)
    s = quizReducer(s, { type: 'MAP_CASE', caseId: 'a', optionId: 'X' }, questions)
    expect(s.caseIndex).toBe(1)
    s = quizReducer(s, { type: 'SET_CASE_INDEX', caseIndex: 0 }, questions)
    expect(s.caseIndex).toBe(0)
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
