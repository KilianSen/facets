import { type Content, type Rule, type Signature, type AxisDimCell } from './types'

interface Pt { x: number; y: number; w: number }

/** Weighted least-squares slope of y over x. Returns 0 if no x-spread or no weight. */
export function weightedSlope(points: Pt[]): number {
  const W = points.reduce((s, p) => s + p.w, 0)
  if (W === 0) return 0
  const xbar = points.reduce((s, p) => s + p.w * p.x, 0) / W
  const ybar = points.reduce((s, p) => s + p.w * p.y, 0) / W
  let num = 0, den = 0
  for (const p of points) {
    num += p.w * (p.x - xbar) * (p.y - ybar)
    den += p.w * (p.x - xbar) * (p.x - xbar)
  }
  return den === 0 ? 0 : num / den
}

export function computeSignature(rules: Rule[], content: Content): { signature: Signature; flexibility: number } {
  const signature: Signature = {}
  const slopeMagnitudes: number[] = []

  for (const axis of content.axes) {
    signature[axis.id] = {}
    const axisRules = rules.filter(r => r.axis === axis.id)

    for (const dim of content.dims) {
      const points: Pt[] = axisRules
        .filter(r => dim.id in r.vector)
        .map(r => ({ x: r.axisLevel, y: r.vector[dim.id], w: r.weight }))

      const slope = weightedSlope(points)

      const byLevel = new Map<number, { sw: number; swy: number }>()
      for (const p of points) {
        const e = byLevel.get(p.x) ?? { sw: 0, swy: 0 }
        e.sw += p.w
        e.swy += p.w * p.y
        byLevel.set(p.x, e)
      }
      const levels = [...byLevel.entries()]
        .map(([level, e]) => ({ level, value: e.sw ? e.swy / e.sw : 0 }))
        .sort((a, b) => a.level - b.level)

      // Curvature = the quadratic bend across the three canonical levels, orthogonal to the slope:
      // (value@0 + value@1 − 2·value@0.5) / 2. Captures a consistent "both ways" shape (e.g. an
      // inverted-U) that the linear slope alone reads as flat. 0 if a level is missing.
      const byX = new Map(levels.map(l => [l.level, l.value]))
      const v0 = byX.get(0), vMid = byX.get(0.5), v1 = byX.get(1)
      const curvature = v0 !== undefined && vMid !== undefined && v1 !== undefined
        ? (v0 + v1 - 2 * vMid) / 2
        : 0

      const cell: AxisDimCell = { slope, curvature, levels }
      signature[axis.id][dim.id] = cell
      if (points.length > 0) slopeMagnitudes.push(Math.abs(slope))
    }
  }

  const flexibility = slopeMagnitudes.length
    ? slopeMagnitudes.reduce((s, v) => s + v, 0) / slopeMagnitudes.length
    : 0

  return { signature, flexibility }
}
