export type AxisId = string
export type DimId = string

export interface SituationAxis { id: AxisId; name: string; lowLabel: string; highLabel: string }
export interface BehaviorDim { id: DimId; name: string; lowLabel: string; highLabel: string }

export type Vector = Record<DimId, number>

export interface Option { id: string; label: string; vector: Vector }
export interface Case { id: string; label: string; axisLevel: number } // 0..1
export type QuestionKind = 'backbone' | 'flavor'

export interface Question {
  id: string
  prompt: string
  options: Option[]
  kind: QuestionKind
  axis?: AxisId
  cases?: Case[]
  /** held out of base runs; drawn only for the adaptive "sharpen" round (parallel items per axis) */
  reserve?: boolean
}

export interface Archetype {
  id: string
  code: string
  name: string
  tagline: string
  copy: string
  /** expected slope per axis per dim — the prototype shape (how behaviour shifts) */
  signature: Record<AxisId, Record<DimId, number>>
  /** expected average behavioural level per dim (0 / omitted = no lean); used by baseline-aware matching */
  baseline?: Record<DimId, number>
}

export interface Content {
  axes: SituationAxis[]
  dims: BehaviorDim[]
  questions: Question[]
  archetypes: Archetype[]
}

export interface SingleAnswer { questionId: string; mode: 'single'; optionId: string }
export interface DependsAnswer {
  questionId: string
  mode: 'depends'
  ranking: string[]               // case ids, most-true first
  mapping: Record<string, string> // caseId -> optionId
}
export type Answer = SingleAnswer | DependsAnswer

export interface Rule { axis: AxisId; axisLevel: number; vector: Vector; weight: number }

export interface AxisDimCell { slope: number; levels: { level: number; value: number }[] }
export type Signature = Record<AxisId, Record<DimId, AxisDimCell>>

export interface Contingency { axis: AxisId; dim: DimId; slope: number; text: string }
export interface ArchetypeMatch { id: string; confidence: number; runnerUpId?: string }

/** How shaky an axis's slope estimate is (high instability = inconsistent answers). */
export interface AxisStability { axisId: AxisId; instability: number; coverage: number; n: number }

export interface Profile {
  archetype: ArchetypeMatch
  signature: Signature
  topContingencies: Contingency[]
  dimensionRanges: Record<DimId, { min: number; max: number; typical: number }>
  /** context-independent average behavioural level per dim (drives baseline-aware matching) */
  baseline: Record<DimId, number>
  flexibility: number
  /** per-axis unsettled/instability scores (used on parallel sharpen items only) */
  axisStability?: Record<AxisId, AxisStability>
  /** per-axis swing = strongest |slope| on the axis (the big-swing sharpen trigger) */
  axisSwing?: Record<AxisId, number>
}

export function isDependsAnswer(a: Answer): a is DependsAnswer {
  return a.mode === 'depends'
}
