import type { Archetype } from '../engine/types'
import { CONTENT } from '../content'

export interface Shift { axisId: string; dimId: string; slope: number; curvature?: number }

/** Every non-zero contingency of an archetype (slope and/or bend), strongest feature first. */
export function shiftsOf(a: Archetype): Shift[] {
  const byKey = new Map<string, Shift>()
  const at = (axisId: string, dimId: string) => {
    const k = `${axisId}.${dimId}`
    let s = byKey.get(k)
    if (!s) { s = { axisId, dimId, slope: 0 }; byKey.set(k, s) }
    return s
  }
  for (const [axisId, dims] of Object.entries(a.signature)) {
    for (const [dimId, slope] of Object.entries(dims)) if (slope) at(axisId, dimId).slope = slope
  }
  for (const [axisId, dims] of Object.entries(a.curve ?? {})) {
    for (const [dimId, curvature] of Object.entries(dims)) if (curvature) at(axisId, dimId).curvature = curvature
  }
  const strength = (s: Shift) => Math.max(Math.abs(s.slope), Math.abs(s.curvature ?? 0))
  return [...byKey.values()].sort((x, y) => strength(y) - strength(x))
}

// A behaviour dial as a line: its value (vertical) as the situation runs low → high (horizontal).
// The line rests at the dim's `baseline` lean (its midpoint height) and swings ±slope/2 around it —
// so magnitude reads as steepness and the baseline lifts/drops the whole line off-centre. This is
// what separates two types that share slopes but lean differently (e.g. The Vault vs The Nurturer).
const PX = 11 // px per behaviour unit
const GHOST_MAX = 8 // cap the faint prototype lines so the overlay stays readable

function endpoints(shift: Shift, baseline: Record<string, number>, center: number, span: number) {
  const lean = baseline[shift.dimId] ?? 0
  const curv = shift.curvature ?? 0
  const clamp = (v: number) => Math.max(-span, Math.min(span, v * PX))
  const y = (v: number) => center - clamp(v)
  // Quadratic shape: endpoints lift by the curvature, the midpoint rests at the lean. The control
  // point makes a quadratic Bézier pass through the mid — so curv=0 draws a straight line and a
  // non-zero curv bows it (a "both ways" bend).
  const y0 = y(lean - shift.slope / 2 + curv) // situation low
  const y1 = y(lean + shift.slope / 2 + curv) // situation high
  const yMid = y(lean)
  return { y0, y1, cpy: 2 * yMid - 0.5 * (y0 + y1) }
}

/**
 * The archetype's whole signature as one shape: every contingency line overlaid on a single
 * low → high situation axis. Distinct constellations emerge — a rising fan, an X-cross, a spread —
 * so no two archetypes read alike. `variant="full"` is the labelled detail-page hero; `"mini"` is
 * the unlabelled card thumbnail.
 */
export function Fingerprint({
  shifts, baseline, accent, variant, uid, activeKey = null, supportingKeys, ghost,
}: {
  shifts: Shift[]
  baseline: Record<string, number>
  accent: string
  variant: 'full' | 'mini'
  uid: string
  /** the hovered/focused line's `${axisId}.${dimId}` key — brightens it and fades the rest */
  activeKey?: string | null
  /** user-shift keys that align with the matched archetype — emphasised at rest, the rest muted */
  supportingKeys?: Set<string>
  /** an archetype prototype drawn faintly behind the user's lines, to show the fit */
  ghost?: { shifts: Shift[]; baseline: Record<string, number> }
}) {
  const interactive = activeKey !== null || supportingKeys !== undefined || ghost !== undefined
  const mini = variant === 'mini'
  const W = mini ? 44 : 320
  const H = mini ? 24 : 132
  const padX = mini ? 4 : 16
  const center = H / 2
  const span = center - (mini ? 4 : 14)
  const x1 = padX
  const x2 = W - padX

  if (shifts.length === 0) {
    // The Constant — context barely moves the needle; a single flat line says it.
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden={interactive ? undefined : 'true'}>
        <line x1={x1} y1={center} x2={x2} y2={center} stroke={accent} strokeWidth={mini ? 2 : 3} strokeLinecap="round" strokeOpacity="0.7" />
        {!mini && <circle cx={x2} cy={center} r="5" fill={accent} />}
      </svg>
    )
  }

  const xmid = (x1 + x2) / 2
  const strengthOf = (s: Shift) => Math.max(Math.abs(s.slope), Math.abs(s.curvature ?? 0))
  const lines = shifts.map(s => ({ s, ...endpoints(s, baseline, center, span) }))
  const steepest = Math.max(...shifts.map(strengthOf))
  // Faint prototype lines drawn behind the user's, so the fit is visible. Capped to keep it readable.
  const ghostLines = ghost
    ? ghost.shifts.slice(0, GHOST_MAX).map(s => ({ s, ...endpoints(s, ghost.baseline, center, span) }))
    : []

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden={interactive ? undefined : 'true'}>
      <defs>
        <linearGradient id={`fp-fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity={mini ? 0.18 : 0.16} />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {!mini && (
        <line x1={x1} y1={center} x2={x2} y2={center} stroke="white" strokeOpacity="0.08" strokeDasharray="3 5" />
      )}

      {ghostLines.map(({ s, y0, y1, cpy }) => (
        <path
          key={`ghost-${s.axisId}.${s.dimId}`}
          d={`M ${x1} ${y0} Q ${xmid} ${cpy} ${x2} ${y1}`} fill="none"
          stroke={accent} strokeWidth={1.5} strokeLinecap="round"
          strokeOpacity={activeKey ? 0.08 : 0.2} strokeDasharray="2 4"
        />
      ))}

      {lines.map(({ s, y0, y1, cpy }) => {
        const key = `${s.axisId}.${s.dimId}`
        // Resting emphasis is semantic when we know which shifts back the archetype; otherwise the
        // steepest line leads. A hover/focus on any chip overrides both: that line wins, rest recede.
        const supports = supportingKeys?.has(key) ?? false
        const emphasised = supportingKeys ? supports : strengthOf(s) === steepest
        const isActive = activeKey === key
        const w = mini ? 1.6 : (2 + strengthOf(s) * 0.5) + (isActive ? 1 : 0)
        const opacity = mini
          ? 0.55
          : activeKey
            ? (isActive ? 1 : 0.15)
            : emphasised ? 1 : 0.35
        const path = `M ${x1} ${y0} Q ${xmid} ${cpy} ${x2} ${y1}`
        return (
          <g key={key} style={interactive ? { transition: 'opacity 150ms' } : undefined}>
            {!mini && emphasised && !activeKey && (
              <path d={`${path} L ${x2} ${center} L ${x1} ${center} Z`} fill={`url(#fp-fill-${uid})`} />
            )}
            <path
              d={path} fill="none"
              stroke={accent} strokeWidth={w} strokeLinecap="round"
              strokeOpacity={opacity}
              style={interactive ? { transition: 'stroke-opacity 150ms, stroke-width 150ms' } : undefined}
            />
            {!mini && (
              <>
                <circle cx={x1} cy={y0} r="3.5" fill={accent} fillOpacity={activeKey && !isActive ? 0.1 : 0.35} />
                <circle cx={x2} cy={y1} r={isActive ? 5.5 : 4.5} fill={accent} fillOpacity={activeKey && !isActive ? 0.15 : 1} />
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/** Dim labels for each line, paired with their end-height — rendered as an HTML legend beside the
 * full fingerprint so overlapping lines stay readable without crowding the SVG. */
export function fingerprintLegend(shifts: Shift[]): { key: string; dim: string; axis: string; slope: number; curvature: number }[] {
  return shifts.map(s => {
    const axis = CONTENT.axes.find(a => a.id === s.axisId)
    const dim = CONTENT.dims.find(d => d.id === s.dimId)
    return { key: `${s.axisId}.${s.dimId}`, dim: dim?.name ?? s.dimId, axis: axis?.name ?? s.axisId, slope: s.slope, curvature: s.curvature ?? 0 }
  })
}
