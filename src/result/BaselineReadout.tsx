import type { BehaviorDim } from '../engine/types'

export function BaselineReadout({
  dims, baseline, flexibility,
}: {
  dims: BehaviorDim[]
  baseline: Record<string, number>
  flexibility: number
}) {
  const leans = dims
    .map(d => ({ d, v: baseline[d.id] ?? 0 }))
    .filter(x => Math.abs(x.v) >= 0.5)
    .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
    .slice(0, 3)
    .map(x => (x.v >= 0 ? x.d.highLabel : x.d.lowLabel))

  const flexLabel = flexibility >= 1.5 ? 'highly context-driven' : flexibility >= 0.6 ? 'situational' : 'steady across situations'

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-sm uppercase tracking-widest text-white/50">Your baseline</h2>
      {leans.length > 0
        ? <p className="text-sm text-white/85">Across the board you tend to {leans.join(' · ')}.</p>
        : <p className="text-sm text-white/85">You sit near the middle on most things.</p>}
      <p className="text-xs text-white/50">Overall, you’re {flexLabel}.</p>
    </div>
  )
}
