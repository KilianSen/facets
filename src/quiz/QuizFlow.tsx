import { useEffect, useRef } from 'react'
import type { Answer, Question } from '../engine/types'
import { useQuizState } from './useQuizState'
import { QuestionCard } from './QuestionCard'
import { DependsRanker } from './DependsRanker'
import { CaseMapper } from './CaseMapper'

export function QuizFlow({ questions, onComplete }: { questions: Question[]; onComplete: (answers: Answer[]) => void }) {
  const { state, dispatch } = useQuizState(questions)
  const completed = useRef(false)

  useEffect(() => {
    if (state.phase === 'done' && !completed.current) {
      completed.current = true
      onComplete(state.answers)
    }
  }, [state.phase, state.answers, onComplete])

  if (state.phase === 'done') return null
  const current = questions[state.index]
  if (!current) return null

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <span className="text-xs font-medium tabular-nums text-white/50">
        {state.index + 1} / {questions.length}
      </span>

      {state.phase === 'question' && (
        <QuestionCard
          question={current}
          onSingle={optionId => dispatch({ type: 'ANSWER_SINGLE', optionId })}
          onDepends={() => dispatch({ type: 'START_DEPENDS' })}
        />
      )}

      {state.phase === 'ranking' && current.cases && (
        <DependsRanker cases={current.cases} onConfirm={ranking => dispatch({ type: 'SET_RANKING', ranking })} />
      )}

      {state.phase === 'mapping' && current.cases && (
        <CaseMapper
          cases={current.cases}
          options={current.options}
          mapping={state.draftMapping}
          onMap={(caseId, optionId) => dispatch({ type: 'MAP_CASE', caseId, optionId })}
          canCommit={state.canCommit}
          onCommit={() => dispatch({ type: 'COMMIT_DEPENDS' })}
        />
      )}
    </div>
  )
}
