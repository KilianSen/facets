import type { AxisId, Content } from '../engine/types'
import { behaviourAt, gemCap, situationStrength, SCALE, type SignatureShape } from './shape'

/**
 * The 3D signature: a cluster of six crystals standing on the gem's hexagon, one per situation. Each
 * crystal is that situation's behaviour shape lofted from low intensity (base) to high (top) — its
 * height is how hard the situation moves you, its flare and twist are how your behaviours change on the
 * way up. An optional ghost (e.g. the matched archetype) is drawn as see-through crystals in the same
 * places and scale, so the fit is visible. Pure geometry plus a hand-rolled orthographic projection, so
 * the page, the tests and the build-time share image all draw exactly the same object.
 */

export type V3 = [number, number, number]

/** World units: crystals stand on a ring of radius 1; cross-sections span rIn (−2) … rOut (+2). */
export const CRYSTAL = { ring: 1, rIn: 0.1, rOut: 0.42, hMin: 0.35, hMax: 1.9, apex: 0.3, levels: 7 }
export const PITCH = { min: 0.2, max: 0.7, initial: 0.42 }

export const CRYSTAL_INK = '#151515'
export const CRYSTAL_FLOOR = '#F0E9DE'
export const CRYSTAL_CORAL = '#FF5A36'
/** Fill opacity of ghost faces — glass you can see the solid crystal through. */
export const GHOST_OPACITY = 0.2
const PAPER = '#FAF7F2'

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
function normalize(v: V3): V3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}
const LIGHT = normalize([-0.45, 0.8, 0.55])

/** Blend two #rrggbb colours. */
export function mix(a: string, b: string, t: number): string {
  const rgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
  const A = rgb(a), B = rgb(b)
  return '#' + A.map((c, i) => Math.round(c + (B[i] - c) * t).toString(16).padStart(2, '0')).join('')
}

/** Ground-plane angle of situation i — same clockwise-from-the-back layout as the flat gem. */
const angleOf = (i: number, n: number) => -Math.PI / 2 + (2 * Math.PI * i) / n

/** Crystal height per situation: hMin for a situation that doesn't move you, hMax at the shared cap. */
export function crystalHeights(shape: SignatureShape, content: Content, cap = gemCap([shape], content)): Record<AxisId, number> {
  const out: Record<AxisId, number> = {}
  for (const a of content.axes) {
    out[a.id] = CRYSTAL.hMin + (CRYSTAL.hMax - CRYSTAL.hMin) * Math.min(1, situationStrength(shape, a.id) / cap)
  }
  return out
}

/** World-space rings of one crystal: ring k is the behaviour shape at intensity t = k/(levels−1), lifted to t·height. */
export function crystalRings(shape: SignatureShape, content: Content, axisIndex: number, height: number): V3[][] {
  const axis = content.axes[axisIndex]
  const theta = angleOf(axisIndex, content.axes.length)
  const cx = CRYSTAL.ring * Math.cos(theta)
  const cz = CRYSTAL.ring * Math.sin(theta)
  const m = content.dims.length
  return Array.from({ length: CRYSTAL.levels }, (_, k) => {
    const t = k / (CRYSTAL.levels - 1)
    return content.dims.map((d, j) => {
      const v = behaviourAt(shape, axis.id, d.id, t)
      const r = CRYSTAL.rIn + ((v + SCALE) / (2 * SCALE)) * (CRYSTAL.rOut - CRYSTAL.rIn)
      const a = theta + (2 * Math.PI * j) / m // behaviour 0 points outward, away from the cluster centre
      return [cx + r * Math.cos(a), t * height, cz + r * Math.sin(a)] as V3
    })
  })
}

export interface View { yaw: number; pitch: number; scale: number; cx: number; cy: number }
export interface Projected { sx: number; sy: number; v: V3 }

/** Orthographic camera: spin around the vertical axis by yaw, tilt toward the viewer by pitch. z > 0 is nearer. */
export function project(p: V3, view: View): Projected {
  const x1 = p[0] * Math.cos(view.yaw) + p[2] * Math.sin(view.yaw)
  const z1 = -p[0] * Math.sin(view.yaw) + p[2] * Math.cos(view.yaw)
  const y2 = p[1] * Math.cos(view.pitch) - z1 * Math.sin(view.pitch)
  const z2 = p[1] * Math.sin(view.pitch) + z1 * Math.cos(view.pitch)
  return { sx: view.cx + x1 * view.scale, sy: view.cy - y2 * view.scale, v: [x1, y2, z2] }
}

/** `ghost` faces belong to the comparison shape and are drawn see-through; `selected` ones get a heavier outline. */
export interface CrystalFace { d: string; fill: string; depth: number; axisId: AxisId; ghost: boolean; selected: boolean }
/** `depth` < 0 means behind the cluster's centre: draw those labels before the faces so crystals can cover them. */
export interface CrystalLabel { axisId: AxisId; name: string; x: number; y: number; depth: number }
export interface CrystalScene { width: number; height: number; floor: string; faces: CrystalFace[]; labels: CrystalLabel[] }
export interface CrystalOptions {
  yaw: number
  pitch: number
  accent: string
  /** a situation to pick out with a heavier outline */
  selected?: AxisId | null
  /** per-situation crystal colour (e.g. the colour of the type that explains that situation); falls back to accent */
  colors?: Record<AxisId, string>
  /** a second shape drawn as see-through crystals in the same places (e.g. the matched archetype) */
  ghost?: SignatureShape
  /** the ghost's colour (defaults to accent) */
  ghostAccent?: string
  /** shared spike scale (defaults to the largest of the shape and ghost) */
  cap?: number
  width?: number
  height?: number
  scale?: number
}

const pathOf = (pts: Projected[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join('') + 'Z'

/**
 * The visible faces of the cluster, flat-shaded and sorted back to front. Every face is wound so its
 * outward normal is −(b−a)×(c−a); faces turned away from the camera are culled, which keeps tall thin
 * side faces from painting over nearer ones (painter's sorting alone can't order those reliably).
 * Ghost faces come after all solid ones, like an X-ray: a comparison crystal that fits inside yours
 * would otherwise be hidden, which is exactly when the comparison matters.
 */
export function crystalScene(shape: SignatureShape, content: Content, o: CrystalOptions): CrystalScene {
  const width = o.width ?? 380
  const height = o.height ?? 320
  const view: View = { yaw: o.yaw, pitch: o.pitch, scale: o.scale ?? 78, cx: width / 2, cy: height * 0.66 }
  const cap = o.cap ?? gemCap(o.ghost ? [shape, o.ghost] : [shape], content)
  const n = content.axes.length
  const faces: CrystalFace[] = []

  const face = (pts: V3[], color: string, axisId: AxisId, ghost: boolean) => {
    const pp = pts.map(p => project(p, view))
    const nrm = cross(sub(pp[1].v, pp[0].v), sub(pp[2].v, pp[0].v))
    if (nrm[2] >= 0) return // outward normal (−n) points away from the viewer
    const shade = Math.abs(dot(normalize(nrm), LIGHT))
    faces.push({
      d: pathOf(pp),
      fill: mix(PAPER, color, 0.22 + 0.68 * shade),
      depth: pp.reduce((s, p) => s + p.v[2], 0) / pp.length,
      axisId,
      ghost,
      selected: !ghost && axisId === o.selected,
    })
  }

  const cluster = (s: SignatureShape, ghost: boolean) => {
    const heights = crystalHeights(s, content, cap)
    content.axes.forEach((a, i) => {
      const h = heights[a.id]
      const rings = crystalRings(s, content, i, h)
      const color = ghost ? (o.ghostAccent ?? o.accent) : (o.colors?.[a.id] ?? o.accent)
      const theta = angleOf(i, n)
      const apex: V3 = [CRYSTAL.ring * Math.cos(theta), h + CRYSTAL.apex, CRYSTAL.ring * Math.sin(theta)]
      face([...rings[0]].reverse(), color, a.id, ghost) // underside, wound to face down
      for (let k = 0; k < rings.length - 1; k++) {
        for (let j = 0; j < rings[k].length; j++) {
          const j2 = (j + 1) % rings[k].length
          face([rings[k][j], rings[k][j2], rings[k + 1][j2], rings[k + 1][j]], color, a.id, ghost)
        }
      }
      const top = rings[rings.length - 1]
      for (let j = 0; j < top.length; j++) face([top[j], top[(j + 1) % top.length], apex], color, a.id, ghost)
    })
  }

  cluster(shape, false)
  if (o.ghost) cluster(o.ghost, true)
  const byDepth = (x: CrystalFace, y: CrystalFace) => x.depth - y.depth
  const ordered = [...faces.filter(f => !f.ghost).sort(byDepth), ...faces.filter(f => f.ghost).sort(byDepth)]

  const ground = (r: number, i: number) => project([r * Math.cos(angleOf(i, n)), 0, r * Math.sin(angleOf(i, n))], view)
  return {
    width,
    height,
    floor: pathOf(content.axes.map((_, i) => ground(1.5, i))),
    faces: ordered,
    labels: content.axes.map((a, i) => { const p = ground(1.95, i); return { axisId: a.id, name: a.name, x: p.sx, y: p.sy + 4, depth: p.v[2] } }),
  }
}

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** A standalone SVG of the cluster — for the build-time share image, where there's no React. */
export function crystalSvg(shape: SignatureShape, content: Content, o: CrystalOptions & { labels?: boolean }): string {
  const s = crystalScene(shape, content, o)
  const text = (l: CrystalLabel) =>
    `<text x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="${CRYSTAL_INK}">${escapeXml(l.name)}</text>`
  const path = (f: CrystalFace) => f.ghost
    ? `<path d="${f.d}" fill="${f.fill}" fill-opacity="${GHOST_OPACITY}" stroke="${CRYSTAL_INK}" stroke-opacity="0.85" stroke-width="1.4" stroke-dasharray="4 3" stroke-linejoin="round"/>`
    : `<path d="${f.d}" fill="${f.fill}" stroke="${CRYSTAL_INK}" stroke-width="${f.selected ? 2.6 : 1.4}" stroke-linejoin="round"/>`
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s.width} ${s.height}" width="${s.width}" height="${s.height}">`,
    `<path d="${s.floor}" fill="${CRYSTAL_FLOOR}" stroke="${CRYSTAL_INK}" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="5 5"/>`,
    ...(o.labels ? s.labels.filter(l => l.depth < 0).map(text) : []),
    ...s.faces.map(path),
    ...(o.labels ? s.labels.filter(l => l.depth >= 0).map(text) : []),
    '</svg>',
  ].join('')
}
