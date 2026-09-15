import type { CaseSetting, Question, Vector } from '../engine/types'

// "Across your life" items for the deep dive: one situation at its intense end, asked at work, when dating, with
// friends and with family — so a setting's pull shows up directly against the others, with the situation held fixed.
// Held out of base runs and the signature (like sharpen items); read only by the setting offsets. Each axis's items
// isolate the same behaviour pair as its sharpen items, so three items give every setting three questions per
// behaviour. Vectors are assigned here, not by the authors. Append-only — ids appear in permalinks.

interface Item {
  prompt: string
  work: string; romance: string; social: string; family: string
  optHigh: string; optMid: string; optLow: string
}

const SETTING_ORDER: CaseSetting[] = ['work', 'romance', 'social', 'family']

function build(axis: string, axisLevel: 0 | 1, dims: [string, string], items: Item[]): Question[] {
  const [d1, d2] = dims
  const hi: Vector = { [d1]: 2, [d2]: 2 }
  const lo: Vector = { [d1]: -2, [d2]: -2 }
  return items.map((it, i): Question => {
    const id = `${axis}_lf${i + 1}`
    return {
      id, prompt: it.prompt, kind: 'backbone', axis, reserve: true, acrossSettings: true,
      cases: SETTING_ORDER.map(setting => ({ id: `${id}_${setting}`, label: it[setting], axisLevel, setting })),
      options: [
        { id: 'A', label: it.optHigh, vector: hi },
        { id: 'B', label: it.optMid, vector: {} },
        { id: 'C', label: it.optLow, vector: lo },
      ],
    }
  })
}

export const LIFE_QUESTIONS: Question[] = [
  ...build('closeness', 1, ['warmth', 'approach'], [
    { prompt: "Someone close to you has clearly had an awful day and hasn't said a word about it yet. You…",
      work: 'your work bestie', romance: 'your partner', social: 'your best friend', family: 'your sibling',
      optHigh: "Go straight to them — hug, snacks, 'talk to me'", optMid: 'Check in once and let them come to you', optLow: "Give them space and act like you didn't notice" },
    { prompt: 'Someone close to you just got huge news they’ve been hoping for. You…',
      work: "a coworker you're tight with", romance: "the person you're seeing", social: 'your closest friend', family: 'your mom or dad',
      optHigh: 'Make a whole thing of it — call, celebrate, gush', optMid: "Send a warm 'so proud of you'", optLow: "A quick 'congrats' and back to your day" },
    { prompt: 'Someone close to you wants to spend the whole evening just hanging out with you. You…',
      work: 'your favorite coworker after a long week', romance: 'your partner', social: 'your day-one', family: 'the cousin you grew up with',
      optHigh: 'Say yes and clear the night', optMid: 'Join for a bit, then head out', optLow: 'Make an excuse and keep the night to yourself' },
  ]),
  ...build('stakes', 1, ['composure', 'lead'], [
    { prompt: 'Something big is falling apart right in front of you and everyone freezes. You…',
      work: "the launch you've worked on for months", romance: 'the anniversary trip you planned', social: "your best friend's birthday party", family: 'a family gathering going sideways',
      optHigh: 'Stay cool and start calling the shots', optMid: 'Help wherever someone points you', optLow: 'Panic a little and wait for someone else to fix it' },
    { prompt: 'A decision with real consequences has to be made in the next hour. You…',
      work: 'whether to push a deadline the client cares about', romance: 'whether to move in together', social: 'whether to cancel a trip everyone paid for', family: "what to do about a parent's health scare",
      optHigh: 'Take a breath, weigh it, and make the call', optMid: 'Share your view and let the others decide', optLow: 'Get overwhelmed and hand the decision off' },
    { prompt: "It's on you to deliver when it really counts. You…",
      work: 'the pitch that decides your promotion', romance: "meeting your partner's parents for the first time", social: "your speech at your best friend's wedding", family: 'hosting the holiday dinner everyone will judge',
      optHigh: 'Lock in, steady, and own it', optMid: 'Get through it on autopilot', optLow: 'Rattled — you second-guess every move' },
  ]),
  ...build('audience', 1, ['boldness', 'warmth'], [
    { prompt: "You're the center of attention for a moment and every eye is on you. You…",
      work: "a meeting where you're introduced as the new lead", romance: "your partner's friends sizing you up at a party", social: 'your crew chanting for you at karaoke', family: 'a big family dinner grilling you about your life',
      optHigh: 'Lean all the way in — big energy, big warmth', optMid: 'Smile, keep it short, pass the spotlight', optLow: 'Shrink back and wait for it to be over' },
    { prompt: 'Someone makes a joke at your expense in front of everyone. You…',
      work: 'a coworker during the all-hands', romance: 'your date, in front of their friends', social: 'a friend in the 30-person group chat', family: 'your uncle at a packed barbecue',
      optHigh: 'Fire back, grinning — you can play too', optMid: 'Laugh it off and change the subject', optLow: 'Go quiet and let it sting' },
    { prompt: "There's a moment to share something personal with a crowd watching. You…",
      work: "the team offsite's 'tell us about you' round", romance: "a toast to your partner at their birthday", social: 'an open mic your friends dragged you to', family: 'a speech at the family reunion',
      optHigh: 'Go for it — open, funny, heartfelt', optMid: 'Keep it light and generic', optLow: "Pass — you're not doing that with people watching" },
  ]),
  ...build('energy', 0, ['approach', 'boldness'], [
    { prompt: "You're running on empty and something fun but spontaneous comes up. You…",
      work: 'coworkers heading out for last-minute drinks', romance: 'your date asking to keep the night going', social: 'friends pulling up to a party across town', family: 'your siblings planning a midnight food run',
      optHigh: "Rally anyway — you're in", optMid: 'Show up for a bit, then dip', optLow: 'Hard pass, straight to bed' },
    { prompt: "You're completely drained and someone wants you to take a chance with them. You…",
      work: 'a teammate pitching a wild idea together tomorrow', romance: 'your partner suggesting a spontaneous weekend away', social: 'a friend daring you to try something new tonight', family: 'your cousin roping you into a last-minute plan',
      optHigh: 'Say yes — tired or not', optMid: 'Maybe — ask for a raincheck', optLow: 'No way, not with zero in the tank' },
    { prompt: "You're exhausted and there's a chance to make a new connection. You…",
      work: 'a new hire lingering by your desk', romance: 'someone cute sitting alone at the bar', social: 'a friend-of-a-friend across the table', family: "your sibling's new partner at dinner",
      optHigh: 'Start the conversation anyway', optMid: 'Be friendly if they come to you', optLow: 'Keep your head down and save your energy' },
  ]),
  ...build('power', 1, ['directness', 'lead'], [
    { prompt: "You're the one with the upper hand and something isn't working. You…",
      work: 'you run the project and a teammate keeps missing deadlines', romance: "you're planning the trip and your partner keeps changing it", social: "it's your place and a friend keeps overstaying", family: "you're paying for the vacation and nobody's helping",
      optHigh: 'Say it straight and set the plan', optMid: 'Drop a hint and hope it sorts itself out', optLow: 'Let it slide and go along with it' },
    { prompt: 'You have the final say and everyone is waiting on you. You…',
      work: 'picking which proposal your team goes with', romance: 'choosing where the two of you live next', social: "deciding the weekend plan since you're driving", family: 'settling an argument everyone asked you to judge',
      optHigh: 'Make the call and tell them why', optMid: 'Poll everyone and go with the majority', optLow: 'Stall and hope someone else decides' },
    { prompt: "You're in charge and someone pushes back hard. You…",
      work: 'an intern challenging your decision', romance: "your partner questioning a plan you're paying for", social: 'a guest arguing with the rules at your party', family: 'your younger sibling refusing the chores you assigned',
      optHigh: 'Hold your ground and spell it out', optMid: 'Hear them out and meet in the middle', optLow: 'Back down to keep the peace' },
  ]),
  ...build('initiative', 1, ['approach', 'boldness'], [
    { prompt: "You'd have to make the first move — nobody's going to do it for you. You…",
      work: 'going for the lead on the new project', romance: 'asking someone out', social: 'proposing a trip to a group chat gone quiet', family: "reaching out to a relative you haven't talked to in years",
      optHigh: 'Shoot your shot — right now', optMid: 'Test the waters with a hint first', optLow: 'Wait and hope it comes to you' },
    { prompt: "There's something you want and you'd have to bring it up out of nowhere. You…",
      work: 'a raise', romance: 'more time together', social: "a friend's help with your move", family: "your parents' backing for a big decision",
      optHigh: 'Ask directly, first chance you get', optMid: 'Bring it up if the moment feels right', optLow: 'Keep it to yourself' },
    { prompt: "Things have gone cold and it's on you to break the silence. You…",
      work: 'a coworker you clashed with', romance: "someone you'd been talking to who went quiet", social: 'a friend you drifted from', family: 'a family member after a fight',
      optHigh: 'Reach out first — warm and direct', optMid: 'Like their post and see if they bite', optLow: 'Leave it — they know where to find you' },
  ]),
]
