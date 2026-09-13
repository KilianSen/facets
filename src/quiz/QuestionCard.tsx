import type { RefObject } from 'react'
import { MessageCircle, Split } from 'lucide-react'
import type { Question } from '../engine/types'
import { OptionList } from './OptionList'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'

export function QuestionCard({
  question,
  headingRef,
  selectedId,
  onSingle,
  onDepends,
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
      {/* Conversational Scenario Prompt Card */}
      <div className="flex flex-col gap-2 rounded-3xl rounded-tl-sm border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 shadow-xl shadow-black/20">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent-soft">
          <MessageCircle className="h-3.5 w-3.5" />
          <span>The Situation</span>
        </div>
        <h2
          id={promptId}
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-medium leading-snug text-white focus-visible:outline-none"
        >
          {question.prompt}
        </h2>
      </div>

      {/* Response Options */}
      <OptionList options={question.options} labelledById={promptId} selectedId={selectedId} onSelect={onSingle} />

      <div className="flex items-center justify-between pt-1">
        {question.cases ? (
          <button
            type="button"
            onClick={onDepends}
            className={`group flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-medium text-accent-soft transition-all duration-200 hover:border-accent/60 hover:bg-accent/20 hover:text-white ${ring}`}
          >
            <Split className="h-3.5 w-3.5" />
            <span>It depends who it is…</span>
          </button>
        ) : (
          <div />
        )}

        <p className="hidden text-xs text-white/30 [@media(pointer:fine)]:block font-mono">
          Tip: 1–{question.options.length} to choose
        </p>
      </div>
    </div>
  )
}
