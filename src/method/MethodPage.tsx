import { useState } from 'react'
import { Link } from '../router/router'
import { Reveal } from '../ui/Reveal'
import { Mark } from '../ui/Mark'
import { SiteNav } from '../ui/SiteNav'
import { CONTENT } from '../content'
import { describeContingency, describeCurvature, rankWeight, CURVE_MEANINGFUL, computeCast } from '../engine'
import type { AxisId, DimId, Signature } from '../engine/types'
import { getArchetype, accentOf } from '../archetypes/archetypeMeta'
import { SignatureGem } from '../signature/SignatureGem'
import { shapeFromSlopes, type SignatureShape } from '../signature/shape'
import { btnGhost, btnPrimary, btnSmall, card, eyebrow, panel, ring, stamp, tag } from '../ui/styles'

const ACCENTS = ['#E4572E', '#3B5BDB', '#D63F8C', '#2B9348', '#E3A008', '#7048E8']

// ── The signature sculptor. Set a slope (and optional "both ways" bend) for each behaviour on each
// situation, plus a resting baseline lean — then watch the engine's OWN computeCast() name your
// headline type and co-stars, live. The grid feeds straight into computeCast as a synthetic Signature,
// so this is the real matcher run in reverse, in the browser. ──

type Cell = { slope: number; curve: number }
type Grid = Record<AxisId, Record<DimId, Cell>>

function emptyGrid(): Grid {
  const g: Grid = {}
  for (const a of CONTENT.axes) {
    g[a.id] = {}
    for (const d of CONTENT.dims) g[a.id][d.id] = { slope: 0, curve: 0 }
  }
  return g
}

// Seed on a recognisable shape (closeness → warmth/approach rise sharply) so the lab opens on a clear
// match — The Vault — rather than a blank, zero-confidence Constant.
function seedGrid(): Grid {
  const g = emptyGrid()
  g.closeness.warmth = { slope: 3, curve: 0 }
  g.closeness.approach = { slope: 3, curve: 0 }
  return g
}

/**
 * Reshape the slider grid into the engine's Signature. The per-level `value`s are irrelevant to the
 * match (distance reads slope/curvature; the confidence gate only counts `levels.length`), so we mark
 * an axis as "measured" — three levels — only once the user has touched any of its sliders. That makes
 * confidence honestly climb as more of the signature is sculpted, mirroring the result page.
 */
function buildSignature(grid: Grid): Signature {
  const sig: Signature = {}
  for (const a of CONTENT.axes) {
    sig[a.id] = {}
    const touched = CONTENT.dims.some(d => grid[a.id][d.id].slope !== 0 || grid[a.id][d.id].curve !== 0)
    const levels = touched ? [0, 0.5, 1].map(level => ({ level, value: 0 })) : []
    for (const d of CONTENT.dims) {
      const { slope, curve } = grid[a.id][d.id]
      sig[a.id][d.id] = { slope, curvature: curve, levels }
    }
  }
  return sig
}

/** The grid as the same gem geometry the result and archetype pages draw. */
function gridToShape(grid: Grid, baseline: Record<DimId, number>): SignatureShape {
  const cells: Record<AxisId, Record<DimId, { slope: number; curvature: number }>> = {}
  for (const a of CONTENT.axes) {
    cells[a.id] = {}
    for (const d of CONTENT.dims) cells[a.id][d.id] = { slope: grid[a.id][d.id].slope, curvature: grid[a.id][d.id].curve }
  }
  return shapeFromSlopes(cells, baseline)
}

const pill = (active: boolean) =>
  `rounded-full border-2 border-ink px-3 py-1.5 text-xs font-bold transition-colors ${ring} ${active ? 'bg-ink text-paper' : 'bg-white hover:bg-coral-soft'}`

/** The centrepiece: sculpt a signature, watch the engine name the nearest archetype live. */
function SignatureSculptor() {
  const [grid, setGrid] = useState<Grid>(seedGrid)
  const [baseline, setBaseline] = useState<Record<DimId, number>>({ warmth: 1 })
  const [axisId, setAxisId] = useState<AxisId>('closeness')

  const axis = CONTENT.axes.find(a => a.id === axisId)!
  const baseFull: Record<DimId, number> = {}
  for (const d of CONTENT.dims) baseFull[d.id] = baseline[d.id] ?? 0

  const cast = computeCast(buildSignature(grid), baseFull, CONTENT)
  const match = { id: cast.lead, confidence: cast.confidence, runnerUpId: cast.runnerUpId }
  const coStars = cast.members
    .filter(m => m.archetypeId !== cast.lead)
    .map(m => getArchetype(m.archetypeId))
    .filter((a): a is NonNullable<typeof a> => !!a)
  const matched = getArchetype(match.id)
  const accent = accentOf(match.id)
  const runner = match.runnerUpId ? getArchetype(match.runnerUpId) : undefined
  const shape = gridToShape(grid, baseFull)
  const pct = Math.round(match.confidence * 100)

  const setCell = (dimId: DimId, patch: Partial<Cell>) =>
    setGrid(prev => ({ ...prev, [axisId]: { ...prev[axisId], [dimId]: { ...prev[axisId][dimId], ...patch } } }))
  const setBase = (dimId: DimId, v: number) => setBaseline(prev => ({ ...prev, [dimId]: v }))

  const rnd = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
  const randomBaseline = () => {
    const b: Record<DimId, number> = {}
    for (const d of CONTENT.dims) if (Math.random() < 0.4) b[d.id] = rnd(-2, 2)
    return b
  }

  // Surprise me: scatter random slopes (and the odd bend) across the selected axis plus a light
  // resting lean — concentrated on one axis so it lands on a recognisable archetype, not mush.
  const randomizeAxis = () => {
    const g = emptyGrid()
    for (const d of CONTENT.dims) g[axisId][d.id] = { slope: rnd(-3, 3), curve: Math.random() < 0.2 ? rnd(-3, 3) : 0 }
    setGrid(g)
    setBaseline(randomBaseline())
  }

  // Full chaos: a random slope (and occasional bend) in every cell, across every situation. Usually
  // a tangled, low-confidence signature — handy for finding the cross-axis shape-shifter types.
  const randomizeAll = () => {
    const g = emptyGrid()
    for (const a of CONTENT.axes) {
      for (const d of CONTENT.dims) g[a.id][d.id] = { slope: rnd(-3, 3), curve: Math.random() < 0.15 ? rnd(-3, 3) : 0 }
    }
    setGrid(g)
    setBaseline(randomBaseline())
  }

  // Land a confident match (≥80%). Confidence = margin × sufficiency, so we lay down a random real
  // archetype's exact signature (big margin over the runner-up) and nudge every axis it doesn't
  // already cover so the evidence gate counts as fully measured (sufficiency → 1). Verified against
  // the real matcher, with a few retries as a safety net.
  const randomizeConfident = () => {
    const pool = CONTENT.archetypes.filter(a => a.id !== 'constant')
    let best: { g: Grid; b: Record<DimId, number>; conf: number } | null = null
    for (let attempt = 0; attempt < 40; attempt++) {
      const a = pool[Math.floor(Math.random() * pool.length)]
      const g = emptyGrid()
      for (const [ax, dims] of Object.entries(a.signature))
        for (const [dm, slope] of Object.entries(dims)) if (g[ax]?.[dm]) g[ax][dm].slope = slope
      for (const [ax, dims] of Object.entries(a.curve ?? {}))
        for (const [dm, curv] of Object.entries(dims)) if (g[ax]?.[dm]) g[ax][dm].curve = curv
      // Every axis needs a touched cell or it doesn't count toward sufficiency. Bias the nudge toward
      // a real "both ways" bend so confident matches actually exercise curvature — it barely dents the
      // margin (curvature is weighted modestly), so the match stays ≥80%.
      for (const ax of CONTENT.axes) {
        const touched = CONTENT.dims.some(d => g[ax.id][d.id].slope !== 0 || g[ax.id][d.id].curve !== 0)
        if (!touched) {
          const cell = g[ax.id][CONTENT.dims[rnd(0, CONTENT.dims.length - 1)].id]
          if (Math.random() < 0.6) cell.curve = (Math.random() < 0.5 ? -1 : 1) * rnd(1, 2)
          else cell.slope = Math.random() < 0.5 ? -1 : 1
        }
      }
      const b: Record<DimId, number> = { ...(a.baseline ?? {}) }
      const conf = computeCast(buildSignature(g), b, CONTENT).confidence
      if (!best || conf > best.conf) best = { g, b, conf }
      if (conf >= 0.8) break
    }
    if (best) { setGrid(best.g); setBaseline(best.b) }
  }

  return (
    <div className={`${card} flex flex-col gap-5 p-5 sm:p-6`}>
      <div className="flex flex-col gap-2.5">
        <span className={eyebrow}>Pick a situation</span>
        <div className="flex flex-wrap gap-2">
          {CONTENT.axes.map(a => (
            <button key={a.id} type="button" onClick={() => setAxisId(a.id)} aria-pressed={a.id === axisId} className={pill(a.id === axisId)}>
              {a.name}
            </button>
          ))}
        </div>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          As <span className="font-semibold text-ink">{axis.name.toLowerCase()}</span> rises ({axis.lowLabel} → {axis.highLabel}),
          set how each behaviour shifts. <span className="font-semibold text-ink">Slope</span> is the tilt;{' '}
          <span className="font-semibold text-ink">bend</span> is a “both ways” curve.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-3">
          {CONTENT.dims.map((d, i) => {
            const cell = grid[axisId][d.id]
            const accentI = ACCENTS[i % ACCENTS.length]
            const curvy = Math.abs(cell.curve) >= CURVE_MEANINGFUL && Math.abs(cell.curve) > Math.abs(cell.slope)
            const finding = curvy
              ? describeCurvature(axisId, d.id, cell.curve, CONTENT)
              : cell.slope !== 0 ? describeContingency(axisId, d.id, cell.slope, CONTENT) : null
            return (
              <div key={d.id} className={`${panel} flex flex-col gap-1.5 bg-paper p-3.5`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <span className="h-3 w-3 shrink-0 rounded-full border-2 border-ink" style={{ background: accentI }} />
                    {d.name}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-ink-soft">
                    slope {cell.slope >= 0 ? '+' : ''}{cell.slope}
                    {cell.curve !== 0 && <span className="text-ink"> · bend {cell.curve >= 0 ? '+' : ''}{cell.curve}</span>}
                  </span>
                </div>
                <input
                  type="range" min={-3} max={3} step={1} value={cell.slope}
                  onChange={e => setCell(d.id, { slope: Number(e.target.value) })}
                  aria-label={`${d.name} slope as ${axis.name} rises — from ${d.lowLabel} to ${d.highLabel}`}
                  className="w-full cursor-pointer" style={{ accentColor: accentI }}
                />
                <div className="flex justify-between text-xs text-ink-soft">
                  <span>{d.lowLabel}</span>
                  <span>{d.highLabel}</span>
                </div>
                <input
                  type="range" min={-3} max={3} step={1} value={cell.curve}
                  onChange={e => setCell(d.id, { curve: Number(e.target.value) })}
                  aria-label={`${d.name} bend (both-ways curve) as ${axis.name} rises`}
                  className="mt-1 h-1 w-full cursor-pointer opacity-80" style={{ accentColor: accentI }}
                />
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                  <span>inverted-U</span>
                  <span>bend</span>
                  <span>U</span>
                </div>
                {finding && <p className="mt-1 text-sm leading-relaxed">{finding}</p>}
              </div>
            )
          })}

          <div className={`${panel} flex flex-col gap-3 p-3.5`}>
            <div className="flex flex-col gap-0.5">
              <span className={eyebrow}>Resting lean</span>
              <span className="text-xs leading-relaxed text-ink-soft">
                Where you sit by default — before any situation moves you. It only tiebreaks borderline matches.
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {CONTENT.dims.map(d => (
                <div key={d.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{d.name}</span>
                    <span className="tabular-nums text-ink-soft">{(baseline[d.id] ?? 0) >= 0 ? '+' : ''}{baseline[d.id] ?? 0}</span>
                  </div>
                  <input
                    type="range" min={-2} max={2} step={1} value={baseline[d.id] ?? 0}
                    onChange={e => setBase(d.id, Number(e.target.value))}
                    aria-label={`Resting ${d.name} — from ${d.lowLabel} to ${d.highLabel}`}
                    className="w-full cursor-pointer" style={{ accentColor: '#151515' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className={`${card} overflow-hidden`}>
            <div aria-hidden="true" className="h-3 border-b-2 border-ink" style={{ background: accent }} />
            <div className="flex flex-col gap-3 p-5">
              <span className={eyebrow}>You built</span>
              {matched ? (
                <>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-serif text-3xl font-bold leading-tight tracking-tight">{matched.name}</h3>
                    <span className={stamp}>{matched.code}</span>
                  </div>
                  <p className="font-serif italic text-ink-soft">{matched.tagline}</p>
                  {coStars.length > 0 && (
                    <p className="text-sm">
                      <span className="italic text-ink-soft">with </span>
                      <span className="font-semibold">{coStars.map(a => a.name).join(' · ')}</span>
                    </p>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={eyebrow}>Confidence</span>
                      <span className="font-bold tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-white">
                      <div className="h-full transition-all" style={{ width: `${pct}%`, background: accent }} />
                    </div>
                    <span className="text-xs leading-relaxed text-ink-soft">
                      {runner ? <>…shading toward <span className="font-semibold text-ink">{runner.name}</span>. </> : null}
                      Touch more situations to measure more of the signature.
                    </span>
                  </div>
                  <Link to={`/archetypes/${match.id}`} className={`${btnGhost} mt-1`}>See the full archetype →</Link>
                </>
              ) : (
                <p className="text-sm text-ink-soft">No match.</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={randomizeAxis} className={btnSmall}>⚄ Randomize axis</button>
            <button type="button" onClick={randomizeAll} className={btnSmall}>⚅ Randomize all</button>
            <button type="button" onClick={randomizeConfident} className={`${btnSmall} bg-coral`}>✦ Confident match</button>
            <button type="button" onClick={() => { setGrid(emptyGrid()); setBaseline({}) }} className={`${btnGhost} text-xs`}>
              Clear all → The Constant
            </button>
          </div>
        </div>
      </div>

      <div className={`${panel} bg-paper p-4 sm:p-5`}>
        <SignatureGem shape={shape} accent={accent} label="The shape you built" axisId={axisId} onAxisChange={setAxisId} columns />
      </div>
    </div>
  )
}

/** Interactive: answer the cases in order and watch the weight each answer carries. */
function OrderDemo() {
  const CASES = ['with a close friend', 'with a coworker', 'with your boss']
  const [order, setOrder] = useState<string[]>(['with a close friend'])
  const tap = (c: string) => setOrder(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]))

  return (
    <div className={`${panel} p-5`}>
      <p className="text-[15px] leading-relaxed text-ink-soft">
        <span className="font-semibold text-ink">“When you disagree, how hard do you push back?”</span> Tap the cases
        in the order they’re most like you. The first one you answer counts most — weight is just{' '}
        <span className="font-bold text-ink">cases − position</span>.
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {CASES.map(c => {
          const i = order.indexOf(c)
          return (
            <li key={c}>
              <button
                type="button"
                onClick={() => tap(c)}
                aria-pressed={i >= 0}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 border-ink px-3 py-2.5 text-left text-[15px] font-medium transition-colors ${ring} ${i >= 0 ? 'bg-white' : 'bg-paper hover:bg-coral-soft'}`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink text-xs font-bold ${i >= 0 ? 'bg-ink text-paper' : 'bg-white'}`}>
                  {i >= 0 ? i + 1 : ''}
                </span>
                <span className="flex-1">{c}</span>
                {i >= 0 && <span className={`${tag} bg-coral-soft`}>×{rankWeight(i, CASES.length)}</span>}
              </button>
            </li>
          )
        })}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm leading-relaxed text-ink-soft">
          So the fitted line leans toward the situations that are most <em>you</em> — not a flat average of every box.
        </p>
        <button type="button" onClick={() => setOrder([])} className={`${btnGhost} shrink-0 text-xs`}>Reset</button>
      </div>
    </div>
  )
}

/** A small low→high track with a marker — one "dial" the test reads. */
function Dial({ low, high, accent, pos }: { low: string; high: string; accent: string; pos: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-3 w-full rounded-full border-2 border-ink bg-white">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pos * 100}%`, background: accent }} />
        <div className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink" style={{ left: `${pos * 100}%`, background: accent }} />
      </div>
      <div className="flex justify-between text-xs leading-tight text-ink-soft">
        <span>{low}</span>
        <span className="text-right">{high}</span>
      </div>
    </div>
  )
}

const STEPS = [
  { n: '1', title: 'You say “it depends.”', body: 'When no single answer is honest, the question splits into a few concrete situations — and you answer it once for each.' },
  { n: '2', title: 'You answer in order.', body: 'Start with the situation it’s most true for, then the next. The order you answer in decides how much each answer counts.' },
  { n: '3', title: 'We fit the slope.', body: 'Each answer is a point — how you act, plotted against how intense the situation is. We draw the line that best fits them. The tilt is the finding.' },
  { n: '4', title: 'Slopes become a signature.', body: 'Every slope and bend, across every situation, is your signature — an if-then map of how you move. Each situation you shift on gets its closest type; the one explaining the most of you leads.' },
]

const DETAILS = [
  { t: 'Why a slope, not a score', b: 'A score says “you’re a 6/10 on warmth.” A slope says “cool with strangers, warm with your people” — more accurate, and more useful. People aren’t their average.' },
  { t: 'Both ways, not just up or down', b: 'Not every pattern is a straight trend. You might be steady at the extremes but rattled in the middle — a real “it depends both ways.” Facets fits the bend too, so that gets named, not flattened to “no pattern.”' },
  { t: 'Baseline vs. slope', b: 'Two different reads. Your baseline is where you rest by default; your slope is how far a situation moves you from there. We report both — and lean on the slope when matching.' },
  { t: 'Flexibility', b: 'Average the size of all your slopes and you get flexibility: how much of a chameleon you are. Some barely move; some are a different person per room.' },
  { t: 'How we match you', b: 'Every situation you shift on is matched to the type that explains it best — and a blend can take several situations at once when it explains them as well. The type explaining the most of you is your headline; the rest are your co-stars.' },
  { t: 'How sure we are', b: 'Your read is how much of your shifting your cast actually explains, times how much of you we measured. Shifts no type explains — or too few answers — keep it honestly loose.' },
  { t: 'The adaptive deep-dive', b: 'If one situation swings you unusually hard, Facets quietly asks a few more questions on just that axis — to tell a rock-solid pattern from a genuine “both ways.”' },
  { t: 'Facets, not a box', b: 'Every situation you shift hard on gets its own facet — the type that best explains you there — so nobody is squeezed into one box, and a full code can read like VAULT · CLUTCH · FUMES · HOST.' },
  { t: 'The why behind the shift', b: 'Two people can pull back from strangers just as much — one to stay safe, one to save energy. After your biggest swings we ask what’s behind them. It never changes your archetype; it names what runs it.' },
  { t: 'Comparing two people', b: 'Send a friend your compare link. Once they finish, we line your signatures up cell by cell: where you shift the same way, where you pull opposite ways, and where one of you moves while the other doesn’t.' },
]

const h2 = 'mt-3 font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl'

export function MethodPage() {
  return (
    <div className="min-h-screen w-full">
      <SiteNav />

      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-12 sm:px-6 sm:pt-16">
        <Reveal><p className={eyebrow}>The method</p></Reveal>
        <Reveal delay={0.04}>
          <h1 className="mt-3 font-serif text-5xl font-bold leading-[1] tracking-tight sm:text-7xl">
            How Facets <Mark>measures you.</Mark>
          </h1>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Most tests ask what you’re like and sort you into a box. Facets measures something harder — and more
            true: <span className="font-semibold text-ink">how you change as the situation changes</span>, then reads the
            pattern. Here’s exactly how, with the real engine running underneath.
          </p>
        </Reveal>

        <section className="mt-16">
          <Reveal>
            <p className={eyebrow}>Try it</p>
            <h2 className={h2}>Sculpt a signature. Meet your archetype.</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
              This isn’t a mockup — it’s the engine’s own <span className="font-semibold text-ink">matcher run in reverse</span>.
              Set how each behaviour shifts as a situation rises (add a <span className="font-semibold text-ink">“both ways” bend</span> where
              one slope can’t tell the story), tune your resting lean, and watch the same code that writes your result name
              your cast — headline and co-stars — live.
            </p>
          </Reveal>
          <Reveal delay={0.08}><div className="mt-6"><SignatureSculptor /></div></Reveal>
        </section>

        <section className="mt-20">
          <Reveal>
            <p className={eyebrow}>The technique, end to end</p>
            <h2 className={h2}>Four steps, every question.</h2>
          </Reveal>
          <div className="mt-8 flex flex-col gap-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={0.04 * i}>
                <div className={`${panel} flex gap-5 p-5`}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-coral font-serif text-xl font-bold">{s.n}</span>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-serif text-xl font-bold">{s.title}</h3>
                    <p className="text-[15px] leading-relaxed text-ink-soft">{s.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <Reveal>
            <p className={eyebrow}>Step 2, up close</p>
            <h2 className={h2}>The order is the weight.</h2>
          </Reveal>
          <Reveal delay={0.08}><div className="mt-6"><OrderDemo /></div></Reveal>
        </section>

        <section className="mt-20 grid gap-10 sm:grid-cols-2">
          <Reveal>
            <div className="flex flex-col gap-5">
              <div>
                <p className={eyebrow}>What we turn up</p>
                <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight sm:text-3xl">Six situations</h2>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">The dials a moment can climb. We watch what each does to you.</p>
              </div>
              <div className="flex flex-col gap-4">
                {CONTENT.axes.map((a, i) => (
                  <div key={a.id} className="flex flex-col gap-1.5">
                    <span className="text-sm font-bold">{a.name}</span>
                    <Dial low={a.lowLabel} high={a.highLabel} accent={ACCENTS[i % ACCENTS.length]} pos={0.5 + 0.18 * Math.sin(i * 1.3)} />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="flex flex-col gap-5">
              <div>
                <p className={eyebrow}>What moves</p>
                <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight sm:text-3xl">Six behaviours</h2>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">The ways you can shift as a situation rises or falls.</p>
              </div>
              <div className="flex flex-col gap-4">
                {CONTENT.dims.map((d, i) => (
                  <div key={d.id} className="flex flex-col gap-1.5">
                    <span className="text-sm font-bold">{d.name}</span>
                    <Dial low={d.lowLabel} high={d.highLabel} accent={ACCENTS[(i + 3) % ACCENTS.length]} pos={0.5 - 0.18 * Math.sin(i * 1.1)} />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <section className="mt-20">
          <Reveal>
            <p className={eyebrow}>The fine print</p>
            <h2 className={h2}>From a grid of slopes to a person.</h2>
          </Reveal>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {DETAILS.map((c, i) => (
              <Reveal key={c.t} delay={0.03 * i}>
                <div className={`${panel} flex h-full flex-col gap-1.5 p-5`}>
                  <h3 className="font-serif text-lg font-bold">{c.t}</h3>
                  <p className="text-[15px] leading-relaxed text-ink-soft">{c.b}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.08}>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
              And it all runs in your browser — no email, no signup, your answers never leave your device. Curious what
              all the shapes look like? Browse the <Link to="/archetypes" className={btnGhost}>field guide</Link>.
            </p>
          </Reveal>
        </section>

        <section className="mt-20">
          <Reveal>
            <div className="flex flex-col items-center gap-5 rounded-card border-2 border-ink bg-ink px-6 py-14 text-center text-paper">
              <h2 className="font-serif text-4xl font-bold leading-tight tracking-tight">See your own slopes.</h2>
              <p className="max-w-md text-[15px] leading-relaxed text-paper/75">
                Seven minutes, and your full signature is yours — no email, no signup, no catch.
              </p>
              <Link to="/" className={`${btnPrimary} mt-1 shadow-none`}>Take the test →</Link>
            </div>
          </Reveal>
        </section>
      </main>
    </div>
  )
}
