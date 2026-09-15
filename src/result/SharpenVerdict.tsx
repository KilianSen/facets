import type { SituationAxis } from '../engine/types'
import type { SharpenReadout } from '../engine'
import { eyebrow, panel } from '../ui/styles'

/**
 * The payoff of an opt-in sharpen round: for each axis the user dug into, whether their big swing is
 * a rock-solid pattern or a genuine both-ways "it depends." Renders nothing if no axis was sharpened.
 */
export function SharpenVerdict({ axes, readouts }: { axes: SituationAxis[]; readouts: SharpenReadout[] }) {
  if (readouts.length === 0) return null
  const nameOf = (id: string) => axes.find(a => a.id === id)?.name ?? id

  return (
    <section className="flex flex-col gap-2.5">
      <h2 className={`${eyebrow} px-1`}>Your deep-dive</h2>
      <ul className="flex flex-col gap-2.5">
        {readouts.map(r => (
          <li key={r.axisId} className={`${panel} flex gap-3 p-4`}>
            <span
              aria-hidden="true"
              className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-ink ${r.verdict === 'solid' ? 'bg-[#69DB7C]' : 'bg-[#FFD43B]'}`}
            />
            <p className="text-[15px] leading-relaxed">
              <span className="font-bold">{nameOf(r.axisId)}</span>
              {r.verdict === 'solid'
                ? <> — <span className="font-semibold">a rock-solid read</span>. You shift here, and you do it the same way every time.</>
                : <> — <span className="font-semibold">more situational than fixed</span>. When we dug in, it didn’t come out the same way twice.</>}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
