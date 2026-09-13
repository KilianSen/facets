import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { Option } from '../engine/types'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'

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
          <motion.button
            key={o.id}
            type="button"
            aria-current={selected || undefined}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(o.id)}
            className={`group flex items-start gap-3.5 rounded-2xl p-4 text-left transition-all duration-200 ${ring} ${
              selected
                ? 'bg-gradient-to-r from-accent/20 to-fuchsia-500/10 text-white ring-2 ring-accent shadow-md shadow-accent/10'
                : 'bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white border border-white/5 hover:border-white/15'
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-colors ${
                selected
                  ? 'bg-accent text-ink font-bold shadow-sm'
                  : 'bg-white/10 text-white/50 group-hover:bg-white/15 group-hover:text-white/80'
              }`}
            >
              {selected ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : i + 1}
            </span>
            <span className="flex-1 text-sm leading-snug">{o.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
