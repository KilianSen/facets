import { useEffect, useRef } from 'react'
import type { Answer, Question } from '../engine/types'
import { useQuizState } from './useQuizState'
import { QuestionCard } from './QuestionCard'
import { DependsRanker } from './DependsRanker'
import { CaseMapper } from './CaseMapper'

export function QuizFlow({ questions, onComplete }: { questions: Question[]; onComplete: (answers: Answer[]) => void }) {
  const { state, dispatch } = useQuizState(questions)
  const completed = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (state.phase === 'done' && !completed.current) {
      completed.current = true
      onComplete(state.answers)
    }
  }, [state.phase, state.answers, onComplete])

  // Move focus to the prompt when a new question begins, so keyboard / screen-reader
  // users land on the new question instead of being stranded.
  useEffect(() => {
    headingRef.current?.focus()
  }, [state.index])

  if (state.phase === 'done') return null
  const current = questions[state.index]
  if (!current) return null

  const total = questions.length

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium tabular-nums text-white/50">
          Question {state.index + 1} of {total}
        </span>
        <div
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={state.index}
          className="h-1 w-full overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full bg-sky-400 transition-[width] duration-300"
            style={{ width: `${(state.index / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Single-tap fallback (only for case-less questions; none in production today). */}
      {state.phase === 'question' && (
        <QuestionCard
          question={current}
          onSingle={optionId => dispatch({ type: 'ANSWER_SINGLE', optionId })}
          onDepends={() => dispatch({ type: 'START_DEPENDS' })}
        />
      )}

      {state.phase === 'ranking' && current.cases && (
        <div className="flex flex-col gap-5">
          <h2 ref={headingRef} tabIndex={-1} className="text-lg font-medium text-white focus-visible:outline-none">{current.prompt}</h2>
          <DependsRanker cases={current.cases} onConfirm={ranking => dispatch({ type: 'SET_RANKING', ranking })} />
        </div>
      )}

      {state.phase === 'mapping' && current.cases && (
        <div className="flex flex-col gap-5">
          <h2 ref={headingRef} tabIndex={-1} className="text-lg font-medium text-white focus-visible:outline-none">{current.prompt}</h2>
          <CaseMapper
            cases={current.cases}
            options={current.options}
            mapping={state.draftMapping}
            onMap={(caseId, optionId) => dispatch({ type: 'MAP_CASE', caseId, optionId })}
            canCommit={state.canCommit}
            onCommit={() => dispatch({ type: 'COMMIT_DEPENDS' })}
          />
        </div>
      )}
    </div>
  )
}
