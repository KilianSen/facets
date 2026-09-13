import type { Archetype } from '../engine/types'
import { describeContingency, describeCurvature, CURVE_MEANINGFUL } from '../engine'
import { CONTENT } from '../content'
import { Fingerprint, fingerprintLegend, shiftsOf, type Shift } from './Fingerprint'

const isCurve = (s: Shift) =>
  Math.abs(s.curvature ?? 0) >= CURVE_MEANINGFUL && Math.abs(s.curvature ?? 0) > Math.abs(s.slope)

// A single contingency as an enriched beam: the dim rests at its baseline lean (vertical midpoint)
// and runs low → high. A slope tilts the line; a curvature bows it (quadratic Bézier through the
// midpoint), so a "both ways" bend reads differently from a straight swing. Thicker = stronger.
function RowBeam({ shift, baseline, accent, uid }: { shift: Shift; baseline: Record<string, number>; accent: string; uid: string }) {
  const PX = 11
  const center = 36
  const span = 30
  const lean = baseline[shift.dimId] ?? 0
  const curv = shift.curvature ?? 0
  const clamp = (v: number) => Math.max(-span, Math.min(span, v * PX))
  const y = (v: number) => center - clamp(v)
  const yLow = y(lean - shift.slope / 2 + curv)
  const yHigh = y(lean + shift.slope / 2 + curv)
  const cpy = 2 * y(lean) - 0.5 * (yLow + yHigh) // control so the Bézier passes through the midpoint
  const w = 2 + Math.max(Math.abs(shift.slope), Math.abs(curv)) * 0.5
  const gid = `slope-${uid}` // unique per (axis,dim) so two equal-strength rows don't share a gradient id
  const path = `M 14 ${yLow} Q 160 ${cpy} 306 ${yHigh}`
  return (
    <svg viewBox="0 0 320 72" className="h-16 w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={accent} stopOpacity="0.15" />
          <stop offset="1" stopColor={accent} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.16" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="14" y1="36" x2="306" y2="36" stroke="white" strokeOpacity="0.08" strokeDasharray="3 5" />
      <path d={`${path} L 306 36 L 14 36 Z`} fill={`url(#${gid}-fill)`} />
      <path d={path} fill="none" stroke={`url(#${gid})`} strokeWidth={w} strokeLinecap="round" />
      <circle cx="14" cy={yLow} r="4" fill={accent} fillOpacity="0.4" />
      <circle cx="306" cy={yHigh} r="5" fill={accent} />
    </svg>
  )
}

/**
 * The archetype's signature: how each behaviour dial moves as a situation intensifies. Leads with a
 * single "fingerprint" overlay — every dial on one plot, so the whole shape reads at a glance — then
 * breaks each shift out into its own labelled beam. Falls back to a flat read for The Constant.
 */
export function SignatureGraph({ archetype, accent }: { archetype: Archetype; accent: string }) {
  const shifts = shiftsOf(archetype)
  const baseline = archetype.baseline ?? {}

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

  const legend = fingerprintLegend(shifts)

  return (
    <div className="flex flex-col gap-4">
      {/* Fingerprint overlay — the whole signature as one shape */}
      <div className="rounded-beam border border-white/10 bg-white/[0.03] p-5">
        <span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
          Your signature
        </span>
        <div className="mt-3 h-28 w-full sm:h-32">
          <Fingerprint shifts={shifts} baseline={baseline} accent={accent} variant="full" uid={archetype.id} />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-white/40">
          <span>low situation</span>
          <span>high situation</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {legend.map(l => {
            const curvy = Math.abs(l.curvature) >= CURVE_MEANINGFUL && Math.abs(l.curvature) > Math.abs(l.slope)
            const glyph = curvy ? (l.curvature > 0 ? '∪' : '∩') : l.slope >= 0 ? '↑' : '↓'
            return (
              <span
                key={l.key}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1.5 pr-3 text-[11px] text-white/70"
              >
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: accent, opacity: curvy || l.slope >= 0 ? 1 : 0.5 }} />
                {l.dim}
                <span className="text-white/35">{glyph}</span>
              </span>
            )
          })}
        </div>
      </div>

      {/* Per-shift breakdown */}
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
                {isCurve(s) ? 'both ways' : s.slope >= 0 ? 'rises' : 'falls'}
              </span>
            </div>
            <RowBeam shift={s} baseline={baseline} accent={accent} uid={`${s.axisId}-${s.dimId}`} />
            <div className="mt-1 flex justify-between text-[11px] text-white/40">
              <span>{axis.lowLabel}</span>
              <span>{axis.highLabel}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              {isCurve(s)
                ? describeCurvature(s.axisId, s.dimId, s.curvature ?? 0, CONTENT)
                : describeContingency(s.axisId, s.dimId, s.slope, CONTENT)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
