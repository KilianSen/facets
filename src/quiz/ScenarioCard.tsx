import type { RefObject } from 'react'
import { Check, ChevronLeft, ChevronRight, Layers, Sparkles } from 'lucide-react'
import type { Case, Option } from '../engine/types'

const ring = 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-black'

interface ScenarioCardProps {
  prompt?: string
  headingRef?: RefObject<HTMLHeadingElement>
  cases: Case[]
  options: Option[]
  mapping: Record<string, string>
  caseIndex: number
  onMap: (caseId: string, optionId: string) => void
  onSetCaseIndex: (index: number) => void
  onFillAll?: (optionId: string) => void
}

export function ScenarioCard({
  prompt,
  headingRef,
  cases,
  options,
  mapping,
  caseIndex,
  onMap,
  onSetCaseIndex,
  onFillAll,
}: ScenarioCardProps) {
  const currentCase = cases[caseIndex] ?? cases[0]
  if (!currentCase) return null

  const selectedOptionId = mapping[currentCase.id]

  return (
    <div className="rounded-xl border border-white/10 bg-[#111114] p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
      {/* 1. Prompt (when rendered in depends flow) */}
      {prompt && (
        <div className="flex flex-col gap-1 pb-2 border-b border-white/10">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-editorial text-lg sm:text-xl md:text-2xl font-normal leading-snug text-neutral-100 focus-visible:outline-none"
          >
            {prompt}
          </h2>
        </div>
      )}

      {/* 2. Step Navigation Pills */}
      <div className="flex items-center justify-between gap-1.5 p-0.5">
        {cases.map((c, idx) => {
          const isCurrent = idx === caseIndex
          const isAnswered = mapping[c.id] !== undefined

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSetCaseIndex(idx)}
              aria-label={`Step ${idx + 1}: ${c.label}`}
              aria-current={isCurrent ? 'step' : undefined}
              className={`group flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 font-mono text-xs uppercase tracking-wider transition-all duration-150 border ${ring} ${
                isCurrent
                  ? 'bg-white text-black border-white font-bold shadow-sm'
                  : isAnswered
                    ? 'bg-white/[0.08] text-white border-white/20 hover:border-white/40'
                    : 'bg-white/[0.02] text-neutral-400 border-white/10 hover:border-white/25 hover:text-white'
              }`}
            >
              <span className="tabular-nums flex items-center justify-center">
                {isAnswered && !isCurrent ? (
                  <Check className="h-3 w-3 stroke-[3]" />
                ) : (
                  <span className={`text-[10px] ${isCurrent ? 'text-black' : 'text-neutral-400'}`}>
                    0{idx + 1}
                  </span>
                )}
              </span>
              <span className="truncate max-w-[100px] font-sans font-medium text-xs">{c.label}</span>
            </button>
          )
        })}
      </div>

      {/* 3. Active Context Subheader */}
      <div className="flex items-center justify-between font-mono text-xs text-neutral-400">
        <span>
          When it’s{' '}
          <span className="font-semibold text-white underline decoration-white/30 decoration-1 underline-offset-4">
            {currentCase.label}
          </span>
          :
        </span>
        <span className="text-[11px] text-neutral-400">
          {Object.keys(mapping).length}/{cases.length} mapped
        </span>
      </div>

      {/* 4. Options */}
      <div role="radiogroup" aria-label={`Response for ${currentCase.label}`} className="flex flex-col gap-2">
        {options.map((o, optIdx) => {
          const checked = selectedOptionId === o.id
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onMap(currentCase.id, o.id)}
              className={`group relative flex w-full items-start gap-3 rounded-lg px-3.5 py-2.5 sm:py-3 text-left transition-all duration-150 border ${ring} ${
                checked
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'bg-white/[0.02] text-neutral-300 border-white/10 hover:border-white/30 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold transition-colors ${
                  checked
                    ? 'bg-black text-white'
                    : 'bg-white/10 text-neutral-400 group-hover:text-white group-hover:bg-white/20'
                }`}
              >
                {checked ? <Check className="h-3 w-3 stroke-[3]" /> : `0${optIdx + 1}`}
              </div>
              <span
                className={`flex-1 text-sm sm:text-base leading-snug sm:leading-relaxed ${
                  checked ? 'font-semibold text-black' : 'font-normal'
                }`}
              >
                {o.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* 5. Stepper Navigation Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-1">
        <button
          type="button"
          onClick={() => onSetCaseIndex(caseIndex - 1)}
          disabled={caseIndex === 0}
          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-neutral-400 hover:text-white border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] transition-all disabled:opacity-0 ${ring}`}
        >
          <ChevronLeft className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Previous context</span>
        </button>

        {caseIndex < cases.length - 1 ? (
          <button
            type="button"
            onClick={() => onSetCaseIndex(caseIndex + 1)}
            className={`flex items-center gap-1 rounded-lg px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider text-black bg-white hover:bg-neutral-200 border border-white transition-all font-bold ${ring}`}
          >
            <span>Next context</span>
            <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </button>
        ) : (
          <span className="font-mono text-xs uppercase tracking-wider text-accent flex items-center gap-1.5 px-2.5 py-1 rounded border border-accent/20 bg-accent/10">
            <Sparkles className="h-3.5 w-3.5" />
            <span>All contexts ready</span>
          </span>
        )}
      </div>

      {/* 6. Helper: Same for all contexts */}
      {onFillAll && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-white/5 text-[11px] font-mono text-neutral-400">
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider">
            <Layers className="h-3 w-3" />
            <span>Same for all:</span>
          </span>
          {options.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => onFillAll(o.id)}
              className={`rounded border border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05] text-neutral-300 hover:text-white px-2 py-0.5 text-xs transition-all ${ring}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
