import type { SituationAxis } from '../engine/types'
import type { HeadToHeadEntry } from '../engine'
import { accentOf } from '../archetypes/archetypeMeta'
import { eyebrow, panel } from '../ui/styles'

/** Chapter 1's payoff: how clearly your type beat its closest look-alikes on its own situations. */
export function HeadToHeadSection({
  result, axes,
}: {
  result: { axes: string[]; lead: HeadToHeadEntry; rivals: HeadToHeadEntry[] }
  axes: SituationAxis[]
}) {
  const where = result.axes.map(id => axes.find(a => a.id === id)?.name.toLowerCase() ?? id).join(' & ')
  const rows = [{ ...result.lead, you: true }, ...result.rivals.map(r => ({ ...r, you: false }))].sort((x, y) => y.share - x.share)
  const closest = result.rivals.reduce<HeadToHeadEntry | null>((best, r) => (!best || r.share > best.share ? r : best), null)
  const gap = closest ? Math.round(100 * (result.lead.share - closest.share)) : 0

  return (
    <section className="flex flex-col gap-2.5">
      <h2 className={`${eyebrow} px-1`}>Which one are you?</h2>
      <div className={`${panel} flex flex-col gap-3 p-4`}>
        <p className="text-[15px] leading-relaxed">
          How much of your shift on <span className="font-bold">{where}</span> each type explains.
          {closest && (gap >= 15
            ? <> A clear call over {closest.archetype.name}.</>
            : gap > 0
              ? <> A close call with {closest.archetype.name}.</>
              : <> {closest.archetype.name} fits you just as well here.</>)}
        </p>
        <ul className="flex flex-col gap-2">
          {rows.map(r => {
            const pct = Math.round(100 * r.share)
            return (
              <li key={r.archetype.id} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-bold">
                    {r.archetype.name}
                    {r.you && <span className="ml-1.5 font-medium text-ink-soft">your type</span>}
                  </span>
                  <span className="tabular-nums font-bold">{pct}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-white" aria-hidden="true">
                  <div className="h-full" style={{ width: `${pct}%`, background: accentOf(r.archetype.id) }} />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
