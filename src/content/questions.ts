import type { Question } from '../engine/types'

export const QUESTIONS: Question[] = [
  // ---- Backbone: closeness ----
  {
    id: 'q_close', prompt: 'A friend is going through something rough. You…', kind: 'backbone', axis: 'closeness',
    cases: [
      { id: 'best', label: 'your ride-or-die best friend', axisLevel: 1 },
      { id: 'monthly', label: 'a good friend you see monthly', axisLevel: 0.5 },
      { id: 'foaf', label: 'a friend-of-a-friend', axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: 'show up at their door with food', vector: { warmth: 2, approach: 2 } },
      { id: 'B', label: 'a caring text, then give them space', vector: { warmth: 1, approach: 0 } },
      { id: 'C', label: 'like the post and move on', vector: { warmth: -1, approach: -2 } },
    ],
  },
  // ---- Backbone: stakes ----
  {
    id: 'q_stakes', prompt: 'A group decision is going sideways. You…', kind: 'backbone', axis: 'stakes',
    cases: [
      { id: 'matters', label: 'it actually matters', axisLevel: 1 },
      { id: 'real', label: "it's a real plan", axisLevel: 0.5 },
      { id: 'trivial', label: "it's just where to eat", axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: 'take charge and call it', vector: { lead: 2, boldness: 2, composure: 1 } },
      { id: 'B', label: 'nudge it gently', vector: { lead: 1, boldness: 0, composure: 1 } },
      { id: 'C', label: 'stay out of it', vector: { lead: -1, boldness: -1, composure: 0 } },
    ],
  },
  // ---- Backbone: audience ----
  {
    id: 'q_audience', prompt: 'You have a take you believe in. You…', kind: 'backbone', axis: 'audience',
    cases: [
      { id: 'public', label: 'posting it publicly', axisLevel: 1 },
      { id: 'group', label: 'in the group chat', axisLevel: 0.5 },
      { id: 'dm', label: 'in a 1:1 DM', axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: 'say it loud, with flair', vector: { warmth: 1, boldness: 2 } },
      { id: 'B', label: 'say it plainly', vector: { warmth: 0, boldness: 0 } },
      { id: 'C', label: 'keep it low-key', vector: { warmth: -1, boldness: -1 } },
    ],
  },
  // ---- Backbone: energy ----
  {
    id: 'q_energy', prompt: 'Plans pop up last-minute. You…', kind: 'backbone', axis: 'energy',
    cases: [
      { id: 'buzzing', label: "you're buzzing", axisLevel: 1 },
      { id: 'soso', label: "you're so-so", axisLevel: 0.5 },
      { id: 'empty', label: "you're running on empty", axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: "send it — you're in", vector: { approach: 2, boldness: 2 } },
      { id: 'B', label: 'maybe, depends', vector: { approach: 0, boldness: 0 } },
      { id: 'C', label: 'hard pass, recharge', vector: { approach: -2, boldness: -1 } },
    ],
  },
  // ---- Backbone: power ----
  {
    id: 'q_power', prompt: 'There is friction with someone. You…', kind: 'backbone', axis: 'power',
    cases: [
      { id: 'cards', label: 'you hold the cards', axisLevel: 1 },
      { id: 'equal', label: "you're equals", axisLevel: 0.5 },
      { id: 'theirs', label: 'they hold the cards', axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: 'say exactly what you think', vector: { directness: 2, lead: 2 } },
      { id: 'B', label: 'raise it carefully', vector: { directness: 0, lead: 1 } },
      { id: 'C', label: 'let it slide', vector: { directness: -2, lead: -1 } },
    ],
  },
  // ---- Backbone: initiative ----
  {
    id: 'q_initiative', prompt: 'You are into someone new. You…', kind: 'backbone', axis: 'initiative',
    cases: [
      { id: 'youstart', label: "you'd have to start it", axisLevel: 1 },
      { id: 'mutual', label: 'mutual vibe', axisLevel: 0.5 },
      { id: 'theystart', label: 'they texted you first', axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: 'make the move, confidently', vector: { approach: 2, boldness: 2, lead: 2 } },
      { id: 'B', label: 'test the waters', vector: { approach: 1, boldness: 0, lead: 0 } },
      { id: 'C', label: 'wait and see', vector: { approach: -1, boldness: -1, lead: -1 } },
    ],
  },
  // ---- Flavor: extra closeness coverage ----
  {
    id: 'f_cringe', prompt: 'A friend posts something kind of cringe. You…', kind: 'flavor', axis: 'closeness',
    cases: [
      { id: 'close', label: 'your close friend', axisLevel: 1 },
      { id: 'barely', label: 'someone you barely know', axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: 'comment something supportive', vector: { warmth: 2, approach: 1 } },
      { id: 'B', label: 'say nothing', vector: { warmth: 0, approach: 0 } },
      { id: 'C', label: 'screenshot it to the group chat', vector: { warmth: -2, approach: 0 } },
    ],
  },
  // ---- Flavor: extra stakes coverage ----
  {
    id: 'f_disagree', prompt: 'You disagree with the plan. You…', kind: 'flavor', axis: 'stakes',
    cases: [
      { id: 'high', label: 'it really matters', axisLevel: 1 },
      { id: 'low', label: "it's no big deal", axisLevel: 0 },
    ],
    options: [
      { id: 'A', label: 'speak up firmly', vector: { directness: 2, lead: 1 } },
      { id: 'B', label: 'go with the flow', vector: { directness: -1, lead: -1 } },
    ],
  },
]
