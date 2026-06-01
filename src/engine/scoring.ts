import { type Answer, type Content, type Profile, type Contingency } from './types'
import { extractRules } from './rules'
import { computeSignature } from './signature'
import { matchArchetype } from './match'

export function describeContingency(axisId: string, dimId: string, slope: number, content: Content): string {
  const axis = content.axes.find(a => a.id === axisId)!
  const dim = content.dims.find(d => d.id === dimId)!
  const highBehaviour = slope >= 0 ? dim.highLabel : dim.lowLabel
  const lowBehaviour = slope >= 0 ? dim.lowLabel : dim.highLabel
  return `When ${axis.highLabel}, you ${highBehaviour}; when ${axis.lowLabel}, you ${lowBehaviour}.`
}

export function computeProfile(answers: Answer[], content: Content): Profile {
  const rules = extractRules(answers, content)
  const { signature, flexibility } = computeSignature(rules, content)
  const archetype = matchArchetype(signature, content)

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

  return { archetype, signature, topContingencies: cells.slice(0, 5), dimensionRanges, flexibility }
}
