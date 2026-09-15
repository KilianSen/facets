import { describe, it, expect } from 'vitest'
import { CONTENT } from '../content'
import { shapeFromArchetype } from './shape'
import { CRYSTAL, crystalHeights, crystalRings, crystalScene, crystalSvg, mix } from './crystal'

const arch = (id: string) => shapeFromArchetype(CONTENT.archetypes.find(a => a.id === id)!)
const axisIndex = (id: string) => CONTENT.axes.findIndex(a => a.id === id)
const dimIndex = (id: string) => CONTENT.dims.findIndex(d => d.id === id)

/** Horizontal distance of a ring point from its crystal's own centre. */
function radius(axisId: string, p: [number, number, number]) {
  const th = -Math.PI / 2 + (2 * Math.PI * axisIndex(axisId)) / CONTENT.axes.length
  return Math.hypot(p[0] - CRYSTAL.ring * Math.cos(th), p[2] - CRYSTAL.ring * Math.sin(th))
}

describe('crystal geometry', () => {
  it('a steady person is six stubby, straight-sided prisms', () => {
    const shape = arch('constant')
    const heights = crystalHeights(shape, CONTENT)
    for (const h of Object.values(heights)) expect(h).toBeCloseTo(CRYSTAL.hMin)
    const rings = crystalRings(shape, CONTENT, 0, heights.closeness)
    rings[0].forEach((p, j) => expect(radius('closeness', p)).toBeCloseTo(radius('closeness', rings[rings.length - 1][j])))
  })

  it('stands tallest on the situation that moves you most', () => {
    const heights = crystalHeights(arch('vault'), CONTENT)
    expect(heights.closeness).toBeCloseTo(CRYSTAL.hMax)
    expect(heights.stakes).toBeCloseTo(CRYSTAL.hMin)
  })

  it('flares where a behaviour rises: The Clutch widens toward calm at the top of stakes', () => {
    const shape = arch('clutch')
    const rings = crystalRings(shape, CONTENT, axisIndex('stakes'), 1)
    const c = dimIndex('composure')
    expect(radius('stakes', rings[rings.length - 1][c])).toBeGreaterThan(radius('stakes', rings[0][c]))
    expect(rings[rings.length - 1][c][1]).toBeCloseTo(1) // top ring sits at the crystal's height
  })
})

describe('crystalScene', () => {
  const opts = { yaw: 0, pitch: 0.4, accent: '#E3A008' }

  it('draws all six crystals back to front, hiding faces turned away from the camera', () => {
    const scene = crystalScene(arch('clutch'), CONTENT, opts)
    const m = CONTENT.dims.length
    const mesh = CONTENT.axes.length * (1 + (CRYSTAL.levels - 1) * m + m)
    expect(scene.faces.length).toBeGreaterThan(mesh / 3)
    expect(scene.faces.length).toBeLessThan(mesh)
    expect(new Set(scene.faces.map(f => f.axisId)).size).toBe(CONTENT.axes.length)
    for (let i = 1; i < scene.faces.length; i++) expect(scene.faces[i].depth).toBeGreaterThanOrEqual(scene.faces[i - 1].depth)
    expect(scene.labels.map(l => l.name)).toEqual(CONTENT.axes.map(a => a.name))
  })

  it('never draws the underside when looking from above', () => {
    // Looking down, all six caps' apex triangles face the camera while the flat undersides don't:
    // visible faces per crystal = some sides + its 6 cap triangles, never 1 + all sides + caps.
    const scene = crystalScene(arch('constant'), CONTENT, opts)
    const m = CONTENT.dims.length
    const perCrystal = scene.faces.filter(f => f.axisId === 'closeness').length
    expect(perCrystal).toBeLessThan(1 + (CRYSTAL.levels - 1) * m + m)
    expect(perCrystal).toBeGreaterThanOrEqual(m)
  })

  it('turning the view moves the drawing', () => {
    const a = crystalScene(arch('clutch'), CONTENT, opts)
    const b = crystalScene(arch('clutch'), CONTENT, { ...opts, yaw: 1 })
    expect(a.floor).not.toBe(b.floor)
  })

  it('marks the selected situation’s solid faces', () => {
    const scene = crystalScene(arch('clutch'), CONTENT, { ...opts, selected: 'stakes', ghost: arch('clutch') })
    expect(scene.faces.filter(f => f.selected).every(f => f.axisId === 'stakes' && !f.ghost)).toBe(true)
    expect(scene.faces.some(f => f.selected)).toBe(true)
  })

  it('colours each crystal by the type that explains it, and the ghost by its own colour', () => {
    const plain = crystalScene(arch('clutch'), CONTENT, opts)
    const tinted = crystalScene(arch('clutch'), CONTENT, { ...opts, colors: { closeness: '#E4572E' }, ghost: arch('vault'), ghostAccent: '#3B5BDB' })
    const first = (s: typeof plain, pred: (f: typeof plain.faces[number]) => boolean) => s.faces.find(pred)!.fill
    expect(first(tinted, f => f.axisId === 'closeness' && !f.ghost)).not.toBe(first(plain, f => f.axisId === 'closeness'))
    expect(first(tinted, f => f.axisId === 'stakes' && !f.ghost)).toBe(first(plain, f => f.axisId === 'stakes')) // falls back to accent
    expect(tinted.faces.filter(f => f.ghost).map(f => f.fill)).not.toContain(first(plain, f => f.axisId === 'stakes'))
  })
})

describe('ghost comparison', () => {
  const opts = { yaw: -0.35, pitch: 0.42, accent: '#E3A008' }

  it('overlays the comparison shape as see-through faces on top of the solid cluster (X-ray)', () => {
    const solo = crystalScene(arch('clutch'), CONTENT, opts)
    const withGhost = crystalScene(arch('clutch'), CONTENT, { ...opts, ghost: arch('vault') })
    expect(solo.faces.every(f => !f.ghost)).toBe(true)
    const firstGhost = withGhost.faces.findIndex(f => f.ghost)
    expect(firstGhost).toBe(solo.faces.length) // every solid face first…
    expect(withGhost.faces.slice(firstGhost).every(f => f.ghost)).toBe(true) // …then all the glass
    const sorted = (fs: typeof withGhost.faces) => fs.every((f, i) => i === 0 || f.depth >= fs[i - 1].depth)
    expect(sorted(withGhost.faces.slice(0, firstGhost))).toBe(true)
    expect(sorted(withGhost.faces.slice(firstGhost))).toBe(true)
  })

  it('draws a perfect match with the glass right on top of the solid', () => {
    const scene = crystalScene(arch('clutch'), CONTENT, { ...opts, ghost: arch('clutch') })
    const solid = scene.faces.findIndex(f => !f.ghost)
    const twin = scene.faces.findIndex(f => f.ghost && f.d === scene.faces[solid].d)
    expect(twin).toBeGreaterThan(solid)
  })

  it('shares one scale, so a taller ghost shrinks nobody', () => {
    const cap = 6
    const a = crystalScene(arch('clutch'), CONTENT, { ...opts, cap })
    const b = crystalScene(arch('clutch'), CONTENT, { ...opts, cap, ghost: arch('vault') })
    expect(b.faces.filter(f => !f.ghost).map(f => f.d)).toEqual(a.faces.map(f => f.d))
  })

  it('serialises ghost faces translucent and dashed', () => {
    const svg = crystalSvg(arch('clutch'), CONTENT, { ...opts, ghost: arch('vault') })
    expect(svg).toContain('fill-opacity="0.2"')
    expect(svg).toContain('stroke-dasharray="4 3"')
  })
})

describe('crystalSvg', () => {
  it('serialises to a standalone SVG for the share image', () => {
    const bare = crystalSvg(arch('vault'), CONTENT, { yaw: -0.35, pitch: 0.42, accent: '#E4572E' })
    expect(bare.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(bare).toContain('<path')
    expect(bare).not.toContain('<text')
    expect(crystalSvg(arch('vault'), CONTENT, { yaw: 0, pitch: 0.4, accent: '#E4572E', labels: true })).toContain('>Closeness</text>')
  })

  it('mixes colours', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
  })
})
