import { describe, it, expect } from 'vitest'
import { ARCHETYPES } from './archetypes'
import { AXES } from './axes'
import { DIMS } from './dimensions'
import { computeCast, matchArchetype } from '../engine'
import type { Archetype, Content, Signature } from '../engine/types'

const content: Content = { axes: AXES, dims: DIMS, archetypes: ARCHETYPES, questions: [] }

/** Build a user signature whose slopes AND curvatures equal an archetype's prototype exactly (every axis "measured"). */
function signatureFromProto(a: Archetype): Signature {
  const sig: Signature = {}
  for (const axis of AXES) {
    sig[axis.id] = {}
    for (const dim of DIMS) {
      sig[axis.id][dim.id] = {
        slope: a.signature[axis.id]?.[dim.id] ?? 0,
        curvature: a.curve?.[axis.id]?.[dim.id] ?? 0,
        levels: [0, 0.5, 1].map(level => ({ level, value: 0 })),
      }
    }
  }
  return sig
}

describe('ARCHETYPES', () => {
  it('defines 58 archetypes with unique ids and codes and non-empty copy', () => {
    expect(ARCHETYPES).toHaveLength(58)
    expect(new Set(ARCHETYPES.map(a => a.id)).size).toBe(ARCHETYPES.length)
    expect(new Set(ARCHETYPES.map(a => a.code)).size).toBe(ARCHETYPES.length)
    for (const a of ARCHETYPES) {
      expect(a.name).toBeTruthy()
      expect(a.tagline).toBeTruthy()
      expect(a.copy).toBeTruthy()
    }
  })

  it('includes the constant archetype with a flat (empty) signature', () => {
    const constant = ARCHETYPES.find(a => a.id === 'constant')!
    expect(constant.signature).toEqual({})
  })

  it('is separable: every archetype self-matches its own prototype signature + curve + baseline', () => {
    for (const a of ARCHETYPES) {
      const match = matchArchetype(signatureFromProto(a), a.baseline ?? {}, content)
      expect(match.id, `${a.code} should self-match`).toBe(a.id)
    }
  })

  it('is castable: every archetype leads the cast built from its own exact prototype', () => {
    for (const a of ARCHETYPES) {
      const cast = computeCast(signatureFromProto(a), a.baseline ?? {}, content)
      expect(cast.lead, `${a.code} should lead its own cast (got ${cast.members.map(m => m.archetypeId).join(', ')})`).toBe(a.id)
      expect(cast.confidence, `${a.code} should be fully explained by its own prototype`).toBeCloseTo(1)
    }
  })
})
