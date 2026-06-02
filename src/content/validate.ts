import type { Content } from '../engine/types'

/** Returns an array of human-readable problems. Empty array = valid. */
export function validateContent(content: Content): string[] {
  const errors: string[] = []
  const axisIds = new Set(content.axes.map(a => a.id))
  const dimIds = new Set(content.dims.map(d => d.id))

  const backboneAxes = new Set<string>()

  for (const q of content.questions) {
    if (q.kind === 'backbone') {
      if (q.axis === undefined || !q.cases || q.cases.length < 2) {
        errors.push(`backbone question "${q.id}" must have an axis and >=2 cases`)
      }
      if (q.axis) backboneAxes.add(q.axis)
    }
    if (q.axis && !axisIds.has(q.axis)) errors.push(`question "${q.id}" references unknown axis "${q.axis}"`)
    for (const o of q.options) {
      for (const dimId of Object.keys(o.vector)) {
        if (!dimIds.has(dimId)) errors.push(`question "${q.id}" option "${o.id}" references unknown dim "${dimId}"`)
      }
    }
  }

  for (const a of content.archetypes) {
    for (const axisId of Object.keys(a.signature)) {
      if (!axisIds.has(axisId)) errors.push(`archetype "${a.id}" references unknown axis "${axisId}"`)
      for (const dimId of Object.keys(a.signature[axisId])) {
        if (!dimIds.has(dimId)) errors.push(`archetype "${a.id}" references unknown dim "${dimId}"`)
      }
    }
  }

  for (const axis of content.axes) {
    if (!backboneAxes.has(axis.id)) errors.push(`axis "${axis.id}" has no backbone question covering it`)
  }

  return errors
}
