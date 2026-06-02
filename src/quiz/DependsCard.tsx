import type { KeyboardEvent } from 'react'
import type { Case, Option } from '../engine/types'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950'

export function DependsCard({
  cases, options, ranking, mapping, onReorder, onMap, onFillAll, canCommit, onCommit,
}: {
  cases: Case[]
  options: Option[]
  ranking: string[]
  mapping: Record<string, string>
  onReorder: (ranking: string[]) => void
  onMap: (caseId: string, optionId: string) => void
  onFillAll: (optionId: string) => void
  canCommit: boolean
  onCommit: () => void
}) {
  const ordered = ranking.map(id => cases.find(c => c.id === id)).filter((c): c is Case => !!c)

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= ordered.length) return
    const next = [...ranking]
    ;[next[i], next[j]] = [next[j], next[i]]
    onReorder(next)
  }

  const moveBtn = `flex h-9 w-9 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 ${ring}`

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/70">Order these from most to least like you, and pick what you’d actually do in each.</p>

      <ol className="flex flex-col gap-3">
        {ordered.map((c, i) => {
          const selectedIdx = options.findIndex(o => mapping[c.id] === o.id)
          const tabbable = selectedIdx >= 0 ? selectedIdx : 0
          const onKey = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
            const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
            if (!d) return
            e.preventDefault()
            const next = (idx + d + options.length) % options.length
            onMap(c.id, options[next].id)
            const group = (e.currentTarget as HTMLElement).closest('[role="radiogroup"]')
            group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
          }
          return (
            <li key={c.id} className="rounded-beam bg-white/[0.04] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm text-white/85">
                  <span className="tabular-nums text-white/40">{i + 1}</span>
                  {c.label}
                </span>
                <span className="flex gap-1">
                  <button type="button" aria-label={`move ${c.label} up`} onClick={() => move(i, -1)} className={moveBtn}>↑</button>
                  <button type="button" aria-label={`move ${c.label} down`} onClick={() => move(i, 1)} className={moveBtn}>↓</button>
                </span>
              </div>
              <div role="radiogroup" aria-label={c.label} className="flex flex-wrap gap-2">
                {options.map((o, idx) => {
                  const checked = mapping[c.id] === o.id
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      tabIndex={idx === tabbable ? 0 : -1}
                      onKeyDown={e => onKey(e, idx)}
                      onClick={() => onMap(c.id, o.id)}
                      className={`rounded-lg px-3 py-2 text-sm transition-colors ${ring} ${checked ? 'bg-accent/20 text-white ring-1 ring-accent/50' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
        <span>Same for everyone?</span>
        {options.map(o => (
          <button
            key={o.id}
            type="button"
            aria-label={`same for all: ${o.label}`}
            onClick={() => onFillAll(o.id)}
            className={`rounded-md bg-white/5 px-2 py-1 text-white/70 transition-colors hover:bg-white/10 ${ring}`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!canCommit}
        onClick={onCommit}
        className={`self-start rounded-xl bg-white/10 px-4 py-2 text-sm transition-colors enabled:hover:bg-white/20 disabled:opacity-40 ${ring}`}
      >
        Continue
      </button>
    </div>
  )
}
