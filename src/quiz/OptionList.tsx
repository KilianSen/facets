import type { Option } from '../engine/types'

export function OptionList({ options, onSelect }: { options: Option[]; onSelect: (optionId: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onSelect(o.id)}
          className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-4 text-left hover:bg-white/10"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold">
            {String.fromCharCode(65 + i)}
          </span>
          <span className="text-sm leading-snug text-white/80">{o.label}</span>
        </button>
      ))}
    </div>
  )
}
