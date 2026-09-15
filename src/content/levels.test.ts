import { describe, it, expect } from 'vitest'
import { CONTENT } from './index'

// Level 1 is always the high end of a situation: someone close, high stakes, being watched, energized,
// holding the power, making the first move. These words only fit one end, so a case at the other end
// that uses one is almost certainly scored backwards (which silently flips every slope it feeds).
const LOW_END: Record<string, RegExp> = {
  closeness: /stranger|never met|random|barely recognize|just met/i,
  stakes: /pizza|meme|five bucks|charger|bangs|dishes|trampoline|game night|bored/i,
  audience: /alone|just you|one-on-one|private|solo/i,
  energy: /5%|fumes|exhaust|drained|last bar|slept three hours|past your limit|empty|spent|no fuel|burnt out|wiped|tired/i,
  power: /fire or demote|senior director|holds all the cards|your (new )?boss|probation|outrank you|they got you|just started|crash on|weren't invited|hosting you broke|you need it|prof picks|you like them more/i,
  initiative: /they (asked|texted|dm'd|waved|tagged|already|said|ask)|asked you|pinging you|signed you both up|waiting on you/i,
}
const HIGH_END: Record<string, RegExp> = {
  closeness: /best friend|partner|sibling|ride-or-die|inner circle|day-one|close friend/i,
  stakes: /rent|parent|the one|marrying|crashed|med results|client|flight tonight|deadlift|define the relationship/i,
  audience: /packed|crowd|sold-out|everyone watching|all eyes|auditorium|amphitheater|live-stream/i,
  energy: /fully charged|energized|rested|refreshed|hyped|wired|buzzing|locked in|plenty/i,
  power: /you run|you set|you hold|your party|lease is in your name|you fund|strongest|you supervise|their boss|they need you|huge following|smurfing|way into you|can't afford to lose/i,
  initiative: /out of nowhere|unprompted|zero (prior )?contact|nobody (has|will|asked|invited)|slide in cold|total(ly)? (stranger|solo)|never met/i,
}

describe('case levels point the right way', () => {
  for (const q of CONTENT.questions) {
    if (!q.axis || !q.cases) continue
    it(q.id, () => {
      for (const c of q.cases!) {
        if (c.axisLevel === 1 && LOW_END[q.axis!]) expect(c.label, `${c.id} is level 1 but reads as the low end`).not.toMatch(LOW_END[q.axis!])
        if (c.axisLevel === 0 && HIGH_END[q.axis!]) expect(c.label, `${c.id} is level 0 but reads as the high end`).not.toMatch(HIGH_END[q.axis!])
      }
    })
  }
})
