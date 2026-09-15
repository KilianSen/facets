import { type Answer, type AxisId, type Content, type Motive, type Signature } from './types'
import { axisStrength } from './cast'
import { describeContingency, describeCurvature, CURVE_MEANINGFUL } from './scoring'

/** An axis must shift at least this hard before we ask why. */
export const MOTIVE_MIN_STRENGTH = 2.0
export const MAX_MOTIVE_AXES = 2

const PREFIX = 'why_'

/** Motive answers ride in the normal answer list as single answers keyed `why_<axis>` → motive id. */
export function motiveQuestionId(axisId: AxisId): string {
  return `${PREFIX}${axisId}`
}

/** The (up to MAX_MOTIVE_AXES) strongest-swinging axes worth asking "why" about, strongest first. */
export function motiveAxes(sig: Signature, content: Content): AxisId[] {
  if (!content.motives) return []
  return content.axes
    .filter(a => (content.motives!.byAxis[a.id]?.length ?? 0) > 0)
    .map(a => ({ id: a.id, s: axisStrength(sig, a.id, content) }))
    .filter(x => x.s >= MOTIVE_MIN_STRENGTH)
    .sort((x, y) => y.s - x.s)
    .slice(0, MAX_MOTIVE_AXES)
    .map(x => x.id)
}

/** The plain-language read of the user's strongest shift on one axis (trend or bend), or null if flat. */
export function strongestTell(sig: Signature, axisId: AxisId, content: Content): string | null {
  let best: { dim: string; slope: number; curvature: number; s: number } | null = null
  for (const dim of content.dims) {
    const cell = sig[axisId]?.[dim.id]
    if (!cell) continue
    const s = Math.max(Math.abs(cell.slope), Math.abs(cell.curvature))
    if (s > 0 && (!best || s > best.s)) best = { dim: dim.id, slope: cell.slope, curvature: cell.curvature, s }
  }
  if (!best) return null
  const curvy = Math.abs(best.curvature) >= CURVE_MEANINGFUL && Math.abs(best.curvature) > Math.abs(best.slope)
  return curvy
    ? describeCurvature(axisId, best.dim, best.curvature, content)
    : describeContingency(axisId, best.dim, best.slope, content)
}

export interface MotiveRead { axisId: AxisId; motive: Motive; label: string }
export interface MotiveReadout {
  reads: MotiveRead[]
  /** a motive behind two or more of the user's swings — the through-line */
  throughLine?: Motive
}

/** Rebuild the "why" read from answers alone, so it survives permalinks, caches and compares. */
export function motiveReadout(answers: Answer[], content: Content): MotiveReadout {
  const mc = content.motives
  if (!mc) return { reads: [] }
  const byAxis = new Map<AxisId, MotiveRead>()
  for (const a of answers) {
    if (a.mode !== 'single' || !a.questionId.startsWith(PREFIX)) continue
    const axisId = a.questionId.slice(PREFIX.length)
    const option = mc.byAxis[axisId]?.find(o => o.motiveId === a.optionId)
    const motive = mc.motives.find(m => m.id === a.optionId)
    if (option && motive) byAxis.set(axisId, { axisId, motive, label: option.label })
  }
  const reads = content.axes.map(ax => byAxis.get(ax.id)).filter((r): r is MotiveRead => !!r)

  const counts = new Map<string, number>()
  for (const r of reads) counts.set(r.motive.id, (counts.get(r.motive.id) ?? 0) + 1)
  const through = [...counts.entries()].filter(([, n]) => n >= 2).sort((x, y) => y[1] - x[1])[0]
  return { reads, throughLine: through ? mc.motives.find(m => m.id === through[0]) : undefined }
}
