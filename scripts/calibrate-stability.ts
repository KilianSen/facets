/**
 * Calibration for the hybrid adaptive-depth feature.
 *  (A) BIG-SWING TRIGGER: sweep per-axis axisSwing (max |slope|) over synthetic base runs — pick a
 *      threshold that fires on a MINORITY (strong-swing axes), not everyone.
 *  (B) VERDICT BAND: on a synthetic PARALLEL set (comparable options), axisStability separates a
 *      consistent answerer from a mixed one — pick the solid/mixed cutoff.
 * Run: npx tsx scripts/calibrate-stability.ts
 */
import { CONTENT } from '../src/content'
import { axisSwing, axisStability, extractRules, computeProfile } from '../src/engine'
import type { Answer, Question, DimId } from '../src/engine/types'

const DIMS = CONTENT.dims.map(d => d.id)
const pct = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN }
const f = (x: number) => Number.isFinite(x) ? x.toFixed(2) : ' — '

// An answerer aligned to a random behaviour-by-level direction (produces a genuine contingency).
function aligned(q: Question, dir: Record<DimId, number>, strength: number): Answer {
  const mapping: Record<string, string> = {}
  for (const c of q.cases!) {
    const target: Record<DimId, number> = {}
    for (const d of DIMS) target[d] = (dir[d] ?? 0) * (c.axisLevel - 0.5) * 4 * strength
    let best = q.options[0], bd = Infinity
    for (const o of q.options) { let dd = 0; for (const k of DIMS) dd += ((o.vector[k] ?? 0) - target[k]) ** 2; if (dd < bd) { bd = dd; best = o } }
    mapping[c.id] = best.id
  }
  return { questionId: q.id, mode: 'depends', ranking: q.cases!.map(c => c.id), mapping }
}
function randomAns(q: Question): Answer {
  const mapping: Record<string, string> = {}
  for (const c of q.cases!) mapping[c.id] = q.options[Math.floor(Math.random() * q.options.length)].id
  return { questionId: q.id, mode: 'depends', ranking: q.cases!.map(c => c.id), mapping }
}

// ---- (A) big-swing trigger distribution over base runs (backbone answered as depends) ----
const backbone = CONTENT.questions.filter(q => q.kind === 'backbone')
const swings: number[] = []
let strongCount = 0, total = 0
for (let i = 0; i < 3000; i++) {
  const strength = 0.4 + Math.random() * 0.8 // varied conviction
  const dir: Record<DimId, number> = {}; for (const d of DIMS) dir[d] = Math.random() * 2 - 1
  const ans = backbone.map(q => (Math.random() < 0.7 ? aligned(q, dir, strength) : randomAns(q)))
  const sw = computeProfile(ans, CONTENT).axisSwing!
  for (const axis of CONTENT.axes) { swings.push(sw[axis.id]); total++ }
}
console.log('=== (A) BIG-SWING trigger: per-axis max|slope| distribution over base runs ===')
console.log(`p25=${f(pct(swings, .25))}  p50=${f(pct(swings, .5))}  p75=${f(pct(swings, .75))}  p90=${f(pct(swings, .9))}  max=${f(Math.max(...swings))}`)
for (const thr of [2.0, 2.5, 3.0, 3.5]) {
  const fires = swings.filter(x => x >= thr).length / swings.length
  console.log(`  threshold ${thr.toFixed(1)} -> fires on ${(fires * 100).toFixed(0)}% of axes`)
}

// ---- (B) verdict band on a synthetic PARALLEL set (comparable warm/neutral/cold options) ----
const opt = (w: number) => ({ id: `o${w}`, label: 'x', vector: { warmth: w, approach: w } })
const pq = (id: string) => ({ id, kind: 'backbone' as const, axis: 'closeness', prompt: 'p',
  cases: [{ id: `${id}a`, label: 'a', axisLevel: 1 }, { id: `${id}b`, label: 'b', axisLevel: 0.5 }, { id: `${id}c`, label: 'c', axisLevel: 0 }],
  options: [opt(2 + (Math.random() - .5) * .6), opt(0 + (Math.random() - .5) * .6), opt(-2 + (Math.random() - .5) * .6)] })
const pcontent = { axes: [{ id: 'closeness', name: 'C', lowLabel: 'x', highLabel: 'y' }], dims: CONTENT.dims, archetypes: [], questions: [] as Question[] }
const consistentV: number[] = [], mixedV: number[] = []
for (let i = 0; i < 2000; i++) {
  const qs = [pq('p1'), pq('p2'), pq('p3')]
  pcontent.questions = qs
  const dir: Record<DimId, number> = { warmth: Math.random() * 2 - 1, approach: Math.random() * 2 - 1 }
  consistentV.push(axisStability(extractRules(qs.map(q => aligned(q, dir, 1)), pcontent), pcontent).closeness.instability)
  mixedV.push(axisStability(extractRules(qs.map(randomAns), pcontent), pcontent).closeness.instability)
}
console.log('\n=== (B) VERDICT band: axisStability on a 3-item PARALLEL set ===')
console.log(`consistent p50/p90 = ${f(pct(consistentV, .5))}/${f(pct(consistentV, .9))}   mixed p10/p50 = ${f(pct(mixedV, .1))}/${f(pct(mixedV, .5))}`)
const band = (pct(consistentV, .9) + pct(mixedV, .1)) / 2
console.log(`MIXED_BAND ~= ${f(band)}  ->  consistent calls "mixed" ${(consistentV.filter(x => x >= band).length / consistentV.length * 100).toFixed(0)}%, mixed calls "mixed" ${(mixedV.filter(x => x >= band).length / mixedV.length * 100).toFixed(0)}%`)

// ---- (C) GATE: simulate the ADAPTIVE loop on the AUTHORED reserve set via the real sharpenReadout ----
// Proves the hand-written parallel items drive the production verdict correctly: a consistent shifter
// ends "solid"; a noisy one ends "mixed"; and — the bug the review caught — a FLAT answerer (always
// the same option, no real shift) reads "mixed", not a bogus "rock-solid", and an all-neutral answerer
// gets NO verdict at all (no evidence). Uses the same sharpenReadout/sharpenConfident the app uses.
import { SHARPEN_MIN, SHARPEN_CAP, SHARPEN_REPRODUCE, sharpenReadout, sharpenConfident } from '../src/engine'

function flatAns(q: Question, optId: string): Answer {
  return { questionId: q.id, mode: 'depends', ranking: q.cases!.map(c => c.id), mapping: Object.fromEntries(q.cases!.map(c => [c.id, optId])) }
}
// A genuine consistent shifter on THIS axis: high → the bold option (A), low → reserved (C), mid → neutral
// (B). This is the population that actually reaches the sharpen round (they swung hard on the axis).
function consistentAns(q: Question, sign: number): Answer {
  const mapping: Record<string, string> = {}
  for (const c of q.cases!) {
    const want = sign * (c.axisLevel - 0.5)
    mapping[c.id] = want > 0.01 ? 'A' : want < -0.01 ? 'C' : 'B'
  }
  return { questionId: q.id, mode: 'depends', ranking: q.cases!.map(c => c.id), mapping }
}
// Run the production loop over a cohort's answer set; return [verdict|'none', itemsUsed].
function runLoop(items: Answer[], axisId: string): [string, number] {
  for (let k = SHARPEN_MIN; k <= SHARPEN_CAP; k++) {
    const r = sharpenReadout(items.slice(0, k), CONTENT).find(x => x.axisId === axisId)
    const confident = r ? sharpenConfident(r.instability, r.n) : true
    if (confident || k === SHARPEN_CAP) return [r ? r.verdict : 'none', k]
  }
  return ['none', SHARPEN_CAP]
}

console.log(`\n=== (C) AUTHORED reserve gate: real verdict via sharpenReadout (REPRODUCE=${SHARPEN_REPRODUCE}) ===`)
const tally = { consSolid: 0, mixMixed: 0, flatASolid: 0, flatBNone: 0, n: 0 }
for (const axis of CONTENT.axes) {
  const reserve = CONTENT.questions.filter(q => q.reserve && q.axis === axis.id).slice(0, SHARPEN_CAP)
  if (reserve.length < SHARPEN_CAP) continue
  for (let i = 0; i < 2000; i++) {
    const sign = Math.random() < 0.5 ? 1 : -1
    if (runLoop(reserve.map(q => consistentAns(q, sign)), axis.id)[0] === 'solid') tally.consSolid++
    if (runLoop(reserve.map(randomAns), axis.id)[0] === 'mixed') tally.mixMixed++
    if (runLoop(reserve.map(q => flatAns(q, 'A')), axis.id)[0] === 'solid') tally.flatASolid++ // bug if >0
    if (runLoop(reserve.map(q => flatAns(q, 'B')), axis.id)[0] === 'none') tally.flatBNone++   // all-neutral → no verdict
    tally.n++
  }
}
const pc = (x: number) => (x / tally.n * 100).toFixed(1)
console.log(`consistent shifter → solid : ${pc(tally.consSolid)}%   (want ~100)`)
console.log(`noisy / random     → mixed : ${pc(tally.mixMixed)}%   (want high)`)
console.log(`FLAT (all-A, no shift) wrongly "solid" : ${pc(tally.flatASolid)}%   (want 0)`)
console.log(`all-neutral (all-B) correctly NO verdict: ${pc(tally.flatBNone)}%   (want ~100)`)
