import type { InterplayInsight } from '../engine'
import { card, eyebrow, panel } from '../ui/styles'
import { accentOf } from '../archetypes/archetypeMeta'

const DYNAMIC_BADGES: Record<InterplayInsight['dynamic'], { label: string; bg: string; text: string }> = {
  tension: { label: 'Tension', bg: '#FFE3E3', text: '#C92A2A' },
  synergy: { label: 'Synergy', bg: '#D3F9D8', text: '#2B8A3E' },
  polarity: { label: 'Polarity', bg: '#E7F5FF', text: '#1971C2' },
}

export function InterplaySection({ insight }: { insight: InterplayInsight }) {
  const badge = DYNAMIC_BADGES[insight.dynamic]
  const leadAccent = accentOf(insight.lead.id)
  const coStarAccent = accentOf(insight.coStar.id)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className={eyebrow}>How your sides interact</h2>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
          style={{ background: badge.bg, color: badge.text }}
        >
          {badge.label}
        </span>
      </div>

      <div className={`${card} flex flex-col gap-4 p-5 sm:p-6`}>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold">
            <span className="h-3 w-3 rounded-full border border-ink" style={{ background: leadAccent }} />
            {insight.lead.name}
          </span>
          <span className="text-xs font-bold text-ink-soft">×</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold">
            <span className="h-3 w-3 rounded-full border border-ink" style={{ background: coStarAccent }} />
            {insight.coStar.name}
          </span>
        </div>

        <div>
          <h3 className="font-serif text-2xl font-bold tracking-tight">{insight.headline}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">{insight.body}</p>
        </div>

        {insight.hierarchy && (
          <div className={`${panel} mt-1 flex flex-col gap-1.5 bg-paper p-4`}>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">
              When they collide:
            </p>
            <p className="font-serif text-lg font-bold">
              {insight.hierarchy.winnerArchetype
                ? `${insight.hierarchy.winnerArchetype.name} takes the wheel`
                : 'You navigate the middle ground'}
            </p>
            <p className="text-sm italic text-ink-soft">“{insight.hierarchy.readout}”</p>
          </div>
        )}
      </div>
    </section>
  )
}
