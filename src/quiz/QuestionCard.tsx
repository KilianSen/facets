import type { RefObject } from 'react'
import type { Question } from '../engine/types'
import { OptionList } from './OptionList'

export function QuestionCard({
  question, headingRef, selectedId, onSingle, onDepends,
}: {
  question: Question
  headingRef?: RefObject<HTMLHeadingElement>
  selectedId?: string
  onSingle: (optionId: string) => void
  onDepends: () => void
}) {
  const promptId = `prompt-${question.id}`
  return (
    <div className="flex flex-col gap-5">
      <h2 id={promptId} ref={headingRef} tabIndex={-1} className="text-lg font-medium text-white focus-visible:outline-none">{question.prompt}</h2>
      <OptionList options={question.options} labelledById={promptId} selectedId={selectedId} onSelect={onSingle} />
      {question.cases && (
        <button
          type="button"
          onClick={onDepends}
          className="self-start rounded text-sm text-accent-soft transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          ＋ It depends
        </button>
      )}
    </div>
  )
}
