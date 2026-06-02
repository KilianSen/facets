import type { Question } from '../engine/types'
import { OptionList } from './OptionList'

export function QuestionCard({
  question, onSingle, onDepends,
}: {
  question: Question
  onSingle: (optionId: string) => void
  onDepends: () => void
}) {
  const promptId = `prompt-${question.id}`
  return (
    <div className="flex flex-col gap-5">
      <h2 id={promptId} className="text-lg font-medium text-white">{question.prompt}</h2>
      <OptionList options={question.options} labelledById={promptId} onSelect={onSingle} />
      {question.cases && (
        <button
          type="button"
          onClick={onDepends}
          className="self-start rounded text-sm text-sky-300 transition-colors hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          ＋ It depends
        </button>
      )}
    </div>
  )
}
