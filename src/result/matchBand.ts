/** Qualitative match strength from the [0,1] confidence — friendlier than a raw percentage. */
export function matchBand(confidence: number): string {
  if (confidence >= 0.55) return 'Strong match'
  if (confidence >= 0.3) return 'Solid match'
  return 'Slight lean'
}
