import type { Archetype } from '../engine/types'
import { describeContingency } from '../engine'
import { CONTENT } from '../content'

interface Shift { axisId: string; dimId: string; slope: number }

function shiftsOf(a: Archetype): Shift[] {
  const out: Shift[] = []
  for (const [axisId, dims] of Object.entries(a.signature)) {
    for (const [dimId, slope] of Object.entries(dims)) if (slope) out.push({ axisId, dimId, slope })
  }
  return out.sort((x, y) => Math.abs(y.slope) - Math.abs(x.slope))
}

// A sloped beam: the dim's value (vertical) as the situation runs low → high (horizontal). Rising =
// "more of this the higher it climbs"; falling = the reverse. Steeper = a harder swing.
function SlopeBeam({ slope, accent, uid }: { slope: number; accent: string; uid: string }) {
  const K = 9
  const off = Math.max(-26, Math.min(26, slope * K))
  const yLeft = 36 + off // low situation
  const yRight = 36 - off // high situation
  const gid = `slope-${uid}` // unique per (axis,dim) so two equal-slope rows don't share a gradient id
  return (
    <svg viewBox="0 0 320 72" className="h-16 w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={accent} stopOpacity="0.15" />
          <stop offset="1" stopColor={accent} stopOpacity="1" />
        </linearGradient>
      </defs>
      <line x1="14" y1="36" x2="306" y2="36" stroke="white" strokeOpacity="0.08" strokeDasharray="3 5" />
      <line x1="14" y1={yLeft} x2="306" y2={yRight} stroke={`url(#${gid})`} strokeWidth="3" strokeLinecap="round" />
      <circle cx="14" cy={yLeft} r="4" fill={accent} fillOpacity="0.4" />
      <circle cx="306" cy={yRight} r="5" fill={accent} />
    </svg>
  )
}

/**
 * The archetype's signature: how each behaviour dial moves as a situation intensifies. Falls back to
 * a flat read for The Constant (no contingencies).
 */
export function SignatureGraph({ archetype, accent }: { archetype: Archetype; accent: string }) {
  const shifts = shiftsOf(archetype)

  if (shifts.length === 0) {
    return (
      <div className="rounded-beam border border-white/10 bg-white/[0.03] p-5">
        <svg viewBox="0 0 320 72" className="h-16 w-full" preserveAspectRatio="none" aria-hidden="true">
          <line x1="14" y1="36" x2="306" y2="36" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeOpacity="0.7" />
          <circle cx="14" cy="36" r="4" fill={accent} fillOpacity="0.5" />
          <circle cx="306" cy="36" r="5" fill={accent} />
        </svg>
        <p className="mt-2 text-sm text-white/65">Flat across the board — the situation barely moves the needle.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {shifts.map(s => {
        const axis = CONTENT.axes.find(a => a.id === s.axisId)
        const dim = CONTENT.dims.find(d => d.id === s.dimId)
        if (!axis || !dim) return null
        return (
          <div key={`${s.axisId}.${s.dimId}`} className="rounded-beam border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
                {axis.name} → {dim.name}
              </span>
              <span className="text-[11px] uppercase tracking-wide text-white/40">
                {s.slope >= 0 ? 'rises' : 'falls'}
              </span>
            </div>
            <SlopeBeam slope={s.slope} accent={accent} />
            <div className="mt-1 flex justify-between text-[11px] text-white/40">
              <span>{axis.lowLabel}</span>
              <span>{axis.highLabel}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              {describeContingency(s.axisId, s.dimId, s.slope, CONTENT)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
