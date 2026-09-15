import { describe, it, expect } from 'vitest'
import { synthesizeInterplay } from './interplay'
import { CONTENT } from '../content'
import { sigFrom } from './testFixtures'
import { computeCast, castFacets } from './cast'
import { computeProfile } from './scoring'
import type { Answer, Profile } from './types'

describe('synthesizeInterplay', () => {
  it('returns null if there are no facets (e.g. constant or single-facet profile)', () => {
    const p = computeProfile([], CONTENT)
    expect(synthesizeInterplay(p, CONTENT, [])).toBeNull()
  })

  it('synthesizes canonical narrative for Vault + Operator', () => {
    // Vault on closeness (warmth: 4, approach: 4) + Operator on power (directness: 4, lead: 4)
    const sig = sigFrom(CONTENT, {
      closeness: { warmth: 4, approach: 4 },
      power: { directness: 4, lead: 4 },
    })
    const cast = computeCast(sig, {}, CONTENT)
    const profile: Profile = {
      archetype: { id: cast.lead, confidence: cast.confidence },
      signature: sig,
      baseline: {},
      topContingencies: [],
      dimensionRanges: {} as any,
      flexibility: 4,
      facets: castFacets(cast),
      axisStability: {} as any,
      axisSwing: {} as any,
    }

    const insight = synthesizeInterplay(profile, CONTENT, [])
    expect(insight).toBeDefined()
    expect(insight?.lead.id).toBe('vault')
    expect(insight?.coStar.id).toBe('operator')
    expect(insight?.headline).toBe('Loyalty vs. Leverage')
    expect(insight?.dynamic).toBe('tension')
    expect(insight?.hierarchy).toBeUndefined()
  })

  it('resolves hierarchy when a crossroads answer is present', () => {
    const sig = sigFrom(CONTENT, {
      closeness: { warmth: 4, approach: 4 },
      power: { directness: 4, lead: 4 },
    })
    const cast = computeCast(sig, {}, CONTENT)
    const profile: Profile = {
      archetype: { id: cast.lead, confidence: cast.confidence },
      signature: sig,
      baseline: {},
      topContingencies: [],
      dimensionRanges: {} as any,
      flexibility: 4,
      facets: castFacets(cast),
      axisStability: {} as any,
      axisSwing: {} as any,
    }

    const answers: Answer[] = [
      { questionId: 'crossroads_closeness_power', mode: 'single', optionId: 'A' },
    ]

    const insight = synthesizeInterplay(profile, CONTENT, answers)
    expect(insight?.hierarchy).toBeDefined()
    expect(insight?.hierarchy?.winnerAxis).toBe('closeness')
    expect(insight?.hierarchy?.winnerArchetype?.id).toBe('vault')
    expect(insight?.hierarchy?.readout).toContain('Loyalty')
  })
})
