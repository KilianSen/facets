import { describe, it, expect } from 'vitest'
import { motiveAxes, motiveReadout, motiveQuestionId, strongestTell, MAX_MOTIVE_AXES } from './motives'
import { computeProfile } from './scoring'
import { makeTestContent, sigFrom, vaultAnswer } from './testFixtures'
import { CONTENT } from '../content'
import type { Answer } from './types'

describe('motiveAxes', () => {
  it('asks about the strongest swings, strongest first, capped', () => {
    const sig = sigFrom(CONTENT, {
      closeness: { warmth: 2.5 },
      stakes: { composure: 4 },
      power: { lead: 3 },
      energy: { approach: 1 }, // below the threshold
    })
    expect(motiveAxes(sig, CONTENT)).toEqual(['stakes', 'power'].slice(0, MAX_MOTIVE_AXES))
  })

  it('counts a "both ways" bend as a swing', () => {
    expect(motiveAxes(sigFrom(CONTENT, { audience: { boldness: [0, -3] } }), CONTENT)).toEqual(['audience'])
  })

  it('asks nothing of a flat signature or content without motives', () => {
    expect(motiveAxes(sigFrom(CONTENT, {}), CONTENT)).toEqual([])
    const noMotives = makeTestContent()
    expect(motiveAxes(sigFrom(noMotives, { closeness: { warmth: 4 } }), noMotives)).toEqual([])
  })
})

describe('strongestTell', () => {
  it('reads the strongest trend on an axis', () => {
    const sig = sigFrom(CONTENT, { closeness: { warmth: 1, approach: -3 } })
    expect(strongestTell(sig, 'closeness', CONTENT)).toMatch(/someone close, you pull back/)
  })
  it('reads a dominant bend as both-ways', () => {
    expect(strongestTell(sigFrom(CONTENT, { stakes: { composure: [0.5, -3] } }), 'stakes', CONTENT)).toMatch(/middle/)
  })
  it('returns null for a flat axis', () => {
    expect(strongestTell(sigFrom(CONTENT, {}), 'stakes', CONTENT)).toBeNull()
  })
})

describe('motiveReadout', () => {
  const why = (axis: string, motive: string): Answer => ({ questionId: motiveQuestionId(axis), mode: 'single', optionId: motive })

  it('rebuilds each axis’s motive from answers, in axis order', () => {
    const r = motiveReadout([why('stakes', 'control'), why('closeness', 'trust')], CONTENT)
    expect(r.reads.map(x => [x.axisId, x.motive.id])).toEqual([['closeness', 'trust'], ['stakes', 'control']])
    expect(r.reads[1].label).toMatch(/grip/)
    expect(r.throughLine).toBeUndefined()
  })

  it('finds a through-line when one motive runs two swings', () => {
    const r = motiveReadout([why('closeness', 'safety'), why('initiative', 'safety')], CONTENT)
    expect(r.throughLine?.id).toBe('safety')
  })

  it('ignores motives not offered on that axis, unknown axes and non-motive answers', () => {
    const r = motiveReadout([
      why('closeness', 'control'), // control is not a closeness option
      why('nowhere', 'trust'),
      { questionId: 'closeness_1', mode: 'single', optionId: 'A' },
    ], CONTENT)
    expect(r.reads).toEqual([])
  })

  it('never changes the measured profile', () => {
    const content = makeTestContent()
    const base = computeProfile([vaultAnswer], content)
    expect(computeProfile([vaultAnswer, why('closeness', 'trust')], content)).toEqual(base)
  })
})
