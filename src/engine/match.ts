import { type Content, type Signature, type ArchetypeMatch, type DimId } from './types'

/**
 * How much the behavioural baseline weighs vs the contingency shape. Kept low so the
 * contingency *slope* stays the primary signal: user baselines span ~±2 per dim and slope
 * gaps between archetypes are ~3, so at this weight the baseline term tiebreaks / nudges
 * borderline matches without overriding a clear slope match.
 */
export const BASELINE_WEIGHT = 0.25

/**
 * How much a curvature mismatch weighs vs the linear-slope match. Kept modest (like BASELINE_WEIGHT)
 * so the slope stays the primary signal for the monotonic majority, while still being decisive enough
 * to pull a genuinely non-monotonic answerer onto a "both ways" archetype rather than the nearest
 * slope/constant. Calibrated against the reachability + separation gates.
 */
export const CURVE_WEIGHT = 0.35

/** Euclidean distance between a user signature and a prototype signature over all axis×dim slopes. */
export function signatureDistance(
  sig: Signature,
  proto: Record<string, Record<string, number>>,
  content: Content,
): number {
  let sum = 0
  for (const axis of content.axes) {
    const protoAxis = proto[axis.id] ?? {}
    for (const dim of content.dims) {
      const userSlope = sig[axis.id]?.[dim.id]?.slope ?? 0
      const protoSlope = protoAxis[dim.id] ?? 0
      const d = userSlope - protoSlope
      sum += d * d
    }
  }
  return Math.sqrt(sum)
}

/** Euclidean distance between a user signature's curvature and a prototype's `curve` over all axis×dim. */
export function curvatureDistance(
  sig: Signature,
  protoCurve: Record<string, Record<string, number>> | undefined,
  content: Content,
): number {
  let sum = 0
  for (const axis of content.axes) {
    const protoAxis = protoCurve?.[axis.id] ?? {}
    for (const dim of content.dims) {
      const userCurve = sig[axis.id]?.[dim.id]?.curvature ?? 0
      const protoC = protoAxis[dim.id] ?? 0
      const d = userCurve - protoC
      sum += d * d
    }
  }
  return Math.sqrt(sum)
}

/** Euclidean distance between a user baseline and an archetype baseline over all dims. */
export function baselineDistance(
  baseline: Record<DimId, number>,
  proto: Record<DimId, number> | undefined,
  content: Content,
): number {
  let sum = 0
  for (const dim of content.dims) {
    const d = (baseline[dim.id] ?? 0) - (proto?.[dim.id] ?? 0)
    sum += d * d
  }
  return Math.sqrt(sum)
}

export function matchArchetype(
  sig: Signature,
  baseline: Record<DimId, number>,
  content: Content,
): ArchetypeMatch {
  if (content.archetypes.length === 0) throw new Error('No archetypes defined in content')

  const scored = content.archetypes.map((a, idx) => ({
    id: a.id,
    idx,
    dist: signatureDistance(sig, a.signature, content)
      + CURVE_WEIGHT * curvatureDistance(sig, a.curve, content)
      + BASELINE_WEIGHT * baselineDistance(baseline, a.baseline, content),
  }))
  scored.sort((a, b) => a.dist - b.dist || a.idx - b.idx) // nearest; tiebreak by catalog order

  const best = scored[0]
  const runnerUp = scored[1]

  // Margin to the runner-up, bounded [0,1].
  let margin = 1
  if (runnerUp) {
    const denom = best.dist + runnerUp.dist
    margin = denom === 0 ? 0.5 : Math.max(0, Math.min(1, (runnerUp.dist - best.dist) / denom + 0.5))
  }

  // Evidence gate: a flat signature from a consistent person and a flat signature from
  // *no answers* look identical, so confidence must depend on actual data, not just distance.
  // An axis is "covered" when some dim there has >= 2 levels of data (a real slope exists).
  const axesWithData = content.axes.filter(ax =>
    content.dims.some(d => (sig[ax.id]?.[d.id]?.levels.length ?? 0) >= 2),
  ).length
  const sufficiency = content.axes.length ? axesWithData / content.axes.length : 0

  return { id: best.id, confidence: margin * sufficiency, runnerUpId: runnerUp?.id }
}
