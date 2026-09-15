import type { Archetype } from '../engine/types'
import { ARCHETYPES } from '../content/archetypes'

/**
 * Presentation metadata for the archetype browse pages. Archetypes are organised into the situation
 * "lens" they pivot on (the axis their signature lives on), plus two cross-axis groups and the flat
 * one. Each group gets a flat print colour — saturated enough to read as a stroke or swatch on cream,
 * always paired with ink text — so the gallery reads as an organised spectrum, not a wall of lookalike tiles.
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
    accent: '#E4572E', archetypeIds: ['vault', 'open_book', 'peacekeeper', 'ride_or_die', 'home_turf', 'ringleader', 'plus_one', 'fierce_loyalist'],
  },
  {
    id: 'audience', label: 'Audience', spectrum: 'just you → all eyes on you',
    blurb: 'Who you become when the room is watching.',
    accent: '#D63F8C', archetypeIds: ['performer', 'backstage', 'menace', 'host', 'stage_fright', 'frontman', 'emcee', 'statesperson'],
  },
  {
    id: 'stakes', label: 'Stakes', spectrum: 'trivial → everything on the line',
    blurb: 'What pressure does to you when it actually counts.',
    accent: '#E3A008', archetypeIds: ['clutch', 'fumble', 'nurturer', 'cold_front', 'surgeon', 'first_responder'],
  },
  {
    id: 'power', label: 'Power', spectrum: 'no leverage → you hold the cards',
    blurb: 'How your voice changes with who has the upper hand.',
    accent: '#3B5BDB', archetypeIds: ['operator', 'underdog', 'reluctant_boss', 'patron', 'captain', 'ivory_tower', 'good_boss', 'heavyweight'],
  },
  {
    id: 'initiative', label: 'Initiative', spectrum: 'they came to you → you make the move',
    blurb: 'Whether you light up chasing or being chased.',
    accent: '#2B9348', archetypeIds: ['spark', 'prize', 'overthinker', 'closer', 'waiting_game', 'first_mover', 'deputy'],
  },
  {
    id: 'energy', label: 'Energy', spectrum: 'running on empty → fully charged',
    blurb: 'How much your battery runs the show.',
    accent: '#F08C00', archetypeIds: ['battery', 'runs_on_fumes', 'hangry', 'night_and_day', 'peace_at_all_costs', 'social_battery'],
  },
  {
    id: 'cross', label: 'Blends', spectrum: 'several situations at once',
    blurb: 'One pattern that runs across more than one situation — they can stand in for several separate types.',
    accent: '#7048E8', archetypeIds: ['chameleon', 'diplomat', 'wallflower', 'main_character'],
  },
  {
    id: 'curve', label: 'Both-ways', spectrum: 'low → middle → high',
    blurb: 'Non-monotonic types — shape curves rather than simple slopes.',
    accent: '#0C8599', archetypeIds: ['sweet_spot', 'small_room', 'butterfly', 'peer', 'green_light', 'middle_gear', 'all_or_nothing', 'adrenaline_addict', 'arena_intimacy', 'hierarch'],
  },
  {
    id: 'constant', label: 'The Constant', spectrum: 'context barely moves them',
    blurb: 'Same with everyone, everywhere.',
    accent: '#868E96', archetypeIds: ['constant'],
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
  return GROUP_BY_ID.get(id)?.accent ?? '#FF5A36'
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
