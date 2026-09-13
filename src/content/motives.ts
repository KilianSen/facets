import type { MotiveContent } from '../engine/types'

// The "why" layer. A shared vocabulary of motives (what a shift is FOR), offered per axis with wording
// that fits that situation. Labels are direction-neutral on purpose: they explain the difference
// between the two ends of the situation, whichever way the user leans. Motives are encoded in
// permalinks by position in `motives` — append-only, never reorder or remove.
export const MOTIVES: MotiveContent = {
  motives: [
    { id: 'trust', name: 'Trust', tagline: 'earned, not given',
      copy: 'You keep an honest ledger. People get the version of you they’ve built with you — not moodiness, just accounting.' },
    { id: 'safety', name: 'Protection', tagline: 'managing the risk',
      copy: 'Your shifts are armour. Where it could cost you — rejection, embarrassment, getting hurt — you adjust before it can land.' },
    { id: 'energy', name: 'Battery', tagline: 'spending what you’ve got',
      copy: 'You budget yourself. The shift is less about them than about what you have left to give, and where it’s worth spending.' },
    { id: 'norms', name: 'The script', tagline: 'reading what fits',
      copy: 'You read the room’s rules and play the right part. It’s fluency, not fakeness — you know what each moment calls for.' },
    { id: 'control', name: 'Control', tagline: 'keeping a grip',
      copy: 'Your shifts are about steering. You open up or clamp down depending on how much of the outcome sits in your hands.' },
    { id: 'stimulation', name: 'The charge', tagline: 'following the feeling',
      copy: 'Your shifts follow your chemistry. Some moments switch you on, some switch you off — and you go where the charge is.' },
    { id: 'belonging', name: 'The bond', tagline: 'protecting the connection',
      copy: 'Your shifts are about keeping people close. You adjust to protect how things stand between you and them.' },
  ],
  byAxis: {
    closeness: [
      { motiveId: 'trust', label: 'Trust is earned — how much you get depends on what we’ve built' },
      { motiveId: 'safety', label: 'Protection — who I let in is how I avoid getting hurt' },
      { motiveId: 'energy', label: 'I only have so much to give, so I spend it carefully' },
      { motiveId: 'norms', label: 'Different people just call for a different version of me' },
    ],
    stakes: [
      { motiveId: 'control', label: 'When it matters, I need a grip on how it goes' },
      { motiveId: 'safety', label: 'Honestly? The bigger it gets, the more there is to lose' },
      { motiveId: 'stimulation', label: 'Pressure changes my chemistry — it switches me on or off' },
      { motiveId: 'norms', label: 'I match the weight of the moment — it’s what it demands' },
    ],
    audience: [
      { motiveId: 'belonging', label: 'It’s about how I come across to the people watching' },
      { motiveId: 'safety', label: 'Being seen feels exposed, so I adjust' },
      { motiveId: 'stimulation', label: 'An audience changes my energy — a charge or a drain' },
      { motiveId: 'norms', label: 'Public and private just run on different rules' },
    ],
    energy: [
      { motiveId: 'energy', label: 'Pure battery — I can only be what I have fuel for' },
      { motiveId: 'control', label: 'My filter depends on how much I’ve got left to hold it up' },
      { motiveId: 'stimulation', label: 'My mood drives it more than any plan does' },
      { motiveId: 'safety', label: 'When I’m low, everything feels riskier' },
    ],
    power: [
      { motiveId: 'safety', label: 'It’s what I can afford to risk from where I stand' },
      { motiveId: 'control', label: 'Leverage decides whether I steer or not' },
      { motiveId: 'norms', label: 'Hierarchy has rules, and I play by them' },
      { motiveId: 'belonging', label: 'I’m protecting the relationship with whoever’s above or below me' },
    ],
    initiative: [
      { motiveId: 'safety', label: 'Rejection — it’s about not getting burned' },
      { motiveId: 'control', label: 'I like setting the terms of how things start' },
      { motiveId: 'belonging', label: 'I need to know they actually want it too' },
      { motiveId: 'stimulation', label: 'The chase itself is the fun — or the drag' },
    ],
  },
}
