import { type Answer, type Content, type Profile, type Contingency } from './types'
import { extractRules, extractBaseline } from './rules'
import { computeSignature } from './signature'
import { matchArchetype } from './match'
import { axisStability, axisSwing } from './stability'

export function describeContingency(axisId: string, dimId: string, slope: number, content: Content): string {
  const axis = content.axes.find(a => a.id === axisId)
  const dim = content.dims.find(d => d.id === dimId)
  if (!axis || !dim) throw new Error(`describeContingency: unknown axis "${axisId}" or dim "${dimId}"`)
  const highBehaviour = slope >= 0 ? dim.highLabel : dim.lowLabel
  const lowBehaviour = slope >= 0 ? dim.lowLabel : dim.highLabel
  return `When ${axis.highLabel}, you ${highBehaviour}; when ${axis.lowLabel}, you ${lowBehaviour}.`
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

  const cells: Contingency[] = []
  for (const axis of content.axes) {
    for (const dim of content.dims) {
      const slope = signature[axis.id][dim.id].slope
      if (slope !== 0) {
        cells.push({ axis: axis.id, dim: dim.id, slope, text: describeContingency(axis.id, dim.id, slope, content) })
      }
    }
  }
  cells.sort((a, b) => Math.abs(b.slope) - Math.abs(a.slope))

  return {
    archetype, signature, topContingencies: cells.slice(0, 5), dimensionRanges, baseline, flexibility,
    axisStability: axisStability(rules, content),
    axisSwing: axisSwing(signature, content),
  }
}
