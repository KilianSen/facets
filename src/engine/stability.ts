import { type AxisId, type Content, type Rule, type Signature, type AxisStability } from './types'

/**
 * Per-axis "swing" = the strongest contingency on the axis (max |slope| over its dims). High = the
 * user shifts hard as this situation intensifies. Used as the (cheap) trigger for the sharpen prompt.
 */
export function axisSwing(signature: Signature, content: Content): Record<AxisId, number> {
  const out: Record<AxisId, number> = {}
  for (const axis of content.axes) {
    let max = 0
    for (const dim of content.dims) max = Math.max(max, Math.abs(signature[axis.id]?.[dim.id]?.slope ?? 0))
    out[axis.id] = max
  }
  return out
}

/**
 * Per-axis "unsettled" score = within-level inconsistency: when several questions measure the same
 * behaviour dim at the same situation level, how much do the responses DISAGREE? (Same situation,
 * different behaviour ⇒ a shaky read.) This needs replication — a dim contributes only on levels
 * with >= 2 points — so it requires >= 2 backbone questions per axis measuring overlapping dims.
 *
 * `instability` = evidence-weighted mean of contributing dims' within-level stdev, normalized by the
 * [-2, 2] range (÷4). `coverage` = fraction of dims that had any replicated level.
 */
export function axisStability(rules: Rule[], content: Content): Record<AxisId, AxisStability> {
  const out: Record<AxisId, AxisStability> = {}
  for (const axis of content.axes) {
    const axisRules = rules.filter(r => r.axis === axis.id)
    let weighted = 0, weight = 0, contributing = 0, maxN = 0
    for (const dim of content.dims) {
      const points = axisRules.filter(r => dim.id in r.vector).map(r => ({ x: r.axisLevel, y: r.vector[dim.id], w: r.weight }))
      const byLevel = new Map<number, { y: number; w: number }[]>()
      for (const p of points) { const a = byLevel.get(p.x) ?? []; a.push(p); byLevel.set(p.x, a) }
      let dimAcc = 0, dimW = 0, n = 0
      for (const lvl of byLevel.values()) {
        if (lvl.length < 2) continue // no replication at this level
        const W = lvl.reduce((s, p) => s + p.w, 0)
        const mean = lvl.reduce((s, p) => s + p.w * p.y, 0) / W
        const varr = lvl.reduce((s, p) => s + p.w * (p.y - mean) ** 2, 0) / W
        dimAcc += Math.sqrt(varr) * W
        dimW += W
        n += lvl.length
      }
      if (dimW > 0) {
        weighted += ((dimAcc / dimW) / 4) * dimW
        weight += dimW
        contributing++
        maxN = Math.max(maxN, n)
      }
    }
    out[axis.id] = {
      axisId: axis.id,
      instability: weight > 0 ? weighted / weight : 0,
      coverage: content.dims.length ? contributing / content.dims.length : 0,
      n: maxN,
    }
  }
  return out
}

// Calibrated via scripts/calibrate-stability.ts.
// Big-swing TRIGGER: offer to sharpen an axis whose max |slope| clears this (a clearly strong
// contingency — the distribution is bimodal at ~0 vs ~4+, so 3.5 fires only on strong axes).
export const SWING_THRESHOLD = 3.5
// VERDICT on the parallel sharpen items: axisStability >= this reads as "mixed" (you go both ways),
// below as "solid" (clean separation: consistent ≤0.11, mixed ≥0.19 on a 3-item parallel set).
export const MIXED_BAND = 0.15
