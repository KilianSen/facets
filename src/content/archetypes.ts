import type { Archetype } from '../engine/types'

// Each archetype is a prototype *signature*: expected slope of a dim as a situation axis
// rises (0..1). Magnitudes ~±3 (primary) / ±2 (secondary). Same-axis archetypes use
// distinct dim bundles or opposite directions so every archetype stays separable — see
// the self-match test in archetypes.test.ts.
export const ARCHETYPES: Archetype[] = [
  // ---------- closeness ----------
  {
    id: 'vault', code: 'VAULT', name: 'The Vault', tagline: 'selective · loyal-coded',
    copy: 'You go all in for your inner circle and ration warmth sharply by distance. Not cold — selective.',
    signature: { closeness: { warmth: 3, approach: 3 } },
  },
  {
    id: 'open_book', code: 'OPEN-BK', name: 'The Open Book', tagline: 'easy with anyone new',
    copy: 'Strangers get the warmest, most open version of you; the closer someone gets, the more your guard quietly goes up.',
    signature: { closeness: { warmth: -3, approach: -3 } },
  },
  {
    id: 'peacekeeper', code: 'PEACE', name: 'The Peacekeeper', tagline: 'no smoke with the inner circle',
    copy: 'With people you love you go calm and conflict-avoidant — you would rather keep the peace than win the point.',
    signature: { closeness: { directness: -3, composure: 3 } },
  },
  {
    id: 'ride_or_die', code: 'R-O-D', name: 'The Ride-or-Die', tagline: 'the anchor',
    copy: 'For your people you become the steady one — warmer, closer, calmer, and ready to lead when they need it.',
    signature: { closeness: { warmth: 2, approach: 2, lead: 2, composure: 2 } },
  },
  // ---------- audience ----------
  {
    id: 'performer', code: 'PERF', name: 'The Performer', tagline: 'comes alive with eyes on you',
    copy: 'Your dial spikes when watched. Private you and public you are different people — and you know it.',
    signature: { audience: { warmth: 3, boldness: 3 } },
  },
  {
    id: 'backstage', code: 'BCKSTG', name: 'The Backstage', tagline: 'realest one-on-one',
    copy: 'You are warmest and boldest in private; an audience makes you shrink and play it safe.',
    signature: { audience: { warmth: -3, boldness: -3 } },
  },
  {
    id: 'menace', code: 'MENACE', name: 'The Menace', tagline: 'more eyes, more chaos',
    copy: 'A crowd brings out your unfiltered side — the bigger the audience, the blunter and bolder you get.',
    signature: { audience: { directness: 3, boldness: 3 } },
  },
  {
    id: 'wallflower', code: 'WALLFL', name: 'The Wallflower', tagline: 'crowds drain you',
    copy: 'You pull back as rooms fill up and as your battery dips — small and quiet beats loud and seen, every time.',
    signature: { audience: { approach: -3, warmth: -2 }, energy: { approach: -2 } },
  },
  // ---------- stakes ----------
  {
    id: 'clutch', code: 'CLUTCH', name: 'The Clutch', tagline: 'rises to pressure',
    copy: 'Low stakes barely register; when it actually matters you get calm, decisive, and take the wheel.',
    signature: { stakes: { composure: 3, lead: 2, boldness: 2 } },
  },
  {
    id: 'fumble', code: 'FUMBLE', name: 'The Fumble', tagline: 'breezy until it counts',
    copy: 'You are loose and capable when nothing is on the line — but the bigger it gets, the more you freeze.',
    signature: { stakes: { composure: -3, lead: -2, boldness: -2 } },
  },
  {
    id: 'nurturer', code: 'NURTUR', name: 'The Nurturer', tagline: 'softens when it is heavy',
    copy: 'The harder things get, the warmer and more present you become. Crisis is when you show up closest.',
    signature: { stakes: { warmth: 3, approach: 3 } },
  },
  // ---------- power ----------
  {
    id: 'operator', code: 'OPERTR', name: 'The Operator', tagline: 'reads the room for leverage',
    copy: 'With the upper hand you say exactly what you think and steer. Without it you go diplomatic and patient.',
    signature: { power: { directness: 3, lead: 3 } },
  },
  {
    id: 'underdog', code: 'UNDRDG', name: 'The Underdog', tagline: 'loudest with nothing to lose',
    copy: 'When you hold no cards you get bold and blunt; hand you the power and you suddenly play it careful.',
    signature: { power: { directness: -3, boldness: -3 } },
  },
  // ---------- initiative ----------
  {
    id: 'spark', code: 'SPARK', name: 'The Spark', tagline: 'ignites when it is on you',
    copy: 'When someone has to make the first move, it is you — bold, forward, leading. When it lands in your lap, less so.',
    signature: { initiative: { approach: 3, boldness: 3 } },
  },
  {
    id: 'prize', code: 'PRIZE', name: 'The Prize', tagline: 'won’t chase',
    copy: 'You light up when you are pursued and go cool when you would have to start it. You let it come to you.',
    signature: { initiative: { approach: -3, boldness: -3 } },
  },
  // ---------- energy ----------
  {
    id: 'battery', code: 'BATTRY', name: 'The Battery', tagline: 'all-in when charged',
    copy: 'Fully charged, you are the most down person in the room; drained, you vanish. Your energy runs the show.',
    signature: { energy: { approach: 3, boldness: 3 } },
  },
  {
    id: 'runs_on_fumes', code: 'FUMES', name: 'Runs on Fumes', tagline: 'sends it on empty',
    copy: 'Counterintuitively, you go hardest when you are running on nothing — exhaustion makes you reckless, not cautious.',
    signature: { energy: { approach: -3, boldness: -3 } },
  },
  // ---------- cross-axis / shape ----------
  {
    id: 'chameleon', code: 'CHAMEL', name: 'The Chameleon', tagline: 'morphs to every room',
    copy: 'You shift across closeness, audience, and power alike — there is no single you, just the one each moment needs.',
    signature: { closeness: { warmth: 2 }, audience: { boldness: 2 }, power: { directness: 2 } },
  },
  {
    id: 'diplomat', code: 'DIPLMT', name: 'The Diplomat', tagline: 'gentler the higher it climbs',
    copy: 'The more that is at stake — or the more power you hold — the softer and more careful your words get.',
    signature: { stakes: { directness: -3 }, power: { directness: -3 } },
  },
  // ---------- flat ----------
  {
    id: 'constant', code: 'CONST', name: 'The Constant', tagline: 'same with everyone',
    copy: 'Context barely moves you. People always know what they are getting — steady, unbothered, consistent.',
    signature: {},
  },
]
