import type { Option } from '../engine/types'

export function OptionList({
  options, labelledById, selectedId, onSelect,
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
            className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${selected ? 'bg-accent/20 ring-1 ring-accent/50' : 'bg-white/5 hover:bg-white/10 active:bg-white/[0.15]'}`}
          >
            <span aria-hidden="true" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-sm leading-snug text-white/80">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
