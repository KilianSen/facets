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
        const typ = pct(r.typical)
        return (
          <div key={d.id} className="text-xs">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-white/40">{d.lowLabel}</span>
              <span className="text-white/70">{d.name}</span>
              <span className="text-white/40">{d.highLabel}</span>
            </div>
            <div className="relative mt-1 h-1.5 w-full rounded-full bg-white/10">
              <div className="absolute h-1.5 rounded-full bg-sky-400/40" style={{ left: `${left}%`, width: `${width}%` }} />
              <div className="absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 rounded-full bg-sky-300" style={{ left: `${typ}%` }} aria-hidden="true" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
