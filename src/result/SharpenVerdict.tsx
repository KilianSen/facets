import type { SituationAxis } from '../engine/types'
import type { SharpenReadout } from '../engine'

/**
 * The payoff of an opt-in sharpen round: for each axis the user dug into, whether their big swing is
 * a rock-solid pattern or a genuine both-ways "it depends." Renders nothing if no axis was sharpened.
 */
export function SharpenVerdict({
  axes, readouts,
}: {
  axes: SituationAxis[]
  readouts: SharpenReadout[]
}) {
  if (readouts.length === 0) return null
  const nameOf = (id: string) => axes.find(a => a.id === id)?.name ?? id

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm uppercase tracking-widest text-white/50">Your deep-dive</h2>
      <ul className="flex flex-col gap-2">
        {readouts.map(r => (
          <li
            key={r.axisId}
            className={`rounded-xl border-l-2 px-4 py-3 text-sm ${
              r.verdict === 'solid'
                ? 'border-emerald-400/60 bg-emerald-400/5 text-white/85'
                : 'border-amber-400/60 bg-amber-400/5 text-white/85'
            }`}
          >
            <span className="font-medium">{nameOf(r.axisId)}</span>
            {r.verdict === 'solid'
              ? <> — <span className="text-emerald-300/90">a rock-solid read</span>. You shift here, and you do it the same way every time.</>
              : <> — <span className="text-amber-300/90">more situational than fixed</span>. When we dug in, it didn’t come out the same way twice.</>}
          </li>
        ))}
      </ul>
    </div>
  )
}
