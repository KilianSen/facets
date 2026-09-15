import type { BehaviorDim, Profile } from '../engine/types'
import { eyebrow, panel } from '../ui/styles'

// Heuristics tuned to the [-2, 2] dimension scale. A dial that ranges ≥ this much across situations
// reads as a genuine "swing"; one that leans at least this hard (and doesn't swing) reads as an
// "anchor". Both are deliberately forgiving — verify against a real run and adjust.
const SWING_MIN = 1.2
const LEAN_MIN = 0.4
const MAX_PER_GROUP = 3

interface Row { dim: BehaviorDim; min: number; max: number; typical: number; width: number }

// Map a [-2, 2] value onto a [0, 100]% scale for the range bar.
const pct = (v: number) => Math.max(0, Math.min(100, ((v + 2) / 4) * 100))

function RangeBar({ row }: { row: Row }) {
  const left = pct(row.min)
  const width = Math.max(3, pct(row.max) - pct(row.min))
  return (
    <div className="relative mt-1.5 h-3 w-full rounded-full border-2 border-ink bg-white">
      <div className="absolute inset-y-0 rounded-full bg-coral" style={{ left: `${left}%`, width: `${width}%` }} />
      <div className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-ink" style={{ left: `${pct(row.typical)}%` }} aria-hidden="true" />
    </div>
  )
}

function Group({ title, rows, right }: { title: string; rows: Row[]; right: (r: Row) => string }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className={eyebrow}>{title}</h3>
      {rows.map(r => (
        <div key={r.dim.id} className="text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold">{r.dim.name}</span>
            <span className="text-ink-soft">{right(r)}</span>
          </div>
          <RangeBar row={r} />
        </div>
      ))}
    </div>
  )
}

/**
 * The per-dimension data as a plain-language story rather than a wall of bars: the dials that stay put
 * (your anchors) vs the ones the situation swings most.
 */
export function DimensionStory({ dims, ranges }: { dims: BehaviorDim[]; ranges: Profile['dimensionRanges'] }) {
  const rows: Row[] = dims
    .map(d => {
      const r = ranges[d.id] ?? { min: 0, max: 0, typical: 0 }
      return { dim: d, min: r.min, max: r.max, typical: r.typical, width: r.max - r.min }
    })
    .filter(r => r.max !== r.min || r.typical !== 0) // drop dims with no measured signal

  const swings = [...rows].filter(r => r.width >= SWING_MIN).sort((a, b) => b.width - a.width).slice(0, MAX_PER_GROUP)
  const swingIds = new Set(swings.map(r => r.dim.id))
  const anchors = rows
    .filter(r => !swingIds.has(r.dim.id) && Math.abs(r.typical) >= LEAN_MIN)
    .sort((a, b) => Math.abs(b.typical) - Math.abs(a.typical))
    .slice(0, MAX_PER_GROUP)

  return (
    <section className={`${panel} flex flex-col gap-5 p-5 sm:p-6`}>
      <h2 className="font-serif text-2xl font-bold tracking-tight">The breakdown</h2>
      {swings.length === 0 && anchors.length === 0 ? (
        <p className="text-[15px] text-ink-soft">You land near the middle across the board — no strong anchors or swings.</p>
      ) : (
        <>
          {anchors.length > 0 && <Group title="What’s constant about you" rows={anchors} right={r => `you ${r.typical >= 0 ? r.dim.highLabel : r.dim.lowLabel}`} />}
          {swings.length > 0 && <Group title="What shifts most" rows={swings} right={r => `${r.dim.lowLabel} → ${r.dim.highLabel}`} />}
        </>
      )}
    </section>
  )
}
