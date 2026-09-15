import type { SituationAxis } from '../engine/types'
import type { MotiveReadout } from '../engine'
import { card, eyebrow, panel } from '../ui/styles'

/**
 * The "why" payoff: what runs the user's biggest swings. A motive behind two or more swings is called
 * out as the through-line — the single most revealing line on the page. Renders nothing if skipped.
 */
export function MotiveSection({ readout, axes }: { readout: MotiveReadout; axes: SituationAxis[] }) {
  if (readout.reads.length === 0) return null
  const nameOf = (id: string) => axes.find(a => a.id === id)?.name ?? id
  const through = readout.throughLine

  return (
    <section className="flex flex-col gap-3">
      <h2 className={`${eyebrow} px-1`}>What’s behind it</h2>

      {through && (
        <div className={`${card} bg-coral-soft p-5 sm:p-6`}>
          <p className={eyebrow}>One motive runs through you</p>
          <p className="mt-1 font-serif text-4xl font-bold tracking-tight">{through.name}</p>
          <p className="font-serif text-lg italic text-ink-soft">{through.tagline}</p>
          <p className="mt-3 text-[15px] leading-relaxed">{through.copy}</p>
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {readout.reads.map(r => (
          <li key={r.axisId} className={`${panel} flex flex-col gap-1 p-4`}>
            <p className="text-sm font-semibold text-ink-soft">{nameOf(r.axisId)} runs on</p>
            <p className="font-serif text-2xl font-bold leading-tight">{r.motive.name}</p>
            <p className="font-serif text-sm italic text-ink-soft">“{r.label}”</p>
            {r.motive.id !== through?.id && <p className="mt-1 text-sm leading-relaxed">{r.motive.copy}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}
