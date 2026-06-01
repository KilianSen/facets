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
}

export interface Archetype {
  id: string
  code: string
  name: string
  tagline: string
  copy: string
  /** expected slope per axis per dim — the prototype shape */
  signature: Record<AxisId, Record<DimId, number>>
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

export interface Profile {
  archetype: ArchetypeMatch
  signature: Signature
  topContingencies: Contingency[]
  dimensionRanges: Record<DimId, { min: number; max: number; typical: number }>
  flexibility: number
}

export function isDependsAnswer(a: Answer): a is DependsAnswer {
  return a.mode === 'depends'
}
