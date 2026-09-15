import { useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Answer, Question } from '../engine/types'
import { useQuizState } from './useQuizState'
import { QuestionCard } from './QuestionCard'
import { PromptCard } from './PromptCard'
import { DependsFlow } from './DependsFlow'
import { Reveal } from '../ui/Reveal'
import { btnGhost, btnPrimary } from '../ui/styles'

export function QuizFlow({
  questions, onComplete, minIndex = 0,
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

  useEffect(() => {
    if (state.phase === 'done' && !completed.current) {
      completed.current = true
      onComplete(state.answers)
    }
  }, [state.phase, state.answers, onComplete])

  // Focus the prompt on each new question / phase change (keyboard + screen-reader orientation).
  useEffect(() => { headingRef.current?.focus() }, [state.index, state.phase])

  // Desktop keyboard: number keys pick an answer (for the open person in depends); Enter continues.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cur = questions[state.index]
      if (!cur) return
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      const n = Number(e.key)
      const isPick = Number.isInteger(n) && n >= 1 && n <= cur.options.length
      if (state.phase === 'single') {
        if (tag === 'button' || tag === 'a' || !isPick) return
        e.preventDefault()
        dispatch({ type: 'ANSWER_SINGLE', optionId: cur.options[n - 1].id })
      } else if (state.phase === 'depends') {
        if (e.key === 'Enter' && state.canCommit && document.activeElement !== continueRef.current) {
          e.preventDefault()
          dispatch({ type: 'COMMIT_DEPENDS' })
        } else if (isPick && state.activeCaseId && tag !== 'input') {
          e.preventDefault()
          dispatch({ type: 'MAP_CASE', caseId: state.activeCaseId, optionId: cur.options[n - 1].id })
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.phase, state.index, state.activeCaseId, state.canCommit, questions, dispatch])

  if (state.phase === 'done') return null
  const current = questions[state.index]
  if (!current) return null
  const total = questions.length

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b-2 border-ink bg-paper">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-2.5 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => dispatch({ type: 'GO_BACK' })}
              disabled={state.index <= minIndex}
              className={`${btnGhost} no-underline disabled:invisible`}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>
            <span className="text-sm font-bold tabular-nums">Question {state.index + 1} of {total}</span>
          </div>
          <div
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={state.index}
            className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-white"
          >
            <div className="h-full bg-coral transition-[width] duration-300" style={{ width: `${(state.index / total) * 100}%` }} />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-xl px-4 py-6 sm:py-10">
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
                <PromptCard prompt={current.prompt} headingRef={headingRef} />
                <DependsFlow
                  cases={current.cases}
                  options={current.options}
                  ranking={state.draftRanking}
                  mapping={state.draftMapping}
                  activeCaseId={state.activeCaseId}
                  onOpen={caseId => dispatch({ type: 'OPEN_CASE', caseId })}
                  onMap={(caseId, optionId) => dispatch({ type: 'MAP_CASE', caseId, optionId })}
                  onFillAll={optionId => dispatch({ type: 'FILL_ALL', optionId })}
                  onReset={() => dispatch({ type: 'RESET_DEPENDS' })}
                />
              </>
            )}
          </Reveal>
        </div>
      </main>

      {state.phase === 'depends' && current.cases && (
        <footer className="sticky bottom-0 z-20 border-t-2 border-ink bg-paper" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto flex w-full max-w-xl items-center gap-3 px-4 py-3">
            {current.kind === 'flavor' ? (
              <button type="button" onClick={() => dispatch({ type: 'CANCEL_DEPENDS' })} className={btnGhost}>
                ← Just one answer
              </button>
            ) : (
              <span className="hidden text-xs font-semibold text-ink-soft [@media(pointer:fine)]:inline">Press Enter to continue</span>
            )}
            <button ref={continueRef} type="button" onClick={() => dispatch({ type: 'COMMIT_DEPENDS' })} disabled={!state.canCommit} className={`${btnPrimary} ml-auto`}>
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
