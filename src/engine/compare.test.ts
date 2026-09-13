import { describe, it, expect } from 'vitest'
import { compareProfiles, syncBand } from './compare'
import { motiveQuestionId } from './motives'
import { computeProfile } from './scoring'
import { sigFrom } from './testFixtures'
import { CONTENT } from '../content'
import type { Answer, Profile } from './types'

const base = computeProfile([], CONTENT)
const profile = (cells: Parameters<typeof sigFrom>[1]): Profile => ({ ...base, signature: sigFrom(CONTENT, cells) })

describe('compareProfiles', () => {
  it('reads identical signatures as fully in sync, all clicks', () => {
    const p = profile({ closeness: { warmth: 4, approach: 3 } })
    const c = compareProfiles(p, p, CONTENT)
    expect(c.sync).toBeCloseTo(1)
    expect(c.clicks.map(r => r.dimId)).toEqual(['warmth', 'approach'])
    expect(c.clashes).toEqual([])
    expect(c.blindSpots).toEqual([])
  })

  it('finds a clash where the two shift in opposite directions', () => {
    const c = compareProfiles(
      profile({ stakes: { lead: 4, composure: 4, boldness: 4 } }),
      profile({ stakes: { lead: -4, composure: -4, boldness: -4 } }),
      CONTENT,
    )
    expect(c.clashes).toHaveLength(3)
    expect(c.clashes[0]).toMatchObject({ axisId: 'stakes', kind: 'slope', a: 4, b: -4 })
    expect(c.sync).toBeLessThan(0.3)
    expect(syncBand(c.sync)).toBe('Opposite poles')
  })

  it('finds a blind spot where one shifts hard and the other does not move', () => {
    const c = compareProfiles(profile({}), profile({ audience: { boldness: 4 } }), CONTENT)
    expect(c.blindSpots).toEqual([{ axisId: 'audience', dimId: 'boldness', kind: 'slope', a: 0, b: 4, mover: 'b' }])
  })

  it('compares "both ways" bends as their own kind', () => {
    const c = compareProfiles(profile({ audience: { boldness: [0, -3] } }), profile({ audience: { boldness: [0, 3] } }), CONTENT)
    expect(c.clashes[0]).toMatchObject({ kind: 'curve', a: -3, b: 3 })
  })

  it('reads two steady people as in sync', () => {
    expect(compareProfiles(profile({}), profile({}), CONTENT).sync).toBe(1)
  })

  it('surfaces motives both people named', () => {
    const why = (axis: string, m: string): Answer => ({ questionId: motiveQuestionId(axis), mode: 'single', optionId: m })
    const p = profile({})
    const c = compareProfiles(p, p, CONTENT, [why('closeness', 'trust'), why('stakes', 'control')], [why('power', 'control')])
    expect(c.sharedMotives).toEqual(['control'])
  })

  it('is symmetric in sync', () => {
    const a = profile({ closeness: { warmth: 4 }, stakes: { lead: -2 } })
    const b = profile({ closeness: { warmth: 1 }, power: { directness: 3 } })
    expect(compareProfiles(a, b, CONTENT).sync).toBeCloseTo(compareProfiles(b, a, CONTENT).sync)
  })
})
