/**
 * Feasibility probe: if we ADD replication (>=2 backbone questions per axis measuring the SAME
 * dim at the SAME levels), does a WITHIN-LEVEL variance metric separate a consistent answerer
 * from a random one? This is the precondition for "make 'unsettled' measurable" — it tests the
 * metric+replication concept on a synthetic axis, independent of the current (disjoint) content.
 * Run: npx tsx scripts/feasibility-stability.ts
 */

// within-level instability: for each axis-level with >=2 points, weighted stdev of y; aggregate, /4.
function withinLevelInstability(points: { x: number; y: number; w: number }[]): number {
  const byLevel = new Map<number, { y: number; w: number }[]>()
  for (const p of points) { (byLevel.get(p.x) ?? byLevel.set(p.x, []).get(p.x)!).push(p) }
  let acc = 0, wsum = 0
  for (const pts of byLevel.values()) {
    if (pts.length < 2) continue
    const W = pts.reduce((s, p) => s + p.w, 0)
    const mean = pts.reduce((s, p) => s + p.w * p.y, 0) / W
    const varr = pts.reduce((s, p) => s + p.w * (p.y - mean) ** 2, 0) / W
    acc += Math.sqrt(varr) * W; wsum += W
  }
  return wsum > 0 ? (acc / wsum) / 4 : NaN
}

// Synthetic axis: K questions, each with 3 cases at levels {1, 0.5, 0} and 3 options whose
// `warmth` is ~{+2, 0, -2} with small per-question jitter (realistic heterogeneity).
const LEVELS = [1, 0.5, 0]
function makeQuestion(seed: number) {
  const j = () => (Math.random() - 0.5) * 0.6 // ±0.3 jitter
  return { options: [2 + j(), 0 + j(), -2 + j()] } // option warmth values
}
function consistentPick(target: number, opts: number[]): number {
  // a coherent person picks the option closest to their true behaviour at this level
  let best = opts[0]; for (const o of opts) if (Math.abs(o - target) < Math.abs(best - target)) best = o
  return best
}
function randomPick(opts: number[]): number { return opts[Math.floor(Math.random() * opts.length)] }

const pct = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))] }
const f = (x: number) => x.toFixed(3)

for (const K of [2, 3, 4]) {
  const consistent: number[] = [], random: number[] = []
  for (let t = 0; t < 2000; t++) {
    const qs = Array.from({ length: K }, (_, i) => makeQuestion(i))
    // consistent user: a monotone warmth-by-level target (slope drawn per user)
    const slope = (Math.random() * 2 - 1) * 4
    const cPts: { x: number; y: number; w: number }[] = []
    const rPts: { x: number; y: number; w: number }[] = []
    for (const q of qs) for (const x of LEVELS) {
      cPts.push({ x, y: consistentPick(slope * (x - 0.5), q.options), w: 1 })
      rPts.push({ x, y: randomPick(q.options), w: 1 })
    }
    consistent.push(withinLevelInstability(cPts))
    random.push(withinLevelInstability(rPts))
  }
  const t = (pct(consistent, .9) + pct(random, .1)) / 2
  const fp = consistent.filter(x => x >= t).length / consistent.length
  const tp = random.filter(x => x >= t).length / random.length
  console.log(`K=${K} backbone/axis:  consistent p50/p90 = ${f(pct(consistent, .5))}/${f(pct(consistent, .9))}   random p10/p50 = ${f(pct(random, .1))}/${f(pct(random, .5))}   thr~${f(t)} -> false ${(fp * 100).toFixed(0)}% / true ${(tp * 100).toFixed(0)}%`)
}
