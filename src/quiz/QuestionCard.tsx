import type { RefObject } from 'react'
import { Sparkles, Split } from 'lucide-react'
import type { Question } from '../engine/types'
import { OptionList } from './OptionList'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2'

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
    <div className="rounded-[32px] bg-bone text-slate-900 p-6 md:p-8 border-3 border-slate-950 shadow-[6px_6px_0px_#000] flex flex-col gap-6 transition-all">
      {/* 1. Header Sticker & Subtitle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-coral text-white font-black uppercase text-[10px] tracking-widest px-2.5 py-1 rounded-md border-2 border-slate-950 shadow-[2px_2px_0px_#000]">
            <Sparkles className="h-3 w-3" />
            <span>Real Talk</span>
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Signature Prompt
          </span>
        </div>
      </div>

      {/* 2. Editorial Serif Headline */}
      <h2
        id={promptId}
        ref={headingRef}
        tabIndex={-1}
        className="font-editorial text-2xl md:text-3xl font-bold leading-snug text-slate-950 focus-visible:outline-none"
      >
        {question.prompt}
      </h2>

      {/* 3. Response Options List */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
          Your gut reaction:
        </div>
        <OptionList
          options={question.options}
          labelledById={promptId}
          selectedId={selectedId}
          onSelect={onSingle}
        />
      </div>

      {/* 4. Branching Button & Keyboard Tip */}
      <div className="flex items-center justify-between pt-2 border-t-2 border-slate-200">
        {question.cases ? (
          <button
            type="button"
            onClick={onDepends}
            className={`group inline-flex items-center gap-2 rounded-xl bg-pop-yellow px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 border-2 border-slate-950 shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${ring}`}
          >
            <Split className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>It depends who it is…</span>
          </button>
        ) : (
          <div />
        )}

        <p className="hidden text-xs font-mono font-bold text-slate-400 [@media(pointer:fine)]:block">
          Press 1–{question.options.length}
        </p>
      </div>
    </div>
  )
}
