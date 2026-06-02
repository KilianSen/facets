import { useEffect, useRef, useState } from 'react'
import type { Answer, Question } from '../engine/types'
import { useQuizState } from './useQuizState'
import { QuestionCard } from './QuestionCard'
import { DependsCard } from './DependsCard'
import { Coachmark } from './Coachmark'
import { Reveal } from '../ui/Reveal'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'
const COACH_KEY = 'fptic.coach.v1'

export function QuizFlow({ questions, onComplete }: { questions: Question[]; onComplete: (answers: Answer[]) => void }) {
  const { state, dispatch } = useQuizState(questions)
  const completed = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const continueRef = useRef<HTMLButtonElement>(null)
  const [coachSeen, setCoachSeen] = useState(() => {
    try { return localStorage.getItem(COACH_KEY) === '1' } catch { return false }
  })

  function dismissCoach() {
    try { localStorage.setItem(COACH_KEY, '1') } catch { /* ignore */ }
    setCoachSeen(true)
  }
  function commit() {
    dispatch({ type: 'COMMIT_DEPENDS' })
    if (!coachSeen) dismissCoach()
  }

  useEffect(() => {
    if (state.phase === 'done' && !completed.current) {
      completed.current = true
      onComplete(state.answers)
    }
  }, [state.phase, state.answers, onComplete])

  // Focus the prompt on each new question / phase change (keyboard + screen-reader orientation).
  useEffect(() => { headingRef.current?.focus() }, [state.index, state.phase])

  // Desktop keyboard input: number keys pick a flavor option; Enter continues a completed backbone.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cur = questions[state.index]
      if (!cur) return
      const active = document.activeElement
      const tag = (active?.tagName ?? '').toLowerCase()
      if (state.phase === 'single') {
        // Don't steal a digit from a focused control (Back / ＋ It depends / an option).
        if (tag === 'button' || tag === 'a') return
        const n = Number(e.key)
        if (Number.isInteger(n) && n >= 1 && n <= cur.options.length) {
          e.preventDefault()
          dispatch({ type: 'ANSWER_SINGLE', optionId: cur.options[n - 1].id })
        }
      } else if (state.phase === 'depends' && e.key === 'Enter' && state.canCommit) {
        // Commit from anywhere except the Continue button itself (it activates natively).
        if (active !== continueRef.current) { e.preventDefault(); commit() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.index, state.canCommit, coachSeen, questions])

  if (state.phase === 'done') return null
  const current = questions[state.index]
  if (!current) return null
  const total = questions.length
  const containerW = state.phase === 'depends' ? 'md:max-w-3xl' : 'md:max-w-xl'

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/80 backdrop-blur">
        <div className={`mx-auto flex w-full max-w-md ${containerW} flex-col gap-2 px-5 py-3`}>
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
            <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(state.index / total) * 100}%` }} />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className={`mx-auto w-full max-w-md ${containerW} px-5 py-8`}>
          <Reveal key={`q-${state.index}-${state.phase}`} className="flex flex-col gap-5">
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
              <>
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
                />
              </>
            )}
          </Reveal>
        </div>
      </main>

      {state.phase === 'depends' && current.cases && (
        <footer className="sticky bottom-0 z-20 border-t border-white/5 bg-ink/80 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className={`mx-auto flex w-full max-w-md ${containerW} items-center justify-between gap-3 px-5 py-3`}>
            {current.kind === 'flavor'
              ? (
                <button type="button" onClick={() => dispatch({ type: 'CANCEL_DEPENDS' })} className={`rounded text-xs text-white/40 transition-colors hover:text-white/70 ${ring}`}>
                  ← just give one answer
                </button>
              )
              : <span className="hidden text-xs text-white/30 [@media(pointer:fine)]:inline">press ⏎ when done</span>}
            <button
              ref={continueRef}
              type="button"
              onClick={commit}
              disabled={!state.canCommit}
              className={`rounded-xl bg-accent/20 px-5 py-2.5 text-sm font-medium text-accent-soft transition-colors enabled:hover:bg-accent/30 disabled:opacity-40 ${ring}`}
            >
              Continue
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
