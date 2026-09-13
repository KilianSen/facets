import type { RefObject } from 'react'
import { Split } from 'lucide-react'
import type { Question } from '../engine/types'
import { OptionList } from './OptionList'

const ring = 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-black'

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
    <div className="rounded-xl border border-white/10 bg-[#111114] p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
      {/* 1. Prompt Heading */}
      <h2
        id={promptId}
        ref={headingRef}
        tabIndex={-1}
        className="font-editorial text-lg sm:text-xl md:text-2xl font-normal leading-snug text-neutral-100 focus-visible:outline-none"
      >
        {question.prompt}
      </h2>

      {/* 2. Response Options List */}
      <OptionList
        options={question.options}
        labelledById={promptId}
        selectedId={selectedId}
        onSelect={onSingle}
      />

      {/* 3. Branching Action & Tip */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-1">
        {question.cases ? (
          <button
            type="button"
            onClick={onDepends}
            className={`group inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-neutral-300 transition-all hover:bg-white/[0.08] hover:border-white/30 hover:text-white ${ring}`}
          >
            <Split className="h-3.5 w-3.5" />
            <span>It depends who it is…</span>
          </button>
        ) : (
          <div />
        )}

        <p className="hidden text-[11px] font-mono text-neutral-500 [@media(pointer:fine)]:block">
          Press 1–{question.options.length}
        </p>
      </div>
    </div>
  )
}
