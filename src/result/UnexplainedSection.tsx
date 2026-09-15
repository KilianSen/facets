import type { Contingency } from '../engine/types'
import { eyebrow, tag } from '../ui/styles'

/**
 * The shifts no type in your cast accounts for, said plainly — so a looser read still tells you
 * something true about you instead of just looking weak. Renders nothing when the cast covers it all.
 */
export function UnexplainedSection({ items }: { items: Contingency[] }) {
  if (items.length === 0) return null
  return (
    <section className="flex flex-col gap-2 rounded-card border-2 border-dashed border-ink bg-white p-5">
      <h2 className={eyebrow}>Also true about you</h2>
      <p className="text-sm text-ink-soft">No type in your cast covers these — they’re all yours.</p>
      <ul className="mt-1 flex flex-col gap-2">
        {items.map(c => (
          <li key={`${c.axis}.${c.dim}`} className="text-[15px] leading-relaxed">
            {c.kind === 'curve' && <span className={`${tag} mr-2 bg-coral-soft align-middle text-[10px] uppercase tracking-wide`}>both ways</span>}
            {c.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
