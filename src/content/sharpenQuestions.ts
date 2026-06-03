import type { Question, Vector } from '../engine/types'

// Parallel "sharpen" reserve: held out of base runs, drawn only for the adaptive deep-dive on an axis
// the user already shifts hard on. Per axis, all items isolate the SAME behaviour cluster on a clean
// high → neutral → low scale, so a consistent person answers the same relative way each time and the
// within-level consistency verdict (axisStability) is measurable. Vectors are assigned here (not by
// the authors) so the dim-isolation is correct by construction. Append-only — ids appear in permalinks.

interface Item { prompt: string; caseHigh: string; caseMid: string; caseLow: string; optHigh: string; optMid: string; optLow: string }

function build(axis: string, dims: [string, string], items: Item[]): Question[] {
  const [d1, d2] = dims
  const hi: Vector = { [d1]: 2, [d2]: 2 }
  const lo: Vector = { [d1]: -2, [d2]: -2 }
  return items.map((it, i): Question => {
    const id = `${axis}_sh${i + 1}`
    return {
      id, prompt: it.prompt, kind: 'backbone', axis, reserve: true,
      cases: [
        { id: `${id}_h`, label: it.caseHigh, axisLevel: 1 },
        { id: `${id}_m`, label: it.caseMid, axisLevel: 0.5 },
        { id: `${id}_l`, label: it.caseLow, axisLevel: 0 },
      ],
      options: [
        { id: 'A', label: it.optHigh, vector: hi },
        // The mid option carries NO vector on purpose: an answerer who picks neutral everywhere then
        // produces no replicated evidence, so the verdict withholds rather than calling a non-shift
        // "rock-solid" (see sharpenReadout's coverage gate). High/low carry the signal.
        { id: 'B', label: it.optMid, vector: {} },
        { id: 'C', label: it.optLow, vector: lo },
      ],
    }
  })
}

export const SHARPEN_QUESTIONS: Question[] = [
  ...build('closeness', ['warmth', 'approach'], [
    { prompt: "They catch you off guard with 'wait, are you actually okay though?' and hold eye contact like they mean it. You…", caseHigh: 'your ride-or-die', caseMid: 'a coworker you grab coffee with', caseLow: 'someone you just met tonight', optHigh: "Drop the act and tell them what's really going on", optMid: 'Give them the surface version, keep the rest', optLow: "Hit them with 'I'm good, just tired' and move on" },
    { prompt: "You're a few drinks in and the convo turns deep — they share something real, then look at you like it's your turn. You…", caseHigh: 'your best friend since forever', caseMid: 'a friend-of-a-friend you click with', caseLow: 'a stranger at the same table', optHigh: 'Match them and open up about your own stuff', optMid: 'Share one small thing, keep it light', optLow: 'Deflect with a joke and flip it back to them' },
    { prompt: "They text out of nowhere: 'random but how are you really doing these days?' Your thumb hovers over the keyboard. You…", caseHigh: 'your sibling', caseMid: 'an old teammate you still text sometimes', caseLow: 'a mutual you barely DM', optHigh: 'Type out the honest paragraph, no filter', optMid: "Send a 'been up and down ngl' and leave it there", optLow: "Reply 'haha all good! you?' and dodge" },
    { prompt: "They ask straight up what you've been so stressed about lately — they clearly noticed something's off. You…", caseHigh: 'your partner', caseMid: 'a classmate you sit with', caseLow: 'a barista you see every week', optHigh: 'Walk them through the whole messy situation', optMid: 'Name the gist of it, skip the details', optLow: "Brush it off with 'oh it's nothing' and change topics" },
  ]),
  ...build('stakes', ['composure', 'lead'], [
    { prompt: "You're up to present in 60 seconds and the slides won't load off the USB. The room's already looking at you. You…", caseHigh: 'final thesis defense', caseMid: 'graded class presentation', caseLow: 'low-stakes club meeting', optHigh: "Smile, say 'give me one sec' and calmly start talking it through from memory", optMid: 'Fumble with the cable, get a little flustered but push through', optLow: 'Go red, voice shaking, completely lose your train of thought' },
    { prompt: 'You’re driving and the GPS dies right as the lane splits five ways, horns going off behind you. You…', caseHigh: 'rushing someone to the ER', caseMid: 'late to catch a flight', caseLow: 'heading to a chill hangout', optHigh: 'Pick a lane, breathe, and just figure it out without panicking', optMid: 'Tense up, pick something last-second, mutter at the road', optLow: "Freeze at the wheel, heart pounding, can't decide and nearly stall" },
    { prompt: "You're mid-checkout and the card declines in front of a full line, the cashier waiting. You…", caseHigh: 'the deposit that locks your apartment', caseMid: "a full week's groceries", caseLow: 'one iced coffee', optHigh: "Stay easy, 'one sec', calmly tap another card or sort it out", optMid: 'Get a bit flustered, fish around, mumble an apology', optLow: 'Turn bright red, fumble everything, want to bolt out the door' },
    { prompt: "You're hosting and the food's burning, the smoke alarm screams, and guests are walking in the door. You…", caseHigh: 'meeting their parents for the first time', caseMid: 'a few friends over for dinner', caseLow: 'just your roommate grabbing a plate', optHigh: 'Crack a joke, kill the alarm, calmly take charge of the chaos', optMid: 'Scramble a bit, get a little frazzled, but handle it', optLow: 'Lose it completely, freeze up, feel the whole night unraveling' },
  ]),
  ...build('audience', ['boldness', 'warmth'], [
    { prompt: 'Your favorite song drops and your body wants to move — you can feel the urge to fully dance it out. You…', caseHigh: 'middle of a packed dancefloor', caseMid: 'kitchen with two roommates', caseLow: 'alone, blinds shut', optHigh: 'Go full out, big moves, zero shame', optMid: 'Sway a little, keep it low-key', optLow: 'Stay still, just nod your head' },
    { prompt: "You just made a thing you're lowkey proud of — a drawing, a beat, a fit pic. The urge to put it out there hits. You…", caseHigh: 'post it to your main for everyone', caseMid: 'send it to the 3-person group chat', caseLow: 'keep it saved in your camera roll', optHigh: "Share it loud with 'look what I made'", optMid: 'Drop it with a low-key caption', optLow: 'Sit on it, show no one for now' },
    { prompt: 'A perfect dumb bit pops into your head — a voice, an impression, a one-liner that would absolutely land. You…', caseHigh: 'whole party is in earshot', caseMid: 'just two friends next to you', caseLow: 'nobody around but you', optHigh: 'Commit to the bit out loud, full send', optMid: 'Mutter it and see if it lands', optLow: 'Keep it in your head, say nothing' },
    { prompt: 'Your team scores the winner / the plot twist hits / your song comes on — a wave of hype surges through you. You…', caseHigh: 'crowded bar, everyone around', caseMid: 'on the couch with a friend', caseLow: 'watching solo in your room', optHigh: 'Jump up, yell, full celebration', optMid: "Grin and say 'let's go' under your breath", optLow: 'Feel it inside, stay totally still' },
  ]),
  ...build('power', ['directness', 'lead'], [
    { prompt: "The check lands and it's split nowhere near evenly — you covered the apps and the round of drinks, and the math is quietly going to screw you. You…", caseHigh: "you booked the table, it's your night", caseMid: 'just a regular group dinner', caseLow: "they're treating, you're the broke one here", optHigh: "Say it flat out: 'Let's just itemize it, I'm not eating that'", optMid: "Float a soft 'should we maybe split by what we got?'", optLow: "Bite it, Venmo your 'share', say nothing" },
    { prompt: "You're texting a situationship and they suggest hanging at 11pm again — never a real plan, always last-minute on their terms. You actually want a daytime date. You…", caseHigh: "they're way more into you than you are them", caseMid: "it's pretty mutual and casual", caseLow: "you're catching way more feelings than they are", optHigh: "Tell them straight: 'I want an actual date, not a 11pm thing'", optMid: "Hint you'd be 'down for something earlier sometime'", optLow: "Just say 'sure' and show up at 11 again" },
    { prompt: "Two weeks in, the order finally arrives and half of it is wrong — missing pieces, not what the listing promised. The seller's chat is open on your phone. You…", caseHigh: 'you’re a big account, your review can tank them', caseMid: 'just a normal one-off customer', caseLow: 'tiny no-name seller, you kinda need this to work out', optHigh: "Open with 'This is wrong — I want it fixed or refunded, today'", optMid: "Ask 'hey, is there any chance this can get sorted?'", optLow: "Accept it, tell yourself it's basically fine" },
    { prompt: "The squad's locking in the trip and the plan drifting into place is one you low-key hate — wrong dates, a place you don't want. Everyone's typing. You…", caseHigh: "you're hosting and footing most of it", caseMid: "you're chipping in same as everyone", caseLow: "they're covering you, you're tagging along free", optHigh: "Say it outright: 'I'm not doing those dates — here's what works'", optMid: "Drop a 'hmm, would another weekend be easier?' and see", optLow: 'React 👍 and go along with whatever they pick' },
  ]),
  ...build('initiative', ['approach', 'boldness'], [
    { prompt: "There's someone you've been catching a vibe with and the spark is real. Right now is the moment to actually shoot your shot. You…", caseHigh: 'they have no idea you exist yet', caseMid: "you've been trading likes and lingering looks", caseLow: "they straight-up told a friend they're into you", optHigh: 'Make the move tonight — ask them out, no overthinking', optMid: "Float a soft 'we should hang sometime' and read the room", optLow: 'Sit tight and let them come to you' },
    { prompt: "The weekend plan is a mess — a dozen people, zero decisions, and it's all about to fizzle. You're staring at the chat. You…", caseHigh: 'nobody has lifted a finger to organize anything', caseMid: 'a couple people are half-tossing out ideas', caseLow: "everyone's literally @-ing you to just call it", optHigh: 'Lock the plan, the time, and the spot — send it', optMid: 'Drop one option and see if it catches', optLow: 'Stay quiet and roll with whatever lands' },
    { prompt: "Someone whose career you'd kill to have is one message away, and the door is cracked open just enough. You…", caseHigh: "you've got zero connection — it'd be fully cold", caseMid: 'you share a mutual who could loosely vouch', caseLow: "they said 'reach out anytime' to your face", optHigh: 'Send the bold pitch right now and ask for the meeting', optMid: 'Draft a polite intro and maybe send it later', optLow: 'Hold off and hope an opening comes to you' },
    { prompt: "A friend's been off for weeks and you can feel something's wrong under the surface. You could be the one to break the silence. You…", caseHigh: 'you two have drifted and barely talk now', caseMid: "you still react to each other's stuff here and there", caseLow: "they already texted you 'can we talk?'", optHigh: 'Call them right now and actually get into it', optMid: "Send a 'hey, you good?' and leave the door open", optLow: "Give it space and figure they'll reach out if they need to" },
  ]),
  ...build('energy', ['approach', 'boldness'], [
    { prompt: "It's a friend's birthday and the group is pulling up to a spot across town in 15 minutes — they're texting 'who's actually coming??' You…", caseHigh: 'fully charged, just napped', caseMid: 'ate, running okay', caseLow: 'running on empty, eyes closing', optHigh: "Text 'omw' and grab your jacket", optMid: "Say 'maybe, might be late'", optLow: 'Leave it on read and stay in' },
    { prompt: "A close friend texts 'are you up? kind of falling apart rn' and you can tell they need someone tonight. You…", caseHigh: 'refreshed, plenty in the tank', caseMid: 'okay-ish, kind of tired', caseLow: 'completely drained, done for the day', optHigh: "Call them and stay on till they're okay", optMid: 'Text back, half-there, check in later', optLow: 'Send a heart and deal with it tomorrow' },
    { prompt: "At a meetup someone's standing alone by the wall, clearly knowing no one, and there's space next to you. You…", caseHigh: 'energized, social battery full', caseMid: 'neutral, mid energy', caseLow: 'wiped, want zero small talk', optHigh: 'Wave them over and pull them in', optMid: 'Give a nod and stay put', optLow: 'Look at your phone and tune out' },
    { prompt: 'The group chat wants a spontaneous hangout today, but it dies unless one person actually picks a place and rounds everyone up. You…', caseHigh: 'fresh, ready to go', caseMid: 'lukewarm, slow start', caseLow: 'no fuel left, want to vanish', optHigh: 'Pick the spot and rally everyone yourself', optMid: 'Toss out one idea, let it ride', optLow: 'Go quiet and let it fizzle' },
  ]),
]
