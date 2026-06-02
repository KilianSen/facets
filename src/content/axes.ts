import type { SituationAxis } from '../engine/types'

// highLabel / lowLabel are clauses that read after "When …".
export const AXES: SituationAxis[] = [
  { id: 'closeness',  name: 'Closeness',  lowLabel: "it's a stranger",          highLabel: "it's someone close" },
  { id: 'stakes',     name: 'Stakes',     lowLabel: "it's trivial",             highLabel: 'the stakes are high' },
  { id: 'audience',   name: 'Audience',   lowLabel: "it's just you",            highLabel: "you're being watched" },
  { id: 'energy',     name: 'Energy',     lowLabel: "you're drained",           highLabel: "you're energized" },
  { id: 'power',      name: 'Power',      lowLabel: "you've got no leverage",   highLabel: 'you hold the power' },
  { id: 'initiative', name: 'Initiative', lowLabel: 'they came to you',         highLabel: 'you make the first move' },
]
