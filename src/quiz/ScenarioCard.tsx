import { Check, ChevronLeft, ChevronRight, Layers, Sparkles } from 'lucide-react'
import type { Case, Option } from '../engine/types'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2'

interface ScenarioCardProps {
  cases: Case[]
  options: Option[]
  mapping: Record<string, string>
  caseIndex: number
  onMap: (caseId: string, optionId: string) => void
  onSetCaseIndex: (index: number) => void
  onFillAll?: (optionId: string) => void
}

function getCaseEmoji(label: string, index: number, total: number): string {
  const lower = label.toLowerCase()
  if (lower.includes('friend') || lower.includes('sibling') || lower.includes('crew') || lower.includes('partner')) return '👯'
  if (lower.includes('classmate') || lower.includes('teammate') || lower.includes('coworker')) return '🤝'
  if (lower.includes('boss') || lower.includes('stranger') || lower.includes('rando') || lower.includes('never met')) return '👤'
  if (index === 0) return '🔥'
  if (index === total - 1) return '🧊'
  return '⚡'
}

export function ScenarioCard({
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
  const emoji = getCaseEmoji(currentCase.label, caseIndex, cases.length)

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Neo-Brutalist Step Pills */}
      <div className="flex items-center justify-between gap-2 p-1">
        {cases.map((c, idx) => {
          const isCurrent = idx === caseIndex
          const isAnswered = mapping[c.id] !== undefined
          const pillEmoji = getCaseEmoji(c.label, idx, cases.length)

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSetCaseIndex(idx)}
              aria-label={`Step ${idx + 1}: ${c.label}`}
              aria-current={isCurrent ? 'step' : undefined}
              className={`group flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-black uppercase tracking-wider transition-all duration-150 border-2 border-slate-950 ${ring} ${
                isCurrent
                  ? 'bg-slate-950 text-white shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                  : isAnswered
                    ? 'bg-pop-yellow text-slate-950 shadow-[2px_2px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                    : 'bg-white text-slate-500 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              <span>{pillEmoji}</span>
              <span className="tabular-nums">
                {isAnswered && !isCurrent ? <Check className="inline h-3.5 w-3.5 stroke-[3]" /> : idx + 1}
              </span>
              <span className="hidden truncate sm:inline max-w-[100px]">{c.label}</span>
            </button>
          )
        })}
      </div>

      {/* 2. Physical Context Card (Hinge Prompt + Neo-Brutalist Stamp) */}
      <div className="rounded-[32px] bg-bone text-slate-900 p-6 md:p-8 border-3 border-slate-950 shadow-[6px_6px_0px_#000] flex flex-col gap-5 transition-all">
        {/* Context Target Banner */}
        <div className="bg-pop-yellow text-slate-950 border-2 border-slate-950 rounded-2xl p-4 shadow-[3px_3px_0px_#000] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border-2 border-slate-950 text-2xl shadow-[2px_2px_0px_#000]">
              {emoji}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">
                Plot Context {caseIndex + 1} of {cases.length}
              </span>
              <span className="text-base md:text-lg font-black text-slate-950 leading-tight">
                When it’s <span className="underline decoration-2 underline-offset-4">{currentCase.label}</span>:
              </span>
            </div>
          </div>
          <span className="text-[11px] font-black font-mono bg-white text-slate-950 px-2.5 py-1 rounded-lg border-2 border-slate-950 shadow-[1px_1px_0px_#000]">
            {Object.keys(mapping).length}/{cases.length}
          </span>
        </div>

        {/* Quick-Reply Options */}
        <div role="radiogroup" aria-label={`Response for ${currentCase.label}`} className="flex flex-col gap-3 pt-1">
          {options.map((o, optIdx) => {
            const checked = selectedOptionId === o.id
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => onMap(currentCase.id, o.id)}
                className={`group relative flex w-full items-start gap-3.5 rounded-2xl p-4 text-left transition-all duration-150 ${ring} ${
                  checked
                    ? 'bg-coral text-white border-2 border-slate-950 shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                    : 'bg-white text-slate-900 border-2 border-slate-950 shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black tabular-nums transition-colors border ${
                    checked
                      ? 'bg-slate-950 text-white border-slate-950'
                      : 'bg-slate-100 text-slate-800 border-slate-300 group-hover:bg-slate-200'
                  }`}
                >
                  {checked ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : optIdx + 1}
                </div>
                <span className="flex-1 text-sm md:text-base font-bold leading-snug">
                  {o.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Stepper Navigation Controls */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-slate-200 mt-1">
          <button
            type="button"
            onClick={() => onSetCaseIndex(caseIndex - 1)}
            disabled={caseIndex === 0}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider text-slate-950 bg-white border-2 border-slate-950 transition-all enabled:shadow-[2px_2px_0px_#000] enabled:hover:translate-x-[-1px] enabled:hover:translate-y-[-1px] disabled:opacity-0 ${ring}`}
          >
            <ChevronLeft className="h-3.5 w-3.5 stroke-[3]" />
            <span>Previous context</span>
          </button>

          {caseIndex < cases.length - 1 ? (
            <button
              type="button"
              onClick={() => onSetCaseIndex(caseIndex + 1)}
              className={`flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-slate-950 bg-pop-yellow border-2 border-slate-950 shadow-[2px_2px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all ${ring}`}
            >
              <span>Next context</span>
              <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
            </button>
          ) : (
            <span className="text-xs font-black text-slate-950 flex items-center gap-1 bg-pop-yellow px-2.5 py-1 rounded-lg border-2 border-slate-950 shadow-[1px_1px_0px_#000]">
              <Sparkles className="h-3.5 w-3.5" />
              All contexts ready!
            </span>
          )}
        </div>
      </div>

      {/* Helper: Same for all contexts */}
      {onFillAll && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-white/60">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
            <Layers className="h-3.5 w-3.5" />
            Same for everyone?
          </span>
          {options.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => onFillAll(o.id)}
              className={`rounded-xl bg-slate-900 px-3 py-1 text-white font-bold text-xs border-2 border-slate-700 hover:border-white shadow-[2px_2px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all ${ring}`}
            >
              {o.label.length > 25 ? `${o.label.slice(0, 25)}…` : o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
