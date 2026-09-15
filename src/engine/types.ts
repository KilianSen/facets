export type AxisId = string
export type DimId = string

export interface SituationAxis {
  id: AxisId; name: string; lowLabel: string; highLabel: string
  /** short, direction-neutral phrase naming the situation as a facet lens (e.g. "under pressure") */
  lens?: string
  /** the "It depends…" affordance on a single-answer question about this situation */
  dependsLabel?: string
}
export interface BehaviorDim { id: DimId; name: string; lowLabel: string; highLabel: string }

export type Vector = Record<DimId, number>

export interface Option { id: string; label: string; vector: Vector }
export type CaseSetting = 'romance' | 'work' | 'social' | 'family'
export interface Case { id: string; label: string; axisLevel: number; setting?: CaseSetting } // 0..1
export type QuestionKind = 'backbone' | 'flavor'

export interface Question {
  id: string
  prompt: string
  options: Option[]
  kind: QuestionKind
  axis?: AxisId
  cases?: Case[]
  /** held out of base runs and the signature; drawn only by a follow-up round (sharpen, or across-your-life) */
  reserve?: boolean
  /** an across-your-life item (deep dive): one situation asked in each setting; read only by the setting offsets */
  acrossSettings?: boolean
}

export interface Archetype {
  id: string
  code: string
  name: string
  tagline: string
  copy: string
  /** expected slope per axis per dim — the prototype's linear shape (how behaviour shifts) */
  signature: Record<AxisId, Record<DimId, number>>
  /** expected quadratic bend per axis per dim — set only for non-monotonic ("both ways") archetypes;
   * omitted = no bend. Same sign convention as AxisDimCell.curvature (>0 U, <0 inverted-U). */
  curve?: Record<AxisId, Record<DimId, number>>
  /** expected average behavioural level per dim (0 / omitted = no lean); used by baseline-aware matching */
  baseline?: Record<DimId, number>
}

/**
 * A reason behind a shift — the CAPS "why" (the expectancy / goal / affect that produces the if-then
 * behaviour). Two people with the same slope can run on different motives; this is what tells them apart.
 */
export interface Motive { id: string; name: string; tagline: string; copy: string }
export interface MotiveOption { motiveId: string; label: string }
export interface MotiveContent {
  motives: Motive[]
  /** the motive choices offered when asking why a user swings on an axis */
  byAxis: Record<AxisId, MotiveOption[]>
}

export interface Content {
  axes: SituationAxis[]
  dims: BehaviorDim[]
  questions: Question[]
  archetypes: Archetype[]
  motives?: MotiveContent
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

/**
 * The fitted shape of one behaviour dim as a situation axis rises.
 * `slope` is the linear trend; `curvature` is the quadratic bend derived from the per-level means —
 * the orthogonal second difference `(value@0 + value@1 − 2·value@0.5) / 2`. Sign convention:
 * curvature > 0 = U (convex, mid below the ends), < 0 = inverted-U (concave, mid above the ends),
 * ≈ 0 = straight. 0 when any of the three canonical levels is missing (unidentifiable). This is what
 * lets the model see a consistent "both ways" pattern that a slope-only fit reports as flat.
 */
export interface AxisDimCell { slope: number; curvature: number; levels: { level: number; value: number }[] }
export type Signature = Record<AxisId, Record<DimId, AxisDimCell>>

export interface Contingency {
  axis: AxisId
  dim: DimId
  slope: number
  /** quadratic bend (see AxisDimCell.curvature); present once curvature is computed */
  curvature?: number
  /** whether this tell reads primarily as a linear trend or a non-monotonic "both ways" bend */
  kind?: 'slope' | 'curve'
  text: string
}
export interface ArchetypeMatch { id: string; confidence: number; runnerUpId?: string }

/**
 * A secondary facet: the single-axis archetype that best explains a situation the primary archetype
 * doesn't cover. `strength` = the axis's strongest |slope| or |bend|; `fit` = how much of the user's
 * shape on that axis the facet explains (1 = exactly, 0 = no better than flat).
 */
export interface Facet {
  axisId: AxisId
  archetypeId: string
  strength: number
  fit: number
  /** every situation this facet explains — several for a blend (defaults to [axisId]) */
  axes?: AxisId[]
}

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
  /** strong shifts no type in the cast explains, as plain-language tells (absent on legacy caches) */
  unexplained?: Contingency[]
  /** the co-stars: every other cast member — layers on a situation, or blends across several (absent on legacy caches) */
  facets?: Facet[]
  /** per-axis unsettled/instability scores (used on parallel sharpen items only) */
  axisStability?: Record<AxisId, AxisStability>
  /** per-axis swing = strongest |slope| on the axis (the big-swing sharpen trigger) */
  axisSwing?: Record<AxisId, number>
}

export function isDependsAnswer(a: Answer): a is DependsAnswer {
  return a.mode === 'depends'
}
