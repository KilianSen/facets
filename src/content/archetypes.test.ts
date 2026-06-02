import { describe, it, expect } from 'vitest'
import { ARCHETYPES } from './archetypes'

describe('ARCHETYPES', () => {
  it('defines 6 archetypes with unique ids and codes and non-empty copy', () => {
    expect(ARCHETYPES).toHaveLength(6)
    expect(new Set(ARCHETYPES.map(a => a.id)).size).toBe(6)
    expect(new Set(ARCHETYPES.map(a => a.code)).size).toBe(6)
    for (const a of ARCHETYPES) { expect(a.name).toBeTruthy(); expect(a.tagline).toBeTruthy(); expect(a.copy).toBeTruthy() }
  })
  it('includes the constant archetype with a flat (empty) signature', () => {
    const constant = ARCHETYPES.find(a => a.id === 'constant')!
    expect(constant.signature).toEqual({})
  })
})
