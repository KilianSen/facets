import { type Archetype, type AxisId, type AxisStability, type Content, type DimId, type Facet, type Signature } from './types'
import { matchArchetype } from './match'

/**
 * Compositional matching. Instead of forcing one prototype to explain a whole signature, every situation
 * you shift on is explained by layers of single-situation types: the type removing the most of your
 * shift goes first, then another may take what's left if it explains a clear extra part (a combo type,
 * e.g. The Fierce Loyalist, wins in one layer when it covers both parts). A multi-situation type (a
 * blend, e.g. The Wallflower) takes several situations as one member when it explains them about as
 * well as their layers do. The member explaining the most of you is the headline; the rest are
 * co-stars; what nobody explains is reported as-is. Nobody shifts → the flat type (The Constant).
 *
 * "Explaining" is measured as shift energy: per behaviour, slope² + genuine bend² (see `Cells`), so a
 * real both-ways pattern counts as much as a trend while a one-directional step costs nothing extra.
 */

/** A situation needs at least this strong a shift (|slope| or |bend|) to be cast. */
export const CAST_MIN_STRENGTH = 2.0
/** A situation's layers together must explain at least this share of its shift energy, or it stays unclaimed. */
export const CAST_MIN_FIT = 0.4
/** Each layer must remove at least this share of its situation's shift energy… */
export const LAYER_MIN_SHARE = 0.15
/** …and every layer after the first at least this much in absolute terms. */
export const LAYER_MIN_GAIN = 4
export const MAX_LAYERS = 3
/** A blend may explain its situations up to this much worse than their layers and still win (it's one idea, not several). */
export const BLEND_PARSIMONY = 0.25
/** Leftover shifts at least this strong (|slope| or |bend|) are reported as unexplained. */
export const UNEXPLAINED_MIN = 2
const MAX_UNEXPLAINED = 4

export interface CastMember {
  archetypeId: string
  /** the situations this member explains (one for a single-situation type, several for a blend) */
  axes: AxisId[]
  /** its strongest situation */
  axisId: AxisId
  strength: number
  /** share of those situations' shift energy it explains (0..1) */
  fit: number
  /** absolute shift energy it explains — what ranks the cast */
  explained: number
}

/** A shift left over after the cast: the residual slope / bend nobody in the cast accounts for. */
export interface Leftover { axisId: AxisId; dimId: DimId; slope: number; curvature: number }

export interface Cast {
  lead: string
  members: CastMember[]
  /** the closest alternative reading of the lead's situations */
  runnerUpId?: string
  /** strong shifts no cast member explains, strongest first */
  unexplained: Leftover[]
  /** share of the whole signature's shift energy the cast explains */
  explained: number
  /** share of situations with real evidence */
  sufficiency: number
  /** explained × sufficiency — what the result's read band shows */
  confidence: number
}

/** The situations an archetype's prototype actually lives on (non-empty slope or curve entries). */
export function axesOf(a: Archetype): Set<AxisId> {
  const out = new Set<AxisId>()
  for (const [ax, dims] of Object.entries(a.signature)) if (Object.keys(dims).length) out.add(ax)
  for (const [ax, dims] of Object.entries(a.curve ?? {})) if (Object.keys(dims).length) out.add(ax)
  return out
}

/** The strongest feature on one situation: max |slope| or |curvature| over its behaviours. */
export function axisStrength(sig: Signature, axisId: AxisId, content: Content): number {
  let max = 0
  for (const dim of content.dims) {
    const cell = sig[axisId]?.[dim.id]
    if (cell) max = Math.max(max, Math.abs(cell.slope), Math.abs(cell.curvature))
  }
  return max
}

/**
 * One situation's shifts as [slope, genuine bend] per behaviour. A bend of up to half the slope is what a
 * one-directional step produces ("only my best friend is different") — that belongs to the trend, so it
 * is dropped here, once, relative to the person's own slope. Only the bend beyond it (a real "both ways"
 * shape, or a zig-zag from inconsistent answers) is kept, and it counts at full weight.
 */
type Cells = Record<DimId, [number, number]>

function genuineBend(slope: number, bend: number): number {
  return Math.sign(bend) * Math.max(0, Math.abs(bend) - Math.abs(slope) / 2)
}

const cellsOf = (sig: Signature, axisId: AxisId, content: Content): Cells =>
  Object.fromEntries(content.dims.map(d => {
    const cell = sig[axisId]?.[d.id]
    return [d.id, [cell?.slope ?? 0, genuineBend(cell?.slope ?? 0, cell?.curvature ?? 0)]]
  }))

const minus = (cells: Cells, proto: Archetype, axisId: AxisId): Cells =>
  Object.fromEntries(Object.entries(cells).map(([d, [s, c]]) => [d, [s - (proto.signature[axisId]?.[d] ?? 0), c - (proto.curve?.[axisId]?.[d] ?? 0)]]))

/** Shift energy: slope² + genuine bend² per behaviour. */
const energyOf = (cells: Cells) => Object.values(cells).reduce((sum, [s, g]) => sum + s * s + g * g, 0)

/** Shift energy on one situation that `proto` leaves unexplained; proto = null gives the situation's total. */
export function axisResidual(sig: Signature, axisId: AxisId, proto: Archetype | null, content: Content): number {
  const cells = cellsOf(sig, axisId, content)
  return energyOf(proto ? minus(cells, proto, axisId) : cells)
}

/**
 * `answeredAxes`: the situations the person actually answered "it depends" questions on. When given, it
 * is the evidence behind `sufficiency` — answering the neutral option everywhere is evidence of being
 * steady, not a lack of evidence. Without it (e.g. a hand-built signature), situations count as measured
 * once some behaviour has data at two or more levels.
 */
export function computeCast(
  sig: Signature,
  baseline: Record<DimId, number>,
  content: Content,
  answeredAxes?: Iterable<AxisId>,
  stability?: Record<AxisId, AxisStability>,
): Cast {
  const order = new Map(content.archetypes.map((a, i) => [a.id, i]))
  const axisIds = content.axes.map(a => a.id)
  const strength = (axisId: AxisId) => axisStrength(sig, axisId, content)
  const shifting = axisIds.filter(id => strength(id) >= CAST_MIN_STRENGTH)
  const shiftSet = new Set(shifting)
  const residuals = new Map<AxisId, Cells>(axisIds.map(id => [id, cellsOf(sig, id, content)]))

  // 1. Layers: per situation, repeatedly add the single-situation type that removes the most remaining
  // shift energy, while it removes a clear share. Ties go to catalog order (simpler types come first).
  const layers = new Map<AxisId, CastMember[]>()
  for (const axisId of shifting) {
    const cells = residuals.get(axisId)!
    const e0 = energyOf(cells)
    if (e0 <= 0) continue
    let res = cells
    const picked: CastMember[] = []
    const used = new Set<string>()
    for (let k = 0; k < MAX_LAYERS; k++) {
      let best: { a: Archetype; gain: number; next: Cells } | null = null
      for (const a of content.archetypes) {
        const axes = axesOf(a)
        if (axes.size !== 1 || !axes.has(axisId) || used.has(a.id)) continue
        const next = minus(res, a, axisId)
        const gain = energyOf(res) - energyOf(next)
        if (!best || gain > best.gain) best = { a, gain, next }
      }
      // The first layer only needs a clear share (a pure bend is small in absolute terms); extra layers
      // must also clear an absolute floor so they don't pick at crumbs.
      if (!best || best.gain <= 0 || best.gain < LAYER_MIN_SHARE * e0 || (k > 0 && best.gain < LAYER_MIN_GAIN)) break
      used.add(best.a.id)
      res = best.next
      picked.push({ archetypeId: best.a.id, axes: [axisId], axisId, strength: strength(axisId), fit: best.gain / e0, explained: best.gain })
    }
    if (picked.length > 0 && 1 - energyOf(res) / e0 >= CAST_MIN_FIT) {
      layers.set(axisId, picked)
      residuals.set(axisId, res)
    }
  }

  // 2. Blends: a multi-situation type replaces the layers on its situations when it explains them nearly
  // as well (within BLEND_PARSIMONY). Best-fitting blends first; situations can't be shared.
  const blends = content.archetypes
    .map(a => ({ a, axes: axisIds.filter(id => axesOf(a).has(id)) }))
    .filter(b => b.axes.length >= 2 && b.axes.every(id => shiftSet.has(id)))
    .map(b => {
      const own = b.axes.map(id => minus(cellsOf(sig, id, content), b.a, id))
      return {
        ...b, own,
        flat: b.axes.reduce((s, id) => s + energyOf(cellsOf(sig, id, content)), 0),
        r: own.reduce((s, cells) => s + energyOf(cells), 0),
        sep: b.axes.reduce((s, id) => s + energyOf(residuals.get(id)!), 0),
      }
    })
    .filter(b => b.flat > 0 && 1 - b.r / b.flat >= CAST_MIN_FIT && b.r <= b.sep * (1 + BLEND_PARSIMONY))
    .sort((x, y) => x.r / Math.max(x.sep, 1e-9) - y.r / Math.max(y.sep, 1e-9) || order.get(x.a.id)! - order.get(y.a.id)!)

  const taken = new Set<AxisId>()
  const members: CastMember[] = []
  for (const b of blends) {
    if (b.axes.some(id => taken.has(id))) continue
    b.axes.forEach((id, i) => { taken.add(id); residuals.set(id, b.own[i]) })
    const axisId = [...b.axes].sort((x, y) => strength(y) - strength(x))[0]
    members.push({ archetypeId: b.a.id, axes: b.axes, axisId, strength: strength(axisId), fit: 1 - b.r / b.flat, explained: b.flat - b.r })
  }
  for (const [axisId, picked] of layers) if (!taken.has(axisId)) members.push(...picked)
  members.sort((x, y) => y.explained - x.explained || order.get(x.archetypeId)! - order.get(y.archetypeId)!)

  // 3. Headline + the closest alternative reading.
  const flatType = content.archetypes.find(a => axesOf(a).size === 0)
  let lead: string
  let runnerUpId: string | undefined
  if (members.length > 0) {
    lead = members[0].archetypeId
    runnerUpId = alternative(sig, content, lead, members[0].axes)
  } else if (shifting.length === 0 && flatType) {
    lead = flatType.id
    const m = matchArchetype(sig, baseline, content)
    runnerUpId = m.id !== lead ? m.id : m.runnerUpId
  } else {
    // You shift, but nothing in the catalogue explains it well — fall back to the nearest overall shape.
    const m = matchArchetype(sig, baseline, content)
    lead = m.id
    runnerUpId = m.runnerUpId
  }

  // 4. What's left: strong shifts on each situation that the cast doesn't account for.
  const unexplained: Leftover[] = []
  for (const axisId of axisIds) {
    for (const [dimId, [s, c]] of Object.entries(residuals.get(axisId)!)) {
      if (Math.abs(s) >= UNEXPLAINED_MIN || Math.abs(c) >= UNEXPLAINED_MIN) unexplained.push({ axisId, dimId, slope: s, curvature: c })
    }
  }
  unexplained.sort((x, y) => Math.max(Math.abs(y.slope), Math.abs(y.curvature)) - Math.max(Math.abs(x.slope), Math.abs(x.curvature)))

  const total = axisIds.reduce((s, id) => s + energyOf(cellsOf(sig, id, content)), 0)
  const explained = total > 0 ? Math.max(0, Math.min(1, members.reduce((s, m) => s + m.explained, 0) / total)) : 1
  const answered = answeredAxes ? new Set(answeredAxes) : null
  const withData = content.axes.filter(ax => answered
    ? answered.has(ax.id)
    : content.dims.some(d => (sig[ax.id]?.[d.id]?.levels.length ?? 0) >= 2)).length
  const sufficiency = content.axes.length ? withData / content.axes.length : 0
  const rawConfidence = explained * sufficiency
  let confidence = rawConfidence
  if (stability) {
    const activeStabs = Object.values(stability).filter(s => s.coverage > 0)
    if (activeStabs.length > 0) {
      const meanInstability = activeStabs.reduce((s, x) => s + x.instability, 0) / activeStabs.length
      // Penalize response instability: a consistent person has instability ~0.05 (penalty <8%),
      // while a random clicker has instability ~0.26 (drops confidence by ~40%, down to Loose read).
      confidence = Math.max(0, rawConfidence * Math.max(0, 1 - 1.5 * meanInstability))
    }
  }

  return {
    lead, members, runnerUpId,
    unexplained: unexplained.slice(0, MAX_UNEXPLAINED),
    explained, sufficiency, confidence,
  }
}

/** The best other type for the lead's situations (single-situation types on them, or blends within them). */
function alternative(sig: Signature, content: Content, leadId: string, leadAxes: AxisId[]): string | undefined {
  let best: { id: string; r: number } | undefined
  for (const a of content.archetypes) {
    if (a.id === leadId) continue
    const axes = axesOf(a)
    if (axes.size === 0 || ![...axes].every(id => leadAxes.includes(id))) continue
    const r = leadAxes.reduce((s, id) => s + axisResidual(sig, id, axes.has(id) ? a : null, content), 0)
    if (!best || r < best.r) best = { id: a.id, r }
  }
  return best?.id
}

/** The co-stars as facets (everyone in the cast except the lead). */
export function castFacets(cast: Cast): Facet[] {
  return cast.members
    .filter(m => m.archetypeId !== cast.lead)
    .map(m => ({ axisId: m.axisId, axes: m.axes, archetypeId: m.archetypeId, strength: m.strength, fit: m.fit }))
}

/** The full multi-facet code, e.g. "VAULT · CLUTCH · FUMES". */
export function facetCode(primaryId: string, facets: Facet[], content: Content): string {
  const code = (id: string) => content.archetypes.find(a => a.id === id)?.code
  return [primaryId, ...facets.map(f => f.archetypeId)].map(code).filter(Boolean).join(' · ')
}
