import { useReducer } from 'react'
import type { Answer, Case, Question } from '../engine/types'

export const STORAGE_KEY = 'fptic.quiz.v1'

export type QuizPhase = 'single' | 'depends' | 'done'

export interface QuizState {
  index: number
  phase: QuizPhase
  answers: Answer[]
  /**
   * Depends: case ids in the order the user answered them. That order IS the ranking (most-true
   * first) — people start with whoever the situation is most true for, so no separate rank step.
   */
  draftRanking: string[]
  draftMapping: Record<string, string>
  /** Depends: the case currently open for answering; null = let the user pick who's next. */
  activeCaseId: string | null
  canCommit: boolean
  /** prior single-tap choice to preselect when returning to a flavor question via Back */
  selectedOptionId?: string
}

export type QuizAction =
  | { type: 'ANSWER_SINGLE'; optionId: string }
  | { type: 'START_DEPENDS' }
  | { type: 'CANCEL_DEPENDS' }
  | { type: 'OPEN_CASE'; caseId: string }
  | { type: 'MAP_CASE'; caseId: string; optionId: string }
  | { type: 'FILL_ALL'; optionId: string }
  | { type: 'RESET_DEPENDS' }
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

const EMPTY_DRAFT = { draftRanking: [] as string[], draftMapping: {} as Record<string, string>, activeCaseId: null, canCommit: false }

/** With exactly one person left, open them automatically — their place in the ranking is already decided. */
function nextOpen(cases: Case[], mapping: Record<string, string>): string | null {
  const left = cases.filter(c => mapping[c.id] === undefined)
  return left.length === 1 ? left[0].id : null
}

function dependsDraft(q: Question, ranking: string[] = [], mapping: Record<string, string> = {}) {
  const cases = q.cases ?? []
  return {
    draftRanking: ranking,
    draftMapping: mapping,
    activeCaseId: nextOpen(cases, mapping),
    canCommit: cases.length > 0 && cases.every(c => mapping[c.id] !== undefined),
  }
}

function phaseFor(index: number, questions: Question[]): QuizPhase {
  if (index >= questions.length) return 'done'
  return questions[index].kind === 'backbone' ? 'depends' : 'single'
}

/** Fresh state for landing on `index`. */
function landOn(index: number, questions: Question[]): Omit<QuizState, 'answers'> {
  const phase = phaseFor(index, questions)
  const q = questions[index]
  if (phase === 'depends' && q?.cases) return { index, phase, ...dependsDraft(q), selectedOptionId: undefined }
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
  const hasCase = (id: string) => !!current?.cases?.some(c => c.id === id)

  switch (action.type) {
    case 'ANSWER_SINGLE':
      if (!current) return state
      return advance(state, { questionId: current.id, mode: 'single', optionId: action.optionId }, questions)

    case 'START_DEPENDS':
      if (!current?.cases) return state
      return { ...state, phase: 'depends', ...dependsDraft(current), selectedOptionId: undefined }

    case 'CANCEL_DEPENDS':
      // Only a promoted flavor question can collapse back to single-tap; backbone stays depends.
      if (current?.kind !== 'flavor') return state
      return { ...state, phase: 'single', ...EMPTY_DRAFT, selectedOptionId: undefined }

    case 'OPEN_CASE':
      if (state.phase !== 'depends' || !hasCase(action.caseId)) return state
      return { ...state, activeCaseId: state.activeCaseId === action.caseId ? null : action.caseId }

    case 'MAP_CASE': {
      if (state.phase !== 'depends' || !current || !hasCase(action.caseId)) return state
      const mapping = { ...state.draftMapping, [action.caseId]: action.optionId }
      // First answer for a case appends it to the ranking; re-answering keeps its place.
      const ranking = state.draftRanking.includes(action.caseId) ? state.draftRanking : [...state.draftRanking, action.caseId]
      return { ...state, ...dependsDraft(current, ranking, mapping) }
    }

    case 'FILL_ALL': {
      if (state.phase !== 'depends' || !current?.cases) return state
      const mapping: Record<string, string> = {}
      for (const c of current.cases) mapping[c.id] = action.optionId
      // Anyone not yet ranked follows the already-answered ones, in authored order.
      const ranking = [...state.draftRanking, ...current.cases.map(c => c.id).filter(id => !state.draftRanking.includes(id))]
      return { ...state, ...dependsDraft(current, ranking, mapping) }
    }

    case 'RESET_DEPENDS':
      if (state.phase !== 'depends' || !current?.cases) return state
      return { ...state, ...dependsDraft(current) }

    case 'COMMIT_DEPENDS': {
      if (!current?.cases || !state.canCommit) return state
      const ranking = [...state.draftRanking, ...current.cases.map(c => c.id).filter(id => !state.draftRanking.includes(id))]
      return advance(state, { questionId: current.id, mode: 'depends', ranking, mapping: state.draftMapping }, questions)
    }

    case 'GO_BACK': {
      if (state.index === 0) return state
      const index = state.index - 1
      const prev = questions[index]
      const prior = state.answers.find(a => a.questionId === prev.id)
      persist(state.answers, index, questions)
      if (prior && prior.mode === 'depends') {
        return { ...state, index, phase: 'depends', ...dependsDraft(prev, prior.ranking, prior.mapping), selectedOptionId: undefined }
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
