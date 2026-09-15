import type { Archetype } from '../engine/types'

// Each archetype is a prototype *signature*: expected slope of a dim as a situation axis
// rises (0..1). Magnitudes ~±3 (primary) / ±2 (secondary). Same-axis archetypes use
// distinct dim bundles or opposite directions so every archetype stays separable — see
// the self-match test in archetypes.test.ts.
//
// `baseline` is the archetype's expected context-independent behavioural lean per dim
// (magnitudes kept small, ~|0.5–1.5|, so the contingency *shape* stays primary and the
// baseline only nudges borderline matches). Authored from each archetype's copy.
export const ARCHETYPES: Archetype[] = [
  // ---------- closeness ----------
  {
    id: 'vault', code: 'VAULT', name: 'The Vault', tagline: 'selective · loyal-coded',
    copy: 'You go all in for your inner circle and ration warmth sharply by distance. Not cold — selective.',
    signature: { closeness: { warmth: 3, approach: 3 } },
    baseline: { warmth: 0.5, approach: -0.5 },
  },
  {
    id: 'open_book', code: 'OPEN-BK', name: 'The Open Book', tagline: 'easy with anyone new',
    copy: 'Strangers get the warmest, most open version of you; the closer someone gets, the more your guard quietly goes up.',
    signature: { closeness: { warmth: -3, approach: -3 } },
    baseline: { warmth: 1, approach: 1 },
  },
  {
    id: 'peacekeeper', code: 'PEACE', name: 'The Peacekeeper', tagline: 'no smoke with the inner circle',
    copy: 'With people you love you go calm and conflict-avoidant — you would rather keep the peace than win the point.',
    signature: { closeness: { directness: -3, composure: 3 } },
    baseline: { directness: -1, composure: 1 },
  },
  {
    id: 'ride_or_die', code: 'R-O-D', name: 'The Ride-or-Die', tagline: 'the anchor',
    copy: 'For your people you become the steady one — warmer, closer, calmer, and ready to lead when they need it.',
    signature: { closeness: { warmth: 2, approach: 2, lead: 2, composure: 2 } },
    baseline: { warmth: 1, composure: 1, lead: 0.5 },
  },
  {
    id: 'home_turf', code: 'HOME', name: 'The Home Turf', tagline: 'unfiltered with your people',
    copy: 'Strangers get your polite, even-keeled side. The people closest to you get the real thing — blunt, heated, no filter. You fight with the ones you love because you can.',
    signature: { closeness: { directness: 3, composure: -3 } },
    baseline: { directness: 1, composure: -0.5 },
  },
  {
    id: 'ringleader', code: 'RING', name: 'The Ringleader', tagline: 'runs the crew',
    copy: 'With your people you are the one calling the plan and daring everyone into it. Around strangers you hang back, follow the flow and play it safe.',
    signature: { closeness: { lead: 3, boldness: 3 } },
    baseline: { lead: 0.5, boldness: 0.5 },
  },
  {
    id: 'plus_one', code: 'PLUS1', name: 'The Plus-One', tagline: 'your people lead, you tag along',
    copy: 'With strangers you will take charge and take chances. With your people you happily hand over the plan and play it safe — they have got it.',
    signature: { closeness: { lead: -3, boldness: -3 } },
    baseline: { lead: -0.5 },
  },
  {
    id: 'fierce_loyalist', code: 'FIERCE', name: 'The Fierce Loyalist', tagline: 'all-in and all-heat with your people',
    copy: 'With the people closest to you, you go all in — warmer and closer, and also blunter and more heated. Strangers get a cooler, more polite and even version of you.',
    signature: { closeness: { warmth: 3, approach: 3, directness: 3, composure: -3 } },
    baseline: { warmth: 0.5, directness: 0.5 },
  },
  // ---------- audience ----------
  {
    id: 'performer', code: 'PERF', name: 'The Performer', tagline: 'comes alive with eyes on you',
    copy: 'Your dial spikes when watched. Private you and public you are different people — and you know it.',
    signature: { audience: { warmth: 3, boldness: 3 } },
    baseline: { boldness: 1, warmth: 0.5 },
  },
  {
    id: 'backstage', code: 'BCKSTG', name: 'The Backstage', tagline: 'realest one-on-one',
    copy: 'You are warmest and boldest in private; an audience makes you shrink and play it safe.',
    signature: { audience: { warmth: -3, boldness: -3 } },
    baseline: { boldness: -0.5, warmth: 0.5 },
  },
  {
    id: 'menace', code: 'MENACE', name: 'The Menace', tagline: 'more eyes, more chaos',
    copy: 'A crowd brings out your unfiltered side — the bigger the audience, the blunter and bolder you get.',
    signature: { audience: { directness: 3, boldness: 3 } },
    baseline: { directness: 1, boldness: 1 },
  },
  {
    id: 'wallflower', code: 'WALLFL', name: 'The Wallflower', tagline: 'crowds drain you',
    copy: 'You pull back as rooms fill up and as your battery dips — small and quiet beats loud and seen, every time.',
    signature: { audience: { approach: -3, warmth: -2 }, energy: { approach: -2 } },
    baseline: { approach: -1, warmth: -0.5 },
  },
  {
    id: 'host', code: 'HOST', name: 'The Host', tagline: 'works the room',
    copy: 'The fuller the room, the warmer you get — you pull people in, make introductions, check everyone is okay. One-on-one you are quieter than people expect.',
    // approach 2, not 3: the audience backbone only moves approach on its warm option, so that's all it can show.
    signature: { audience: { warmth: 3, approach: 2 } },
    baseline: { warmth: 1, approach: 0.5 },
  },
  {
    id: 'stage_fright', code: 'STAGE', name: 'The Stage Fright', tagline: 'shakes when watched',
    copy: 'Alone or with a few, you are steady and happy to take charge. Put eyes on you and your nerves take the wheel — you rattle, second-guess and hand over the lead.',
    signature: { audience: { composure: -3, lead: -3 } },
    baseline: { composure: -0.5 },
  },
  {
    id: 'frontman', code: 'FRONT', name: 'The Frontman', tagline: 'steadiest on stage',
    copy: 'An audience settles you. The more people watching, the calmer you get and the more naturally you step up to run things.',
    signature: { audience: { composure: 3, lead: 3 } },
    baseline: { composure: 1, lead: 0.5 },
  },
  {
    id: 'emcee', code: 'EMCEE', name: 'The Emcee', tagline: 'runs the room and warms it up',
    copy: 'Eyes on you bring out your best — calmer, in charge, and warmer, pulling everyone in. One-on-one you are quieter and happier to follow.',
    signature: { audience: { warmth: 3, approach: 2, composure: 3, lead: 3 } },
    baseline: { warmth: 1, composure: 0.5 },
  },
  {
    id: 'statesperson', code: 'STATES', name: 'The Statesperson', tagline: 'diplomatic under the lights',
    copy: 'In private you speak with zero filter—raw, heated, and blunt. Put a room of people in front of you, and your poise locks in: you become measured, diplomatic, and calm, curating every word for the room.',
    signature: { audience: { directness: -3 } },
    baseline: { directness: -0.5 },
  },
  // ---------- stakes ----------
  {
    id: 'clutch', code: 'CLUTCH', name: 'The Clutch', tagline: 'rises to pressure',
    copy: 'Low stakes barely register; when it actually matters you get calm, decisive, and take the wheel.',
    signature: { stakes: { composure: 3, lead: 2, boldness: 2 } },
    baseline: { composure: 1, lead: 0.5 },
  },
  {
    id: 'fumble', code: 'FUMBLE', name: 'The Fumble', tagline: 'breezy until it counts',
    copy: 'You are loose and capable when nothing is on the line — but the bigger it gets, the more you freeze.',
    signature: { stakes: { composure: -3, lead: -2, boldness: -2 } },
    baseline: { composure: -1, boldness: -0.5 },
  },
  {
    id: 'nurturer', code: 'NURTUR', name: 'The Nurturer', tagline: 'softens when it is heavy',
    copy: 'The harder things get, the warmer and more present you become. Crisis is when you show up closest.',
    signature: { stakes: { warmth: 3, approach: 3 } },
    baseline: { warmth: 1, approach: 0.5 },
  },
  {
    id: 'cold_front', code: 'COLD', name: 'The Cold Front', tagline: 'goes cold under pressure',
    copy: 'When it really matters, you take the feelings out of it — cooler, more distant, straight to the point. When nothing is riding on it, you are easygoing and warm.',
    signature: { stakes: { warmth: -3, approach: -3, directness: 2 } },
    baseline: { directness: 0.5, composure: 0.5 },
  },
  {
    id: 'surgeon', code: 'SURGN', name: 'The Surgeon', tagline: 'calm, decisive, switched off',
    copy: 'When it really counts you get calm, take charge and take the risk — and switch your feelings off to do it. When nothing is riding on it, you are warmer and more easygoing.',
    signature: { stakes: { composure: 3, lead: 2, boldness: 2, warmth: -3, approach: -3, directness: 2 } },
    baseline: { composure: 1, directness: 0.5 },
  },
  {
    id: 'first_responder', code: 'FIRST', name: 'The First Responder', tagline: 'steady and warm in a crisis',
    copy: 'The heavier it gets, the more you show up on both fronts — calm and in charge, and warmer and closer to the people going through it.',
    signature: { stakes: { composure: 3, lead: 2, boldness: 2, warmth: 3, approach: 3 } },
    baseline: { composure: 1, warmth: 0.5 },
  },
  // ---------- power ----------
  {
    id: 'operator', code: 'OPERTR', name: 'The Operator', tagline: 'reads the room for leverage',
    copy: 'With the upper hand you say exactly what you think and steer. Without it you go diplomatic and patient.',
    signature: { power: { directness: 3, lead: 3 } },
    baseline: { directness: 0.5, lead: 0.5 },
  },
  {
    id: 'underdog', code: 'UNDRDG', name: 'The Underdog', tagline: 'loudest with nothing to lose',
    copy: 'When you hold no cards you get bold and blunt; hand you the power and you suddenly play it careful.',
    signature: { power: { directness: -3, boldness: -3 } },
    baseline: { directness: 0.5, boldness: 1 },
  },
  {
    id: 'reluctant_boss', code: 'RELUCT', name: 'The Reluctant Boss', tagline: 'power makes you quieter',
    copy: 'Hand you the upper hand and you go careful — softer words, and you would rather someone else ran it. With nothing to lose, you speak up and steer.',
    signature: { power: { directness: -3, lead: -3 } },
    baseline: { directness: -0.5 },
  },
  {
    id: 'patron', code: 'PATRON', name: 'The Patron', tagline: 'generous with the upper hand',
    copy: 'When you hold the power you get warmer and more generous — you look after people and bring them in. When you have none, you keep your distance and your guard up.',
    signature: { power: { warmth: 3, approach: 3 } },
    baseline: { warmth: 0.5 },
  },
  {
    id: 'captain', code: 'CAPTN', name: 'The Captain', tagline: 'takes the wheel when it’s yours',
    copy: 'Give you the upper hand and you step up and run things — calmly, without needing to get loud about it. Without it, you are happy to let someone else steer.',
    signature: { power: { lead: 3 } },
    baseline: { lead: 0.5 },
  },
  {
    id: 'ivory_tower', code: 'IVORY', name: 'The Ivory Tower', tagline: 'power makes you distant',
    copy: 'The more power you hold, the cooler and more distant you get — people are kept at arm’s length from the top. On equal footing or below, you are warmer and closer.',
    signature: { power: { warmth: -3, approach: -3 } },
    baseline: { warmth: -0.5 },
  },
  {
    id: 'good_boss', code: 'GDBOSS', name: 'The Good Boss', tagline: 'steers and looks after people',
    copy: 'With the upper hand you say what you think and take the lead — and you look after your people while you do it. Without it, you go quieter and keep more to yourself.',
    signature: { power: { directness: 3, lead: 3, warmth: 3, approach: 3 } },
    baseline: { lead: 0.5, warmth: 0.5 },
  },
  {
    id: 'heavyweight', code: 'HVYWGT', name: 'The Heavyweight', tagline: 'bets big with the upper hand',
    copy: 'Give you leverage, institutional backing, or the upper hand and you play fearless — audacious swings, bold calls, and taking all the space. Without leverage, you keep your head down and play it safe.',
    signature: { power: { boldness: 3, lead: 2 } },
    baseline: { boldness: 0.5 },
  },
  // ---------- initiative ----------
  {
    id: 'spark', code: 'SPARK', name: 'The Spark', tagline: 'ignites when it is on you',
    copy: 'When someone has to make the first move, it is you — bold, forward, leading. When it lands in your lap, less so.',
    signature: { initiative: { approach: 3, boldness: 3 } },
    baseline: { approach: 1, boldness: 0.5, lead: 0.5 },
  },
  {
    id: 'prize', code: 'PRIZE', name: 'The Prize', tagline: 'won’t chase',
    copy: 'You light up when you are pursued and go cool when you would have to start it. You let it come to you.',
    signature: { initiative: { approach: -3, boldness: -3 } },
    baseline: { approach: -1, boldness: -0.5 },
  },
  {
    id: 'overthinker', code: 'OVRTHK', name: 'The Overthinker', tagline: 'rattled when it’s on you',
    copy: 'When they come to you, you are calm and say what you mean. When you would have to make the first move, your head gets loud — you hedge, soften and second-guess.',
    signature: { initiative: { directness: -3, composure: -3 } },
    baseline: { composure: -0.5 },
  },
  {
    id: 'closer', code: 'CLOSER', name: 'The Closer', tagline: 'steadiest when it’s on you',
    copy: 'Making the first move settles you — calm, clear, straight to the point. When it lands in your lap instead, you are more hesitant and roundabout.',
    signature: { initiative: { directness: 3, composure: 3 } },
    baseline: { composure: 0.5 },
  },
  {
    id: 'waiting_game', code: 'WAITNG', name: 'The Waiting Game', tagline: 'open when chosen, frozen when choosing',
    copy: 'When someone comes to you, you are warm, bold and at ease. When it is on you to make the move, you freeze up, hedge and hang back.',
    signature: { initiative: { approach: -3, boldness: -3, directness: -3, composure: -3 } },
    baseline: { composure: -0.5 },
  },
  {
    id: 'first_mover', code: 'FRSTMV', name: 'The First Mover', tagline: 'steps up when no one will',
    copy: 'When a group is stalling and silence takes over, you cannot sit on your hands — you take the reins, make the call, and get things moving. When someone else is already driving, you happily stay in your lane.',
    signature: { initiative: { lead: 3, boldness: 2 } },
    baseline: { lead: 0.5 },
  },
  {
    id: 'deputy', code: 'DEPUTY', name: 'The Deputy', tagline: 'leads only when called upon',
    copy: 'You never force yourself into a leadership vacuum — uninvited, you hang back and let things settle. But once you are officially tapped, asked, or appointed, you step up and run the mission with total dedication.',
    signature: { initiative: { lead: -3, approach: -2 } },
    baseline: { lead: -0.5 },
  },
  // ---------- energy ----------
  {
    id: 'battery', code: 'BATTRY', name: 'The Battery', tagline: 'all-in when charged',
    copy: 'Fully charged, you are the most down person in the room; drained, you vanish. Your energy runs the show.',
    signature: { energy: { approach: 3, boldness: 3 } },
    baseline: { approach: 0.5, boldness: 0.5, warmth: 0.5 },
  },
  {
    id: 'runs_on_fumes', code: 'FUMES', name: 'Runs on Fumes', tagline: 'sends it on empty',
    copy: 'Counterintuitively, you go hardest when you are running on nothing — exhaustion makes you reckless, not cautious.',
    signature: { energy: { approach: -3, boldness: -3 } },
    baseline: { boldness: 1, composure: -0.5 },
  },
  {
    id: 'hangry', code: 'HANGRY', name: 'The Hangry', tagline: 'snappy on empty',
    copy: 'Fully charged, you are patient and easy to be around. Running low, the filter goes — you get short, blunt and quick to snap.',
    signature: { energy: { directness: -3, composure: 3 } },
    baseline: { directness: 0.5 },
  },
  {
    id: 'night_and_day', code: 'NGTDAY', name: 'The Night & Day', tagline: 'charged and sunny, drained and snappy',
    copy: 'Fully charged, you are social, bold and patient. Running on empty, you pull back from everyone and get short with whoever is left.',
    signature: { energy: { approach: 3, boldness: 3, directness: -3, composure: 3 } },
    baseline: {},
  },
  {
    id: 'peace_at_all_costs', code: 'PEACEC', name: 'Peace at All Costs', tagline: 'fights when charged, folds when drained',
    copy: 'When energized you have the stamina for friction—candid, bold, and unyielding. But running on fumes, your filter defaults to appeasement: you nod along and keep the peace just to survive the room.',
    signature: { energy: { directness: 3, composure: -3 } },
    baseline: { directness: 0.5, composure: -0.5 },
  },
  {
    id: 'social_battery', code: 'SOCBAT', name: 'The Social Battery', tagline: 'warm when charged, cold when drained',
    copy: 'When your battery is full you pour boundless warmth, patience, and engagement into everyone around you. When it drains, the light turns off completely — you go cold, distant, and need total silence to recover.',
    signature: { energy: { warmth: 3 } },
    baseline: { warmth: 0.5 },
  },
  // ---------- cross-axis / shape ----------
  {
    id: 'chameleon', code: 'CHAMEL', name: 'The Chameleon', tagline: 'morphs to every room',
    copy: 'You shift across closeness, audience, and power alike — there is no single you, just the one each moment needs.',
    signature: { closeness: { warmth: 2 }, audience: { boldness: 2 }, power: { directness: 2 } },
    baseline: {},
  },
  {
    id: 'diplomat', code: 'DIPLMT', name: 'The Diplomat', tagline: 'gentler the higher it climbs',
    copy: 'The more that is at stake — or the more power you hold — the softer and more careful your words get.',
    signature: { stakes: { directness: -3 }, power: { directness: -3 } },
    baseline: { directness: -1, composure: 0.5 },
  },
  {
    id: 'main_character', code: 'MAIN', name: 'The Main Character', tagline: 'rises to every big moment',
    copy: 'More at stake, more eyes on you, more power in your hands — whatever turns the moment up, you get steadier and step into the lead.',
    // The union of The Clutch, The Frontman and The Operator: a blend wins exactly when all three situations
    // fit — then one idea ("rises to every big moment") beats three separate types.
    signature: { stakes: { composure: 3, lead: 2, boldness: 2 }, audience: { composure: 3, lead: 3 }, power: { lead: 3, directness: 3 } },
    baseline: { composure: 1, lead: 1 },
  },
  // ---------- non-monotonic / both-ways (curve, not slope) ----------
  {
    id: 'sweet_spot', code: 'SWEET', name: 'The Sweet Spot', tagline: 'peaks under medium pressure',
    copy: 'Hand you a moderate challenge and you are calm, sharp, decisive. But too low and you switch off; too high and you crack. You run best on Goldilocks stakes — not nothing, not everything.',
    signature: {},
    curve: { stakes: { composure: -3, lead: -2, boldness: -2 } },
    baseline: {},
  },
  {
    id: 'small_room', code: 'ROOM', name: 'The Small Room', tagline: 'boldest with a few',
    copy: 'A handful of people is your zone — you open all the way up. Alone you go quiet, and a big crowd shuts you back down again. You need some eyes on you, just not all of them.',
    signature: {},
    curve: { audience: { boldness: -3 } },
    baseline: {},
  },
  {
    id: 'butterfly', code: 'BTRFLY', name: 'The Social Butterfly', tagline: 'best with the in-betweens',
    copy: 'Acquaintances and friends-of-friends get your warmest, most open side. Total strangers and your very closest people both get a cooler, more guarded version.',
    signature: {},
    curve: { closeness: { warmth: -3, approach: -3 } },
    baseline: { warmth: 0.5, approach: 0.5 },
  },
  {
    id: 'peer', code: 'PEER', name: 'The Peer', tagline: 'thrives on equal footing',
    copy: 'You run best on level ground. Hand you total leverage or strip you of power and you clam up or play it careful; side-by-side with equals, you speak your mind and take the initiative.',
    signature: {},
    curve: { power: { directness: -3, lead: -3 } },
    baseline: {},
  },
  {
    id: 'green_light', code: 'GREEN', name: 'The Green Light', tagline: 'boldest with a mutual cue',
    copy: 'You need a shared signal. If making the move is completely on you, you freeze; if someone chases you down too hard, you dodge. But give you a subtle, mutual cue and you lean all the way in.',
    signature: {},
    curve: { initiative: { approach: -3, boldness: -3 } },
    baseline: { approach: 0.5 },
  },
  {
    id: 'middle_gear', code: 'MIDGR', name: 'The Middle Gear', tagline: 'runs best in a steady rhythm',
    copy: 'You do not thrive on manic caffeine highs or running on fumes. Over-caffeinated you scatter; exhausted you vanish. Put you in a calm, sustainable mid-range gear and your focus is unbreakable.',
    signature: {},
    curve: { energy: { composure: -3 } },
    baseline: { composure: 0.5 },
  },
  {
    id: 'all_or_nothing', code: 'ALLNON', name: 'The All-or-Nothing', tagline: 'stranger or soulmate, no in-between',
    copy: 'With total strangers you are effortless and chatty, and with your inner circle you are all-in and deeply loving. But casual acquaintances and lukewarm mutuals bring out your stiffest, most awkward, and guarded self.',
    signature: {},
    curve: { closeness: { warmth: 3, approach: 3 } },
    baseline: {},
  },
  {
    id: 'adrenaline_addict', code: 'ADREN', name: 'The Adrenaline Addict', tagline: 'only wakes up in the fire',
    copy: 'Low stakes you are playful and relaxed; extreme emergency you are calm, fearless, and dialed in. But moderate, everyday routine bores you to tears — you need either total play or a five-alarm crisis to function.',
    signature: {},
    curve: { stakes: { composure: 3, boldness: 3 } },
    baseline: {},
  },
  {
    id: 'arena_intimacy', code: 'ARENA', name: 'Arena & Intimacy', tagline: 'electric 1-on-1 or in front of crowds',
    copy: 'In an intimate one-on-one you are deeply engaged, and on a big stage you light up and command the room. But medium dinner parties of six people make you fade into the background — you need either pure intimacy or a full arena.',
    signature: {},
    curve: { audience: { boldness: 3 } },
    baseline: {},
  },
  {
    id: 'hierarch', code: 'HIERAR', name: 'The Hierarch', tagline: 'clarity at the top or bottom',
    copy: 'You are completely comfortable executing orders from a strong leader, and equally comfortable giving orders when you are in charge. But vague peer committees with no clear hierarchy leave you frustrated and stalled.',
    signature: {},
    curve: { power: { lead: 3, directness: 3 } },
    baseline: {},
  },
  // ---------- flat ----------
  {
    id: 'constant', code: 'CONST', name: 'The Constant', tagline: 'same with everyone',
    copy: 'Context barely moves you. People always know what they are getting — steady, unbothered, consistent.',
    signature: {},
    baseline: {},
  },
]
