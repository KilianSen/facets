import type { Question } from '../engine/types'

// Auto-generated bank: ~10 conditional questions per situation axis (first 2 per axis = backbone).
export const QUESTIONS: Question[] = [
  // ---- closeness ----
  {
    id: "closeness_1", kind: "backbone", axis: "closeness",
    prompt: "They post a story crying in their car at 1am with the caption 'i can't anymore.' You're scrolling and see it. You…",
    cases: [
      { id: "closeness_1_c0", label: "your best friend", axisLevel: 1 },
      { id: "closeness_1_c1", label: "a classmate you vibe with", axisLevel: 0.5 },
      { id: "closeness_1_c2", label: "a random mutual", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Call them right now and stay on the line", vector: {"approach":2,"warmth":2} },
      { id: "B", label: "Drop a 'you good?' and wait", vector: {} },
      { id: "C", label: "Keep scrolling, not your business", vector: {"approach":-2,"warmth":-2} },
    ],
  },
  {
    id: "closeness_2", kind: "backbone", axis: "closeness",
    prompt: "At dinner they keep making 'jokes' that are lowkey digs at you in front of everyone. The table goes quiet. You…",
    cases: [
      { id: "closeness_2_c0", label: "your sibling", axisLevel: 1 },
      { id: "closeness_2_c1", label: "a teammate", axisLevel: 0.5 },
      { id: "closeness_2_c2", label: "your boss's friend", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Stay easy, let it slide — maybe bring it up gently, just the two of you later", vector: {"directness":-2,"composure":2} },
      { id: "B", label: "Laugh it off and change the subject", vector: {} },
      { id: "C", label: "Snap something back, sharp — everyone can see you're done", vector: {"directness":2,"composure":-2} },
    ],
  },
  {
    id: "closeness_3", kind: "flavor", axis: "closeness",
    prompt: "The group chat is spiraling — nobody's picked a place, the reservation closes in 10 min, and people keep sending '???'. You…",
    cases: [
      { id: "closeness_3_c0", label: "your day-one crew", axisLevel: 1 },
      { id: "closeness_3_c1", label: "your floor's hangout chat", axisLevel: 0.5 },
      { id: "closeness_3_c2", label: "a chat of randos from an event", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Pick the spot, book it, drop the address", vector: {"lead":2} },
      { id: "B", label: "Throw out two options and see", vector: {} },
      { id: "C", label: "Mute it and wait for someone else", vector: {"lead":-2} },
    ],
  },
  {
    id: "closeness_4", kind: "flavor", axis: "closeness",
    prompt: "You spot them across the party standing alone, looking unsure if they should stay. You catch eyes. You…",
    cases: [
      { id: "closeness_4_c0", label: "your close friend", axisLevel: 1 },
      { id: "closeness_4_c1", label: "an old coworker", axisLevel: 0.5 },
      { id: "closeness_4_c2", label: "someone you've never met", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Walk straight over and pull them into your group", vector: {"approach":2,"warmth":1} },
      { id: "B", label: "Nod and stay where you are", vector: {} },
      { id: "C", label: "Look away and avoid the interaction", vector: {"approach":-2} },
    ],
  },
  {
    id: "closeness_5", kind: "flavor", axis: "closeness",
    prompt: "They Venmo-request you $40 for a thing you genuinely never agreed to split. The request just hit your phone. You…",
    cases: [
      { id: "closeness_5_c0", label: "your roommate of 3 years", axisLevel: 1 },
      { id: "closeness_5_c1", label: "a gym buddy", axisLevel: 0.5 },
      { id: "closeness_5_c2", label: "a guy from one group hang", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Reply 'I never agreed to this lol, what's it for?'", vector: {"directness":2} },
      { id: "B", label: "Decline quietly, no message", vector: {} },
      { id: "C", label: "Just pay it to dodge the awkwardness", vector: {"directness":-2} },
    ],
  },
  {
    id: "closeness_6", kind: "flavor", axis: "closeness",
    prompt: "It's 11pm and they text 'my flight got cancelled, I'm stranded at the airport and broke.' You…",
    cases: [
      { id: "closeness_6_c0", label: "your partner", axisLevel: 1 },
      { id: "closeness_6_c1", label: "a friend-of-a-friend", axisLevel: 0.5 },
      { id: "closeness_6_c2", label: "a name you barely recognize", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Book them a hotel and figure out a plan together", vector: {"warmth":2,"lead":2} },
      { id: "B", label: "Send some options for cheap nearby spots", vector: {} },
      { id: "C", label: "Reply 'oof that sucks' and leave it", vector: {"warmth":-2,"lead":-2} },
    ],
  },
  {
    id: "closeness_7", kind: "flavor", axis: "closeness",
    prompt: "Mid-ranked match, they rage and start blaming you in voice chat, throwing the game on purpose. You…",
    cases: [
      { id: "closeness_7_c0", label: "your duo since middle school", axisLevel: 1 },
      { id: "closeness_7_c1", label: "a regular in your discord", axisLevel: 0.5 },
      { id: "closeness_7_c2", label: "a random teammate", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Stay chill, call shots, try to steady the game", vector: {"composure":2} },
      { id: "B", label: "Go quiet and just play your lane", vector: {} },
      { id: "C", label: "Snap back and tilt harder than them", vector: {"composure":-2} },
    ],
  },
  {
    id: "closeness_8", kind: "flavor", axis: "closeness",
    prompt: "They double-text 'can we hang this weekend?? i really need to talk' but you're already drained and overbooked. You…",
    cases: [
      { id: "closeness_8_c0", label: "your ride-or-die", axisLevel: 1 },
      { id: "closeness_8_c1", label: "a casual friend", axisLevel: 0.5 },
      { id: "closeness_8_c2", label: "an acquaintance from class", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Clear time and tell them 'I've got you, come over'", vector: {"approach":2,"warmth":2} },
      { id: "B", label: "Offer a quick call instead of hanging", vector: {} },
      { id: "C", label: "Leave it on read till you have energy", vector: {"approach":-2,"warmth":-2} },
    ],
  },
  {
    id: "closeness_9", kind: "flavor", axis: "closeness",
    prompt: "In a meeting they confidently present an idea as theirs — but it was literally yours from yesterday. People are nodding. You…",
    cases: [
      { id: "closeness_9_c0", label: "your work bestie", axisLevel: 1 },
      { id: "closeness_9_c1", label: "a teammate you kinda know", axisLevel: 0.5 },
      { id: "closeness_9_c2", label: "a new hire you just met", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Jump in: 'Love it — building on what I pitched, here's the next step'", vector: {"directness":2,"lead":2} },
      { id: "B", label: "Add a comment without claiming credit", vector: {} },
      { id: "C", label: "Say nothing and stew about it later", vector: {"directness":-2,"lead":-2} },
    ],
  },
  {
    id: "closeness_10", kind: "flavor", axis: "closeness",
    prompt: "On a first-ish date, they suddenly get vulnerable and bring up something heavy from their past. The mood shifts. You…",
    cases: [
      { id: "closeness_10_c0", label: "someone you've dated for months", axisLevel: 1 },
      { id: "closeness_10_c1", label: "a third-date situationship", axisLevel: 0.5 },
      { id: "closeness_10_c2", label: "a Hinge match you just met", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Hold steady, lean in, 'thank you for trusting me with that'", vector: {"composure":2,"warmth":2} },
      { id: "B", label: "Nod along and gently steer it lighter", vector: {} },
      { id: "C", label: "Freeze up and awkwardly pivot to the menu", vector: {"composure":-2,"warmth":-2} },
    ],
  },
  // ---- stakes ----
  {
    id: "stakes_1", kind: "backbone", axis: "stakes",
    prompt: "Your phone buzzes with a notification mid-conversation and your stomach drops a little. You open it and the news is waiting. You…",
    cases: [
      { id: "stakes_1_c0", label: "Med results are in", axisLevel: 1 },
      { id: "stakes_1_c1", label: "Job interview reply", axisLevel: 0.5 },
      { id: "stakes_1_c2", label: "Pizza order update", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Take a breath, read it, and start handling it head-on", vector: {"composure":2,"lead":2,"boldness":2} },
      { id: "B", label: "Glance at it, then put the phone face-down for now", vector: {} },
      { id: "C", label: "Spiral — reread it five times, freeze up, can't deal yet", vector: {"composure":-2,"lead":-2,"boldness":-2} },
    ],
  },
  {
    id: "stakes_2", kind: "backbone", axis: "stakes",
    prompt: "The group chat is melting down because plans are falling apart and nobody can agree. People keep typing and deleting. You…",
    cases: [
      { id: "stakes_2_c0", label: "Booking a flight tonight", axisLevel: 1 },
      { id: "stakes_2_c1", label: "Saturday brunch spot", axisLevel: 0.5 },
      { id: "stakes_2_c2", label: "Which meme to post", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Step in warm — 'hey, we've got this' — smooth it over and keep everyone in", vector: {"warmth":2,"approach":2,"directness":-2} },
      { id: "B", label: "Throw out a soft suggestion and see if it sticks", vector: {} },
      { id: "C", label: "Get blunt — 'this is dumb, sort it out' — and check out", vector: {"warmth":-2,"approach":-2,"directness":2} },
    ],
  },
  {
    id: "stakes_3", kind: "flavor", axis: "stakes",
    prompt: "There's a chance to put your money on something risky right now, and the window is closing fast. You…",
    cases: [
      { id: "stakes_3_c0", label: "Your rent money", axisLevel: 1 },
      { id: "stakes_3_c1", label: "A month's fun budget", axisLevel: 0.5 },
      { id: "stakes_3_c2", label: "Five bucks", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Send it, full risk, no hesitation", vector: {"boldness":2} },
      { id: "B", label: "Put in a small amount, hedge the rest", vector: {} },
      { id: "C", label: "Pass entirely, keep it safe", vector: {"boldness":-2} },
    ],
  },
  {
    id: "stakes_4", kind: "flavor", axis: "stakes",
    prompt: "Someone in your orbit is clearly going through it — quiet, off, not themselves. You notice. You…",
    cases: [
      { id: "stakes_4_c0", label: "Lost a parent", axisLevel: 1 },
      { id: "stakes_4_c1", label: "Bad breakup", axisLevel: 0.5 },
      { id: "stakes_4_c2", label: "Lost a ranked match", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Pull them aside, sit with them, 'I'm here, talk to me'", vector: {"warmth":2,"approach":2} },
      { id: "B", label: "Send a quick 'you good?' text and leave it", vector: {} },
      { id: "C", label: "Give them space, figure it's not your business", vector: {"warmth":-2,"approach":-2} },
    ],
  },
  {
    id: "stakes_5", kind: "flavor", axis: "stakes",
    prompt: "You catch eyes with someone across the room and there's a spark. The night's almost over and you'd have to make a move. You…",
    cases: [
      { id: "stakes_5_c0", label: "Could be the one", axisLevel: 1 },
      { id: "stakes_5_c1", label: "Cute, worth a shot", axisLevel: 0.5 },
      { id: "stakes_5_c2", label: "Bored, just curious", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Walk straight over and start the conversation", vector: {"approach":2,"boldness":2} },
      { id: "B", label: "Linger nearby and hope they come to you", vector: {} },
      { id: "C", label: "Look away, decide it's not worth it", vector: {"approach":-2,"boldness":-2} },
    ],
  },
  {
    id: "stakes_6", kind: "flavor", axis: "stakes",
    prompt: "A friend asks for your honest take and you can tell they want the truth, not the nice version. You…",
    cases: [
      { id: "stakes_6_c0", label: "Marrying the wrong person", axisLevel: 1 },
      { id: "stakes_6_c1", label: "Quitting for a sketchy job", axisLevel: 0.5 },
      { id: "stakes_6_c2", label: "Bangs, yes or no", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Tell them flat out what you really think, steady and clear", vector: {"directness":2,"composure":2} },
      { id: "B", label: "Give a balanced 'there are pros and cons' answer", vector: {} },
      { id: "C", label: "Dance around it, say what they want to hear", vector: {"directness":-2,"composure":-2} },
    ],
  },
  {
    id: "stakes_7", kind: "flavor", axis: "stakes",
    prompt: "Your little sibling messes up and comes to you before telling your parents, eyes already watering. You…",
    cases: [
      { id: "stakes_7_c0", label: "Crashed the car", axisLevel: 1 },
      { id: "stakes_7_c1", label: "Failed a class", axisLevel: 0.5 },
      { id: "stakes_7_c2", label: "Broke your charger", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Hug them, 'we'll fix it together, it's okay'", vector: {"warmth":2} },
      { id: "B", label: "Stay neutral, 'okay, let's figure out the next step'", vector: {} },
      { id: "C", label: "Cold shrug, 'that's on you, not my problem'", vector: {"warmth":-2} },
    ],
  },
  {
    id: "stakes_8", kind: "flavor", axis: "stakes",
    prompt: "The team project is stalling and the deadline is looming. Everyone's looking around waiting for someone to step up. You…",
    cases: [
      { id: "stakes_8_c0", label: "Final pitch to the client", axisLevel: 1 },
      { id: "stakes_8_c1", label: "Graded group assignment", axisLevel: 0.5 },
      { id: "stakes_8_c2", label: "Casual game night squad", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Take the reins, split the work, run point", vector: {"lead":2} },
      { id: "B", label: "Pitch in on whatever's left over", vector: {} },
      { id: "C", label: "Wait for someone else to organize it", vector: {"lead":-2} },
    ],
  },
  {
    id: "stakes_9", kind: "flavor", axis: "stakes",
    prompt: "You're about to attempt something physical that could genuinely go wrong, and people are watching. You…",
    cases: [
      { id: "stakes_9_c0", label: "Max deadlift PR", axisLevel: 1 },
      { id: "stakes_9_c1", label: "New climbing route", axisLevel: 0.5 },
      { id: "stakes_9_c2", label: "Trampoline backflip", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Commit fully, announce it, go all in", vector: {"boldness":2,"directness":2} },
      { id: "B", label: "Try a scaled-down version first", vector: {} },
      { id: "C", label: "Back off, say you'll do it another day", vector: {"boldness":-2,"directness":-2} },
    ],
  },
  {
    id: "stakes_10", kind: "flavor", axis: "stakes",
    prompt: "You've been avoiding a hard conversation and now they're right in front of you. This is your moment to bring it up. You…",
    cases: [
      { id: "stakes_10_c0", label: "Define the relationship", axisLevel: 1 },
      { id: "stakes_10_c1", label: "Money they owe you", axisLevel: 0.5 },
      { id: "stakes_10_c2", label: "They left dishes again", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Lean in and start the conversation right now", vector: {"approach":2} },
      { id: "B", label: "Hint at it and gauge their reaction first", vector: {} },
      { id: "C", label: "Change the subject, put it off again", vector: {"approach":-2} },
    ],
  },
  // ---- audience ----
  {
    id: "audience_1", kind: "backbone", axis: "audience",
    prompt: "A song you secretly love comes on and you feel the urge to sing it at full volume. You…",
    cases: [
      { id: "audience_1_c0", label: "karaoke bar, full crowd", axisLevel: 1 },
      { id: "audience_1_c1", label: "carpool with two friends", axisLevel: 0.5 },
      { id: "audience_1_c2", label: "alone in your room", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Belt it out, no holding back", vector: {"boldness":2} },
      { id: "B", label: "Hum along quietly", vector: {} },
      { id: "C", label: "Mute it and keep scrolling", vector: {"boldness":-2} },
    ],
  },
  {
    id: "audience_2", kind: "backbone", axis: "audience",
    prompt: "Someone trips and drops their whole tray of food right in front of you. You…",
    cases: [
      { id: "audience_2_c0", label: "packed cafeteria, all eyes", axisLevel: 1 },
      { id: "audience_2_c1", label: "small office kitchen", axisLevel: 0.5 },
      { id: "audience_2_c2", label: "empty hallway, just you two", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Rush over and help them clean up", vector: {"warmth":2,"approach":1} },
      { id: "B", label: "Ask once if they're okay, then move on", vector: {} },
      { id: "C", label: "Pretend you didn't see it", vector: {"warmth":-2} },
    ],
  },
  {
    id: "audience_3", kind: "flavor", axis: "audience",
    prompt: "A friend posts a take you completely disagree with in the group chat. You…",
    cases: [
      { id: "audience_3_c0", label: "30-person class group chat", axisLevel: 1 },
      { id: "audience_3_c1", label: "your 5-friend squad chat", axisLevel: 0.5 },
      { id: "audience_3_c2", label: "your private DM to them", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Say flat out you think they're wrong", vector: {"directness":2} },
      { id: "B", label: "Drop a vague 'interesting' reaction", vector: {} },
      { id: "C", label: "Like it to keep the peace", vector: {"directness":-2} },
    ],
  },
  {
    id: "audience_4", kind: "flavor", axis: "audience",
    prompt: "Your crush walks into the room and there's an open seat next to them. You…",
    cases: [
      { id: "audience_4_c0", label: "loud party, everyone watching", axisLevel: 1 },
      { id: "audience_4_c1", label: "small study group", axisLevel: 0.5 },
      { id: "audience_4_c2", label: "empty cafe, just you two", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Slide right in and start a convo", vector: {"approach":2,"boldness":1} },
      { id: "B", label: "Take a seat nearby and wait", vector: {} },
      { id: "C", label: "Find a spot across the room", vector: {"approach":-2} },
    ],
  },
  {
    id: "audience_5", kind: "flavor", axis: "audience",
    prompt: "A waiter brings the wrong order and you have to decide whether to send it back. You…",
    cases: [
      { id: "audience_5_c0", label: "fancy dinner, full table watching", axisLevel: 1 },
      { id: "audience_5_c1", label: "lunch with one coworker", axisLevel: 0.5 },
      { id: "audience_5_c2", label: "solo takeout counter", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Flag them down and say it's wrong", vector: {"boldness":2,"directness":2} },
      { id: "B", label: "Mention it only if they ask", vector: {} },
      { id: "C", label: "Just eat it, no fuss", vector: {"boldness":-2,"directness":-2} },
    ],
  },
  {
    id: "audience_6", kind: "flavor", axis: "audience",
    prompt: "You spot someone clearly having a rough day, eyes red, sitting alone. You…",
    cases: [
      { id: "audience_6_c0", label: "busy gym floor", axisLevel: 1 },
      { id: "audience_6_c1", label: "quiet library corner", axisLevel: 0.5 },
      { id: "audience_6_c2", label: "empty bus, just you two", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Go over and check on them", vector: {"warmth":2,"approach":2} },
      { id: "B", label: "Offer a small nod from where you are", vector: {} },
      { id: "C", label: "Give them space and look away", vector: {"warmth":-2,"approach":-2} },
    ],
  },
  {
    id: "audience_7", kind: "flavor", axis: "audience",
    prompt: "Trivia night and you're 90% sure of an answer nobody else has guessed. You…",
    cases: [
      { id: "audience_7_c0", label: "team mic in front of the bar", axisLevel: 1 },
      { id: "audience_7_c1", label: "huddled with your 4 teammates", axisLevel: 0.5 },
      { id: "audience_7_c2", label: "playing the app solo at home", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Lock it in and bet big on it", vector: {"boldness":2} },
      { id: "B", label: "Suggest it but defer to the group", vector: {} },
      { id: "C", label: "Stay quiet, go with the safe pick", vector: {"boldness":-2} },
    ],
  },
  {
    id: "audience_8", kind: "flavor", axis: "audience",
    prompt: "A friend keeps 'forgetting' to pay you back the money they owe. You…",
    cases: [
      { id: "audience_8_c0", label: "bring it up in the group chat", axisLevel: 1 },
      { id: "audience_8_c1", label: "mention it when a few friends are around", axisLevel: 0.5 },
      { id: "audience_8_c2", label: "text them one-on-one", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Name the exact amount and ask now", vector: {"directness":2} },
      { id: "B", label: "Hint about being a bit broke lately", vector: {} },
      { id: "C", label: "Let it slide and never mention it", vector: {"directness":-2} },
    ],
  },
  {
    id: "audience_9", kind: "flavor", axis: "audience",
    prompt: "There's an open mic slot and the host is scanning the room for a volunteer. You…",
    cases: [
      { id: "audience_9_c0", label: "sold-out venue", axisLevel: 1 },
      { id: "audience_9_c1", label: "small house party", axisLevel: 0.5 },
      { id: "audience_9_c2", label: "rehearsing alone, recording yourself", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Throw your hand up and go for it", vector: {"approach":2,"boldness":1} },
      { id: "B", label: "Wait to see if someone drags you up", vector: {} },
      { id: "C", label: "Shrink back and avoid eye contact", vector: {"approach":-2} },
    ],
  },
  {
    id: "audience_10", kind: "flavor", axis: "audience",
    prompt: "Your teammate nails a clutch play that wins the match for everyone. You…",
    cases: [
      { id: "audience_10_c0", label: "live-streamed ranked match", axisLevel: 1 },
      { id: "audience_10_c1", label: "casual lobby with friends", axisLevel: 0.5 },
      { id: "audience_10_c2", label: "private duo, mics only you two", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Hype them up loud, full credit", vector: {"warmth":2} },
      { id: "B", label: "Drop a quick 'gg' and move on", vector: {} },
      { id: "C", label: "Say nothing, queue the next game", vector: {"warmth":-2} },
    ],
  },
  // ---- energy ----
  {
    id: "energy_1", kind: "backbone", axis: "energy",
    prompt: "It's 11pm and the group chat explodes: everyone's deciding whether to pull up to a last-minute house party across town. The car's leaving in 10 minutes. You…",
    cases: [
      { id: "energy_1_c0", label: "fully charged, just napped", axisLevel: 1 },
      { id: "energy_1_c1", label: "ate, mildly tired", axisLevel: 0.5 },
      { id: "energy_1_c2", label: "running on empty, eyes closing", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Type 'omw' and start grabbing your jacket", vector: {"approach":2,"boldness":1} },
      { id: "B", label: "Say 'maybe, tell me who's going first'", vector: {} },
      { id: "C", label: "Leave it on read and stay in bed", vector: {"approach":-2} },
    ],
  },
  {
    id: "energy_2", kind: "backbone", axis: "energy",
    prompt: "Karaoke night. The host slides the mic toward you and the whole bar is chanting for someone to take the next song. You…",
    cases: [
      { id: "energy_2_c0", label: "buzzing, hyped up", axisLevel: 1 },
      { id: "energy_2_c1", label: "warmed up but unsure", axisLevel: 0.5 },
      { id: "energy_2_c2", label: "wiped, barely talking", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Grab it and belt your signature song", vector: {"boldness":2,"approach":1} },
      { id: "B", label: "Wait and maybe do a duet with someone", vector: {} },
      { id: "C", label: "Pass it down the line, hard no", vector: {"boldness":-2} },
    ],
  },
  {
    id: "energy_3", kind: "flavor", axis: "energy",
    prompt: "Your roommate texts that their situationship just ended and they're crying in their room. You're already in your PJs. You…",
    cases: [
      { id: "energy_3_c0", label: "refreshed, plenty in the tank", axisLevel: 1 },
      { id: "energy_3_c1", label: "okay-ish, kind of tired", axisLevel: 0.5 },
      { id: "energy_3_c2", label: "completely drained", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Knock, bring snacks, sit with them all night", vector: {"warmth":2,"approach":1} },
      { id: "B", label: "Text 'here if you need me' and check later", vector: {} },
      { id: "C", label: "Send a thumbs-up and deal with it tomorrow", vector: {"warmth":-2} },
    ],
  },
  {
    id: "energy_4", kind: "flavor", axis: "energy",
    prompt: "Open-mic pitch night at your uni: a startup competition has one slot left and the sign-up sheet is right in front of you. Winner gets funding. You…",
    cases: [
      { id: "energy_4_c0", label: "wired, brain firing", axisLevel: 1 },
      { id: "energy_4_c1", label: "steady but flat", axisLevel: 0.5 },
      { id: "energy_4_c2", label: "burnt out, foggy", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Sign up and start sketching slides on the spot", vector: {"approach":2,"boldness":2} },
      { id: "B", label: "Take a flyer and 'think about next time'", vector: {} },
      { id: "C", label: "Walk past and tell yourself it's not your thing", vector: {"approach":-2,"boldness":-2} },
    ],
  },
  {
    id: "energy_5", kind: "flavor", axis: "energy",
    prompt: "A new coworker eats lunch alone every day and looks lost. Today there's an empty seat next to them in the break room. You…",
    cases: [
      { id: "energy_5_c0", label: "energized, social battery full", axisLevel: 1 },
      { id: "energy_5_c1", label: "neutral, mid energy", axisLevel: 0.5 },
      { id: "energy_5_c2", label: "drained, want silence", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Sit down, intro yourself, invite them to the group", vector: {"warmth":2,"approach":1} },
      { id: "B", label: "Give a quick nod and eat at your desk", vector: {} },
      { id: "C", label: "Put your earbuds in and ignore them", vector: {"warmth":-2} },
    ],
  },
  {
    id: "energy_6", kind: "flavor", axis: "energy",
    prompt: "Gym is packed and the squat rack just opened up with a PR-worthy weight already loaded. People are eyeing it too. You…",
    cases: [
      { id: "energy_6_c0", label: "pre-workout kicking in", axisLevel: 1 },
      { id: "energy_6_c1", label: "decent, a bit sluggish", axisLevel: 0.5 },
      { id: "energy_6_c2", label: "exhausted, sore all over", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Claim it and go for a new max", vector: {"boldness":2,"approach":1} },
      { id: "B", label: "Do your normal sets at a safe weight", vector: {} },
      { id: "C", label: "Skip it and head to the machines", vector: {"boldness":-2} },
    ],
  },
  {
    id: "energy_7", kind: "flavor", axis: "energy",
    prompt: "Your crush posts a story: 'anyone wanna get food rn?' It's been up for 4 minutes and you can see they're online. You…",
    cases: [
      { id: "energy_7_c0", label: "lively, feeling bold", axisLevel: 1 },
      { id: "energy_7_c1", label: "calm, on the fence", axisLevel: 0.5 },
      { id: "energy_7_c2", label: "flatlined, low effort", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "DM 'me, where to?' immediately", vector: {"approach":2,"boldness":1} },
      { id: "B", label: "React to the story with an emoji and wait", vector: {} },
      { id: "C", label: "Watch it, do nothing, scroll on", vector: {"approach":-2} },
    ],
  },
  {
    id: "energy_8", kind: "flavor", axis: "energy",
    prompt: "Family dinner and your grandma asks for help setting up her new phone — it'll clearly take an hour of patient explaining. You…",
    cases: [
      { id: "energy_8_c0", label: "rested, in a good mood", axisLevel: 1 },
      { id: "energy_8_c1", label: "fine but ready to leave", axisLevel: 0.5 },
      { id: "energy_8_c2", label: "totally spent", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Pull up a chair and walk her through everything", vector: {"warmth":2,"approach":2} },
      { id: "B", label: "Fix the one main thing, then say later", vector: {} },
      { id: "C", label: "Tell her to ask a cousin and step away", vector: {"warmth":-2,"approach":-2} },
    ],
  },
  {
    id: "energy_9", kind: "flavor", axis: "energy",
    prompt: "Ranked match, final round, and your teammate just made a brutal mistake that probably cost the game. Voice chat goes quiet. You…",
    cases: [
      { id: "energy_9_c0", label: "locked in, hyped", axisLevel: 1 },
      { id: "energy_9_c1", label: "focused but fading", axisLevel: 0.5 },
      { id: "energy_9_c2", label: "tilted and exhausted", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Hype them up and call an aggressive clutch play", vector: {"boldness":2,"warmth":2} },
      { id: "B", label: "Stay quiet and just play it out", vector: {} },
      { id: "C", label: "Snap at them and play passive", vector: {"boldness":-2,"warmth":-2} },
    ],
  },
  {
    id: "energy_10", kind: "flavor", axis: "energy",
    prompt: "Saturday morning and the group chat is planning a spontaneous beach day — but someone needs to organize rides, snacks, and the playlist or it falls apart. You…",
    cases: [
      { id: "energy_10_c0", label: "fresh, ready to go", axisLevel: 1 },
      { id: "energy_10_c1", label: "lukewarm, slow start", axisLevel: 0.5 },
      { id: "energy_10_c2", label: "no fuel left", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Volunteer to run it all and make the plan happen", vector: {"approach":2,"warmth":1} },
      { id: "B", label: "Offer to bring one thing if others lead", vector: {} },
      { id: "C", label: "Mute the chat and let it fizzle", vector: {"approach":-2} },
    ],
  },
  // ---- power ----
  {
    id: "power_1", kind: "backbone", axis: "power",
    prompt: "A group project is due Friday and the chat is chaos — nobody's claimed tasks. You drop a message. You…",
    cases: [
      { id: "power_1_c0", label: "you set the deadline", axisLevel: 1 },
      { id: "power_1_c1", label: "you're one of equals", axisLevel: 0.5 },
      { id: "power_1_c2", label: "the prof picks the lead", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Assign everyone a task and a time, and pin it", vector: {"lead":2,"directness":1} },
      { id: "B", label: "Suggest splitting it up and see who bites", vector: {} },
      { id: "C", label: "Wait for someone else to organize and take what's left", vector: {"lead":-2} },
    ],
  },
  {
    id: "power_2", kind: "backbone", axis: "power",
    prompt: "Your situationship leaves you on read for three days, then posts a thirst trap. You finally reply. You…",
    cases: [
      { id: "power_2_c0", label: "they're way into you", axisLevel: 1 },
      { id: "power_2_c1", label: "it's mutual, casual", axisLevel: 0.5 },
      { id: "power_2_c2", label: "you like them more", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "\"Cute. You ghost then post? Tell me what we are.\"", vector: {"directness":2,"boldness":1} },
      { id: "B", label: "Drop a chill \"hey stranger\" and gauge the vibe", vector: {} },
      { id: "C", label: "Like the post, say nothing, hope they text first", vector: {"directness":-2} },
    ],
  },
  {
    id: "power_3", kind: "flavor", axis: "power",
    prompt: "At a house party someone dares the group to crash the rooftop that's clearly off-limits. You…",
    cases: [
      { id: "power_3_c0", label: "it's your party", axisLevel: 1 },
      { id: "power_3_c1", label: "you barely know the host", axisLevel: 0.5 },
      { id: "power_3_c2", label: "you weren't invited", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Lead the way up there, no hesitation", vector: {"boldness":2,"lead":1} },
      { id: "B", label: "Go if a couple others go first", vector: {} },
      { id: "C", label: "Hard pass and stay where it's safe", vector: {"boldness":-2} },
    ],
  },
  {
    id: "power_4", kind: "flavor", axis: "power",
    prompt: "Your manager floats an unpaid 'opportunity' to run the new project on top of your full workload. You…",
    cases: [
      { id: "power_4_c0", label: "they need you to stay", axisLevel: 1 },
      { id: "power_4_c1", label: "you're replaceable-ish", axisLevel: 0.5 },
      { id: "power_4_c2", label: "you're on probation", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Counter on the spot: \"Happy to lead it — with a title and a raise.\"", vector: {"lead":2,"directness":2} },
      { id: "B", label: "Say you'll think it over and circle back", vector: {} },
      { id: "C", label: "Just take it on and hope it gets noticed later", vector: {"lead":-2,"directness":-2} },
    ],
  },
  {
    id: "power_5", kind: "flavor", axis: "power",
    prompt: "You're up 2-0 in a ranked match and the enemy team starts trash-talking in chat. You…",
    cases: [
      { id: "power_5_c0", label: "you're smurfing, way better", axisLevel: 1 },
      { id: "power_5_c1", label: "evenly matched", axisLevel: 0.5 },
      { id: "power_5_c2", label: "they outrank you hard", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Call your shot and go for the risky all-in play", vector: {"boldness":2} },
      { id: "B", label: "Play your normal game, no extra risks", vector: {} },
      { id: "C", label: "Turtle up and protect the lead", vector: {"boldness":-2} },
    ],
  },
  {
    id: "power_6", kind: "flavor", axis: "power",
    prompt: "The family group chat is planning a trip and your aunt 'volunteers' you to pay for everyone's hotel. You…",
    cases: [
      { id: "power_6_c0", label: "you fund the whole trip", axisLevel: 1 },
      { id: "power_6_c1", label: "you chip in like everyone", axisLevel: 0.5 },
      { id: "power_6_c2", label: "they're hosting you broke", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "\"That's not happening — we split it evenly.\"", vector: {"directness":2} },
      { id: "B", label: "React with a 😅 and dodge committing", vector: {} },
      { id: "C", label: "Privately just pay it to avoid drama", vector: {"directness":-2} },
    ],
  },
  {
    id: "power_7", kind: "flavor", axis: "power",
    prompt: "Your roommate keeps leaving dishes for a week straight and it's reached a tipping point. You…",
    cases: [
      { id: "power_7_c0", label: "lease is in your name", axisLevel: 1 },
      { id: "power_7_c1", label: "equal tenants", axisLevel: 0.5 },
      { id: "power_7_c2", label: "you crash on their couch", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Set up a chore schedule and tell them it starts today", vector: {"lead":2} },
      { id: "B", label: "Bring it up casually and hope they get it", vector: {} },
      { id: "C", label: "Just clean them yourself again and stew", vector: {"lead":-2} },
    ],
  },
  {
    id: "power_8", kind: "flavor", axis: "power",
    prompt: "A brand DMs you to collab but the deal is way below your usual rate. You…",
    cases: [
      { id: "power_8_c0", label: "huge following, they want you", axisLevel: 1 },
      { id: "power_8_c1", label: "decent reach", axisLevel: 0.5 },
      { id: "power_8_c2", label: "tiny account, you need it", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Pitch a bigger package at triple the price, take it or leave it", vector: {"boldness":2,"lead":2} },
      { id: "B", label: "Ask if there's any room to move on the rate", vector: {} },
      { id: "C", label: "Accept their number, glad to be picked", vector: {"boldness":-2,"lead":-2} },
    ],
  },
  {
    id: "power_9", kind: "flavor", axis: "power",
    prompt: "At dinner the bill comes and a friend who never pays starts 'forgetting' their wallet again. You…",
    cases: [
      { id: "power_9_c0", label: "you invited, you'd cover", axisLevel: 1 },
      { id: "power_9_c1", label: "casual hangout", axisLevel: 0.5 },
      { id: "power_9_c2", label: "they got you the job", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "\"Bro, Venmo me your half — same as last three times.\"", vector: {"directness":2} },
      { id: "B", label: "Split the total and say nothing about it", vector: {} },
      { id: "C", label: "Quietly cover them and let it slide", vector: {"directness":-2} },
    ],
  },
  {
    id: "power_10", kind: "flavor", axis: "power",
    prompt: "Your gym crew is deciding the workout split and everyone's looking around for who calls it. You…",
    cases: [
      { id: "power_10_c0", label: "you're the strongest, they follow", axisLevel: 1 },
      { id: "power_10_c1", label: "you all lift the same", axisLevel: 0.5 },
      { id: "power_10_c2", label: "you just started lifting", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Call the split, set the pace, and run the session", vector: {"lead":2,"boldness":1} },
      { id: "B", label: "Throw out an idea and go with the group", vector: {} },
      { id: "C", label: "Wait to be told what we're hitting today", vector: {"lead":-2} },
    ],
  },
  // ---- initiative ----
  {
    id: "initiative_1", kind: "backbone", axis: "initiative",
    prompt: "Someone you've been low-key crushing on appears on your FYP-adjacent Close Friends story. The vibe is open. You…",
    cases: [
      { id: "initiative_1_c0", label: "you'd have to slide in cold", axisLevel: 1 },
      { id: "initiative_1_c1", label: "they liked your last 3 stories", axisLevel: 0.5 },
      { id: "initiative_1_c2", label: "they DM'd you first", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Open the DM and send something real right now", vector: {"approach":2,"boldness":1} },
      { id: "B", label: "React to the story and see what happens", vector: {} },
      { id: "C", label: "Leave it, watch the story, do nothing", vector: {"approach":-2} },
    ],
  },
  {
    id: "initiative_2", kind: "backbone", axis: "initiative",
    prompt: "A startup founder posts that they're hiring for a role you'd kill for, but it's not even listed yet. You…",
    cases: [
      { id: "initiative_2_c0", label: "you have zero connection to them", axisLevel: 1 },
      { id: "initiative_2_c1", label: "you share one mutual", axisLevel: 0.5 },
      { id: "initiative_2_c2", label: "they tagged you in the post", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Cold-pitch yourself with a wild personalized demo", vector: {"boldness":2,"approach":1} },
      { id: "B", label: "Apply normally once it gets posted", vector: {} },
      { id: "C", label: "Wait and hope they reach out to you", vector: {"boldness":-2} },
    ],
  },
  {
    id: "initiative_3", kind: "flavor", axis: "initiative",
    prompt: "The group chat is 80 messages deep arguing about where to go this weekend and nothing is decided. You…",
    cases: [
      { id: "initiative_3_c0", label: "nobody has stepped up at all", axisLevel: 1 },
      { id: "initiative_3_c1", label: "people keep half-pitching ideas", axisLevel: 0.5 },
      { id: "initiative_3_c2", label: "they're literally waiting on you to call it", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Drop a plan, a time, and a venmo request — locked", vector: {"lead":2,"boldness":1} },
      { id: "B", label: "Throw out one option and let it ride", vector: {} },
      { id: "C", label: "Stay quiet and go with whatever happens", vector: {"lead":-2} },
    ],
  },
  {
    id: "initiative_4", kind: "flavor", axis: "initiative",
    prompt: "At a house party you spot the one person in the room everyone's orbiting. The window to talk is closing. You…",
    cases: [
      { id: "initiative_4_c0", label: "you've never met them", axisLevel: 1 },
      { id: "initiative_4_c1", label: "you've nodded at events before", axisLevel: 0.5 },
      { id: "initiative_4_c2", label: "they waved you over", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Walk straight up and open with something bold", vector: {"approach":2,"boldness":2} },
      { id: "B", label: "Drift near their circle and let it happen", vector: {} },
      { id: "C", label: "Stay with your friends across the room", vector: {"approach":-2,"boldness":-2} },
    ],
  },
  {
    id: "initiative_5", kind: "flavor", axis: "initiative",
    prompt: "Your project team is stalling on a deadline and the energy is dead. Someone needs to step in. You…",
    cases: [
      { id: "initiative_5_c0", label: "no one is even talking", axisLevel: 1 },
      { id: "initiative_5_c1", label: "a couple people are loosely contributing", axisLevel: 0.5 },
      { id: "initiative_5_c2", label: "they already asked you to run it", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Take over, assign tasks, set a check-in tonight", vector: {"lead":2,"approach":2} },
      { id: "B", label: "Offer to help with your slice and nudge gently", vector: {} },
      { id: "C", label: "Do your own part quietly and wait it out", vector: {"lead":-2,"approach":-2} },
    ],
  },
  {
    id: "initiative_6", kind: "flavor", axis: "initiative",
    prompt: "Pre-raid lobby in your squad game: comms are silent and the timer's ticking before queue. You…",
    cases: [
      { id: "initiative_6_c0", label: "they're all randoms", axisLevel: 1 },
      { id: "initiative_6_c1", label: "a few are regulars you've duo'd with", axisLevel: 0.5 },
      { id: "initiative_6_c2", label: "they're already calling you shotcaller", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Mic up, call a risky aggressive comp, lead the push", vector: {"boldness":2,"lead":2} },
      { id: "B", label: "Suggest a safe loadout and follow the team", vector: {} },
      { id: "C", label: "Mute, pick the meta pick, play passive", vector: {"boldness":-2,"lead":-2} },
    ],
  },
  {
    id: "initiative_7", kind: "flavor", axis: "initiative",
    prompt: "A friend has been off lately and their last few posts feel like a quiet cry for help. You…",
    cases: [
      { id: "initiative_7_c0", label: "you've drifted apart this year", axisLevel: 1 },
      { id: "initiative_7_c1", label: "you still react to each other's stuff", axisLevel: 0.5 },
      { id: "initiative_7_c2", label: "they texted you 'can we talk'", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Call them right now and actually check in", vector: {"approach":2} },
      { id: "B", label: "Send a 'you good?' text and leave it open", vector: {} },
      { id: "C", label: "Figure it's not your place and stay back", vector: {"approach":-2} },
    ],
  },
  {
    id: "initiative_8", kind: "flavor", axis: "initiative",
    prompt: "Your gym has a hyrox-style competition signup closing tonight and it's way above your usual level. You…",
    cases: [
      { id: "initiative_8_c0", label: "you'd go in totally solo", axisLevel: 1 },
      { id: "initiative_8_c1", label: "a couple gym acquaintances might join", axisLevel: 0.5 },
      { id: "initiative_8_c2", label: "your training partner already signed you both up", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Sign up before you can talk yourself out of it", vector: {"boldness":2} },
      { id: "B", label: "Wait to see if a friend commits first", vector: {} },
      { id: "C", label: "Skip it, you're not ready", vector: {"boldness":-2} },
    ],
  },
  {
    id: "initiative_9", kind: "flavor", axis: "initiative",
    prompt: "Family group chat is spiraling about who hosts the summer reunion and it's becoming a whole thing. You…",
    cases: [
      { id: "initiative_9_c0", label: "nobody will commit to hosting", axisLevel: 1 },
      { id: "initiative_9_c1", label: "an aunt is half-offering", axisLevel: 0.5 },
      { id: "initiative_9_c2", label: "everyone's pinging you to organize it", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Claim it: 'My place, this date, I'll handle food'", vector: {"lead":2,"approach":1} },
      { id: "B", label: "Offer to bring a dish and help whoever hosts", vector: {} },
      { id: "C", label: "Stay out of it and let the adults sort it", vector: {"lead":-2} },
    ],
  },
  {
    id: "initiative_10", kind: "flavor", axis: "initiative",
    prompt: "A talk just ended and the speaker you admire is packing up alone near the stage. Two minutes max. You…",
    cases: [
      { id: "initiative_10_c0", label: "you're a total stranger to them", axisLevel: 1 },
      { id: "initiative_10_c1", label: "you commented on their posts once", axisLevel: 0.5 },
      { id: "initiative_10_c2", label: "they said 'come find me after'", axisLevel: 0 },
    ],
    options: [
      { id: "A", label: "Go introduce yourself and pitch a bold follow-up", vector: {"approach":2,"boldness":2} },
      { id: "B", label: "Hover, and say hi only if they look up", vector: {} },
      { id: "C", label: "Head out and maybe email later, maybe not", vector: {"approach":-2,"boldness":-2} },
    ],
  },
]
