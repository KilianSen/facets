import { describe, it, expect } from 'vitest'
import { ARCHETYPES } from './archetypes'
import { AXES } from './axes'
import { DIMS } from './dimensions'
import { matchArchetype } from '../engine'
import type { Archetype, Content, Signature } from '../engine/types'

const content: Content = { axes: AXES, dims: DIMS, archetypes: ARCHETYPES, questions: [] }

/** Build a user signature whose slopes AND curvatures equal an archetype's prototype exactly. */
function signatureFromProto(a: Archetype): Signature {
  const sig: Signature = {}
  for (const axis of AXES) {
    sig[axis.id] = {}
    for (const dim of DIMS) {
      sig[axis.id][dim.id] = {
        slope: a.signature[axis.id]?.[dim.id] ?? 0,
        curvature: a.curve?.[axis.id]?.[dim.id] ?? 0,
        levels: [],
      }
    }
  }
  return sig
}

describe('ARCHETYPES', () => {
  it('defines 22 archetypes with unique ids and codes and non-empty copy', () => {
    expect(ARCHETYPES).toHaveLength(22)
    expect(new Set(ARCHETYPES.map(a => a.id)).size).toBe(22)
    expect(new Set(ARCHETYPES.map(a => a.code)).size).toBe(22)
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
})
