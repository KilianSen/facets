import type { Answer, Archetype, AxisId, Content, Profile } from './types'
import { axesOf } from './cast'
import { findCrossroadsDilemma, isCrossroadsAnswer } from '../content/crossroads'

export interface InterplayInsight {
  lead: Archetype
  coStar: Archetype
  axes: [AxisId, AxisId]
  headline: string
  dynamic: 'tension' | 'synergy' | 'polarity'
  body: string
  hierarchy?: {
    winnerAxis?: AxisId | 'balance'
    winnerArchetype?: Archetype
    readout: string
  }
}

/** Pre-authored canonical narrative dynamics for the most prominent Lead + Co-star combinations. */
const CANONICAL_INTERPLAYS: Record<string, { headline: string; dynamic: 'tension' | 'synergy' | 'polarity'; body: string }> = {
  // Closeness x Power
  'vault:operator': {
    headline: 'Loyalty vs. Leverage',
    dynamic: 'tension',
    body: "Your private and professional boundaries run in opposite directions: you are fiercely loyal and protective of your circle, but strategic and unsentimental around leverage. You feel the greatest strain when a close friend becomes a coworker or reports to you.",
  },
  'peacekeeper:underdog': {
    headline: 'Gentle with Friends, Fierce with Power',
    dynamic: 'polarity',
    body: "You would rather let an argument slide than risk friction with someone you love, but you have zero hesitation taking on authority with nothing to lose. You save your peace for your people and your fight for the hierarchy.",
  },
  'open_book:ivory_tower': {
    headline: 'Open Ground, Distant Heights',
    dynamic: 'tension',
    body: "On equal or neutral ground you are welcoming and transparent to newcomers; but when handed power or status, you retreat into distance and keep people at arm’s length.",
  },
  // Closeness x Stakes
  'vault:clutch': {
    headline: 'The Steadfast Guardian',
    dynamic: 'synergy',
    body: "High pressure and personal loyalty reinforce each other: when crisis hits your people, you lock in completely—cool, decisive, and fully present. You are who people call when everything is falling apart.",
  },
  'peacekeeper:surgeon': {
    headline: 'Peace in the Calm, Ice in the Crisis',
    dynamic: 'polarity',
    body: "In everyday relationships you prioritize keeping the peace and softening hard edges. But when real crisis strikes, you switch your feelings off entirely and make the cold, decisive call.",
  },
  // Audience x Stakes
  'performer:clutch': {
    headline: 'Thrives Under the Bright Lights',
    dynamic: 'synergy',
    body: "High pressure and high visibility bring out your peak performance. Rather than rattling you, all eyes on you in a critical moment centers your focus and sharpens your instincts.",
  },
  'backstage:clutch': {
    headline: 'Quiet Hero',
    dynamic: 'polarity',
    body: "You rise to high-pressure challenges with calm decisiveness, but you prefer doing it without an audience watching. You want to fix the crisis, not take a victory lap.",
  },
  'menace:clutch': {
    headline: 'Chaos in Public, Steel in Crisis',
    dynamic: 'tension',
    body: "An audience tempts you into playful disruption and bold candor, but true stakes sober you up into decisive focus. People who only know your public persona are surprised by how capable you are when it counts.",
  },
  // Audience x Closeness
  'vault:performer': {
    headline: 'Electric in Public, Selective in Private',
    dynamic: 'polarity',
    body: "You can charm and electrify a room with ease, but very few people ever get behind the curtain. An audience gets your energy, but only your day-ones get your real vulnerability.",
  },
  'backstage:open_book': {
    headline: 'One-on-One Warmth',
    dynamic: 'synergy',
    body: "You do not need a crowd to be social—in fact, a crowd shuts you down. Your warmth is built for intimate, one-on-one depth where you can share without feeling watched.",
  },
  'fierce_loyalist:statesperson': {
    headline: 'Fierce in Private, Diplomatic in Public',
    dynamic: 'polarity',
    body: "Your private and public masks are starkly separate. With your inner circle you are all-heat, all-in, and unapologetically blunt. But put a room of people in front of you, and your poise locks in: you become tactful, diplomatic, and measured, curating every word.",
  },
}

function keyFor(idA: string, idB: string): string {
  return `${idA}:${idB}`
}

/** Synthesize the narrative interplay between the Headline and strongest Co-star. */
export function synthesizeInterplay(profile: Profile, content: Content, answers: Answer[]): InterplayInsight | null {
  const lead = content.archetypes.find(a => a.id === profile.archetype.id)
  if (!lead || !profile.facets || profile.facets.length === 0) return null

  const coStarFacet = profile.facets[0]
  const coStar = content.archetypes.find(a => a.id === coStarFacet.archetypeId)
  if (!coStar) return null

  const leadAxes = [...axesOf(lead)]
  const leadAxis = leadAxes[0] ?? content.axes[0].id
  const coStarAxis = coStarFacet.axisId ?? [...axesOf(coStar)][0] ?? content.axes[1].id

  if (leadAxis === coStarAxis) return null // same situation; no cross-axis friction

  const axes: [AxisId, AxisId] = [leadAxis, coStarAxis]
  const key1 = keyFor(lead.id, coStar.id)
  const key2 = keyFor(coStar.id, lead.id)
  const canonical = CANONICAL_INTERPLAYS[key1] ?? CANONICAL_INTERPLAYS[key2]

  const leadAxisName = content.axes.find(a => a.id === leadAxis)?.name ?? leadAxis
  const coStarAxisName = content.axes.find(a => a.id === coStarAxis)?.name ?? coStarAxis

  const headline = canonical?.headline ?? `${lead.name} meets ${coStar.name}`
  const dynamic = canonical?.dynamic ?? 'tension'
  const body = canonical?.body
    ?? `Your headline style (${lead.name} around ${leadAxisName.toLowerCase()}) operates alongside your secondary facet (${coStar.name} around ${coStarAxisName.toLowerCase()}). When these two situations overlap, your behaviour shifts depending on which trigger feels more immediate.`

  // Check if user answered a Crossroads dilemma for these two axes
  const dilemma = findCrossroadsDilemma(leadAxis, coStarAxis)
  let hierarchy: InterplayInsight['hierarchy'] | undefined

  if (dilemma) {
    const crossroadsAns = answers.find(a => isCrossroadsAnswer(a.questionId) && a.questionId === dilemma.id)
    if (crossroadsAns && crossroadsAns.mode === 'single') {
      const pickedOpt = dilemma.options.find(o => o.id === crossroadsAns.optionId)
      if (pickedOpt) {
        const winnerAxis = pickedOpt.favorsAxis
        const winnerArchetype = winnerAxis === leadAxis ? lead : winnerAxis === coStarAxis ? coStar : undefined
        hierarchy = {
          winnerAxis,
          winnerArchetype,
          readout: pickedOpt.explanation,
        }
      }
    }
  }

  return { lead, coStar, axes, headline, dynamic, body, hierarchy }
}
