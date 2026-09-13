import { describe, it, expect } from 'vitest'
import { computeFacets, facetCode, axesOf, FACET_MIN_STRENGTH, MAX_FACETS } from './facets'
import { matchArchetype } from './match'
import { computeProfile } from './scoring'
import { sigFrom } from './testFixtures'
import { CONTENT } from '../content'

describe('axesOf', () => {
  it('lists the axes a prototype lives on, slope or curve', () => {
    const byId = (id: string) => CONTENT.archetypes.find(a => a.id === id)!
    expect([...axesOf(byId('vault'))]).toEqual(['closeness'])
    expect([...axesOf(byId('sweet_spot'))]).toEqual(['stakes'])
    expect(axesOf(byId('wallflower')).size).toBe(2)
    expect(axesOf(byId('constant')).size).toBe(0)
  })
})

describe('computeFacets', () => {
  // A Vault (closeness) who is also clearly Clutch under pressure and Runs on Fumes.
  const sig = sigFrom(CONTENT, {
    closeness: { warmth: 4, approach: 4 },
    stakes: { composure: 4, lead: 3, boldness: 3 },
    energy: { approach: -3, boldness: -3 },
  })

  it('names the archetype behind each strong axis the primary does not cover', () => {
    const primary = matchArchetype(sig, {}, CONTENT).id
    expect(primary).toBe('vault')
    const facets = computeFacets(sig, primary, CONTENT)
    expect(facets.map(f => f.archetypeId).sort()).toEqual(['clutch', 'runs_on_fumes'])
    for (const f of facets) {
      expect(f.fit).toBeGreaterThan(0.4)
      expect(f.fit).toBeLessThanOrEqual(1)
    }
  })

  it('never re-uses the primary archetype’s own axis', () => {
    const facets = computeFacets(sig, 'vault', CONTENT)
    expect(facets.some(f => f.axisId === 'closeness')).toBe(false)
  })

  it('skips axes that barely shift', () => {
    const weak = sigFrom(CONTENT, { closeness: { warmth: 4, approach: 4 }, stakes: { composure: FACET_MIN_STRENGTH - 0.5 } })
    expect(computeFacets(weak, 'vault', CONTENT)).toEqual([])
  })

  it('skips a strong axis no single-axis archetype actually explains', () => {
    // Warmth rising with stakes while boldness falls: no stakes prototype fits this mix well.
    const odd = sigFrom(CONTENT, { closeness: { warmth: 4, approach: 4 }, stakes: { directness: 3, boldness: 3, lead: -3 } })
    expect(computeFacets(odd, 'vault', CONTENT).some(f => f.axisId === 'stakes')).toBe(false)
  })

  it('caps at MAX_FACETS, strongest first', () => {
    const busy = sigFrom(CONTENT, {
      closeness: { warmth: 4, approach: 4 },
      stakes: { composure: 4, lead: 3, boldness: 3 },
      energy: { approach: -2.5, boldness: -2.5 },
      power: { directness: 4, lead: 4 },
    })
    const facets = computeFacets(busy, 'vault', CONTENT)
    expect(facets).toHaveLength(MAX_FACETS)
    expect(facets[0].strength * facets[0].fit).toBeGreaterThanOrEqual(facets[1].strength * facets[1].fit)
  })

  it('gives a flat signature no facets', () => {
    expect(computeFacets(sigFrom(CONTENT, {}), 'constant', CONTENT)).toEqual([])
  })

  it('is part of every computed profile', () => {
    expect(computeProfile([], CONTENT).facets).toEqual([])
  })
})

describe('facetCode', () => {
  it('joins the primary and facet codes', () => {
    expect(facetCode('vault', [{ axisId: 'stakes', archetypeId: 'clutch', strength: 4, fit: 0.8 }], CONTENT)).toBe('VAULT · CLUTCH')
  })
})
