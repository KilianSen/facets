import { useEffect, useRef, useState } from 'react'
import type { Answer, Question } from '../engine/types'
import { useQuizState } from './useQuizState'
import { QuestionCard } from './QuestionCard'
import { DependsCard } from './DependsCard'
import { Coachmark } from './Coachmark'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950'
const COACH_KEY = 'fptic.coach.v1'

export function QuizFlow({ questions, onComplete }: { questions: Question[]; onComplete: (answers: Answer[]) => void }) {
  const { state, dispatch } = useQuizState(questions)
  const completed = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [coachSeen, setCoachSeen] = useState(() => {
    try { return localStorage.getItem(COACH_KEY) === '1' } catch { return false }
  })

  function dismissCoach() {
    try { localStorage.setItem(COACH_KEY, '1') } catch { /* ignore */ }
    setCoachSeen(true)
  }

  useEffect(() => {
    if (state.phase === 'done' && !completed.current) {
      completed.current = true
      onComplete(state.answers)
    }
  }, [state.phase, state.answers, onComplete])

  // Move focus to the prompt when the question OR phase changes (e.g. promoting a flavor
  // question to depends), so keyboard / screen-reader users aren't stranded on <body>.
  useEffect(() => { headingRef.current?.focus() }, [state.index, state.phase])

  if (state.phase === 'done') return null
  const current = questions[state.index]
  if (!current) return null
  const total = questions.length

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => dispatch({ type: 'GO_BACK' })}
            disabled={state.index === 0}
            className={`rounded text-xs text-white/50 transition-colors enabled:hover:text-white disabled:opacity-0 ${ring}`}
          >
            ← Back
          </button>
          <span className="text-xs font-medium tabular-nums text-white/50">Question {state.index + 1} of {total}</span>
        </div>
        <div
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={state.index}
          className="h-1 w-full overflow-hidden rounded-full bg-white/10"
        >
          <div className="h-full rounded-full bg-sky-400 transition-[width] duration-300" style={{ width: `${(state.index / total) * 100}%` }} />
        </div>
      </div>

      {state.phase === 'single' && (
        <QuestionCard
          question={current}
          headingRef={headingRef}
          selectedId={state.selectedOptionId}
          onSingle={optionId => dispatch({ type: 'ANSWER_SINGLE', optionId })}
          onDepends={() => dispatch({ type: 'START_DEPENDS' })}
        />
      )}

      {state.phase === 'depends' && current.cases && (
        <div className="flex flex-col gap-5">
          <h2 ref={headingRef} tabIndex={-1} className="text-lg font-medium text-white focus-visible:outline-none">{current.prompt}</h2>
          {!coachSeen && <Coachmark onDismiss={dismissCoach} />}
          <DependsCard
            cases={current.cases}
            options={current.options}
            ranking={state.draftRanking}
            mapping={state.draftMapping}
            onReorder={ranking => dispatch({ type: 'SET_RANK_ORDER', ranking })}
            onMap={(caseId, optionId) => dispatch({ type: 'MAP_CASE', caseId, optionId })}
            onFillAll={optionId => dispatch({ type: 'FILL_ALL', optionId })}
            canCommit={state.canCommit}
            onCommit={() => { dispatch({ type: 'COMMIT_DEPENDS' }); if (!coachSeen) dismissCoach() }}
          />
          {current.kind === 'flavor' && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'CANCEL_DEPENDS' })}
              className={`self-start text-xs text-white/40 transition-colors hover:text-white/70 ${ring}`}
            >
              ← just give one answer
            </button>
          )}
        </div>
      )}
    </div>
  )
}
