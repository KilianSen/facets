import type { Archetype } from '../engine/types'
import { Link } from '../router/router'
import { accentOf } from './archetypeMeta'
import { Fingerprint, shiftsOf } from './Fingerprint'

export function ArchetypeCard({ archetype }: { archetype: Archetype }) {
  const accent = accentOf(archetype.id)
  const shifts = shiftsOf(archetype)

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
        <span className="block h-6 w-12" aria-hidden="true">
          <Fingerprint shifts={shifts} baseline={archetype.baseline ?? {}} accent={accent} variant="mini" uid={archetype.id} />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-xl font-semibold leading-tight text-white">{archetype.name}</h3>
        <p className="text-xs text-white/55">{archetype.tagline}</p>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-white/65">{archetype.copy}</p>
    </Link>
  )
}
