import type { Archetype } from '../engine/types'
import { Link } from '../router/router'
import { panel, ring, tag, tint } from '../ui/styles'
import { GemMini } from '../signature/SignatureGem'
import { shapeFromArchetype } from '../signature/shape'
import { accentOf } from './archetypeMeta'

export function ArchetypeCard({ archetype }: { archetype: Archetype }) {
  const accent = accentOf(archetype.id)
  return (
    <Link
      to={`/archetypes/${archetype.id}`}
      aria-label={`${archetype.name} — ${archetype.tagline}`}
      className={`${panel} group flex h-full flex-col gap-3 p-5 transition-[transform,box-shadow] duration-150 hover:-translate-y-1 hover:shadow-hard ${ring}`}
    >
      <div className="flex items-start justify-between">
        <span className={tag} style={{ background: tint(accent) }}>{archetype.code}</span>
        <GemMini shape={shapeFromArchetype(archetype)} accent={accent} className="-mr-1 -mt-1 h-12 w-12 transition-transform duration-300 group-hover:rotate-[30deg]" />
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="font-serif text-2xl font-bold leading-tight tracking-tight">{archetype.name}</h3>
        <p className="font-serif text-sm italic text-ink-soft">{archetype.tagline}</p>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{archetype.copy}</p>
    </Link>
  )
}
