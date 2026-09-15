import type { RefObject } from 'react'
import { Split } from 'lucide-react'
import type { Question } from '../engine/types'
import { CONTENT } from '../content'
import { ring } from '../ui/styles'
import { OptionList } from './OptionList'
import { PromptCard } from './PromptCard'

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
  const axis = CONTENT.axes.find(a => a.id === question.axis)

  return (
    <div className="flex flex-col gap-5">
      <PromptCard id={promptId} prompt={question.prompt} headingRef={headingRef} />
      <OptionList options={question.options} labelledById={promptId} selectedId={selectedId} onSelect={onSingle} />
      {question.cases && (
        // Dashed on purpose: it's a fork in the question, not another answer.
        <button
          type="button"
          onClick={onDepends}
          className={`inline-flex items-center gap-2 self-start rounded-full border-2 border-dashed border-ink px-5 py-2.5 text-sm font-bold transition-colors hover:border-solid hover:bg-white ${ring}`}
        >
          <Split className="h-4 w-4" aria-hidden="true" />
          {axis?.dependsLabel ?? 'It depends'}…
        </button>
      )}
    </div>
  )
}
