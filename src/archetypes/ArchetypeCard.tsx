import type { Archetype } from '../engine/types'
import { Link } from '../router/router'
import { accentOf } from './archetypeMeta'

// The single strongest shift, as a compact rising/falling tick for the card preview.
function topSlope(a: Archetype): number {
  let best = 0
  for (const dims of Object.values(a.signature)) {
    for (const slope of Object.values(dims)) if (Math.abs(slope) > Math.abs(best)) best = slope
  }
  return best
}

export function ArchetypeCard({ archetype }: { archetype: Archetype }) {
  const accent = accentOf(archetype.id)
  const slope = topSlope(archetype)
  const off = Math.max(-14, Math.min(14, slope * 4))

  return (
    <Link
      to={`/archetypes/${archetype.id}`}
      aria-label={`${archetype.name} — ${archetype.tagline}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-beam border border-white/10 bg-white/[0.025] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      style={{ ['--tw-ring-color' as string]: accent }}
    >
      {/* accent wash that blooms on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl transition-opacity duration-300 group-hover:opacity-50"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between">
        <span
          className="rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-wider"
          style={{ color: accent, borderColor: `${accent}55` }}
        >
          {archetype.code}
        </span>
        <svg viewBox="0 0 44 24" className="h-5 w-11" aria-hidden="true">
          <line x1="4" y1={12 + off} x2="40" y2={12 - off} stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="40" cy={12 - off} r="3" fill={accent} />
        </svg>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-xl font-semibold leading-tight text-white">{archetype.name}</h3>
        <p className="text-xs text-white/55">{archetype.tagline}</p>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-white/65">{archetype.copy}</p>
    </Link>
  )
}
