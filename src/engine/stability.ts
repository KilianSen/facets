import { type AxisId, type Answer, type Content, type Rule, type Signature, type AxisStability } from './types'
import { extractRules } from './rules'
import { computeSignature } from './signature'

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

// Adaptive sharpen loop: ask >= SHARPEN_MIN parallel items, add more while the verdict sits within
// CONFIDENT_MARGIN of the band (ambiguous), stop at SHARPEN_CAP (all authored items used).
export const SHARPEN_MIN = 2
export const SHARPEN_CAP = 4
export const CONFIDENT_MARGIN = 0.06
// "solid" requires the swing to actually REPRODUCE on the parallel items: the reserve-only slope must
// clear this. A flat round (you answered evenly — no shift) is well below it and reads "mixed".
// Reserve options are ±2, so a genuine shifter lands ~4 and a flat answerer ~0; 1.5 separates cleanly.
export const SHARPEN_REPRODUCE = 1.5

/** The consistency verdict for an axis from its parallel-item instability. */
export function sharpenVerdict(instability: number): 'solid' | 'mixed' {
  return instability >= MIXED_BAND ? 'mixed' : 'solid'
}

export interface SharpenReadout { axisId: AxisId; instability: number; verdict: 'solid' | 'mixed'; n: number }

/**
 * The per-axis consistency verdict, derived purely from the parallel "reserve" answers present in a
 * run. Stateless — the result page, a permalink, or a resumed run can all recompute it from answers
 * alone. An axis only gets a verdict once its reserve answers carry REAL replicated evidence
 * (coverage > 0); a "solid" read further requires the swing to reproduce (a genuine slope here) AND
 * be consistent within each situation level — anything less reads "mixed" (the swing didn't hold up).
 */
export function sharpenReadout(answers: Answer[], content: Content): SharpenReadout[] {
  const reserve = new Map(content.questions.filter(q => q.reserve && !q.acrossSettings).map(q => [q.id, q]))
  const byAxis = new Map<AxisId, Answer[]>()
  for (const a of answers) {
    const q = reserve.get(a.questionId)
    if (!q?.axis) continue
    const arr = byAxis.get(q.axis) ?? []
    arr.push(a)
    byAxis.set(q.axis, arr)
  }
  const out: SharpenReadout[] = []
  for (const [axisId, ans] of byAxis) {
    if (ans.length < SHARPEN_MIN) continue
    const rules = extractRules(ans, content)
    const stab = axisStability(rules, content)[axisId]
    if (stab.coverage <= 0) continue // no replicated evidence → withhold a verdict
    // All-neutral picks replicate perfectly but show no shift at all — nothing to judge, so withhold too.
    if (rules.every(r => Object.values(r.vector).every(v => v === 0))) continue
    const { signature } = computeSignature(rules, content)
    const reproduced = Math.max(0, ...content.dims.map(d => Math.abs(signature[axisId]?.[d.id]?.slope ?? 0)))
    const solid = reproduced >= SHARPEN_REPRODUCE && stab.instability < MIXED_BAND
    out.push({ axisId, instability: stab.instability, verdict: solid ? 'solid' : 'mixed', n: ans.length })
  }
  return out
}

/**
 * Adaptive stopping rule (ASYMMETRIC — calibrated on the authored items):
 * - "mixed" shows up fast: with parallel items a consistent answerer sits at ~0, so a reading clearly
 *   above the band (>= MIXED_BAND + CONFIDENT_MARGIN) at >= SHARPEN_MIN items is real → stop early.
 * - "solid" is only trustworthy with the full set: two discrete picks often coincide by chance at low
 *   N (a mixed answerer can look momentarily solid), so we keep asking until SHARPEN_CAP before we
 *   commit to "solid". This also matches the intent — pour the extra questions into the swing axis.
 */
export function sharpenConfident(instability: number, n: number): boolean {
  if (n >= SHARPEN_CAP) return true
  if (n >= SHARPEN_MIN && instability >= MIXED_BAND + CONFIDENT_MARGIN) return true // clearly mixed
  return false
}
