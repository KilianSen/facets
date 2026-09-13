import { Check } from 'lucide-react'
import type { Option } from '../engine/types'

const ring = 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-black'

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
    <div role="group" aria-labelledby={labelledById} className="flex flex-col gap-2.5">
      {options.map((o, i) => {
        const selected = selectedId === o.id
        return (
          <button
            key={o.id}
            type="button"
            aria-current={selected || undefined}
            onClick={() => onSelect(o.id)}
            className={`group relative flex w-full items-start gap-4 rounded-xl px-4 py-3.5 text-left transition-all duration-150 border ${ring} ${
              selected
                ? 'bg-white text-black border-white shadow-sm'
                : 'bg-white/[0.02] text-neutral-300 border-white/10 hover:border-white/30 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold transition-colors ${
                selected
                  ? 'bg-black text-white'
                  : 'bg-white/10 text-neutral-400 group-hover:text-white group-hover:bg-white/20'
              }`}
            >
              {selected ? <Check className="h-3 w-3 stroke-[3]" /> : `0${i + 1}`}
            </span>
            <span className={`flex-1 text-sm md:text-base leading-relaxed ${selected ? 'font-semibold text-black' : 'font-normal'}`}>
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
