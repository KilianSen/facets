/**
 * Qualitative match strength from the [0,1] confidence — friendlier than a raw percentage.
 *
 * Calibrated to the distribution the engine actually produces: a COMPLETED run answers all 6
 * axes (sufficiency ≈ 1) and the 20 archetypes are densely packed, so margin sits just above
 * 0.5 — real confidences cluster in ~[0.50, 0.63]. Thresholds are set so a finished run never
 * reads as a deflating "Slight lean" (that floor is reserved for partial/abandoned runs that
 * never reach the result page), and clearer matches earn "Strong match".
 * (Split ratio is a calibration knob — revisit with a computeProfile sweep if content changes.)
 */
export function matchBand(confidence: number): string {
  if (confidence >= 0.53) return 'Strong match'
  if (confidence >= 0.49) return 'Solid match'
  return 'Slight lean'
}
