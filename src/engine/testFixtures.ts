import type { Content, Answer } from './types'

// Tiny content: 1 axis (closeness), 2 dims (warmth, approach), 1 backbone question, 2 archetypes.
export function makeTestContent(): Content {
  return {
    axes: [{ id: 'closeness', name: 'Closeness', lowLabel: "it's a stranger", highLabel: "it's someone close" }],
    dims: [
      { id: 'warmth', name: 'Warmth', lowLabel: 'stay cool', highLabel: 'get warm' },
      { id: 'approach', name: 'Approach', lowLabel: 'pull back', highLabel: 'lean in' },
    ],
    questions: [
      {
        id: 'q_close',
        prompt: 'A friend is going through something rough. You…',
        kind: 'backbone',
        axis: 'closeness',
        cases: [
          { id: 'c_best', label: 'your best friend', axisLevel: 1 },
          { id: 'c_mid', label: 'a monthly friend', axisLevel: 0.5 },
          { id: 'c_far', label: 'a friend-of-a-friend', axisLevel: 0 },
        ],
        options: [
          { id: 'A', label: 'show up at their door', vector: { warmth: 2, approach: 2 } },
          { id: 'B', label: 'a caring text, then space', vector: { warmth: 1, approach: 0 } },
          { id: 'C', label: 'like the post, move on', vector: { warmth: -1, approach: -2 } },
        ],
      },
    ],
    archetypes: [
      { id: 'vault', code: 'VAULT', name: 'The Vault', tagline: 'selective', copy: '',
        signature: { closeness: { warmth: 3, approach: 3 } } },
      { id: 'constant', code: 'CONSTANT', name: 'The Constant', tagline: 'unchanging', copy: '',
        signature: {} },
    ],
  }
}

// Vault-shaped answer: warm+approach high when close, cold when distant.
export const vaultAnswer: Answer = {
  questionId: 'q_close', mode: 'depends',
  ranking: ['c_best', 'c_mid', 'c_far'],
  mapping: { c_best: 'A', c_mid: 'B', c_far: 'C' },
}

// Constant-shaped answer: same option for every case (flat).
export const constantAnswer: Answer = {
  questionId: 'q_close', mode: 'depends',
  ranking: ['c_best', 'c_mid', 'c_far'],
  mapping: { c_best: 'B', c_mid: 'B', c_far: 'B' },
}
