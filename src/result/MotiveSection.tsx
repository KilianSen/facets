import type { SituationAxis } from '../engine/types'
import type { MotiveReadout } from '../engine'

/**
 * The "why" payoff: what runs the user's biggest swings. A motive behind two or more swings is called
 * out as the through-line — the single most revealing line on the page. Renders nothing if skipped.
 */
export function MotiveSection({ readout, axes }: { readout: MotiveReadout; axes: SituationAxis[] }) {
  if (readout.reads.length === 0) return null
  const nameOf = (id: string) => axes.find(a => a.id === id)?.name ?? id
  const through = readout.throughLine

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm uppercase tracking-widest text-white/50">What’s behind it</h2>

      {through && (
        <div className="flex flex-col gap-1 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
          <span className="text-[11px] uppercase tracking-[0.2em] text-accent-soft/80">One motive runs through you</span>
          <span className="font-display text-lg font-semibold text-white">{through.name} <span className="text-sm font-normal text-white/55">· {through.tagline}</span></span>
          <p className="text-sm leading-relaxed text-white/75">{through.copy}</p>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {readout.reads.map(r => (
          <li key={r.axisId} className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
            <span className="text-white/85">
              <span className="font-medium">{nameOf(r.axisId)}</span>
              <span className="text-white/40"> runs on </span>
              <span className="font-medium text-accent-soft">{r.motive.name}</span>
            </span>
            <span className="text-xs italic text-white/50">“{r.label}”</span>
            {r.motive.id !== through?.id && <p className="text-xs leading-relaxed text-white/65">{r.motive.copy}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
