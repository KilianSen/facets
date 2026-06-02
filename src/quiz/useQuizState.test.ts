import { describe, it, expect, beforeEach } from 'vitest'
import { quizReducer, initQuizState, STORAGE_KEY, type QuizState } from './useQuizState'
import type { Question } from '../engine/types'

const q1: Question = {
  id: 'q1', prompt: 'p1', kind: 'backbone', axis: 'closeness',
  cases: [{ id: 'a', label: 'A', axisLevel: 1 }, { id: 'b', label: 'B', axisLevel: 0 }],
  options: [{ id: 'X', label: 'x', vector: {} }, { id: 'Y', label: 'y', vector: {} }],
}
const q2: Question = { id: 'q2', prompt: 'p2', kind: 'flavor', options: [{ id: 'Z', label: 'z', vector: {} }] }
const questions = [q1, q2]

describe('quizReducer', () => {
  let s: QuizState
  beforeEach(() => { localStorage.clear(); s = initQuizState(questions) })

  it('starts at question 0 in question phase', () => {
    expect(s.index).toBe(0)
    expect(s.phase).toBe('question')
  })

  it('records a single answer and advances', () => {
    s = quizReducer(s, { type: 'ANSWER_SINGLE', optionId: 'X' }, questions)
    expect(s.answers[0]).toEqual({ questionId: 'q1', mode: 'single', optionId: 'X' })
    expect(s.index).toBe(1)
    expect(s.phase).toBe('question')
  })

  it('runs the depends flow: rank → map all cases → commit advances', () => {
    s = quizReducer(s, { type: 'START_DEPENDS' }, questions)
    expect(s.phase).toBe('ranking')
    s = quizReducer(s, { type: 'SET_RANKING', ranking: ['b', 'a'] }, questions)
    expect(s.phase).toBe('mapping')
    s = quizReducer(s, { type: 'MAP_CASE', caseId: 'b', optionId: 'Y' }, questions)
    s = quizReducer(s, { type: 'MAP_CASE', caseId: 'a', optionId: 'X' }, questions)
    expect(s.canCommit).toBe(true)
    s = quizReducer(s, { type: 'COMMIT_DEPENDS' }, questions)
    expect(s.answers[0]).toEqual({ questionId: 'q1', mode: 'depends', ranking: ['b', 'a'], mapping: { b: 'Y', a: 'X' } })
    expect(s.index).toBe(1)
  })

  it('cannot commit until all cases are mapped', () => {
    s = quizReducer(s, { type: 'START_DEPENDS' }, questions)
    s = quizReducer(s, { type: 'SET_RANKING', ranking: ['a', 'b'] }, questions)
    s = quizReducer(s, { type: 'MAP_CASE', caseId: 'a', optionId: 'X' }, questions)
    expect(s.canCommit).toBe(false)
  })

  it('reaches done phase after the last question', () => {
    s = quizReducer(s, { type: 'ANSWER_SINGLE', optionId: 'X' }, questions)
    s = quizReducer(s, { type: 'ANSWER_SINGLE', optionId: 'Z' }, questions)
    expect(s.phase).toBe('done')
  })

  it('persists answers to localStorage and reloads them', () => {
    s = quizReducer(s, { type: 'ANSWER_SINGLE', optionId: 'X' }, questions)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).answers).toHaveLength(1)
    const reloaded = initQuizState(questions)
    expect(reloaded.answers).toHaveLength(1)
    expect(reloaded.index).toBe(1)
  })
})
