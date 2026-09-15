import type { Archetype, AxisId, Content, DimId, Signature } from '../engine/types'
import { CURVE_MEANINGFUL, CURVE_WEIGHT } from '../engine'

/**
 * The geometry behind the signature "gem". One source shape feeds every view — a user's measured
 * signature, an archetype prototype, or the method-page sculptor — so they all draw alike.
 */

/** One behaviour on one situation: trend + bend, plus measured values at the low/mid/high ends when known. */
export interface ShapeCell { slope: number; curvature: number; low?: number; mid?: number; high?: number }
export interface SignatureShape {
  cells: Record<AxisId, Record<DimId, ShapeCell>>
  /** resting lean per behaviour — where a behaviour sits when a situation doesn't move it */
  baseline: Record<DimId, number>
}

/** Answers live on −2…+2. */
export const SCALE = 2
/** Below this, a spike still reads at a modest size — so a mild archetype doesn't draw as a giant star. */
export const STRENGTH_FLOOR = 3

export function shapeFromSignature(sig: Signature, baseline: Record<DimId, number>): SignatureShape {
  const cells: SignatureShape['cells'] = {}
  for (const [axisId, dims] of Object.entries(sig)) {
    cells[axisId] = {}
    for (const [dimId, c] of Object.entries(dims)) {
      const at = (level: number) => c.levels.find(l => l.level === level)?.value
      cells[axisId][dimId] = { slope: c.slope, curvature: c.curvature, low: at(0), mid: at(0.5), high: at(1) }
    }
  }
  return { cells, baseline }
}

export function shapeFromSlopes(
  grid: Record<AxisId, Record<DimId, { slope: number; curvature: number }>>,
  baseline: Record<DimId, number>,
): SignatureShape {
  const cells: SignatureShape['cells'] = {}
  for (const [axisId, dims] of Object.entries(grid)) {
    cells[axisId] = {}
    for (const [dimId, c] of Object.entries(dims)) cells[axisId][dimId] = { slope: c.slope, curvature: c.curvature }
  }
  return { cells, baseline }
}

export function shapeFromArchetype(a: Archetype): SignatureShape {
  const grid: Record<AxisId, Record<DimId, { slope: number; curvature: number }>> = {}
  const at = (axisId: string, dimId: string) => ((grid[axisId] ??= {})[dimId] ??= { slope: 0, curvature: 0 })
  for (const [axisId, dims] of Object.entries(a.signature)) for (const [dimId, v] of Object.entries(dims)) at(axisId, dimId).slope = v
  for (const [axisId, dims] of Object.entries(a.curve ?? {})) for (const [dimId, v] of Object.entries(dims)) at(axisId, dimId).curvature = v
  return shapeFromSlopes(grid, a.baseline ?? {})
}

/** Every non-zero contingency of an archetype (slope and/or bend), strongest first. */
export function archetypeShifts(a: Archetype): { axisId: AxisId; dimId: DimId; slope: number; curvature: number }[] {
  const shape = shapeFromArchetype(a)
  const out: { axisId: AxisId; dimId: DimId; slope: number; curvature: number }[] = []
  for (const [axisId, dims] of Object.entries(shape.cells)) {
    for (const [dimId, c] of Object.entries(dims)) if (c.slope || c.curvature) out.push({ axisId, dimId, slope: c.slope, curvature: c.curvature })
  }
  return out.sort((x, y) => Math.max(Math.abs(y.slope), Math.abs(y.curvature)) - Math.max(Math.abs(x.slope), Math.abs(x.curvature)))
}

/** How hard a situation moves you: the strongest |slope| or |bend| over its behaviours. */
export function situationStrength(shape: SignatureShape, axisId: AxisId): number {
  let max = 0
  for (const c of Object.values(shape.cells[axisId] ?? {})) max = Math.max(max, Math.abs(c.slope), Math.abs(c.curvature))
  return max
}

export function strongestAxis(shape: SignatureShape, content: Content): AxisId {
  let best = content.axes[0]?.id ?? ''
  let bestV = -1
  for (const a of content.axes) {
    const v = situationStrength(shape, a.id)
    if (v > bestV) { bestV = v; best = a.id }
  }
  return best
}

/**
 * A behaviour's value at situation intensity t ∈ [0, 1]: the quadratic through its low / mid / high
 * values. Measured levels win; otherwise ends are lean ∓ slope/2 bent by the curvature (mid = lean) —
 * exactly the prototype definition, so curvature (v0 + v1 − 2·vMid)/2 and slope v1 − v0 round-trip.
 */
export function behaviourAt(shape: SignatureShape, axisId: AxisId, dimId: DimId, t: number): number {
  const lean = shape.baseline[dimId] ?? 0
  const c = shape.cells[axisId]?.[dimId]
  if (!c) return clamp(lean)
  const measured = c.low !== undefined || c.high !== undefined
  const low = c.low ?? (c.high !== undefined ? c.high - c.slope : lean - c.slope / 2 + c.curvature)
  const high = c.high ?? (c.low !== undefined ? c.low + c.slope : lean + c.slope / 2 + c.curvature)
  const mid = c.mid ?? (measured ? (low + high) / 2 - c.curvature : lean)
  const v = low * (2 * t - 1) * (t - 1) + mid * -4 * t * (t - 1) + high * t * (2 * t - 1)
  return clamp(v)
}

const clamp = (v: number) => Math.max(-SCALE, Math.min(SCALE, v))

export type Point = [number, number]

/** Point i of n around a centre, starting at 12 o'clock and going clockwise. */
export function polar(cx: number, cy: number, r: number, i: number, n: number): Point {
  const a = -Math.PI / 2 + (2 * Math.PI * i) / n
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

export function pathOf(points: Point[]): string {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + ' Z'
}

/** The largest spike across the given shapes (floored), so shapes drawn together share one scale. */
export function gemCap(shapes: SignatureShape[], content: Content): number {
  return Math.max(STRENGTH_FLOOR, ...shapes.flatMap(s => content.axes.map(a => situationStrength(s, a.id))))
}

/** The gem: one vertex per situation, pushed from rMin toward rMax by how hard it moves you. */
export function gemPoints(
  shape: SignatureShape, content: Content,
  g: { cx: number; cy: number; rMin: number; rMax: number; cap?: number },
): Point[] {
  const cap = g.cap ?? gemCap([shape], content)
  const n = content.axes.length
  return content.axes.map((a, i) => polar(g.cx, g.cy, g.rMin + (g.rMax - g.rMin) * Math.min(1, situationStrength(shape, a.id) / cap), i, n))
}

/** The morph: one spoke per behaviour, its value at intensity t mapped from rIn (−2) to rOut (+2). */
export function morphPoints(
  shape: SignatureShape, axisId: AxisId, content: Content, t: number,
  m: { cx: number; cy: number; rIn: number; rOut: number },
): Point[] {
  const n = content.dims.length
  return content.dims.map((d, i) => {
    const v = behaviourAt(shape, axisId, d.id, t)
    return polar(m.cx, m.cy, m.rIn + ((v + SCALE) / (2 * SCALE)) * (m.rOut - m.rIn), i, n)
  })
}

/**
 * How far apart two shapes are on each situation, judged the way the matcher judges: by how behaviours
 * *shift* (slope, plus the bend at CURVE_WEIGHT), not by their resting level — a type that doesn't
 * define a behaviour shouldn't read as a mismatch just because you sit high or low on it. Mean over
 * behaviours; 0 = the same shifts there.
 */
export function situationFit(a: SignatureShape, b: SignatureShape, content: Content): Record<AxisId, number> {
  const out: Record<AxisId, number> = {}
  for (const axis of content.axes) {
    let sum = 0
    for (const d of content.dims) {
      const ca = a.cells[axis.id]?.[d.id]
      const cb = b.cells[axis.id]?.[d.id]
      sum += Math.abs((ca?.slope ?? 0) - (cb?.slope ?? 0)) + CURVE_WEIGHT * Math.abs((ca?.curvature ?? 0) - (cb?.curvature ?? 0))
    }
    out[axis.id] = sum / content.dims.length
  }
  return out
}

/**
 * The situations where `you` sit closest to and furthest from `base`, among the situations `base` itself
 * lives on. Null when it lives on fewer than two (a single-situation type has only one crystal to compare).
 */
export function fitExtremes(you: SignatureShape, base: SignatureShape, content: Content, min = 1): { closest: AxisId; furthest: AxisId } | null {
  const fit = situationFit(you, base, content)
  // Only the base type's own situations: elsewhere it has nothing to say, so "closest" would just mean "both steady".
  const live = content.axes
    .filter(a => situationStrength(base, a.id) >= min)
    .sort((x, y) => fit[x.id] - fit[y.id])
  return live.length >= 2 ? { closest: live[0].id, furthest: live[live.length - 1].id } : null
}

export interface Mover { dimId: DimId; delta: number; bend: number; curvy: boolean; size: number }

/** The behaviours that change most across one situation, biggest first. Bends report their mid-way bulge. */
export function movers(shape: SignatureShape, axisId: AxisId, content: Content, min = 0.75): Mover[] {
  return content.dims
    .map(d => {
      const c = shape.cells[axisId]?.[d.id]
      const low = behaviourAt(shape, axisId, d.id, 0)
      const high = behaviourAt(shape, axisId, d.id, 1)
      const bend = behaviourAt(shape, axisId, d.id, 0.5) - (low + high) / 2 // > 0: peaks mid-way
      const curvy = !!c && Math.abs(c.curvature) >= CURVE_MEANINGFUL && Math.abs(c.curvature) > Math.abs(c.slope)
      return { dimId: d.id, delta: high - low, bend, curvy, size: curvy ? Math.abs(bend) : Math.abs(high - low) }
    })
    .filter(m => m.size >= min)
    .sort((x, y) => y.size - x.size)
}
