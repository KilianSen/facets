import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import type { Case, Option } from '../engine/types'
import { btnGhost, optionClass, panel, ring } from '../ui/styles'
import { KeyHint } from './KeyHint'

/**
 * "It depends", one person at a time. Each case is a card; the user opens whoever the situation is
 * most true for, answers, then picks who's next. The order they answer in is the ranking — shown as
 * 1-2-3 badges so the meaning is visible — so there's no drag or separate rank step.
 */
export function DependsFlow({
  cases, options, ranking, mapping, activeCaseId, onOpen, onMap, onFillAll, onReset,
}: {
  cases: Case[]
  options: Option[]
  ranking: string[]
  mapping: Record<string, string>
  activeCaseId: string | null
  onOpen: (caseId: string) => void
  onMap: (caseId: string, optionId: string) => void
  onFillAll: (optionId: string) => void
  onReset: () => void
}) {
  const [sameOpen, setSameOpen] = useState(false)
  const answered = cases.filter(c => mapping[c.id] !== undefined).length
  const done = answered === cases.length
  const instruction = answered === 0
    ? 'Start with whoever this is most true for.'
    : done ? 'Ranked in the order you answered.' : 'Who’s next most like you?'

  return (
    <section aria-label="It depends" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <p className="text-sm font-bold">{instruction}</p>
        {answered > 0 && (
          <button type="button" onClick={() => { setSameOpen(false); onReset() }} className={`${btnGhost} shrink-0 text-xs`}>
            Start over
          </button>
        )}
      </div>

      <ol className="flex flex-col gap-2.5">
        {cases.map(c => {
          const rank = ranking.indexOf(c.id) + 1
          const open = activeCaseId === c.id
          const chosen = options.find(o => o.id === mapping[c.id])
          return (
            <li key={c.id} className={`${panel} overflow-hidden transition-shadow ${open ? 'shadow-hard' : ''}`}>
              <button
                type="button"
                onClick={() => onOpen(c.id)}
                aria-expanded={open}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-paper ${ring} focus-visible:ring-inset focus-visible:ring-offset-0`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink text-sm font-bold ${
                    rank ? 'bg-ink text-paper' : open ? 'bg-coral' : 'bg-paper'
                  }`}
                >
                  {rank || ''}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="block font-serif text-lg font-semibold leading-tight first-letter:uppercase">{c.label}</span>
                  <span className={`text-sm leading-snug ${chosen ? 'text-ink' : 'text-ink-faint'}`}>
                    {chosen ? chosen.label : open ? 'What do you do?' : 'Tap to answer'}
                  </span>
                </span>
                {rank > 0 && <span className="sr-only">ranked {rank}</span>}
              </button>

              {open && (
                <div role="radiogroup" aria-label={`Response for ${c.label}`} className="flex flex-col gap-2 border-t-2 border-ink bg-paper p-3">
                  {options.map((o, i) => {
                    const checked = mapping[c.id] === o.id
                    return (
                      <button key={o.id} type="button" role="radio" aria-checked={checked} onClick={() => onMap(c.id, o.id)} className={optionClass(checked)}>
                        <KeyHint n={i + 1} checked={checked} />
                        <span className="flex-1">{o.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {!done && (
        <div className="rounded-card border-2 border-dashed border-ink/40">
          <button
            type="button"
            onClick={() => setSameOpen(v => !v)}
            aria-expanded={sameOpen}
            className={`flex w-full items-center justify-between rounded-card px-4 py-3 text-sm font-semibold text-ink-soft transition-colors hover:text-ink ${ring}`}
          >
            Same answer for everyone
            {sameOpen ? <Minus className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          </button>
          {sameOpen && (
            <div role="group" aria-label="Same answer for everyone" className="flex flex-col gap-2 border-t-2 border-dashed border-ink/40 p-3">
              {options.map(o => (
                <button key={o.id} type="button" onClick={() => { onFillAll(o.id); setSameOpen(false) }} className={optionClass(false)}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
