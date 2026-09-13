import { type Answer, type Content, type Profile, type Contingency } from './types'
import { extractRules, extractBaseline } from './rules'
import { computeSignature } from './signature'
import { matchArchetype } from './match'
import { axisStability, axisSwing } from './stability'
import { computeFacets } from './facets'

export function describeContingency(axisId: string, dimId: string, slope: number, content: Content): string {
  const axis = content.axes.find(a => a.id === axisId)
  const dim = content.dims.find(d => d.id === dimId)
  if (!axis || !dim) throw new Error(`describeContingency: unknown axis "${axisId}" or dim "${dimId}"`)
  const highBehaviour = slope >= 0 ? dim.highLabel : dim.lowLabel
  const lowBehaviour = slope >= 0 ? dim.lowLabel : dim.highLabel
  return `When ${axis.highLabel}, you ${highBehaviour}; when ${axis.lowLabel}, you ${lowBehaviour}.`
}

/** Below this, a measured bend is noise; at or above it (and bigger than the slope) it reads as a
 * genuine non-monotonic "both ways" tell rather than a trend. */
export const CURVE_MEANINGFUL = 1.0

/** Plain-language read of a non-monotonic relationship — the both-ways pattern a slope alone misses. */
export function describeCurvature(axisId: string, dimId: string, curvature: number, content: Content): string {
  const axis = content.axes.find(a => a.id === axisId)
  const dim = content.dims.find(d => d.id === dimId)
  if (!axis || !dim) throw new Error(`describeCurvature: unknown axis "${axisId}" or dim "${dimId}"`)
  // curvature > 0 = U (high at the extremes, low in the middle); < 0 = inverted-U (high in the middle).
  return curvature >= 0
    ? `At the extremes of ${axis.name.toLowerCase()}, you ${dim.highLabel}; in the middle, you ${dim.lowLabel}.`
    : `When ${axis.name.toLowerCase()} sits in the middle, you ${dim.highLabel}; at either extreme, you ${dim.lowLabel}.`
}

export function computeProfile(answers: Answer[], content: Content): Profile {
  // Reserve (sharpen) answers are extreme parallel probes (±2 / neutral) held out of the base
  // measurement; their verdict is surfaced separately via sharpenReadout. Folding them into the
  // signature/baseline biases the baseline toward 0 on exactly the sharpened axis's dims and can flip
  // a borderline archetype — so opting into the optional round must not change who you are.
  const reserveIds = new Set(content.questions.filter(q => q.reserve).map(q => q.id))
  const rules = extractRules(answers.filter(a => !reserveIds.has(a.questionId)), content)
  const { signature, flexibility } = computeSignature(rules, content)
  const baseline = extractBaseline(answers.filter(a => !reserveIds.has(a.questionId)), content)
  const archetype = matchArchetype(signature, baseline, content)

  const dimensionRanges: Profile['dimensionRanges'] = {}
  for (const dim of content.dims) {
    const vals: number[] = []
    for (const axis of content.axes) {
      for (const lvl of signature[axis.id][dim.id].levels) vals.push(lvl.value)
    }
    dimensionRanges[dim.id] = vals.length
      ? { min: Math.min(...vals), max: Math.max(...vals), typical: vals.reduce((s, v) => s + v, 0) / vals.length }
      : { min: 0, max: 0, typical: 0 }
  }

  // A relationship reads as a "both ways" bend when its curvature is meaningful AND outweighs its
  // slope (e.g. a symmetric inverted-U the slope alone would report as flat); otherwise as a trend.
  const cells: Contingency[] = []
  for (const axis of content.axes) {
    for (const dim of content.dims) {
      const { slope, curvature } = signature[axis.id][dim.id]
      const curvy = Math.abs(curvature) >= CURVE_MEANINGFUL && Math.abs(curvature) > Math.abs(slope)
      if (curvy) {
        cells.push({ axis: axis.id, dim: dim.id, slope, curvature, kind: 'curve', text: describeCurvature(axis.id, dim.id, curvature, content) })
      } else if (slope !== 0) {
        cells.push({ axis: axis.id, dim: dim.id, slope, curvature, kind: 'slope', text: describeContingency(axis.id, dim.id, slope, content) })
      }
    }
  }
  const strength = (c: Contingency) => (c.kind === 'curve' ? Math.abs(c.curvature ?? 0) : Math.abs(c.slope))
  cells.sort((a, b) => strength(b) - strength(a))

  return {
    archetype, signature, topContingencies: cells.slice(0, 5), dimensionRanges, baseline, flexibility,
    facets: computeFacets(signature, archetype.id, content),
    axisStability: axisStability(rules, content),
    axisSwing: axisSwing(signature, content),
  }
}
