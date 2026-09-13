import { useEffect, useRef } from 'react'
import { ChevronLeft, Sparkles, Send } from 'lucide-react'
import type { Answer, Question } from '../engine/types'
import { useQuizState } from './useQuizState'
import { QuestionCard } from './QuestionCard'
import { ScenarioCard } from './ScenarioCard'
import { Reveal } from '../ui/Reveal'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2'

function getCheerleading(index: number, total: number) {
  const pct = index / total
  if (pct === 0) return 'Find your vibe ✨'
  if (pct < 0.25) return 'Warming up 🔥'
  if (pct < 0.5) return 'Bold moves… 👀'
  if (pct < 0.75) return 'Pattern locked 🧬'
  if (pct < 1) return 'Almost there 🎯'
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
    <div className="flex min-h-screen flex-col bg-[#0d0c14] text-white">
      {/* 1. Header with Solid Neo-Brutalist Pill Progress */}
      <header className="sticky top-0 z-20 border-b-2 border-white/10 bg-[#0d0c14]/95 backdrop-blur-md">
        <div className={`mx-auto flex w-full max-w-md ${containerW} flex-col gap-3 px-5 py-4`}>
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => dispatch({ type: 'GO_BACK' })}
              disabled={state.index <= minIndex}
              className={`flex items-center gap-1 rounded-xl py-1.5 px-3 text-xs font-black uppercase tracking-wider text-white bg-white/10 border-2 border-white/20 transition-all enabled:hover:bg-white/20 enabled:hover:border-white disabled:opacity-0 ${ring}`}
            >
              <ChevronLeft className="h-3.5 w-3.5 stroke-[3]" />
              <span>Back</span>
            </button>

            {/* Persona Stamp */}
            <div className="flex items-center gap-2">
              <span className="bg-pop-yellow text-slate-950 font-black uppercase text-[10px] tracking-widest px-2.5 py-1 rounded-md border-2 border-slate-950 shadow-[2px_2px_0px_#000]">
                Vibe Check
              </span>
              <span className="text-xs font-black font-mono text-white/90">
                Question {state.index + 1} of {total}
              </span>
            </div>

            {/* Cheerleading Status Pill */}
            <span className="hidden sm:inline-block text-[11px] font-black uppercase tracking-wider text-slate-950 bg-white px-2.5 py-1 rounded-md border-2 border-slate-950 shadow-[2px_2px_0px_#000]">
              {getCheerleading(state.index, total)}
            </span>
          </div>

          {/* Solid 2px-Bordered Progress Bar */}
          <div
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={state.index}
            className="h-2 w-full overflow-hidden rounded-full bg-slate-900 border-2 border-slate-700"
          >
            <div
              className="h-full bg-pop-yellow transition-[width] duration-300"
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
                {/* Physical Editorial Dilemma Prompt Card */}
                <div className="rounded-[32px] bg-bone text-slate-900 p-6 md:p-8 border-3 border-slate-950 shadow-[6px_6px_0px_#000] flex flex-col gap-4 transition-all">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-coral text-white font-black uppercase text-[10px] tracking-widest px-2.5 py-1 rounded-md border-2 border-slate-950 shadow-[2px_2px_0px_#000]">
                      <Sparkles className="h-3 w-3" />
                      <span>The Dilemma</span>
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Context Switcher
                    </span>
                  </div>
                  <h2
                    ref={headingRef}
                    tabIndex={-1}
                    className="font-editorial text-2xl md:text-3xl font-bold leading-snug text-slate-950 focus-visible:outline-none"
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
          className="sticky bottom-0 z-20 border-t-2 border-white/10 bg-[#0d0c14]/95 backdrop-blur-md"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className={`mx-auto flex w-full max-w-md ${containerW} items-center justify-between gap-3 px-5 py-4`}>
            {current.kind === 'flavor' ? (
              <button
                type="button"
                onClick={() => dispatch({ type: 'CANCEL_DEPENDS' })}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold text-white/60 transition-colors hover:text-white hover:bg-white/10 ${ring}`}
              >
                ← Just give one answer
              </button>
            ) : (
              <span className="hidden text-xs font-bold text-white/40 [@media(pointer:fine)]:inline font-mono">
                Press ⏎ when all contexts mapped
              </span>
            )}

            <button
              ref={continueRef}
              type="button"
              onClick={commit}
              disabled={!state.canCommit}
              className={`group flex items-center gap-2 rounded-2xl bg-pop-yellow text-slate-950 font-black uppercase tracking-wider text-sm px-7 py-3.5 border-2 border-slate-950 transition-all duration-150 enabled:shadow-[4px_4px_0px_#000] enabled:hover:translate-x-[-1px] enabled:hover:translate-y-[-1px] enabled:hover:shadow-[5px_5px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed ${ring}`}
            >
              <span>Continue</span>
              <Send className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
