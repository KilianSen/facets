import { type Answer, type AxisId, type Content, type DimId, type Profile } from './types'
import { CURVE_WEIGHT } from './match'
import { CURVE_MEANINGFUL } from './scoring'
import { motiveReadout } from './motives'

/** A shift counts toward a click/clash once it's at least this strong. */
export const COMPARE_MEANINGFUL = 1.0
/** A blind spot needs one person to shift at least this hard… */
export const COMPARE_STRONG = 2.0
/** …while the other barely moves (both slope and bend under this). */
export const COMPARE_FLAT = 0.5
/** Softens the sync ratio so two near-flat people read as in sync, not undefined. */
export const SYNC_SOFTENER = 4
const MAX_ROWS = 4

export type ShiftKind = 'slope' | 'curve'
export interface CompareRow {
  axisId: AxisId
  dimId: DimId
  kind: ShiftKind
  /** person A's / B's value of `kind` on this cell */
  a: number
  b: number
}
export interface BlindSpot extends CompareRow { mover: 'a' | 'b' }

export interface Comparison {
  /** 0..1 — how alike the two signatures are overall */
  sync: number
  /** both shift the same way on the same thing */
  clicks: CompareRow[]
  /** both shift on the same thing, in opposite directions */
  clashes: CompareRow[]
  /** one shifts hard where the other doesn't move at all */
  blindSpots: BlindSpot[]
  /** motive ids that run both people's swings (needs both to have answered "why") */
  sharedMotives: string[]
}

interface Feature { kind: ShiftKind; value: number }

/** A cell's dominant feature: a "both ways" bend when it outweighs the slope, else the trend. */
function featureOf(slope: number, curvature: number): Feature {
  return Math.abs(curvature) >= CURVE_MEANINGFUL && Math.abs(curvature) > Math.abs(slope)
    ? { kind: 'curve', value: curvature }
    : { kind: 'slope', value: slope }
}

const mag = (r: CompareRow) => Math.abs(r.a) + Math.abs(r.b)

export function compareProfiles(
  a: Profile, b: Profile, content: Content,
  answersA: Answer[] = [], answersB: Answer[] = [],
): Comparison {
  const clicks: CompareRow[] = []
  const clashes: CompareRow[] = []
  const blindSpots: BlindSpot[] = []
  let distSq = 0, normA = 0, normB = 0

  for (const axis of content.axes) {
    for (const dim of content.dims) {
      const ca = a.signature[axis.id]?.[dim.id] ?? { slope: 0, curvature: 0 }
      const cb = b.signature[axis.id]?.[dim.id] ?? { slope: 0, curvature: 0 }

      const va = [ca.slope, CURVE_WEIGHT * ca.curvature]
      const vb = [cb.slope, CURVE_WEIGHT * cb.curvature]
      for (let i = 0; i < 2; i++) {
        distSq += (va[i] - vb[i]) ** 2
        normA += va[i] ** 2
        normB += vb[i] ** 2
      }

      const fa = featureOf(ca.slope, ca.curvature)
      const fb = featureOf(cb.slope, cb.curvature)
      const aOn = Math.abs(fa.value) >= COMPARE_MEANINGFUL
      const bOn = Math.abs(fb.value) >= COMPARE_MEANINGFUL
      const flat = (c: { slope: number; curvature: number }) =>
        Math.abs(c.slope) < COMPARE_FLAT && Math.abs(c.curvature) < COMPARE_FLAT

      if (aOn && bOn && fa.kind === fb.kind) {
        const row = { axisId: axis.id, dimId: dim.id, kind: fa.kind, a: fa.value, b: fb.value }
        ;(Math.sign(fa.value) === Math.sign(fb.value) ? clicks : clashes).push(row)
      } else if (Math.abs(fa.value) >= COMPARE_STRONG && flat(cb)) {
        blindSpots.push({ axisId: axis.id, dimId: dim.id, kind: fa.kind, a: fa.value, b: 0, mover: 'a' })
      } else if (Math.abs(fb.value) >= COMPARE_STRONG && flat(ca)) {
        blindSpots.push({ axisId: axis.id, dimId: dim.id, kind: fb.kind, a: 0, b: fb.value, mover: 'b' })
      }
    }
  }

  const byMag = (x: CompareRow, y: CompareRow) => mag(y) - mag(x)
  const sync = Math.max(0, Math.min(1, 1 - Math.sqrt(distSq) / (Math.sqrt(normA) + Math.sqrt(normB) + SYNC_SOFTENER)))

  const motivesA = new Set(motiveReadout(answersA, content).reads.map(r => r.motive.id))
  const sharedMotives = [...new Set(motiveReadout(answersB, content).reads.map(r => r.motive.id))].filter(m => motivesA.has(m))

  return {
    sync,
    clicks: clicks.sort(byMag).slice(0, MAX_ROWS),
    clashes: clashes.sort(byMag).slice(0, MAX_ROWS),
    blindSpots: blindSpots.sort(byMag).slice(0, MAX_ROWS),
    sharedMotives,
  }
}

/**
 * Qualitative read of the sync score. Calibrated on a simulated sweep: random answerer pairs sit at
 * p50 ≈ 0.37, noisy same-archetype pairs at p50 ≈ 0.68 — so "Same wavelength" means genuinely alike
 * and "Opposite poles" is reserved for pairs that actively pull against each other.
 */
export function syncBand(sync: number): string {
  if (sync >= 0.7) return 'Mirror images'
  if (sync >= 0.5) return 'Same wavelength'
  if (sync >= 0.3) return 'Different channels'
  return 'Opposite poles'
}
