import { describe, it, expect } from 'vitest'
import { matchArchetype, signatureDistance } from './match'
import { computeSignature } from './signature'
import { extractRules } from './rules'
import { makeTestContent, vaultAnswer, constantAnswer } from './testFixtures'
import type { Signature } from './types'

describe('matchArchetype', () => {
  const content = makeTestContent()

  it('matches a vault-shaped signature to the vault archetype', () => {
    const { signature } = computeSignature(extractRules([vaultAnswer], content), content)
    const match = matchArchetype(signature, {}, content)
    expect(match.id).toBe('vault')
    expect(match.runnerUpId).toBe('constant')
    expect(match.confidence).toBeGreaterThan(0.5)
  })

  it('matches a flat signature to the constant archetype', () => {
    const { signature } = computeSignature(extractRules([constantAnswer], content), content)
    expect(matchArchetype(signature, {}, content).id).toBe('constant')
  })

  it('breaks ties deterministically by catalog order', () => {
    const tied = {
      ...content,
      archetypes: [
        { id: 'first', code: 'F', name: 'First', tagline: '', copy: '', signature: {} },
        { id: 'second', code: 'S', name: 'Second', tagline: '', copy: '', signature: {} },
      ],
    }
    const flat: Signature = { closeness: { warmth: { slope: 0, levels: [] }, approach: { slope: 0, levels: [] } } }
    expect(matchArchetype(flat, {}, tied).id).toBe('first')
  })

  it('throws when no archetypes are defined', () => {
    expect(() => matchArchetype({}, {}, { ...content, archetypes: [] })).toThrow()
  })

  it('signatureDistance is ~0 for matching slopes and grows with difference', () => {
    const { signature } = computeSignature(extractRules([vaultAnswer], content), content)
    const same = { closeness: { warmth: signature.closeness.warmth.slope, approach: signature.closeness.approach.slope } }
    expect(signatureDistance(signature, same, content)).toBeCloseTo(0)
    const far = { closeness: { warmth: signature.closeness.warmth.slope + 5, approach: signature.closeness.approach.slope } }
    expect(signatureDistance(signature, far, content)).toBeGreaterThan(0)
  })
})
