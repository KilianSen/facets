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
  const containerW = state.phase === 'depends' ? 'md:max-w-2xl' : 'md:max-w-xl'

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0c15] text-white">
      {/* 1. Header with Brutal Minimalist Progress */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0c15]/95 backdrop-blur-md">
        <div className={`mx-auto flex w-full max-w-md ${containerW} flex-col gap-3 px-5 py-4`}>
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => dispatch({ type: 'GO_BACK' })}
              disabled={state.index <= minIndex}
              className={`flex items-center gap-1.5 rounded-lg py-1.5 px-3 font-mono text-xs uppercase tracking-wider text-neutral-400 hover:text-white bg-white/[0.03] border border-white/15 hover:border-white/30 transition-all disabled:opacity-0 ${ring}`}
            >
              <ChevronLeft className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Back</span>
            </button>

            {/* Question Counter (preserves exact text Question X of Y for tests) */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-300">
                Question {state.index + 1} of {total}
              </span>
            </div>

            {/* Cheerleading Status */}
            <span className="hidden sm:inline-block font-mono text-[11px] uppercase tracking-wider text-neutral-400">
              {getCheerleading(state.index, total)}
            </span>
          </div>

          {/* Razor-Thin Minimalist Progress Bar */}
          <div
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={state.index}
            className="h-1 w-full overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full bg-white transition-[width] duration-300 ease-out"
              style={{ width: `${Math.max(5, (state.index / total) * 100)}%` }}
            />
          </div>
        </div>
      </header>

      {/* 2. Main Question Card Viewport */}
      <main className="flex flex-1 flex-col">
        <div className={`mx-auto w-full max-w-md ${containerW} px-5 py-8`}>
          <Reveal key={`q-${state.index}-${state.phase}`} className="flex flex-col gap-6">
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
                {/* Refined Dilemma Prompt Card */}
                <div className="rounded-2xl border border-white/10 bg-[#111114] p-6 md:p-8 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-neutral-400">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>The Dilemma // Context Breakdown</span>
                    </span>
                    <span className="text-neutral-500">Multi-facet</span>
                  </div>
                  <h2
                    ref={headingRef}
                    tabIndex={-1}
                    className="font-editorial text-xl md:text-2xl font-normal leading-relaxed text-neutral-100 focus-visible:outline-none"
                  >
                    {current.prompt}
                  </h2>
                </div>

                {/* Scenario Stepper Card */}
                <ScenarioCard
                  cases={current.cases}
                  options={current.options}
                  mapping={state.draftMapping}
                  caseIndex={state.caseIndex}
                  onMap={(caseId, optionId) => dispatch({ type: 'MAP_CASE', caseId, optionId })}
                  onSetCaseIndex={caseIndex => dispatch({ type: 'SET_CASE_INDEX', caseIndex })}
                  onFillAll={optionId => dispatch({ type: 'FILL_ALL', optionId })}
                />
              </>
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
          <div className={`mx-auto flex w-full max-w-md ${containerW} items-center justify-between gap-3 px-5 py-4`}>
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
              className={`flex items-center gap-2 rounded-lg bg-white text-black font-mono text-xs font-bold uppercase tracking-widest px-6 py-3 border border-white transition-all enabled:hover:bg-neutral-200 active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed ${ring}`}
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
