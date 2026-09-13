import { useEffect, useRef } from 'react'
import { MessageCircle, ArrowLeft, Sparkles } from 'lucide-react'
import type { Answer, Question } from '../engine/types'
import { useQuizState } from './useQuizState'
import { QuestionCard } from './QuestionCard'
import { ScenarioCard } from './ScenarioCard'
import { Reveal } from '../ui/Reveal'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'

function getCheerleading(index: number, total: number) {
  const pct = index / total
  if (pct === 0) return 'Let’s find your vibe ✨'
  if (pct < 0.25) return 'Warming up 🔥'
  if (pct < 0.5) return 'Interesting choices… 👀'
  if (pct < 0.75) return 'Pattern detected 🧬'
  if (pct < 1) return 'Almost figured out 🎯'
  return 'Final stretch 🎉'
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
    <div className="flex min-h-screen flex-col">
      {/* Sticky Header with Dynamic Vibe Progress */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/85 backdrop-blur-md">
        <div className={`mx-auto flex w-full max-w-md ${containerW} flex-col gap-2.5 px-5 py-3.5`}>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => dispatch({ type: 'GO_BACK' })}
              disabled={state.index <= minIndex}
              className={`flex items-center gap-1.5 rounded-lg py-1 px-2 text-xs text-white/50 transition-colors enabled:hover:bg-white/5 enabled:hover:text-white disabled:opacity-0 ${ring}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tabular-nums text-white/80">
                Question {state.index + 1} of {total}
              </span>
              <span className="hidden sm:inline-block h-3 w-px bg-white/10" />
              <span className="hidden sm:inline-block text-[11px] font-medium text-accent-soft">
                {getCheerleading(state.index, total)}
              </span>
            </div>
          </div>

          <div
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={state.index}
            className="h-1.5 w-full overflow-hidden rounded-full bg-white/10 p-0.5"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-fuchsia-400 transition-[width] duration-300 shadow-sm shadow-accent/50"
              style={{ width: `${Math.max(5, (state.index / total) * 100)}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col">
        <div className={`mx-auto w-full max-w-md ${containerW} px-5 py-7`}>
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
                <div className="flex flex-col gap-2 rounded-3xl rounded-tl-sm border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 shadow-xl shadow-black/20">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent-soft">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>The Situation</span>
                  </div>
                  <h2
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-lg font-medium leading-snug text-white focus-visible:outline-none"
                  >
                    {current.prompt}
                  </h2>
                </div>

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

      {/* Footer for Depends Phase */}
      {state.phase === 'depends' && current.cases && (
        <footer
          className="sticky bottom-0 z-20 border-t border-white/5 bg-ink/85 backdrop-blur-md"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className={`mx-auto flex w-full max-w-md ${containerW} items-center justify-between gap-3 px-5 py-3.5`}>
            {current.kind === 'flavor' ? (
              <button
                type="button"
                onClick={() => dispatch({ type: 'CANCEL_DEPENDS' })}
                className={`rounded-lg px-2 py-1 text-xs text-white/50 transition-colors hover:text-white ${ring}`}
              >
                ← Just give one answer
              </button>
            ) : (
              <span className="hidden text-xs text-white/40 [@media(pointer:fine)]:inline font-mono">
                Press ⏎ when all contexts mapped
              </span>
            )}

            <button
              ref={continueRef}
              type="button"
              onClick={commit}
              disabled={!state.canCommit}
              className={`group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-fuchsia-500 px-6 py-3 text-sm font-semibold text-ink transition-all duration-200 enabled:hover:opacity-95 enabled:shadow-lg enabled:shadow-accent/20 disabled:opacity-40 disabled:cursor-not-allowed ${ring}`}
            >
              <span>Continue</span>
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
