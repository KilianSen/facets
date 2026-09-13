import type { Archetype } from '../engine/types'
import { ARCHETYPES } from '../content/archetypes'

/**
 * Presentation metadata for the archetype browse pages. Archetypes are organised into the situation
 * "lens" they pivot on (the axis their signature lives on), plus two cross-axis groups and the flat
 * one. Each group gets a signature hue — jewel tones on ink, cohesive with the cyan↔fuchsia brand —
 * so the gallery reads as an organised spectrum rather than 22 undifferentiated tiles.
 */
export interface ArchetypeGroup {
  id: string
  label: string
  /** the situation that moves this group, framed low → high */
  spectrum: string
  /** one-line on what shifts */
  blurb: string
  accent: string
  archetypeIds: string[]
}

export const ARCHETYPE_GROUPS: ArchetypeGroup[] = [
  {
    id: 'closeness', label: 'Closeness', spectrum: 'a stranger → someone close',
    blurb: 'How your guard moves with the people in the room.',
    accent: '#22d3ee', archetypeIds: ['vault', 'open_book', 'peacekeeper', 'ride_or_die'],
  },
  {
    id: 'audience', label: 'Audience', spectrum: 'just you → all eyes on you',
    blurb: 'Who you become when the room is watching.',
    accent: '#d946ef', archetypeIds: ['performer', 'backstage', 'menace', 'wallflower'],
  },
  {
    id: 'stakes', label: 'Stakes', spectrum: 'trivial → everything on the line',
    blurb: 'What pressure does to you when it actually counts.',
    accent: '#f59e0b', archetypeIds: ['clutch', 'fumble', 'nurturer'],
  },
  {
    id: 'power', label: 'Power', spectrum: 'no leverage → you hold the cards',
    blurb: 'How your voice changes with who has the upper hand.',
    accent: '#818cf8', archetypeIds: ['operator', 'underdog'],
  },
  {
    id: 'initiative', label: 'Initiative', spectrum: 'they came to you → you make the move',
    blurb: 'Whether you light up chasing or being chased.',
    accent: '#34d399', archetypeIds: ['spark', 'prize'],
  },
  {
    id: 'energy', label: 'Energy', spectrum: 'running on empty → fully charged',
    blurb: 'How much your battery runs the show.',
    accent: '#fb7185', archetypeIds: ['battery', 'runs_on_fumes'],
  },
  {
    id: 'cross', label: 'Shape-shifters', spectrum: 'many axes at once',
    blurb: 'The ones who pivot on more than one thing.',
    accent: '#a78bfa', archetypeIds: ['chameleon', 'diplomat'],
  },
  {
    id: 'curve', label: 'Both-ways', spectrum: 'low → middle → high',
    blurb: 'Non-monotonic types — strongest in the middle, not at one end.',
    accent: '#5eead4', archetypeIds: ['sweet_spot', 'small_room'],
  },
  {
    id: 'constant', label: 'The Constant', spectrum: 'context barely moves them',
    blurb: 'Same with everyone, everywhere.',
    accent: '#94a3b8', archetypeIds: ['constant'],
  },
]

const BY_ID = new Map(ARCHETYPES.map(a => [a.id, a]))
const GROUP_BY_ID = new Map<string, ArchetypeGroup>()
for (const g of ARCHETYPE_GROUPS) for (const id of g.archetypeIds) GROUP_BY_ID.set(id, g)

export function getArchetype(id: string): Archetype | undefined {
  return BY_ID.get(id)
}

export function groupOf(id: string): ArchetypeGroup | undefined {
  return GROUP_BY_ID.get(id)
}

export function accentOf(id: string): string {
  return GROUP_BY_ID.get(id)?.accent ?? '#22d3ee'
}

/** Other archetypes that pivot on the same situation — the natural "if not this, then…" set. */
export function relatedArchetypes(id: string): Archetype[] {
  const g = GROUP_BY_ID.get(id)
  if (!g) return []
  return g.archetypeIds.filter(x => x !== id).map(x => BY_ID.get(x)).filter((a): a is Archetype => !!a)
}

/** Every archetype, in gallery order (grouped). */
export const ARCHETYPES_IN_ORDER: Archetype[] = ARCHETYPE_GROUPS.flatMap(g =>
  g.archetypeIds.map(id => BY_ID.get(id)).filter((a): a is Archetype => !!a),
)
