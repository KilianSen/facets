import { describe, it, expect } from 'vitest'
import { axesOf, castFacets, computeCast, facetCode, CAST_MIN_STRENGTH } from './cast'
import { computeProfile } from './scoring'
import { sigFrom } from './testFixtures'
import { CONTENT } from '../content'

const byId = (id: string) => CONTENT.archetypes.find(a => a.id === id)!

describe('axesOf', () => {
  it('lists the situations a prototype lives on, slope or curve', () => {
    expect([...axesOf(byId('vault'))]).toEqual(['closeness'])
    expect([...axesOf(byId('sweet_spot'))]).toEqual(['stakes'])
    expect(axesOf(byId('wallflower')).size).toBe(2)
    expect(axesOf(byId('constant')).size).toBe(0)
  })
})

describe('computeCast', () => {
  it('gives each situation you shift on its own type, led by the one explaining the most', () => {
    const sig = sigFrom(CONTENT, {
      closeness: { warmth: 5, approach: 5 },
      stakes: { composure: 4, lead: 3, boldness: 3 },
      energy: { approach: -3, boldness: -3 },
    })
    const cast = computeCast(sig, {}, CONTENT)
    expect(cast.lead).toBe('vault')
    expect(cast.members.map(m => m.archetypeId).sort()).toEqual(['clutch', 'runs_on_fumes', 'vault'])
    expect(cast.members.map(m => m.explained)).toEqual([...cast.members.map(m => m.explained)].sort((a, b) => b - a))
    expect(castFacets(cast).map(f => f.archetypeId).sort()).toEqual(['clutch', 'runs_on_fumes'])
    expect(cast.explained).toBeGreaterThan(0.8)
  })

  it('has no cap on co-stars', () => {
    const sig = sigFrom(CONTENT, {
      closeness: { warmth: 4, approach: 4 },
      stakes: { composure: 4, lead: 3, boldness: 3 },
      energy: { directness: -4, composure: 4 },
      initiative: { directness: -4, composure: -4 },
    })
    expect(computeCast(sig, {}, CONTENT).members).toHaveLength(4)
  })

  it('skips situations that barely shift, and ones no type explains', () => {
    const weak = sigFrom(CONTENT, { closeness: { warmth: 4, approach: 4 }, stakes: { composure: CAST_MIN_STRENGTH - 0.5 } })
    expect(computeCast(weak, {}, CONTENT).members.map(m => m.axisId)).toEqual(['closeness'])
    const odd = sigFrom(CONTENT, { closeness: { warmth: 4, approach: 4 }, stakes: { directness: 3, boldness: 3, lead: -3 } })
    expect(computeCast(odd, {}, CONTENT).members.some(m => m.axisId === 'stakes')).toBe(false)
  })

  it('lets a blend take several situations as one member when it explains them as well', () => {
    const sig = sigFrom(CONTENT, { audience: { approach: -3, warmth: -2 }, energy: { approach: -2 } })
    const cast = computeCast(sig, {}, CONTENT)
    expect(cast.lead).toBe('wallflower')
    expect(cast.members).toHaveLength(1)
    expect(cast.members[0].axes).toEqual(['audience', 'energy'])
  })

  it('reads a flat signature as The Constant, fully explained', () => {
    const cast = computeCast(sigFrom(CONTENT, {}), {}, CONTENT)
    expect(cast.lead).toBe('constant')
    expect(cast.members).toEqual([])
    expect(cast.confidence).toBe(1)
  })

  it('gives no confidence without evidence', () => {
    expect(computeProfile([], CONTENT).archetype.confidence).toBe(0)
  })

  it('counts a situation answered with neutral picks as evidence of being steady, not missing data', () => {
    const neutralEverywhere = CONTENT.questions
      .filter(q => q.kind === 'backbone' && !q.reserve && q.cases)
      .map(q => ({
        questionId: q.id, mode: 'depends' as const,
        ranking: q.cases!.map(c => c.id),
        mapping: Object.fromEntries(q.cases!.map(c => [c.id, q.options.find(o => Object.keys(o.vector).length === 0)!.id])),
      }))
    const p = computeProfile(neutralEverywhere, CONTENT)
    expect(p.archetype.id).toBe('constant')
    expect(p.archetype.confidence).toBeCloseTo(1)
  })

  it('stays honest when shifts are left unexplained', () => {
    const clean = computeCast(sigFrom(CONTENT, { stakes: { composure: 3, lead: 2, boldness: 2 } }), {}, CONTENT)
    const messy = computeCast(sigFrom(CONTENT, { stakes: { composure: 3, lead: 2, boldness: 2 }, power: { warmth: 1.5, boldness: -1.5 } }), {}, CONTENT)
    expect(clean.lead).toBe('clutch')
    expect(clean.confidence).toBeCloseTo(1)
    expect(messy.lead).toBe('clutch')
    expect(messy.confidence).toBeLessThan(clean.confidence)
  })

  it('names a close alternative reading of the headline’s situations', () => {
    const cast = computeCast(sigFrom(CONTENT, { closeness: { warmth: 4, approach: 4 } }), {}, CONTENT)
    expect(cast.lead).toBe('vault')
    const alt = byId(cast.runnerUpId!)
    expect([...axesOf(alt)].every(id => id === 'closeness')).toBe(true)
  })
})

describe('layers, combos and leftovers', () => {
  it('lets one situation hold several types when each explains a different part of it', () => {
    // Calm and conflict-avoidant with your people (The Peacekeeper) AND running the crew (The Ringleader).
    const cast = computeCast(sigFrom(CONTENT, { closeness: { directness: -4, composure: 4, lead: 4, boldness: 4 } }), {}, CONTENT)
    expect(cast.members.map(m => m.archetypeId)).toEqual(['peacekeeper', 'ringleader'])
    expect(cast.members.every(m => m.axisId === 'closeness')).toBe(true)
    expect(cast.explained).toBeGreaterThan(0.9)
  })

  it('prefers a combo type when it covers both parts in one', () => {
    // All-in AND heated with your people: The Fierce Loyalist, not The Vault + The Home Turf.
    const cast = computeCast(sigFrom(CONTENT, { closeness: { warmth: 4, approach: 4, directness: 4, composure: -4 } }), {}, CONTENT)
    expect(cast.lead).toBe('fierce_loyalist')
    expect(cast.members).toHaveLength(1)
  })

  it('never stacks a combo on a person who only has half of it', () => {
    const cast = computeCast(sigFrom(CONTENT, { closeness: { warmth: 4, approach: 4 } }), {}, CONTENT)
    expect(cast.members.map(m => m.archetypeId)).toEqual(['vault'])
  })

  it('reports strong shifts nobody in the cast explains', () => {
    const cast = computeCast(sigFrom(CONTENT, { stakes: { composure: 3, lead: 2, boldness: 2 }, initiative: { warmth: -4 } }), {}, CONTENT)
    expect(cast.lead).toBe('clutch')
    expect(cast.unexplained).toEqual([{ axisId: 'initiative', dimId: 'warmth', slope: -4, curvature: 0 }])
    expect(computeCast(sigFrom(CONTENT, { stakes: { composure: 3, lead: 2, boldness: 2 } }), {}, CONTENT).unexplained).toEqual([])
  })

  it('reads a genuine both-ways pattern as its bend type, but does not penalise a one-directional step', () => {
    // Composure/lead/boldness peak mid-stakes and drop at both ends → The Sweet Spot.
    const bend = computeCast(sigFrom(CONTENT, { stakes: { composure: [-1.6, -4], lead: [-1.6, -4], boldness: [-1.6, -4] } }), {}, CONTENT)
    expect(bend.lead).toBe('sweet_spot')
    // Only the closest level differs (slope 4, bend 2): still a clean Vault, fully explained.
    const step = computeCast(sigFrom(CONTENT, { closeness: { warmth: [3, 1.5], approach: [3, 1.5] } }), {}, CONTENT)
    expect(step.lead).toBe('vault')
    expect(step.explained).toBeGreaterThan(0.9)
  })

  it('takes charge with power without getting blunter: The Captain', () => {
    expect(computeCast(sigFrom(CONTENT, { power: { lead: 4, directness: -1 } }), {}, CONTENT).lead).toBe('captain')
  })

  it('penalizes cast confidence when answers exhibit high within-level instability', () => {
    const sig = sigFrom(CONTENT, { closeness: { warmth: 4, approach: 4 } })
    const allAxes = CONTENT.axes.map(a => a.id)
    const clean = computeCast(sig, {}, CONTENT, allAxes, {
      closeness: { axisId: 'closeness', instability: 0.05, coverage: 1, n: 6 },
    })
    const noisy = computeCast(sig, {}, CONTENT, allAxes, {
      closeness: { axisId: 'closeness', instability: 0.30, coverage: 1, n: 6 },
    })
    expect(clean.confidence).toBeGreaterThan(0.7)
    expect(noisy.confidence).toBeLessThan(clean.confidence * 0.7)
  })
})

describe('facetCode', () => {
  it('joins the primary and facet codes', () => {
    expect(facetCode('vault', [{ axisId: 'stakes', archetypeId: 'clutch', strength: 4, fit: 0.8 }], CONTENT)).toBe('VAULT · CLUTCH')
  })
})
