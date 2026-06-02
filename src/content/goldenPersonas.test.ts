import { describe, it, expect } from 'vitest'
import { computeProfile } from '../engine'
import { CONTENT } from './index'
import { GOLDEN_PERSONAS } from './goldenPersonas'

describe('golden personas → expected archetype', () => {
  for (const persona of GOLDEN_PERSONAS) {
    it(`${persona.name} maps to ${persona.expectedArchetypeId}`, () => {
      const profile = computeProfile(persona.answers, CONTENT)
      expect(profile.archetype.id).toBe(persona.expectedArchetypeId)
    })
  }
})
