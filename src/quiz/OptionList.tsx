import type { Option } from '../engine/types'
import { optionClass } from '../ui/styles'
import { KeyHint } from './KeyHint'

export function OptionList({
  options, labelledById, selectedId, onSelect,
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
          <button key={o.id} type="button" aria-current={selected || undefined} onClick={() => onSelect(o.id)} className={optionClass(selected)}>
            <KeyHint n={i + 1} checked={selected} />
            <span className="flex-1">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
