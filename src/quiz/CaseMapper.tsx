import type { Case, Option } from '../engine/types'

export function CaseMapper({
  cases, options, mapping, onMap, canCommit, onCommit,
}: {
  cases: Case[]
  options: Option[]
  mapping: Record<string, string>
  onMap: (caseId: string, optionId: string) => void
  canCommit: boolean
  onCommit: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      {cases.map(c => (
        <div key={c.id} role="radiogroup" aria-label={c.label} className="flex flex-col gap-2">
          <p className="text-sm font-medium text-white/90">{c.label}</p>
          <div className="flex flex-wrap gap-2">
            {options.map(o => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={mapping[c.id] === o.id}
                onClick={() => onMap(c.id, o.id)}
                className={`rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${mapping[c.id] === o.id ? 'bg-sky-400/30 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={!canCommit}
        onClick={onCommit}
        className="self-start rounded-xl bg-white/10 px-4 py-2 text-sm transition-colors enabled:hover:bg-white/20 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      >
        Continue
      </button>
    </div>
  )
}
