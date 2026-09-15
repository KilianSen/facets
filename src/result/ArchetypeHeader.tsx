import { Fragment, type ReactNode } from 'react'
import type { Archetype } from '../engine/types'
import { Link } from '../router/router'
import { accentOf } from '../archetypes/archetypeMeta'
import { GemMini } from '../signature/SignatureGem'
import { shapeFromArchetype } from '../signature/shape'
import { btnSmall, card, eyebrow, panel, ring, stamp, tag } from '../ui/styles'
import { matchBand } from './matchBand'

export interface HeaderFacet {
  archetype: Archetype
  lens: string
  axisId?: string
  /** every situation this co-star explains (several for a blend) */
  axes?: string[]
  /** the user's own strongest shift on that situation — why this co-star showed up */
  tell?: string | null
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * The result as a profile with a cast: the main type's card (optional hero visual on top, co-stars named
 * right under the name), then a card per co-star (the facet types) and a dashed near-miss card for the
 * runner-up. Each secondary card can put itself in the 3D comparison via `onCompare`.
 */
export function ArchetypeHeader({
  archetype, confidence, facets = [], runnerUp, code, hero, onCompare, comparingId, motiveThroughLine,
}: {
  archetype: Archetype
  confidence: number
  /** secondary types on situations the main type doesn't cover */
  facets?: HeaderFacet[]
  /** the second-closest overall match, when it isn't already a co-star */
  runnerUp?: Archetype
  /** the full multi-facet code (defaults to the primary archetype's code) */
  code?: string
  /** a visual shown on the card above the name (the 3D signature on results) */
  hero?: ReactNode
  onCompare?: (archetypeId: string) => void
  comparingId?: string | null
  motiveThroughLine?: { name: string }
}) {
  const compareButton = (a: Archetype) => {
    if (!onCompare) return null
    const on = comparingId === a.id
    return (
      <button
        type="button"
        aria-pressed={on}
        aria-label={`Compare ${a.name} in 3D`}
        onClick={() => onCompare(a.id)}
        className={`${btnSmall} mt-2 self-start`}
        style={on ? { background: '#151515', color: '#FAF7F2' } : undefined}
      >
        {on ? 'Shown in 3D ✓' : 'Compare in 3D'}
      </button>
    )
  }

  const nameLink = (a: Archetype, size: string) => (
    <Link to={`/archetypes/${a.id}`} className={`w-fit rounded font-serif font-bold leading-tight tracking-tight hover:underline ${size} ${ring}`}>
      {a.name}
    </Link>
  )

  return (
    <div className="flex flex-col gap-4">
      <article className={`${card} overflow-hidden`}>
        <div aria-hidden="true" className="h-4 border-b-2 border-ink" style={{ background: accentOf(archetype.id) }} />
        {hero && <div className="border-b-2 border-ink bg-paper-deep">{hero}</div>}
        <div className="flex flex-col gap-3 px-6 pb-7 pt-6 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <span className={eyebrow}>You are</span>
            <div className="flex items-center gap-2">
              {motiveThroughLine && (
                <span className={`${tag} border-2 border-ink bg-white`}>Driven by {motiveThroughLine.name}</span>
              )}
              <span className={`${tag} bg-coral-soft`}>{matchBand(confidence)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="font-serif text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl">{archetype.name}</h1>
            {facets.length > 0 && (
              <p className="font-serif text-2xl font-semibold leading-snug tracking-tight sm:text-[1.7rem]">
                <span className="font-normal italic text-ink-soft">with </span>
                {facets.map((f, i) => (
                  <Fragment key={f.archetype.id}>
                    {i > 0 && (i === facets.length - 1 ? ' & ' : ', ')}
                    <span className="underline decoration-[5px] underline-offset-[6px]" style={{ textDecorationColor: accentOf(f.archetype.id) }}>
                      {f.archetype.name}
                    </span>
                  </Fragment>
                ))}
              </p>
            )}
          </div>
          <p className="font-serif text-xl italic leading-snug text-ink-soft">{archetype.tagline}</p>
          <p className="text-[15px] leading-relaxed text-ink-soft">{archetype.copy}</p>
          <div className="pt-1"><span className={stamp}>{code ?? archetype.code}</span></div>
        </div>
      </article>

      {(facets.length > 0 || runnerUp) && (
        <section className="flex flex-col gap-2.5">
          <h2 className={`${eyebrow} px-1`}>{facets.length > 0 ? 'Your co-stars' : 'So close'}</h2>
          <ul className="flex flex-col gap-3">
            {facets.map(f => (
              <li key={f.archetype.id} className={`${panel} flex gap-4 p-4 sm:p-5`}>
                <GemMini shape={shapeFromArchetype(f.archetype)} accent={accentOf(f.archetype.id)} className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
                    <span aria-hidden="true" className="h-3 w-3 rounded-full border-2 border-ink" style={{ background: accentOf(f.archetype.id) }} />
                    {capitalize(f.lens)}, I’m…
                  </span>
                  {nameLink(f.archetype, 'text-3xl')}
                  <span className="font-serif italic text-ink-soft">{f.archetype.tagline}</span>
                  {f.tell && <p className="mt-1.5 text-[15px] leading-relaxed">{f.tell}</p>}
                  {compareButton(f.archetype)}
                </div>
              </li>
            ))}
            {runnerUp && (
              <li className="flex gap-4 rounded-card border-2 border-dashed border-ink bg-paper p-4 sm:p-5">
                <GemMini shape={shapeFromArchetype(runnerUp)} accent={accentOf(runnerUp.id)} className="h-14 w-14 shrink-0 opacity-80 sm:h-16 sm:w-16" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={eyebrow}>You almost got…</span>
                  {nameLink(runnerUp, 'text-2xl')}
                  <span className="font-serif italic text-ink-soft">{runnerUp.tagline}</span>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    Your second-closest match overall — a few answers the other way and this would be your headline.
                  </p>
                  {compareButton(runnerUp)}
                </div>
              </li>
            )}
          </ul>
        </section>
      )}
    </div>
  )
}
