import type { BehaviorDim, Profile } from '../engine/types'

// Heuristics tuned to the [-2, 2] dimension scale. A dial that ranges ≥ this much across situations
// reads as a genuine "swing"; one that leans at least this hard (and doesn't swing) reads as an
// "anchor". Both are deliberately forgiving — verify against a real run and adjust.
const SWING_MIN = 1.2
const LEAN_MIN = 0.4
const MAX_PER_GROUP = 3

interface Row { dim: BehaviorDim; min: number; max: number; typical: number; width: number }

// Map a [-2, 2] value onto a [0, 100]% scale for the slim range bar.
const pct = (v: number) => Math.max(0, Math.min(100, ((v + 2) / 4) * 100))

function RangeBar({ row }: { row: Row }) {
  const left = pct(row.min)
  const width = Math.max(2, pct(row.max) - pct(row.min))
  const typ = pct(row.typical)
  return (
    <div className="relative mt-1 h-1.5 w-full rounded-full bg-white/10">
      <div className="absolute h-1.5 rounded-full bg-sky-400/40" style={{ left: `${left}%`, width: `${width}%` }} />
      <div className="absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 rounded-full bg-sky-300" style={{ left: `${typ}%` }} aria-hidden="true" />
    </div>
  )
}

/**
 * The per-dimension data as a plain-language story rather than a wall of bars: the dials that stay put
 * (your anchors) vs the ones the situation swings most. Replaces the old "Under the hood" ranges.
 */
export function DimensionStory({ dims, ranges }: { dims: BehaviorDim[]; ranges: Profile['dimensionRanges'] }) {
  const rows: Row[] = dims
    .map(d => {
      const r = ranges[d.id] ?? { min: 0, max: 0, typical: 0 }
      return { dim: d, min: r.min, max: r.max, typical: r.typical, width: r.max - r.min }
    })
    .filter(r => r.max !== r.min || r.typical !== 0) // drop dims with no measured signal

  const swings = [...rows]
    .filter(r => r.width >= SWING_MIN)
    .sort((a, b) => b.width - a.width)
    .slice(0, MAX_PER_GROUP)

  const swingIds = new Set(swings.map(r => r.dim.id))
  const anchors = rows
    .filter(r => !swingIds.has(r.dim.id) && Math.abs(r.typical) >= LEAN_MIN)
    .sort((a, b) => Math.abs(b.typical) - Math.abs(a.typical))
    .slice(0, MAX_PER_GROUP)

  if (swings.length === 0 && anchors.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <h2 className="text-sm uppercase tracking-widest text-white/50">The breakdown</h2>
        <p className="text-sm text-white/60">You land near the middle across the board — no strong anchors or swings.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-sm uppercase tracking-widest text-white/50">The breakdown</h2>

      {anchors.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-white/40">What’s constant about you</h3>
          {anchors.map(r => (
            <div key={r.dim.id} className="text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-white/80">{r.dim.name}</span>
                <span className="text-white/55">you {r.typical >= 0 ? r.dim.highLabel : r.dim.lowLabel}</span>
              </div>
              <RangeBar row={r} />
            </div>
          ))}
        </div>
      )}

      {swings.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-white/40">What shifts most</h3>
          {swings.map(r => (
            <div key={r.dim.id} className="text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-white/80">{r.dim.name}</span>
                <span className="text-white/55">{r.dim.lowLabel} → {r.dim.highLabel}</span>
              </div>
              <RangeBar row={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
