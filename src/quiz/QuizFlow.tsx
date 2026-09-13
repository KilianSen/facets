import { useEffect, useRef } from 'react'
import { ChevronLeft, Send } from 'lucide-react'
import type { Answer, Question } from '../engine/types'
import { useQuizState } from './useQuizState'
import { QuestionCard } from './QuestionCard'
import { ScenarioCard } from './ScenarioCard'
import { Reveal } from '../ui/Reveal'

const ring = 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-black'

function getCheerleading(index: number, total: number) {
  const pct = index / total
  if (pct === 0) return 'Calibrating…'
  if (pct < 0.25) return 'Warming up'
  if (pct < 0.5) return 'Building signal'
  if (pct < 0.75) return 'Pattern locked'
  if (pct < 1) return 'Near convergence'
  return 'Final stretch'
}

export function QuizFlow({
  questions,
  onComplete,
  minIndex = 0,
}: {
  questions: Question[]
  onComplete: (answers: Answer[]) => void
  /** Floor for the Back button — set to the first appended sharpen item so base answers can't be edited mid-sharpen. */
  minIndex?: number
}) {
  const { state, dispatch } = useQuizState(questions)
  const completed = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const continueRef = useRef<HTMLButtonElement>(null)

  function commit() {
    dispatch({ type: 'COMMIT_DEPENDS' })
  }

  useEffect(() => {
    if (state.phase === 'done' && !completed.current) {
      completed.current = true
      onComplete(state.answers)
    }
  }, [state.phase, state.answers, onComplete])

  // Focus the prompt on each new question / phase change (keyboard + screen-reader orientation).
  useEffect(() => {
    headingRef.current?.focus()
  }, [state.index, state.phase])

  // Desktop keyboard input: number keys pick an option (advancing stepper in depends mode); Enter continues.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cur = questions[state.index]
      if (!cur) return
      const active = document.activeElement
      const tag = (active?.tagName ?? '').toLowerCase()
      const n = Number(e.key)

      if (state.phase === 'single') {
        if (tag === 'button' || tag === 'a') return
        if (Number.isInteger(n) && n >= 1 && n <= cur.options.length) {
          e.preventDefault()
          dispatch({ type: 'ANSWER_SINGLE', optionId: cur.options[n - 1].id })
        }
      } else if (state.phase === 'depends') {
        if (e.key === 'Enter' && state.canCommit) {
          if (active !== continueRef.current) {
            e.preventDefault()
            commit()
          }
        } else if (tag !== 'button' && tag !== 'a' && cur.cases) {
          const activeCase = cur.cases[state.caseIndex]
          if (Number.isInteger(n) && n >= 1 && n <= cur.options.length && activeCase) {
            e.preventDefault()
            dispatch({ type: 'MAP_CASE', caseId: activeCase.id, optionId: cur.options[n - 1].id })
          }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.index, state.caseIndex, state.canCommit, questions])

  if (state.phase === 'done') return null
  const current = questions[state.index]
  if (!current) return null
  const total = questions.length

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0c15] text-white">
      {/* 1. Compact Header with Hairline Progress */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0c15]/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-2.5">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => dispatch({ type: 'GO_BACK' })}
            disabled={state.index <= minIndex}
            className={`flex items-center gap-1 rounded-md py-1 px-2.5 font-mono text-xs uppercase tracking-wider text-neutral-400 hover:text-white bg-white/[0.03] border border-white/15 hover:border-white/30 transition-all disabled:opacity-0 ${ring}`}
          >
            <ChevronLeft className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Back</span>
          </button>

          {/* Question Counter (preserves exact text Question X of Y for tests) */}
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-300">
            Question {state.index + 1} of {total}
          </span>

          {/* Cheerleading Status */}
          <span className="hidden sm:inline-block font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            {getCheerleading(state.index, total)}
          </span>
        </div>

        {/* Razor Hairline Progress Bar */}
        <div
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={state.index}
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10"
        >
          <div
            className="h-full bg-white transition-[width] duration-200 ease-out"
            style={{ width: `${Math.max(5, (state.index / total) * 100)}%` }}
          />
        </div>
      </header>

      {/* 2. Main Question Viewport */}
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-lg px-4 py-4 md:py-6">
          <Reveal key={`q-${state.index}-${state.phase}`} className="flex flex-col gap-4">
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
              <ScenarioCard
                prompt={current.prompt}
                headingRef={headingRef}
                cases={current.cases}
                options={current.options}
                mapping={state.draftMapping}
                caseIndex={state.caseIndex}
                onMap={(caseId, optionId) => dispatch({ type: 'MAP_CASE', caseId, optionId })}
                onSetCaseIndex={caseIndex => dispatch({ type: 'SET_CASE_INDEX', caseIndex })}
                onFillAll={optionId => dispatch({ type: 'FILL_ALL', optionId })}
              />
            )}
          </Reveal>
        </div>
      </main>

      {/* 3. Footer for Depends Phase */}
      {state.phase === 'depends' && current.cases && (
        <footer
          className="sticky bottom-0 z-20 border-t border-white/10 bg-[#0b0c15]/95 backdrop-blur-md"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-2.5">
            {current.kind === 'flavor' ? (
              <button
                type="button"
                onClick={() => dispatch({ type: 'CANCEL_DEPENDS' })}
                className={`font-mono text-xs uppercase tracking-wider text-neutral-400 hover:text-white transition-colors ${ring}`}
              >
                ← Single response
              </button>
            ) : (
              <span className="hidden text-xs font-mono uppercase tracking-wider text-neutral-400 [@media(pointer:fine)]:inline">
                Press ⏎ when all contexts mapped
              </span>
            )}

            <button
              ref={continueRef}
              type="button"
              onClick={commit}
              disabled={!state.canCommit}
              className={`flex items-center gap-1.5 rounded-lg bg-white text-black font-mono text-xs font-bold uppercase tracking-widest px-5 py-2 border border-white transition-all enabled:hover:bg-neutral-200 active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed ${ring}`}
            >
              <span>Continue</span>
              <Send className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
