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
    <div className="rounded-2xl border border-white/10 bg-[#111114] p-6 md:p-8 flex flex-col gap-6 shadow-sm">
      {/* 1. Monospaced Minimalist Header */}
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-neutral-400">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span>Prompt // First Impulse</span>
        </span>
        <span className="text-neutral-500">Choice</span>
      </div>

      {/* 2. Refined Editorial Heading */}
      <h2
        id={promptId}
        ref={headingRef}
        tabIndex={-1}
        className="font-editorial text-xl md:text-2xl font-normal leading-relaxed text-neutral-100 focus-visible:outline-none"
      >
        {question.prompt}
      </h2>

      {/* 3. Response Options List */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">
          Select response:
        </div>
        <OptionList
          options={question.options}
          labelledById={promptId}
          selectedId={selectedId}
          onSelect={onSingle}
        />
      </div>

      {/* 4. Branching Action & Tip */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        {question.cases ? (
          <button
            type="button"
            onClick={onDepends}
            className={`group inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/[0.04] px-3.5 py-2 font-mono text-xs uppercase tracking-wider text-neutral-300 transition-all hover:bg-white/[0.08] hover:border-white/40 hover:text-white ${ring}`}
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
