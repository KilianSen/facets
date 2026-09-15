import type { Answer, AxisId, Content, DimId, Question, Signature } from './types'
import { extractRules } from './rules'
import { computeSignature } from './signature'
import { describeContingency } from './scoring'

/**
 * The observer read: a friend answers the same questions the way they think you'd act, and their read is lined
 * up with yours. Both sides are fitted from the SAME questions — lining a friend's two-question read up against
 * your whole run reports differences between questions, not differences in how you're seen. Cells only one side
 * answered are skipped, never compared against a flat zero.
 */

/** Questions asked per situation. Taken from the backbone, which every run (short or deep) answers in full. */
export const OBSERVER_QUESTIONS_PER_AXIS = 2
/**
 * A slope gap at least this big reads as a real difference. Each cell rests on one question, so one changed pick
 * moves a slope by 2–4. Simulated with 20% answer noise, the same person re-answering shows a gap in ~13% of reads,
 * and a situation the observer genuinely reads the opposite way is caught ~45% of the time — a hint, not a verdict.
 */
export const OBSERVER_GAP = 4
/** Below this |slope| a read counts as "doesn't shift". */
export const OBSERVER_SHIFT = 1
/** Both reads must shift at least this hard, the same way, to count as a clear mirror. */
const MIRROR_SHIFT = 2
/** The largest possible |slope| on the ±2 option scale — scales congruence. */
const MAX_SLOPE = 4
const MAX_GAPS = 4

export type ObserverGapKind = 'stronger' | 'weaker' | 'opposite' | 'aligned'

export interface ObserverGapItem {
  axisId: AxisId
  dimId: DimId
  selfSlope: number
  otherSlope: number
  /** otherSlope − selfSlope */
  delta: number
  kind: ObserverGapKind
  headline: string
  explanation: string
}

export interface ObserverReport {
  subjectName: string
  observerName: string
  /** situation × behaviour cells both people answered */
  measuredCells: number
  /** 0..1 agreement across those cells; null when nothing overlaps */
  congruence: number | null
  /** where the observer reads a shift clearly differently, biggest gap first */
  blindSpots: ObserverGapItem[]
  /** strong shifts both people read the same way */
  clearMirror: ObserverGapItem[]
  summary: string
}

export function selectObserverQuestions(content: Content): Question[] {
  return content.axes.flatMap(axis =>
    content.questions.filter(q => q.axis === axis.id && q.kind === 'backbone' && !q.reserve).slice(0, OBSERVER_QUESTIONS_PER_AXIS))
}

function readFrom(answers: Answer[], ids: Set<string>, content: Content): Signature {
  return computeSignature(extractRules(answers.filter(a => ids.has(a.questionId)), content), content).signature
}

function shiftText(axisId: AxisId, dimId: DimId, slope: number, content: Content): string {
  if (Math.abs(slope) >= OBSERVER_SHIFT) return describeContingency(axisId, dimId, slope, content)
  const axis = content.axes.find(a => a.id === axisId)!
  const dim = content.dims.find(d => d.id === dimId)!
  return `No real change in ${dim.name.toLowerCase()} as ${axis.name.toLowerCase()} changes.`
}

export function computeObserverReport(
  selfAnswers: Answer[],
  observerAnswers: Answer[],
  content: Content,
  subjectName = 'You',
  observerName = 'An observer',
  questions: Question[] = selectObserverQuestions(content),
): ObserverReport {
  const ids = new Set(questions.map(q => q.id))
  const self = readFrom(selfAnswers, ids, content)
  const other = readFrom(observerAnswers, ids, content)

  const blindSpots: ObserverGapItem[] = []
  const clearMirror: ObserverGapItem[] = []
  let sumSq = 0
  let measuredCells = 0

  for (const axis of content.axes) {
    for (const dim of content.dims) {
      const s = self[axis.id]?.[dim.id]
      const o = other[axis.id]?.[dim.id]
      // A slope needs two levels; anything less on either side is "not asked", not "flat".
      if (!s || !o || s.levels.length < 2 || o.levels.length < 2) continue
      measuredCells++
      sumSq += (o.slope - s.slope) ** 2

      const delta = o.slope - s.slope
      const base = {
        axisId: axis.id, dimId: dim.id, selfSlope: s.slope, otherSlope: o.slope, delta,
        headline: `${dim.name} ${axis.lens ?? axis.name.toLowerCase()}`,
      }
      const opposite = Math.sign(s.slope) !== Math.sign(o.slope) && Math.abs(s.slope) >= OBSERVER_SHIFT && Math.abs(o.slope) >= OBSERVER_SHIFT

      if (Math.abs(delta) >= OBSERVER_GAP) {
        blindSpots.push({
          ...base,
          kind: opposite ? 'opposite' : Math.abs(o.slope) > Math.abs(s.slope) ? 'stronger' : 'weaker',
          explanation: `${observerName}’s read: ${shiftText(axis.id, dim.id, o.slope, content)} ${subjectName}’s own read: ${shiftText(axis.id, dim.id, s.slope, content)}`,
        })
      } else if (!opposite && Math.abs(s.slope) >= MIRROR_SHIFT && Math.abs(o.slope) >= MIRROR_SHIFT) {
        clearMirror.push({
          ...base,
          kind: 'aligned',
          explanation: `You both read it the same way: ${shiftText(axis.id, dim.id, s.slope, content)}`,
        })
      }
    }
  }

  blindSpots.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
  clearMirror.sort((x, y) => Math.abs(y.selfSlope) - Math.abs(x.selfSlope))

  const congruence = measuredCells > 0
    ? Math.round(Math.max(0, Math.min(1, 1 - Math.sqrt(sumSq / measuredCells) / MAX_SLOPE)) * 100) / 100
    : null

  const summary = measuredCells === 0
    ? `${observerName} and ${subjectName} didn’t answer the same questions, so there’s nothing to line up yet.`
    : blindSpots.length === 0
      ? `${observerName} reads ${subjectName}’s shifts the same way ${subjectName} does, on everything you both answered.`
      : `${observerName} reads ${blindSpots.length === 1 ? 'one shift' : `${Math.min(blindSpots.length, MAX_GAPS)} shifts`} clearly differently from how ${subjectName} describes it.`

  return {
    subjectName,
    observerName,
    measuredCells,
    congruence,
    blindSpots: blindSpots.slice(0, MAX_GAPS),
    clearMirror: clearMirror.slice(0, MAX_GAPS),
    summary,
  }
}
