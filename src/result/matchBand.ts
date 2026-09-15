/**
 * Qualitative read strength from the cast's confidence — the share of your shifting that your cast
 * (layers, combos and blends) explains × the share of situations you answered — friendlier than a %.
 *
 * Calibrated on 2,000-run quick-read sweeps per population (layered cast, 45 types):
 * - people shaped like one type (with answer noise): p25 0.70 · p50 0.86 · p75 0.94
 * - genuine blends (2–4 unrelated shifts):             p25 0.53 · p50 0.71 · p75 0.85
 * - random clickers:                                  p25 0.49 · p50 0.59 · p90 0.73
 * A quick read measures each behaviour once, so noise can't be told from complexity by consistency;
 * the bands keep "Clear read" rare for random clicking (~8%) while most coherent people reach it or
 * "Solid read". Re-sweep if content or cast rules change.
 */
export function matchBand(confidence: number): string {
  if (confidence >= 0.75) return 'Clear read'
  if (confidence >= 0.5) return 'Solid read'
  return 'Loose read'
}
