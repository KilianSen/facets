export * from './types'
export { extractRules, rankWeight } from './rules'
export { computeSignature, weightedSlope } from './signature'
export { matchArchetype, signatureDistance, curvatureDistance, CURVE_WEIGHT } from './match'
export { computeProfile, describeContingency, describeCurvature, CURVE_MEANINGFUL } from './scoring'
export {
  axisStability, axisSwing, sharpenVerdict, sharpenConfident, sharpenReadout,
  SWING_THRESHOLD, MIXED_BAND, SHARPEN_MIN, SHARPEN_CAP, CONFIDENT_MARGIN, SHARPEN_REPRODUCE,
} from './stability'
export type { SharpenReadout } from './stability'
export { computeFacets, facetCode, axesOf, axisStrength, FACET_MIN_STRENGTH, FACET_MIN_FIT, MAX_FACETS } from './facets'
export { motiveAxes, motiveReadout, motiveQuestionId, strongestTell, MOTIVE_MIN_STRENGTH, MAX_MOTIVE_AXES } from './motives'
export type { MotiveRead, MotiveReadout } from './motives'
export { compareProfiles, syncBand, COMPARE_MEANINGFUL, COMPARE_STRONG, COMPARE_FLAT } from './compare'
export type { Comparison, CompareRow, BlindSpot, ShiftKind } from './compare'
