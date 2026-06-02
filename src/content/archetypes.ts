import type { Archetype } from '../engine/types'

export const ARCHETYPES: Archetype[] = [
  {
    id: 'vault', code: 'VAULT', name: 'The Vault', tagline: 'selective · loyal-coded',
    copy: 'You go all in for your inner circle and ration warmth sharply by distance. Not cold — selective.',
    signature: { closeness: { warmth: 3, approach: 3 } },
  },
  {
    id: 'constant', code: 'CONSTANT', name: 'The Constant', tagline: 'same with everyone',
    copy: 'Context barely moves you. People always know what they are getting — steady, unbothered, consistent.',
    signature: {},
  },
  {
    id: 'performer', code: 'PERFORMER', name: 'The Performer', tagline: 'comes alive with eyes on you',
    copy: 'Your dial spikes when watched. Private you and public you are different people — and you know it.',
    signature: { audience: { warmth: 3, boldness: 3 } },
  },
  {
    id: 'clutch', code: 'CLUTCH', name: 'The Clutch', tagline: 'rises to pressure',
    copy: 'Low stakes barely register; when it actually matters you get calm, decisive, and take the wheel.',
    signature: { stakes: { composure: 3, lead: 2, boldness: 2 } },
  },
  {
    id: 'operator', code: 'OPERATOR', name: 'The Operator', tagline: 'reads the room for leverage',
    copy: 'With the upper hand you say exactly what you think and steer. Without it you go diplomatic and patient.',
    signature: { power: { directness: 3, lead: 2 } },
  },
  {
    id: 'spark', code: 'SPARK', name: 'The Spark', tagline: 'ignites when it is on you',
    copy: 'When someone has to make the first move, it is you — bold, forward, leading. When it lands in your lap, less so.',
    signature: { initiative: { approach: 2, boldness: 3, lead: 2 } },
  },
]
