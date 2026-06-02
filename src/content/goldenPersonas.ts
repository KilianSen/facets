import type { Answer } from '../engine/types'

/** Helper: answer a question by mapping each case id to an option id, in a fixed rank order. */
function depends(questionId: string, ordered: [string, string][]): Answer {
  return {
    questionId, mode: 'depends',
    ranking: ordered.map(([caseId]) => caseId),
    mapping: Object.fromEntries(ordered),
  }
}

// Maps every backbone case to the SAME option B — produces flat slopes on that axis.
const flat = {
  q_close: depends('q_close', [['best', 'B'], ['monthly', 'B'], ['foaf', 'B']]),
  q_stakes: depends('q_stakes', [['matters', 'B'], ['real', 'B'], ['trivial', 'B']]),
  q_audience: depends('q_audience', [['public', 'B'], ['group', 'B'], ['dm', 'B']]),
  q_energy: depends('q_energy', [['buzzing', 'B'], ['soso', 'B'], ['empty', 'B']]),
  q_power: depends('q_power', [['cards', 'B'], ['equal', 'B'], ['theirs', 'B']]),
  q_initiative: depends('q_initiative', [['youstart', 'B'], ['mutual', 'B'], ['theystart', 'B']]),
}

export interface GoldenPersona { name: string; expectedArchetypeId: string; answers: Answer[] }

export const GOLDEN_PERSONAS: GoldenPersona[] = [
  {
    name: 'vault', expectedArchetypeId: 'vault',
    answers: [
      depends('q_close', [['best', 'A'], ['monthly', 'B'], ['foaf', 'C']]),
      flat.q_stakes, flat.q_audience, flat.q_energy, flat.q_power, flat.q_initiative,
    ],
  },
  {
    name: 'clutch', expectedArchetypeId: 'clutch',
    answers: [
      depends('q_stakes', [['matters', 'A'], ['real', 'B'], ['trivial', 'C']]),
      flat.q_close, flat.q_audience, flat.q_energy, flat.q_power, flat.q_initiative,
    ],
  },
  {
    name: 'constant', expectedArchetypeId: 'constant',
    answers: [flat.q_close, flat.q_stakes, flat.q_audience, flat.q_energy, flat.q_power, flat.q_initiative],
  },
]
