import { describe, it, expect } from 'vitest'
import { CONTENT } from '../content'
import { computeProfile } from '../engine'
import type { Answer } from '../engine/types'
import {
  shapeFromArchetype, shapeFromSignature, shapeFromSlopes, behaviourAt, situationStrength, strongestAxis,
  gemPoints, morphPoints, movers, archetypeShifts, situationFit, fitExtremes, STRENGTH_FLOOR,
} from './shape'

const arch = (id: string) => CONTENT.archetypes.find(a => a.id === id)!
const dist = ([x, y]: [number, number], cx: number, cy: number) => Math.hypot(x - cx, y - cy)

describe('behaviourAt', () => {
  it('reads a prototype as lean ∓ slope/2 at the ends and the lean in the middle', () => {
    const vault = shapeFromArchetype(arch('vault')) // closeness warmth slope 3, lean 0.5
    expect(behaviourAt(vault, 'closeness', 'warmth', 0)).toBeCloseTo(-1)
    expect(behaviourAt(vault, 'closeness', 'warmth', 0.5)).toBeCloseTo(0.5)
    expect(behaviourAt(vault, 'closeness', 'warmth', 1)).toBeCloseTo(2)
  })

  it('draws a both-ways bend: The Sweet Spot peaks in the middle of stakes', () => {
    const sweet = shapeFromArchetype(arch('sweet_spot'))
    const mid = behaviourAt(sweet, 'stakes', 'composure', 0.5)
    expect(mid).toBeGreaterThan(behaviourAt(sweet, 'stakes', 'composure', 0))
    expect(mid).toBeGreaterThan(behaviourAt(sweet, 'stakes', 'composure', 1))
  })

  it('uses the measured level values of a real run', () => {
    const answers: Answer[] = [{
      questionId: 'closeness_1', mode: 'depends',
      ranking: ['closeness_1_c0', 'closeness_1_c1', 'closeness_1_c2'],
      mapping: { closeness_1_c0: 'A', closeness_1_c1: 'B', closeness_1_c2: 'C' },
    }]
    const p = computeProfile(answers, CONTENT)
    const s = shapeFromSignature(p.signature, p.baseline)
    expect(behaviourAt(s, 'closeness', 'warmth', 1)).toBeCloseTo(2)
    expect(behaviourAt(s, 'closeness', 'warmth', 0)).toBeCloseTo(-2)
  })

  it('stays on the −2…+2 answer scale and falls back to the lean where nothing moves', () => {
    const s = shapeFromSlopes({ stakes: { lead: { slope: 9, curvature: 0 } } }, { warmth: 1 })
    expect(behaviourAt(s, 'stakes', 'lead', 1)).toBe(2)
    expect(behaviourAt(s, 'power', 'warmth', 0.3)).toBe(1)
  })
})

describe('situations', () => {
  it('strength is the strongest slope or bend, and the strongest situation is picked', () => {
    const s = shapeFromArchetype(arch('clutch'))
    expect(situationStrength(s, 'stakes')).toBe(3)
    expect(situationStrength(s, 'closeness')).toBe(0)
    expect(strongestAxis(s, CONTENT)).toBe('stakes')
    expect(situationStrength(shapeFromArchetype(arch('small_room')), 'audience')).toBe(3)
  })
})

describe('situationFit & fitExtremes', () => {
  it('is zero everywhere for identical shapes', () => {
    const fit = situationFit(shapeFromArchetype(arch('clutch')), shapeFromArchetype(arch('clutch')), CONTENT)
    for (const v of Object.values(fit)) expect(v).toBeCloseTo(0)
  })

  it('finds where you match a multi-situation type and where you part ways, on its own situations', () => {
    // The Main Character's stakes shape exactly, but the opposite on audience (rattled and following).
    const you = shapeFromSlopes({
      stakes: { composure: { slope: 3, curvature: 0 }, lead: { slope: 2, curvature: 0 }, boldness: { slope: 2, curvature: 0 } },
      audience: { composure: { slope: -3, curvature: 0 }, lead: { slope: -3, curvature: 0 } },
      closeness: { warmth: { slope: -4, curvature: 0 } }, // not one of its situations — ignored
    }, {})
    expect(fitExtremes(you, shapeFromArchetype(arch('main_character')), CONTENT)).toEqual({ closest: 'stakes', furthest: 'audience' })
  })

  it('names no extremes for a single-situation type', () => {
    const you = shapeFromSlopes({ closeness: { warmth: { slope: 4, curvature: 0 } }, energy: { boldness: { slope: 3, curvature: 0 } } }, {})
    expect(fitExtremes(you, shapeFromArchetype(arch('clutch')), CONTENT)).toBeNull()
    expect(fitExtremes(shapeFromArchetype(arch('clutch')), shapeFromArchetype(arch('constant')), CONTENT)).toBeNull()
  })
})

describe('gemPoints', () => {
  const g = { cx: 50, cy: 50, rMin: 10, rMax: 40 }

  it('a flat signature is a small, even hexagon', () => {
    const pts = gemPoints(shapeFromArchetype(arch('constant')), CONTENT, g)
    expect(pts).toHaveLength(6)
    for (const p of pts) expect(dist(p, 50, 50)).toBeCloseTo(10)
  })

  it('a single-situation type spikes on that situation only', () => {
    const pts = gemPoints(shapeFromArchetype(arch('vault')), CONTENT, g)
    const closeness = CONTENT.axes.findIndex(a => a.id === 'closeness')
    pts.forEach((p, i) => expect(dist(p, 50, 50)).toBeCloseTo(i === closeness ? 40 : 10))
  })

  it('shares one scale across shapes drawn together', () => {
    const big = shapeFromSlopes({ stakes: { lead: { slope: STRENGTH_FLOOR * 2, curvature: 0 } } }, {})
    const half = gemPoints(shapeFromArchetype(arch('clutch')), CONTENT, { ...g, cap: STRENGTH_FLOOR * 2 })
    const stakes = CONTENT.axes.findIndex(a => a.id === 'stakes')
    expect(dist(half[stakes], 50, 50)).toBeCloseTo(25)
    expect(dist(gemPoints(big, CONTENT, { ...g, cap: STRENGTH_FLOOR * 2 })[stakes], 50, 50)).toBeCloseTo(40)
  })
})

describe('morphPoints & movers', () => {
  it('maps −2 to the inner ring and +2 to the outer ring', () => {
    const s = shapeFromSlopes({ stakes: { lead: { slope: 8, curvature: 0 } } }, {})
    const m = { cx: 0, cy: 0, rIn: 10, rOut: 50 }
    const lead = CONTENT.dims.findIndex(d => d.id === 'lead')
    expect(dist(morphPoints(s, 'stakes', CONTENT, 0, m)[lead], 0, 0)).toBeCloseTo(10)
    expect(dist(morphPoints(s, 'stakes', CONTENT, 1, m)[lead], 0, 0)).toBeCloseTo(50)
  })

  it('ranks what changes most and flags a bend', () => {
    const clutch = movers(shapeFromArchetype(arch('clutch')), 'stakes', CONTENT)
    expect(clutch[0]).toMatchObject({ dimId: 'composure', curvy: false })
    expect(clutch.every(m => m.delta > 0)).toBe(true)
    // The Sweet Spot's bends run past the ±2 scale, so its three dims tie once clamped — all peak mid-way.
    const sweet = movers(shapeFromArchetype(arch('sweet_spot')), 'stakes', CONTENT)
    expect(sweet.map(m => m.dimId).sort()).toEqual(['boldness', 'composure', 'lead'])
    expect(sweet.every(m => m.curvy && m.bend > 0)).toBe(true)
  })

  it('lists an archetype’s shifts strongest first', () => {
    expect(archetypeShifts(arch('clutch')).map(s => s.dimId)).toEqual(['composure', 'lead', 'boldness'])
    expect(archetypeShifts(arch('constant'))).toEqual([])
  })
})
