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
export {
  computeCast, castFacets, facetCode, axesOf, axisStrength, axisResidual,
  CAST_MIN_STRENGTH, CAST_MIN_FIT, BLEND_PARSIMONY, LAYER_MIN_GAIN, LAYER_MIN_SHARE, MAX_LAYERS, UNEXPLAINED_MIN,
} from './cast'
export type { Cast, CastMember, Leftover } from './cast'
export { unexplainedTells } from './scoring'
export { motiveAxes, motiveReadout, motiveQuestionId, strongestTell, MOTIVE_MIN_STRENGTH, MAX_MOTIVE_AXES } from './motives'
export type { MotiveRead, MotiveReadout } from './motives'
export { compareProfiles, syncBand, COMPARE_MEANINGFUL, COMPARE_STRONG, COMPARE_FLAT } from './compare'
export type { Comparison, CompareRow, BlindSpot, ShiftKind } from './compare'
export { synthesizeInterplay } from './interplay'
export type { InterplayInsight } from './interplay'
export { computeSettingOffsets } from './settings'
export type { SettingOffsetReport, SettingOffsets } from './settings'
export { selectObserverQuestions, computeObserverReport } from './observer'
export { thinCells, pickFirmUpQuestions, asRanked, FIRM_UP_MIN, FIRM_UP_CAP } from './firmUp'
export {
  rivalsOf, pickDuelQuestions, pickLifeQuestions, pickCollideDilemmas, headToHead,
  DUEL_CAP, DUEL_RIVALS, LIFE_STEADY_AXES, LIFE_PER_AXIS, LIFE_STORY_ITEMS, LIFE_SWING, COLLIDE_SWING, COLLIDE_MAX,
} from './deepDive'
export type { HeadToHeadEntry } from './deepDive'
export type { ObserverGapItem, ObserverReport } from './observer'
