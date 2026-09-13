import { type Archetype, type AxisId, type Content, type Facet, type Signature } from './types'
import { CURVE_WEIGHT } from './match'

/** An axis must shift at least this hard (|slope| or |bend|) to earn a facet. */
export const FACET_MIN_STRENGTH = 2.0
/** A facet must explain at least this much of the user's shape on its axis (1 − dist/flatDist). */
export const FACET_MIN_FIT = 0.4
export const MAX_FACETS = 2

/** The axes an archetype's prototype actually lives on (non-empty slope or curve entries). */
export function axesOf(a: Archetype): Set<AxisId> {
  const out = new Set<AxisId>()
  for (const [ax, dims] of Object.entries(a.signature)) if (Object.keys(dims).length) out.add(ax)
  for (const [ax, dims] of Object.entries(a.curve ?? {})) if (Object.keys(dims).length) out.add(ax)
  return out
}

/** The strongest feature on one axis: max |slope| or |curvature| over its dims. */
export function axisStrength(sig: Signature, axisId: AxisId, content: Content): number {
  let max = 0
  for (const dim of content.dims) {
    const cell = sig[axisId]?.[dim.id]
    if (cell) max = Math.max(max, Math.abs(cell.slope), Math.abs(cell.curvature))
  }
  return max
}

/** matchArchetype's distance restricted to one axis; `proto = null` measures distance to flat. */
function axisDistance(sig: Signature, axisId: AxisId, proto: Archetype | null, content: Content): number {
  let s = 0, c = 0
  for (const dim of content.dims) {
    const cell = sig[axisId]?.[dim.id]
    const ds = (cell?.slope ?? 0) - (proto?.signature[axisId]?.[dim.id] ?? 0)
    const dc = (cell?.curvature ?? 0) - (proto?.curve?.[axisId]?.[dim.id] ?? 0)
    s += ds * ds
    c += dc * dc
  }
  return Math.sqrt(s) + CURVE_WEIGHT * Math.sqrt(c)
}

/**
 * The secondary facets that make a result multi-faceted rather than one box. For every axis the
 * primary archetype doesn't already cover and that the user shifts hard on, find the single-axis
 * archetype nearest the user's shape on that axis alone. Keep it only if it genuinely explains the
 * shape (fit ≥ FACET_MIN_FIT), then rank by strength × fit. Deterministic: ties go to catalog order.
 */
export function computeFacets(sig: Signature, primaryId: string, content: Content): Facet[] {
  const primary = content.archetypes.find(a => a.id === primaryId)
  const covered = primary ? axesOf(primary) : new Set<AxisId>()
  const facets: Facet[] = []

  for (const axis of content.axes) {
    if (covered.has(axis.id)) continue
    const strength = axisStrength(sig, axis.id, content)
    if (strength < FACET_MIN_STRENGTH) continue
    const flat = axisDistance(sig, axis.id, null, content)
    if (flat === 0) continue

    let best: { a: Archetype; d: number } | null = null
    for (const a of content.archetypes) {
      if (a.id === primaryId) continue
      const axes = axesOf(a)
      if (axes.size !== 1 || !axes.has(axis.id)) continue
      const d = axisDistance(sig, axis.id, a, content)
      if (!best || d < best.d) best = { a, d }
    }
    if (!best) continue

    const fit = 1 - best.d / flat
    if (fit >= FACET_MIN_FIT) facets.push({ axisId: axis.id, archetypeId: best.a.id, strength, fit })
  }

  return facets
    .sort((x, y) => y.strength * y.fit - x.strength * x.fit)
    .slice(0, MAX_FACETS)
}

/** The full multi-facet code, e.g. "VAULT · CLUTCH · FUMES". */
export function facetCode(primaryId: string, facets: Facet[], content: Content): string {
  const code = (id: string) => content.archetypes.find(a => a.id === id)?.code
  return [primaryId, ...facets.map(f => f.archetypeId)].map(code).filter(Boolean).join(' · ')
}
