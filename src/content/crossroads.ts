import type { AxisId } from '../engine/types'

export interface CrossroadsOption {
  id: string
  label: string
  /** The axis that takes precedence if this option is chosen, or 'balance' if navigating both */
  favorsAxis: AxisId | 'balance'
  explanation: string
}

export interface CrossroadsDilemma {
  id: string
  axes: [AxisId, AxisId]
  title: string
  prompt: string
  options: [CrossroadsOption, CrossroadsOption, CrossroadsOption]
}

export function crossroadsQuestionId(axisA: AxisId, axisB: AxisId): string {
  const [a, b] = [axisA, axisB].sort()
  return `crossroads_${a}_${b}`
}

export function isCrossroadsAnswer(questionId: string): boolean {
  return questionId.startsWith('crossroads_')
}

export const CROSSROADS_DILEMMAS: CrossroadsDilemma[] = [
  {
    id: crossroadsQuestionId('closeness', 'power'),
    axes: ['closeness', 'power'],
    title: 'The Friend as Direct Report',
    prompt: "You're leading a high-priority project at work, and your close friend is your direct report. They’ve slipped on deliverables three weeks in a row, and leadership is asking questions. You…",
    options: [
      { id: 'A', label: 'Cover for them in the meeting and quietly fix it together after', favorsAxis: 'closeness', explanation: 'Loyalty to your people overrides workplace hierarchy.' },
      { id: 'B', label: 'Address it candidly in your 1-on-1: work is work, standards stay firm', favorsAxis: 'power', explanation: 'Authority and objective standards take precedence over personal ties.' },
      { id: 'C', label: 'Redistribute their key deliverables to protect both the project and the friendship', favorsAxis: 'balance', explanation: 'You reset boundaries to keep personal and professional separate.' },
    ],
  },
  {
    id: crossroadsQuestionId('closeness', 'stakes'),
    axes: ['closeness', 'stakes'],
    title: 'The Risky Confession',
    prompt: "A high-stakes situation is spiraling, and someone from your inner circle privately confesses they caused the mistake. Covering for them puts you and the group at severe risk. You…",
    options: [
      { id: 'A', label: 'Shield them—you take the heat together or find another way out', favorsAxis: 'closeness', explanation: 'Your ride-or-die bond holds even when the cost is high.' },
      { id: 'B', label: 'Tell the truth straight up—the stakes are too big to play favorites', favorsAxis: 'stakes', explanation: 'The weight of the consequences overrides personal loyalty.' },
      { id: 'C', label: 'Insist they step forward and confess right now, but stand beside them while they do', favorsAxis: 'balance', explanation: 'You hold them accountable without abandoning them.' },
    ],
  },
  {
    id: crossroadsQuestionId('audience', 'power'),
    axes: ['audience', 'power'],
    title: 'The Public Pushback',
    prompt: "In a packed room, someone with authority over you presents a flawed decision that will hurt the group. Everyone looks at you to see if you speak up. You…",
    options: [
      { id: 'A', label: 'Challenge them publicly right then and there—the room needs to hear it', favorsAxis: 'audience', explanation: 'Audience energy pushes you into bold, direct resistance.' },
      { id: 'B', label: 'Nod politely in the room, then challenge them privately behind closed doors', favorsAxis: 'power', explanation: 'You respect hierarchy and leverage, choosing strategy over spectacle.' },
      { id: 'C', label: 'Ask a calm, innocent-sounding question in front of everyone that exposes the flaw', favorsAxis: 'balance', explanation: 'You navigate the room with diplomatic finesse without open war.' },
    ],
  },
  {
    id: crossroadsQuestionId('audience', 'closeness'),
    axes: ['audience', 'closeness'],
    title: 'The Roast',
    prompt: "You're holding court at a gathering and everyone is laughing. A hilarious joke pops into your head, but it lightly exposes a private insecurity of your close friend sitting right next to you. You…",
    options: [
      { id: 'A', label: 'Fire off the joke—the room is electric and they know you love them', favorsAxis: 'audience', explanation: 'The urge to perform and entertain the room wins the moment.' },
      { id: 'B', label: 'Bite your tongue—protecting your friend always comes before laughs from a crowd', favorsAxis: 'closeness', explanation: 'Inner-circle safety is sacred, no matter who is watching.' },
      { id: 'C', label: 'Pivot the punchline to tease yourself instead, keeping the room laughing', favorsAxis: 'balance', explanation: 'You feed the audience while keeping your friend completely safe.' },
    ],
  },
  {
    id: crossroadsQuestionId('energy', 'stakes'),
    axes: ['energy', 'stakes'],
    title: 'The 2 AM Crisis',
    prompt: "You're running completely on fumes after a grueling week and just collapsed into bed. An urgent crisis call rings from someone whose situation genuinely matters. You…",
    options: [
      { id: 'A', label: 'Answer immediately, surge on adrenaline, and take charge of it', favorsAxis: 'stakes', explanation: 'Pressure wakes you up; when it counts, your battery finds reserve power.' },
      { id: 'B', label: 'Let it go to voicemail—running on empty, you’ll only make it worse', favorsAxis: 'energy', explanation: 'Your battery boundaries are non-negotiable, even in a crisis.' },
      { id: 'C', label: 'Send a quick text with one key recommendation, then shut your phone off', favorsAxis: 'balance', explanation: 'You offer high-leverage triage without draining yourself dry.' },
    ],
  },
  {
    id: crossroadsQuestionId('initiative', 'power'),
    axes: ['initiative', 'power'],
    title: 'The Unsanctioned Move',
    prompt: "You spot a rare, fast-closing opportunity that requires making an immediate bold move, but protocol demands waiting for sign-off from higher-ups who are unreachable. You…",
    options: [
      { id: 'A', label: 'Pull the trigger right now—ask for forgiveness instead of permission', favorsAxis: 'initiative', explanation: 'First-mover advantage beats waiting for permission every time.' },
      { id: 'B', label: 'Hold back and follow the chain of command—it’s not your call to make', favorsAxis: 'power', explanation: 'Respecting authority and leverage safeguards you from overstepping.' },
      { id: 'C', label: 'Take low-risk preparatory steps without committing, ready when sign-off arrives', favorsAxis: 'balance', explanation: 'You lean forward without violating the hierarchy.' },
    ],
  },
  {
    id: crossroadsQuestionId('initiative', 'closeness'),
    axes: ['initiative', 'closeness'],
    title: 'The Vulnerability Leap',
    prompt: "You've grown close to someone and want to take things deeper, but you have no guarantee they feel the same. Stepping forward leaves you completely exposed. You…",
    options: [
      { id: 'A', label: 'Put your cards on the table right now—better to risk rejection than stay in limbo', favorsAxis: 'initiative', explanation: 'You would rather move first and own the outcome than wait.' },
      { id: 'B', label: 'Hold back and let them come to you—the bond needs to prove itself safe first', favorsAxis: 'closeness', explanation: 'Protection of your guard takes precedence over pursuit.' },
      { id: 'C', label: 'Drop a subtle, unmistakable hint and see if they step forward into it', favorsAxis: 'balance', explanation: 'You invite them to meet you halfway.' },
    ],
  },
  {
    id: crossroadsQuestionId('power', 'stakes'),
    axes: ['power', 'stakes'],
    title: 'The High-Stakes Gamble',
    prompt: "You hold the decision-making leverage, but the stakes are massive and a wrong call will land squarely on your shoulders. You…",
    options: [
      { id: 'A', label: 'Call the shot decisively—that’s what having authority is for', favorsAxis: 'power', explanation: 'You lean into your power and own the consequences.' },
      { id: 'B', label: 'Call a vote and distribute the decision across the team', favorsAxis: 'stakes', explanation: 'The weight of the moment prompts you to hedge and share the risk.' },
      { id: 'C', label: 'Test a small, reversible pilot before committing full resources', favorsAxis: 'balance', explanation: 'You steer prudently, minimizing catastrophic downside.' },
    ],
  },
  {
    id: crossroadsQuestionId('audience', 'stakes'),
    axes: ['audience', 'stakes'],
    title: 'The Public Blunder',
    prompt: "You're presenting to a key client or high-stakes committee when you realize a crucial figure on your slide is completely wrong. Correcting it on the spot stops the momentum in front of everyone; ignoring it risks signing off on catastrophic bad data. You…",
    options: [
      { id: 'A', label: 'Stop the presentation immediately and correct the error in front of the room', favorsAxis: 'stakes', explanation: 'Getting the facts and stakes right matters more than public image.' },
      { id: 'B', label: 'Smoothly talk past the slide, preserve momentum, and send corrections after', favorsAxis: 'audience', explanation: 'Public composure and keeping the room confident takes priority.' },
      { id: 'C', label: 'Acknowledge the figure lightly, note the correct number, and continue smoothly', favorsAxis: 'balance', explanation: 'You protect the room and the stakes without panic.' },
    ],
  },
  {
    id: crossroadsQuestionId('audience', 'energy'),
    axes: ['audience', 'energy'],
    title: 'The After-Party Spotlight',
    prompt: "An important gathering is hitting peak excitement, and everyone wants you to stay and take the center of the room. But your social battery is at absolute zero. You…",
    options: [
      { id: 'A', label: 'Power through and deliver for the room—you can sleep tomorrow', favorsAxis: 'audience', explanation: 'The pull of the crowd and being present overrides physical fatigue.' },
      { id: 'B', label: 'Slip out the back without explaining—protecting your battery is non-negotiable', favorsAxis: 'energy', explanation: 'When the tank is empty, your energy boundaries take absolute priority.' },
      { id: 'C', label: 'Stay for one round of genuine goodbyes, then make a graceful exit', favorsAxis: 'balance', explanation: 'You honour the room while respecting your limits.' },
    ],
  },
  {
    id: crossroadsQuestionId('audience', 'initiative'),
    axes: ['audience', 'initiative'],
    title: 'The Cold Room',
    prompt: "A large room or meeting is dead silent. Someone asks for a volunteer or ideas to kick things off, and the silence stretches painfully. Nobody is budging. You…",
    options: [
      { id: 'A', label: 'Jump in immediately with an unpolished idea to break the ice and get things moving', favorsAxis: 'initiative', explanation: 'Taking first action matters more than waiting for perfection.' },
      { id: 'B', label: 'Read the room and hold your silence—never expose yourself until you understand the dynamics', favorsAxis: 'audience', explanation: 'Public exposure requires careful calibration before you speak.' },
      { id: 'C', label: 'Toss out a light, open question that invites two other people in the room to chime in', favorsAxis: 'balance', explanation: 'You break the deadlock while redirecting the spotlight.' },
    ],
  },
  {
    id: crossroadsQuestionId('closeness', 'energy'),
    axes: ['closeness', 'energy'],
    title: 'The Depleted Companion',
    prompt: "Someone very close to you needs to vent about a hard day for hours, but you are physically and emotionally drained to the marrow. You…",
    options: [
      { id: 'A', label: 'Sit with them and listen as long as it takes—loyalty means showing up even empty', favorsAxis: 'closeness', explanation: 'Deep relational bonds trump personal comfort and exhaustion.' },
      { id: 'B', label: 'Tell them honestly you have nothing left to give tonight and need to be alone', favorsAxis: 'energy', explanation: 'You cannot pour from an empty cup; your battery comes first.' },
      { id: 'C', label: 'Give them 20 minutes of your complete presence, then lovingly schedule a long catch-up tomorrow', favorsAxis: 'balance', explanation: 'You give quality over endurance, protecting both the bond and yourself.' },
    ],
  },
  {
    id: crossroadsQuestionId('energy', 'power'),
    axes: ['energy', 'power'],
    title: 'The Exhausting Succession',
    prompt: "An exhausting power struggle or leadership void opens up on a team you care about. Taking command will restore order, but it will consume whatever precious energy reserves you have left. You…",
    options: [
      { id: 'A', label: 'Step up and take the wheel—giving up control to weak leadership is worse than fatigue', favorsAxis: 'power', explanation: 'Holding command and steering the outcome outweighs the energy cost.' },
      { id: 'B', label: 'Decline to take on the leadership role—no title or influence is worth burning out', favorsAxis: 'energy', explanation: 'Preserving your bandwidth is worth ceding control.' },
      { id: 'C', label: 'Coach a capable peer to take the lead, serving as a low-intensity advisor', favorsAxis: 'balance', explanation: 'You preserve strategic influence without carrying daily operational weight.' },
    ],
  },
  {
    id: crossroadsQuestionId('energy', 'initiative'),
    axes: ['energy', 'initiative'],
    title: 'The Exhausted Spark',
    prompt: "You're tired after a long haul, but you have an inspired idea for a new initiative that requires striking right this second before momentum fades. You…",
    options: [
      { id: 'A', label: 'Ride the spark and start building right now—momentum waits for no one', favorsAxis: 'initiative', explanation: 'The impulse to create and launch takes precedence over rest.' },
      { id: 'B', label: 'Put the idea away and rest—if it’s truly a good initiative, it will still make sense when you’re fresh', favorsAxis: 'energy', explanation: 'Sustainable stamina wins out over impulsive bursts.' },
      { id: 'C', label: 'Spend exactly fifteen minutes writing an outline to capture the vision, then step away', favorsAxis: 'balance', explanation: 'You pin down the initiative without burning into your reserves.' },
    ],
  },
  {
    id: crossroadsQuestionId('initiative', 'stakes'),
    axes: ['initiative', 'stakes'],
    title: 'The Decisive Gamble',
    prompt: "A high-stakes situation is deteriorating by the minute. Making an unverified proactive move could solve the entire problem instantly or make things catastrophically worse. Waiting guarantees a slow loss. You…",
    options: [
      { id: 'A', label: 'Make the aggressive move right now—better to lose taking action than die by inches', favorsAxis: 'initiative', explanation: 'Proactive speed and taking the initiative beats cautious paralysis.' },
      { id: 'B', label: 'Hold your fire and minimize exposure—in high-stakes scenarios, avoiding catastrophic error comes first', favorsAxis: 'stakes', explanation: 'Risk containment and surviving the downside outweighs boldness.' },
      { id: 'C', label: 'Deploy a fast, limited exploratory measure to buy time and gather signal before committing', favorsAxis: 'balance', explanation: 'You balance forward movement with strict risk containment.' },
    ],
  },
]

/** Find the authored crossroads dilemma for two axes, if one exists. */
export function findCrossroadsDilemma(axisA: AxisId, axisB: AxisId): CrossroadsDilemma | undefined {
  const id = crossroadsQuestionId(axisA, axisB)
  return CROSSROADS_DILEMMAS.find(d => d.id === id)
}
