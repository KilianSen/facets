import type { BehaviorDim, Profile } from '../engine/types'

export function DimensionRanges({ dims, ranges }: { dims: BehaviorDim[]; ranges: Profile['dimensionRanges'] }) {
  // Map a [-2, 2] value onto a [0, 100]% scale for display.
  const pct = (v: number) => Math.max(0, Math.min(100, ((v + 2) / 4) * 100))
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm uppercase tracking-widest text-white/50">Under the hood</h2>
      {dims.map(d => {
        const r = ranges[d.id] ?? { min: 0, max: 0, typical: 0 }
        const left = pct(r.min)
        const width = Math.max(2, pct(r.max) - pct(r.min))
        return (
          <div key={d.id} className="text-xs">
            <span className="text-white/70">{d.name}</span>
            <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
              <div className="h-1.5 rounded-full bg-sky-400/70" style={{ marginLeft: `${left}%`, width: `${width}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
