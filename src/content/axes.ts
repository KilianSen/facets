import type { SituationAxis } from '../engine/types'

// highLabel / lowLabel are clauses that read after "When …"; lens is a neutral phrase for facet cards;
// dependsLabel is the "It depends…" button on a single-answer question about this situation.
export const AXES: SituationAxis[] = [
  { id: 'closeness',  name: 'Closeness',  lowLabel: "it's a stranger",        highLabel: "it's someone close",      lens: 'up close',           dependsLabel: 'It depends who it is' },
  { id: 'stakes',     name: 'Stakes',     lowLabel: "it's trivial",           highLabel: 'the stakes are high',     lens: 'under pressure',     dependsLabel: 'It depends what’s at stake' },
  { id: 'audience',   name: 'Audience',   lowLabel: "it's just you",          highLabel: "you're being watched",    lens: 'in front of people', dependsLabel: 'It depends who’s watching' },
  { id: 'energy',     name: 'Energy',     lowLabel: "you're drained",         highLabel: "you're energized",        lens: 'on your battery',    dependsLabel: 'It depends on my energy' },
  { id: 'power',      name: 'Power',      lowLabel: "you've got no leverage", highLabel: 'you hold the power',      lens: 'around power',       dependsLabel: 'It depends who has the power' },
  { id: 'initiative', name: 'Initiative', lowLabel: 'they came to you',       highLabel: 'you make the first move', lens: 'on the first move',  dependsLabel: 'It depends who makes the move' },
]
