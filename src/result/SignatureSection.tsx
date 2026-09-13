import { useState } from 'react'
import type { Archetype, BehaviorDim, Contingency, Profile } from '../engine/types'
import { CURVE_MEANINGFUL } from '../engine'
import { Fingerprint, fingerprintLegend, shiftsOf, type Shift } from '../archetypes/Fingerprint'

// Below this magnitude a measured slope is noise/flat, not a tell — drop it so the graph stays
// readable. Real decisive swings run well above this; near-zero ones just clutter the plot.
const MEANINGFUL = 0.5
const MAX_LINES = 8

// Strongest feature of a cell — its slope OR its bend, whichever is larger.
const strength = (slope: number, curvature: number) => Math.max(Math.abs(slope), Math.abs(curvature))

/** Pull every meaningful situation→behaviour shift (trend OR bend) out of the signature grid. */
function shiftsFromSignature(signature: Profile['signature']): Shift[] {
  const out: Shift[] = []
  for (const [axisId, dims] of Object.entries(signature)) {
    for (const [dimId, cell] of Object.entries(dims)) {
      if (Math.abs(cell.slope) >= MEANINGFUL || Math.abs(cell.curvature) >= CURVE_MEANINGFUL) {
        out.push({ axisId, dimId, slope: cell.slope, curvature: cell.curvature })
      }
    }
  }
  return out.sort((a, b) => strength(b.slope, b.curvature ?? 0) - strength(a.slope, a.curvature ?? 0)).slice(0, MAX_LINES)
}

/** One closing sentence: the strongest baseline leans + an overall flexibility read. */
function baselineLine(dims: BehaviorDim[], baseline: Record<string, number>, flexibility: number): string {
  // Real baselines compress toward ~0.1–0.4, so the lean threshold is low.
  const leans = dims
    .map(d => ({ d, v: baseline[d.id] ?? 0 }))
    .filter(x => Math.abs(x.v) >= 0.2)
    .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
    .slice(0, 3)
    .map(x => (x.v >= 0 ? x.d.highLabel : x.d.lowLabel))
  // flexibility is mean |slope|; real values run ~1.4–3.6.
  const flex = flexibility >= 2.5 ? 'highly context-driven' : flexibility >= 1.0 ? 'situational' : 'steady across situations'
  return leans.length > 0
    ? `Across the board you tend to ${leans.join(' · ')} — overall, you're ${flex}.`
    : `You sit near the middle on most things — overall, you're ${flex}.`
}

/**
 * The whole result as one block: your signature graph up top, the strongest tells spelled out beneath
 * it, and a one-line baseline read to close. Replaces the old separate tells / graph / baseline trio.
 */
/** Is this shift's curvature its dominant feature (a "both ways" bend rather than a trend)? */
const isCurvy = (slope: number, curvature: number) =>
  Math.abs(curvature) >= CURVE_MEANINGFUL && Math.abs(curvature) > Math.abs(slope)

export function SignatureSection({
  signature, baseline, contingencies, flexibility, dims, accent, archetype,
}: {
  signature: Profile['signature']
  baseline: Record<string, number>
  contingencies: Contingency[]
  flexibility: number
  dims: BehaviorDim[]
  accent: string
  /** the matched archetype — drives the "what infers it" marking + the prototype ghost */
  archetype?: Archetype
}) {
  const shifts = shiftsFromSignature(signature)
  const line = baselineLine(dims, baseline, flexibility)
  const [active, setActive] = useState<string | null>(null)

  // Which of the user's shifts actually back the assigned archetype: the prototype has a non-zero
  // value at the same axis×dim AND its direction agrees with the user's dominant feature. This is the
  // explainable signal behind the Euclidean fit in matchArchetype().
  const marked = archetype !== undefined
  const protoByKey = new Map(
    archetype ? shiftsOf(archetype).map(s => [`${s.axisId}.${s.dimId}`, s] as const) : [],
  )
  const supportingKeys = new Set(
    shifts
      .filter(s => {
        const p = protoByKey.get(`${s.axisId}.${s.dimId}`)
        if (!p) return false
        return isCurvy(s.slope, s.curvature ?? 0)
          ? (p.curvature ?? 0) !== 0 && Math.sign(s.curvature ?? 0) === Math.sign(p.curvature ?? 0)
          : p.slope !== 0 && Math.sign(s.slope) === Math.sign(p.slope)
      })
      .map(s => `${s.axisId}.${s.dimId}`),
  )

  const dimById = new Map(dims.map(d => [d.id, d]))
  // One-line plain-language read of a legend entry, for its hover/focus tooltip.
  const tellPhrase = (l: ReturnType<typeof fingerprintLegend>[number]) => {
    const axis = l.axis.toLowerCase()
    if (isCurvy(l.slope, l.curvature)) {
      return l.curvature > 0
        ? `${l.dim} dips in the middle of ${axis}, climbing toward the extremes.`
        : `${l.dim} peaks in the middle of ${axis}, easing toward the extremes.`
    }
    const d = dimById.get(l.key.split('.')[1])
    const dir = d ? (l.slope >= 0 ? d.highLabel : d.lowLabel) : l.slope >= 0 ? 'lean higher' : 'lean lower'
    return `You ${dir} as ${axis} rises.`
  }

  if (shifts.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <h2 className="text-sm uppercase tracking-widest text-white/50">Your signature</h2>
        <p className="text-sm text-white/85">You stay remarkably consistent across situations.</p>
        <p className="text-xs text-white/50">{line}</p>
      </div>
    )
  }

  const legend = fingerprintLegend(shifts)
  const tells = contingencies.slice(0, 3)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm uppercase tracking-widest text-white/50">Your signature</h2>
        <p className="text-xs text-white/50">
          You don’t have one mode — here’s how you shift.{' '}
          {marked && archetype && <>Lit lines are the ones that point to {archetype.name}.</>}
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="h-28 w-full sm:h-32">
          <Fingerprint
            shifts={shifts} baseline={baseline} accent={accent} variant="full" uid="result"
            activeKey={active}
            supportingKeys={marked ? supportingKeys : undefined}
            ghost={archetype ? { shifts: shiftsOf(archetype), baseline: archetype.baseline ?? {} } : undefined}
          />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-white/40">
          <span>low situation</span>
          <span>high situation</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {legend.map(l => {
            const curvy = isCurvy(l.slope, l.curvature)
            const glyph = curvy ? (l.curvature > 0 ? '∪' : '∩') : l.slope >= 0 ? '↑' : '↓'
            const supports = supportingKeys.has(l.key)
            const phrase = tellPhrase(l)
            const tone = !marked
              ? 'border-white/10 bg-white/[0.03] text-white/70'
              : supports
                ? 'border-accent/40 bg-accent/10 text-white/90'
                : 'border-white/10 bg-white/[0.03] text-white/55'
            const dotOpacity = !marked ? (curvy || l.slope >= 0 ? 1 : 0.5) : supports ? 1 : 0.4
            return (
              <span key={l.key} className="group relative">
                <button
                  type="button"
                  onMouseEnter={() => setActive(l.key)}
                  onMouseLeave={() => setActive(a => (a === l.key ? null : a))}
                  onFocus={() => setActive(l.key)}
                  onBlur={() => setActive(a => (a === l.key ? null : a))}
                  aria-label={`${l.dim}: ${phrase}${supports && archetype ? ` Supports your ${archetype.name} match.` : ''}`}
                  className={`flex items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-2.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-ink ${tone}`}
                  style={{ ['--tw-ring-color' as string]: accent }}
                >
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: accent, opacity: dotOpacity }} />
                  {l.dim}
                  <span className="text-white/35">{glyph} {l.axis.toLowerCase()}</span>
                </button>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden w-max max-w-[15rem] -translate-x-1/2 rounded-lg border border-white/10 bg-ink/95 px-2.5 py-1.5 text-left text-[11px] leading-snug text-white/80 shadow-lg group-hover:block group-focus-within:block"
                >
                  {phrase}
                  {supports && archetype && (
                    <span className="mt-0.5 block text-accent-soft">Supports your {archetype.name} match.</span>
                  )}
                </span>
              </span>
            )
          })}
        </div>
      </div>

      {tells.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {tells.map(c => (
            <li key={`${c.axis}.${c.dim}`} className="text-sm leading-relaxed text-white/85">
              {c.kind === 'curve' && (
                <span className="mr-1.5 rounded-full bg-accent/15 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-accent-soft">
                  both ways
                </span>
              )}
              {c.text}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-white/50">{line}</p>
    </div>
  )
}
