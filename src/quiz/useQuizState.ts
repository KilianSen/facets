import { useReducer } from 'react'
import type { Answer, Question } from '../engine/types'

export const STORAGE_KEY = 'fptic.quiz.v1'

export type QuizPhase = 'question' | 'ranking' | 'mapping' | 'done'

export interface QuizState {
  index: number
  phase: QuizPhase
  answers: Answer[]
  draftRanking: string[]
  draftMapping: Record<string, string>
  canCommit: boolean
}

export type QuizAction =
  | { type: 'ANSWER_SINGLE'; optionId: string }
  | { type: 'START_DEPENDS' }
  | { type: 'SET_RANKING'; ranking: string[] }
  | { type: 'MAP_CASE'; caseId: string; optionId: string }
  | { type: 'COMMIT_DEPENDS' }
  | { type: 'RESET' }

function persist(answers: Answer[], index: number): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, index })) } catch { /* ignore */ }
}

function load(): { answers: Answer[]; index: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.answers)) return { answers: parsed.answers, index: parsed.index ?? parsed.answers.length }
    }
  } catch { /* ignore */ }
  return { answers: [], index: 0 }
}

function freshDraft(): Pick<QuizState, 'draftRanking' | 'draftMapping' | 'canCommit'> {
  return { draftRanking: [], draftMapping: {}, canCommit: false }
}

function phaseFor(index: number, questions: Question[]): QuizPhase {
  if (index >= questions.length) return 'done'
  // Every production question is conditional → go straight to the rank/map flow.
  // Case-less questions (none in production) fall back to the single-tap phase.
  return questions[index].cases ? 'ranking' : 'question'
}

export function initQuizState(questions: Question[]): QuizState {
  const { answers, index } = load()
  return { index, phase: phaseFor(index, questions), answers, ...freshDraft() }
}

function advance(state: QuizState, answer: Answer, questions: Question[]): QuizState {
  const answers = [...state.answers.filter(a => a.questionId !== answer.questionId), answer]
  const index = state.index + 1
  persist(answers, index)
  return { ...state, answers, index, phase: phaseFor(index, questions), ...freshDraft() }
}

export function quizReducer(state: QuizState, action: QuizAction, questions: Question[]): QuizState {
  const current = questions[state.index]
  switch (action.type) {
    case 'ANSWER_SINGLE':
      if (!current) return state
      return advance(state, { questionId: current.id, mode: 'single', optionId: action.optionId }, questions)

    case 'START_DEPENDS':
      if (!current?.cases) return state
      return { ...state, phase: 'ranking', ...freshDraft() }

    case 'SET_RANKING':
      if (state.phase !== 'ranking') return state
      return { ...state, phase: 'mapping', draftRanking: action.ranking }

    case 'MAP_CASE': {
      if (!current?.cases) return state
      const draftMapping = { ...state.draftMapping, [action.caseId]: action.optionId }
      const canCommit = current.cases.every(c => draftMapping[c.id] !== undefined)
      return { ...state, draftMapping, canCommit }
    }

    case 'COMMIT_DEPENDS': {
      if (!current?.cases || !state.canCommit) return state
      return advance(state, {
        questionId: current.id, mode: 'depends',
        ranking: state.draftRanking, mapping: state.draftMapping,
      }, questions)
    }

    case 'RESET':
      persist([], 0)
      return { index: 0, phase: phaseFor(0, questions), answers: [], ...freshDraft() }

    default:
      return state
  }
}

/** React hook wrapper binding the reducer to the question list. */
export function useQuizState(questions: Question[]) {
  const [state, rawDispatch] = useReducer(
    (s: QuizState, a: QuizAction) => quizReducer(s, a, questions),
    questions,
    initQuizState,
  )
  return { state, dispatch: rawDispatch }
}
