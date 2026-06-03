export * from './types'
export { extractRules, rankWeight } from './rules'
export { computeSignature, weightedSlope } from './signature'
export { matchArchetype, signatureDistance } from './match'
export { computeProfile, describeContingency } from './scoring'
export {
  axisStability, axisSwing, sharpenVerdict, sharpenConfident, sharpenReadout,
  SWING_THRESHOLD, MIXED_BAND, SHARPEN_MIN, SHARPEN_CAP, CONFIDENT_MARGIN, SHARPEN_REPRODUCE,
} from './stability'
export type { SharpenReadout } from './stability'
