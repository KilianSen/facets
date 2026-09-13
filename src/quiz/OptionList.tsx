import { Check } from 'lucide-react'
import type { Option } from '../engine/types'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2'

export function OptionList({
  options,
  labelledById,
  selectedId,
  onSelect,
}: {
  options: Option[]
  labelledById?: string
  selectedId?: string
  onSelect: (optionId: string) => void
}) {
  return (
    <div role="group" aria-labelledby={labelledById} className="flex flex-col gap-3">
      {options.map((o, i) => {
        const selected = selectedId === o.id
        return (
          <button
            key={o.id}
            type="button"
            aria-current={selected || undefined}
            onClick={() => onSelect(o.id)}
            className={`group relative flex w-full items-start gap-3.5 rounded-2xl p-4 text-left transition-all duration-150 ${ring} ${
              selected
                ? 'bg-coral text-white border-2 border-slate-950 shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white text-slate-900 border-2 border-slate-950 shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-xs font-black tabular-nums transition-colors border ${
                selected
                  ? 'bg-slate-950 text-white border-slate-950'
                  : 'bg-slate-100 text-slate-800 border-slate-300 group-hover:bg-slate-200'
              }`}
            >
              {selected ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : i + 1}
            </span>
            <span className="flex-1 text-sm md:text-base font-bold leading-snug">
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
