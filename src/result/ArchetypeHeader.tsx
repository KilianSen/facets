import type { Archetype } from '../engine/types'
import { Link } from '../router/router'
import { matchBand } from './matchBand'

export interface HeaderFacet { archetype: Archetype; lens: string }

export function ArchetypeHeader({
  archetype, confidence, runnerUpName, facets = [], code,
}: {
  archetype: Archetype
  confidence: number
  runnerUpName?: string
  /** secondary facets — when present they replace the runner-up line */
  facets?: HeaderFacet[]
  /** the full multi-facet code (defaults to the primary archetype's code) */
  code?: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="text-xs uppercase tracking-[0.25em] text-white/50">You are</span>
      <h1 className="font-display text-4xl font-bold leading-tight">{archetype.name}</h1>
      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[11px] tracking-wider text-accent-soft">{code ?? archetype.code}</span>
      <p className="text-sm text-white/80">{archetype.tagline}</p>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-white/70">{archetype.copy}</p>
      {facets.length > 0 && (
        <div className="mt-3 flex flex-col items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">Your other facets</span>
          <ul className="flex flex-wrap justify-center gap-2">
            {facets.map(f => (
              <li key={f.archetype.id}>
                <Link
                  to={`/archetypes/${f.archetype.id}`}
                  className="inline-flex items-baseline gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/85 transition-colors hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="font-medium">{f.archetype.name}</span>
                  <span className="text-white/45">{f.lens}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <span className="mt-3 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent-soft">{matchBand(confidence)}</span>
      {facets.length === 0 && runnerUpName && <span className="text-xs text-white/40">with a streak of {runnerUpName}</span>}
    </div>
  )
}
