import type { Question } from '../engine/types'
import { OptionList } from './OptionList'

export function QuestionCard({
  question, onSingle, onDepends,
}: {
  question: Question
  onSingle: (optionId: string) => void
  onDepends: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-medium text-white">{question.prompt}</h2>
      <OptionList options={question.options} onSelect={onSingle} />
      {question.cases && (
        <button type="button" onClick={onDepends} className="self-start text-sm text-sky-300 hover:text-sky-200">
          ＋ It depends
        </button>
      )}
    </div>
  )
}
