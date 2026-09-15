import type { Answer, SituationAxis } from '../engine/types'
import { CROSSROADS_DILEMMAS, isCrossroadsAnswer } from '../content/crossroads'
import { eyebrow, panel } from '../ui/styles'

/** Every crossroads you answered: what you'd do when two situations pull opposite ways, and which one wins. */
export function CollideSection({ answers, axes }: { answers: Answer[]; axes: SituationAxis[] }) {
  const nameOf = (id: string) => axes.find(a => a.id === id)?.name ?? id
  const picks = answers.flatMap(a => {
    if (a.mode !== 'single' || !isCrossroadsAnswer(a.questionId)) return []
    const dilemma = CROSSROADS_DILEMMAS.find(d => d.id === a.questionId)
    const option = dilemma?.options.find(o => o.id === a.optionId)
    return dilemma && option ? [{ dilemma, option }] : []
  })
  if (picks.length === 0) return null

  return (
    <section className="flex flex-col gap-2.5">
      <h2 className={`${eyebrow} px-1`}>When situations collide</h2>
      <ul className="flex flex-col gap-2.5">
        {picks.map(({ dilemma, option }) => (
          <li key={dilemma.id} className={`${panel} flex flex-col gap-1.5 p-4`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-serif text-lg font-semibold">{dilemma.title}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                {nameOf(dilemma.axes[0])} × {nameOf(dilemma.axes[1])}
              </span>
            </div>
            <p className="text-[15px] leading-relaxed">
              <span className="font-bold">
                {option.favorsAxis === 'balance' ? 'You balance both.' : `${nameOf(option.favorsAxis)} wins.`}
              </span>{' '}
              {option.explanation}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
