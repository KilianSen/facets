import { useReducer } from 'react'
import type { Answer, Question } from '../engine/types'

export const STORAGE_KEY = 'fptic.quiz.v1'

export type QuizPhase = 'single' | 'depends' | 'done'

export interface QuizState {
  index: number
  phase: QuizPhase
  answers: Answer[]
  draftRanking: string[]
  draftMapping: Record<string, string>
  caseIndex: number
  canCommit: boolean
  /** prior single-tap choice to preselect when returning to a flavor question via Back */
  selectedOptionId?: string
}

export type QuizAction =
  | { type: 'ANSWER_SINGLE'; optionId: string }
  | { type: 'START_DEPENDS' }
  | { type: 'CANCEL_DEPENDS' }
  | { type: 'SET_RANK_ORDER'; ranking: string[] }
  | { type: 'SET_CASE_INDEX'; caseIndex: number }
  | { type: 'MAP_CASE'; caseId: string; optionId: string; autoAdvance?: boolean }
  | { type: 'FILL_ALL'; optionId: string }
  | { type: 'COMMIT_DEPENDS' }
  | { type: 'GO_BACK' }

export interface StoredProgress { answers: Answer[]; index: number; questionIds: string[] }

function persist(answers: Answer[], index: number, questions: Question[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, index, questionIds: questions.map(q => q.id) }))
  } catch { /* ignore */ }
}

/** Read an in-progress run from storage (used by App to offer "Continue"). */
export function loadProgress(): StoredProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (Array.isArray(p.answers) && Array.isArray(p.questionIds)) {
      return { answers: p.answers, index: p.index ?? p.answers.length, questionIds: p.questionIds }
    }
  } catch { /* ignore */ }
  return null
}

const EMPTY_DRAFT = { draftRanking: [] as string[], draftMapping: {} as Record<string, string>, caseIndex: 0, canCommit: false }

function phaseFor(index: number, questions: Question[]): QuizPhase {
  if (index >= questions.length) return 'done'
  return questions[index].kind === 'backbone' ? 'depends' : 'single'
}

/** Fresh state for landing on `index` (default case order when it's a depends question). */
function landOn(index: number, questions: Question[]): Pick<QuizState, 'index' | 'phase' | 'draftRanking' | 'draftMapping' | 'caseIndex' | 'canCommit' | 'selectedOptionId'> {
  const phase = phaseFor(index, questions)
  const q = questions[index]
  if (phase === 'depends' && q?.cases) {
    return { index, phase, draftRanking: q.cases.map(c => c.id), draftMapping: {}, caseIndex: 0, canCommit: false, selectedOptionId: undefined }
  }
  return { index, phase, ...EMPTY_DRAFT, selectedOptionId: undefined }
}

function load(): { answers: Answer[]; index: number } {
  const p = loadProgress()
  return p ? { answers: p.answers, index: p.index } : { answers: [], index: 0 }
}

export function initQuizState(questions: Question[]): QuizState {
  const { answers, index } = load()
  return { answers, ...landOn(index, questions) }
}

function advance(state: QuizState, answer: Answer, questions: Question[]): QuizState {
  const answers = [...state.answers.filter(a => a.questionId !== answer.questionId), answer]
  const index = state.index + 1
  persist(answers, index, questions)
  return { ...state, answers, ...landOn(index, questions) }
}

export function quizReducer(state: QuizState, action: QuizAction, questions: Question[]): QuizState {
  const current = questions[state.index]
  switch (action.type) {
    case 'ANSWER_SINGLE':
      if (!current) return state
      return advance(state, { questionId: current.id, mode: 'single', optionId: action.optionId }, questions)

    case 'START_DEPENDS':
      if (!current?.cases) return state
      return { ...state, phase: 'depends', draftRanking: current.cases.map(c => c.id), draftMapping: {}, caseIndex: 0, canCommit: false, selectedOptionId: undefined }

    case 'CANCEL_DEPENDS':
      // Only a promoted flavor question can collapse back to single-tap; backbone stays depends.
      if (current?.kind !== 'flavor') return state
      return { ...state, phase: 'single', ...EMPTY_DRAFT, selectedOptionId: undefined }

    case 'SET_RANK_ORDER':
      if (state.phase !== 'depends') return state
      return { ...state, draftRanking: action.ranking }

    case 'SET_CASE_INDEX': {
      if (!current?.cases) return state
      const maxIdx = Math.max(0, current.cases.length - 1)
      const nextIdx = Math.max(0, Math.min(maxIdx, action.caseIndex))
      return { ...state, caseIndex: nextIdx }
    }

    case 'MAP_CASE': {
      if (!current?.cases) return state
      const draftMapping = { ...state.draftMapping, [action.caseId]: action.optionId }
      const canCommit = current.cases.every(c => draftMapping[c.id] !== undefined)
      const shouldAdvance = action.autoAdvance !== false && state.caseIndex < current.cases.length - 1
      const nextCaseIndex = shouldAdvance ? state.caseIndex + 1 : state.caseIndex
      return { ...state, draftMapping, canCommit, caseIndex: nextCaseIndex }
    }

    case 'FILL_ALL': {
      if (!current?.cases) return state
      const draftMapping: Record<string, string> = {}
      for (const c of current.cases) draftMapping[c.id] = action.optionId
      return { ...state, draftMapping, canCommit: true }
    }

    case 'COMMIT_DEPENDS': {
      if (!current?.cases || !state.canCommit) return state
      return advance(state, {
        questionId: current.id, mode: 'depends',
        ranking: state.draftRanking, mapping: state.draftMapping,
      }, questions)
    }

    case 'GO_BACK': {
      if (state.index === 0) return state
      const index = state.index - 1
      const prev = questions[index]
      const prior = state.answers.find(a => a.questionId === prev.id)
      persist(state.answers, index, questions)
      if (prior && prior.mode === 'depends') {
        const canCommit = prev.cases ? prev.cases.every(c => prior.mapping[c.id] !== undefined) : false
        return { ...state, index, phase: 'depends', draftRanking: prior.ranking, draftMapping: prior.mapping, caseIndex: 0, canCommit, selectedOptionId: undefined }
      }
      return { ...state, ...landOn(index, questions), selectedOptionId: prior && prior.mode === 'single' ? prior.optionId : undefined }
    }

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
