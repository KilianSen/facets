import { describe, it, expect } from 'vitest'
import { ARCHETYPES } from './archetypes'
import { AXES } from './axes'
import { DIMS } from './dimensions'
import { matchArchetype } from '../engine'
import type { Content, Signature } from '../engine/types'

const content: Content = { axes: AXES, dims: DIMS, archetypes: ARCHETYPES, questions: [] }

/** Build a user signature whose slopes equal an archetype's prototype exactly. */
function signatureFromProto(proto: (typeof ARCHETYPES)[number]['signature']): Signature {
  const sig: Signature = {}
  for (const axis of AXES) {
    sig[axis.id] = {}
    for (const dim of DIMS) {
      sig[axis.id][dim.id] = { slope: proto[axis.id]?.[dim.id] ?? 0, levels: [] }
    }
  }
  return sig
}

describe('ARCHETYPES', () => {
  it('defines 20 archetypes with unique ids and codes and non-empty copy', () => {
    expect(ARCHETYPES).toHaveLength(20)
    expect(new Set(ARCHETYPES.map(a => a.id)).size).toBe(20)
    expect(new Set(ARCHETYPES.map(a => a.code)).size).toBe(20)
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

  it('is separable: every archetype self-matches its own prototype signature', () => {
    for (const a of ARCHETYPES) {
      const match = matchArchetype(signatureFromProto(a.signature), content)
      expect(match.id, `${a.code} should self-match`).toBe(a.id)
    }
  })
})
