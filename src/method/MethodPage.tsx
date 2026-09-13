import { useState } from 'react'
import { Link } from '../router/router'
import { Reveal } from '../ui/Reveal'
import { Beam } from '../ui/Beam'
import { CONTENT } from '../content'
import { describeContingency, describeCurvature, rankWeight, CURVE_MEANINGFUL, matchArchetype } from '../engine'
import type { AxisId, DimId, Signature, Archetype } from '../engine/types'
import { getArchetype, accentOf } from '../archetypes/archetypeMeta'
import { Fingerprint, shiftsOf } from '../archetypes/Fingerprint'

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'

const ACCENTS = ['#22d3ee', '#818cf8', '#d946ef', '#67e8f9', '#a78bfa', '#f472b6']

// ── The signature sculptor. Set a slope (and optional "both ways" bend) for each behaviour on each
// situation, plus a resting baseline lean — then watch the engine's OWN matchArchetype() name the
// nearest archetype, live. The grid feeds straight into matchArchetype as a synthetic Signature, so
// this is the real matcher run in reverse, in the browser. ──

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

/** Turn the grid into the Shift[] the Fingerprint draws, via the same shiftsOf the archetype pages use. */
function gridToShifts(grid: Grid) {
  const signature: Record<string, Record<string, number>> = {}
  const curve: Record<string, Record<string, number>> = {}
  for (const a of CONTENT.axes) {
    for (const d of CONTENT.dims) {
      const c = grid[a.id][d.id]
      if (c.slope) (signature[a.id] ??= {})[d.id] = c.slope
      if (c.curve) (curve[a.id] ??= {})[d.id] = c.curve
    }
  }
  const pseudo: Archetype = { id: '', code: '', name: '', tagline: '', copy: '', signature, curve }
  return shiftsOf(pseudo)
}

/** The centrepiece: sculpt a signature, watch the engine name the nearest archetype live. */
function SignatureSculptor() {
  const [grid, setGrid] = useState<Grid>(seedGrid)
  const [baseline, setBaseline] = useState<Record<DimId, number>>({ warmth: 1 })
  const [axisId, setAxisId] = useState<AxisId>('closeness')

  const axis = CONTENT.axes.find(a => a.id === axisId)!
  const baseFull: Record<DimId, number> = {}
  for (const d of CONTENT.dims) baseFull[d.id] = baseline[d.id] ?? 0

  const match = matchArchetype(buildSignature(grid), baseFull, CONTENT)
  const matched = getArchetype(match.id)
  const accent = accentOf(match.id)
  const runner = match.runnerUpId ? getArchetype(match.runnerUpId) : undefined
  const shifts = gridToShifts(grid)
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
    for (const d of CONTENT.dims) {
      g[axisId][d.id] = { slope: rnd(-3, 3), curve: Math.random() < 0.2 ? rnd(-3, 3) : 0 }
    }
    setGrid(g)
    setBaseline(randomBaseline())
  }

  // Full chaos: a random slope (and occasional bend) in every cell, across every situation. Usually
  // a tangled, low-confidence signature — handy for finding the cross-axis shape-shifter types.
  const randomizeAll = () => {
    const g = emptyGrid()
    for (const a of CONTENT.axes) {
      for (const d of CONTENT.dims) {
        g[a.id][d.id] = { slope: rnd(-3, 3), curve: Math.random() < 0.15 ? rnd(-3, 3) : 0 }
      }
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
      // margin (curvature is weighted 0.2), so the match stays ≥80%.
      for (const ax of CONTENT.axes) {
        const touched = CONTENT.dims.some(d => g[ax.id][d.id].slope !== 0 || g[ax.id][d.id].curve !== 0)
        if (!touched) {
          const cell = g[ax.id][CONTENT.dims[rnd(0, CONTENT.dims.length - 1)].id]
          if (Math.random() < 0.6) cell.curve = (Math.random() < 0.5 ? -1 : 1) * rnd(1, 2)
          else cell.slope = Math.random() < 0.5 ? -1 : 1
        }
      }
      const b: Record<DimId, number> = { ...(a.baseline ?? {}) }
      const conf = matchArchetype(buildSignature(g), b, CONTENT).confidence
      if (!best || conf > best.conf) best = { g, b, conf }
      if (conf >= 0.8) break
    }
    if (best) { setGrid(best.g); setBaseline(best.b) }
  }

  return (
    <Beam glow innerClassName="bg-gradient-to-br from-accent/10 via-transparent to-fuchsia-500/10">
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        {/* axis selector */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs uppercase tracking-[0.2em] text-white/40">Pick a situation</span>
          <div className="flex flex-wrap gap-2">
            {CONTENT.axes.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAxisId(a.id)}
                aria-pressed={a.id === axisId}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${ring} ${
                  a.id === axisId
                    ? 'border-accent/50 bg-accent/15 text-accent-soft'
                    : 'border-white/10 bg-white/[0.03] text-white/55 hover:text-white/80'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-white/70">
            As <span className="text-white">{axis.name.toLowerCase()}</span> rises{' '}
            <span className="text-white/55">({axis.lowLabel} → {axis.highLabel})</span>, set how each
            behaviour shifts. <span className="text-white/55">Slope</span> is the tilt;{' '}
            <span className="text-white/55">bend</span> is a “both ways” curve.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* controls */}
          <div className="flex flex-col gap-4">
            {CONTENT.dims.map((d, i) => {
              const cell = grid[axisId][d.id]
              const accentI = ACCENTS[i % ACCENTS.length]
              const curvy = Math.abs(cell.curve) >= CURVE_MEANINGFUL && Math.abs(cell.curve) > Math.abs(cell.slope)
              const finding = curvy
                ? describeCurvature(axisId, d.id, cell.curve, CONTENT)
                : cell.slope !== 0
                  ? describeContingency(axisId, d.id, cell.slope, CONTENT)
                  : null
              return (
                <div key={d.id} className="flex flex-col gap-1.5 rounded-beam border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-white/90">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: accentI }} />
                      {d.name}
                    </span>
                    <span className="font-mono text-[11px] text-white/45">
                      slope {cell.slope >= 0 ? '+' : ''}{cell.slope}
                      {cell.curve !== 0 && <span className="text-accent-soft"> · bend {cell.curve >= 0 ? '+' : ''}{cell.curve}</span>}
                    </span>
                  </div>
                  <input
                    type="range" min={-3} max={3} step={1} value={cell.slope}
                    onChange={e => setCell(d.id, { slope: Number(e.target.value) })}
                    aria-label={`${d.name} slope as ${axis.name} rises — from ${d.lowLabel} to ${d.highLabel}`}
                    className="w-full cursor-pointer" style={{ accentColor: accentI }}
                  />
                  <div className="flex justify-between text-[11px] text-white/40">
                    <span>{d.lowLabel}</span>
                    <span>{d.highLabel}</span>
                  </div>
                  <input
                    type="range" min={-3} max={3} step={1} value={cell.curve}
                    onChange={e => setCell(d.id, { curve: Number(e.target.value) })}
                    aria-label={`${d.name} bend (both-ways curve) as ${axis.name} rises`}
                    className="mt-1 h-1 w-full cursor-pointer opacity-70" style={{ accentColor: accentI }}
                  />
                  <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/30">
                    <span>inverted-U</span>
                    <span>bend</span>
                    <span>U</span>
                  </div>
                  {finding && <p className="mt-1 text-xs leading-relaxed text-white/55">{finding}</p>}
                </div>
              )
            })}

            {/* baseline strip */}
            <div className="flex flex-col gap-3 rounded-beam border border-white/10 bg-white/[0.02] p-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs uppercase tracking-[0.2em] text-accent-soft/60">Resting lean</span>
                <span className="text-[11px] leading-relaxed text-white/45">
                  Where you sit by default — before any situation moves you. It only tiebreaks borderline matches.
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {CONTENT.dims.map(d => (
                  <div key={d.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/70">{d.name}</span>
                      <span className="font-mono text-white/40">{(baseline[d.id] ?? 0) >= 0 ? '+' : ''}{baseline[d.id] ?? 0}</span>
                    </div>
                    <input
                      type="range" min={-2} max={2} step={1} value={baseline[d.id] ?? 0}
                      onChange={e => setBase(d.id, Number(e.target.value))}
                      aria-label={`Resting ${d.name} — from ${d.lowLabel} to ${d.highLabel}`}
                      className="w-full cursor-pointer accent-white/60"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* live result */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-col gap-3 rounded-beam border p-5" style={{ borderColor: `${accent}40`, background: `${accent}0d` }}>
              <span className="text-xs uppercase tracking-[0.2em] text-white/40">You built</span>
              {matched ? (
                <>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-2xl font-semibold leading-tight" style={{ color: accent }}>{matched.name}</h3>
                    <span className="rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider" style={{ background: `${accent}22`, color: accent }}>{matched.code}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-white/65">{matched.tagline}</p>

                  <div className="h-28 w-full">
                    <Fingerprint shifts={shifts} baseline={baseFull} accent={accent} variant="full" uid="sculptor" />
                  </div>

                  {/* confidence */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="uppercase tracking-wider text-white/40">Confidence</span>
                      <span className="font-mono text-white/70">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: accent }} />
                    </div>
                    <span className="text-[11px] leading-relaxed text-white/40">
                      {runner ? <>…shading toward <span className="text-white/60">{runner.name}</span>. </> : null}
                      Touch more situations to measure more of the signature.
                    </span>
                  </div>

                  <Link
                    to={`/archetypes/${match.id}`}
                    className={`mt-1 inline-flex items-center gap-1 rounded text-sm font-medium underline-offset-4 hover:underline ${ring}`}
                    style={{ color: accent }}
                  >
                    See the full archetype <span aria-hidden="true">→</span>
                  </Link>
                </>
              ) : (
                <p className="text-sm text-white/60">No match.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={randomizeAxis}
                className={`rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-soft transition-colors hover:bg-accent/20 ${ring}`}
              >
                <span aria-hidden="true">⚄</span> Randomize axis
              </button>
              <button
                type="button"
                onClick={randomizeAll}
                className={`rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-soft transition-colors hover:bg-accent/20 ${ring}`}
              >
                <span aria-hidden="true">⚅</span> Randomize all
              </button>
              <button
                type="button"
                onClick={randomizeConfident}
                className={`rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-soft transition-colors hover:bg-accent/20 ${ring}`}
              >
                <span aria-hidden="true">✦</span> Confident match
              </button>
              <button
                type="button"
                onClick={() => { setGrid(emptyGrid()); setBaseline({}) }}
                className={`rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/55 transition-colors hover:text-white/80 ${ring}`}
              >
                Clear all → The Constant
              </button>
            </div>
          </div>
        </div>
      </div>
    </Beam>
  )
}

/** Interactive: reorder the cases and watch the weight each answer carries. */
function RankingDemo() {
  const [order, setOrder] = useState(['with a close friend', 'with a coworker', 'with your boss'])
  const total = order.length
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= order.length) return
    setOrder(prev => {
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }
  return (
    <div className="rounded-beam border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm leading-relaxed text-white/70">
        <span className="text-white">“When you disagree, how hard do you push back?”</span> Rank the
        cases from most to least like you. Your top case counts most — weight is just{' '}
        <span className="font-mono text-white/85">cases − position</span>.
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {order.map((ctx, i) => {
          const weight = rankWeight(i, total)
          return (
            <li key={ctx} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <span className="font-mono text-xs text-white/40">#{i + 1}</span>
              <span className="flex-1 text-sm text-white/85">{ctx}</span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[11px] text-accent-soft">×{weight}</span>
              <div className="flex flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                  aria-label={`Move ${ctx} up`}
                  className={`px-1 text-xs text-white/50 transition-colors hover:text-white disabled:opacity-20 ${ring}`}>▲</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1}
                  aria-label={`Move ${ctx} down`}
                  className={`px-1 text-xs text-white/50 transition-colors hover:text-white disabled:opacity-20 ${ring}`}>▼</button>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-white/45">
        So the fitted line leans toward the situations that are most <em>you</em> — not a flat average of
        every box.
      </p>
    </div>
  )
}

/** A small low→high track with a glowing marker — one "dial" the test reads. */
function Dial({ low, high, accent, pos }: { low: string; high: string; accent: string; pos: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-1.5 w-full rounded-full bg-white/10">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pos * 100}%`, background: `linear-gradient(90deg, ${accent}22, ${accent})` }} />
        <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${pos * 100}%`, background: accent, boxShadow: `0 0 10px ${accent}` }} />
      </div>
      <div className="flex justify-between text-[11px] leading-tight text-white/45">
        <span>{low}</span>
        <span className="text-right">{high}</span>
      </div>
    </div>
  )
}

const STEPS = [
  { n: '01', title: 'You say “it depends.”', body: 'When no single answer is honest, the question splits into a few concrete situations — and you answer it once for each.' },
  { n: '02', title: 'You rank and map.', body: 'Order the situations from most to least like you, then pick what you’d actually do in each. Your ranking decides how much each answer counts.' },
  { n: '03', title: 'We fit the slope.', body: 'Each answer is a point — how you act, plotted against how intense the situation is. We draw the line that best fits them. The tilt is the finding.' },
  { n: '04', title: 'Slopes become a signature.', body: 'Every slope and bend, across every situation, is your signature — an if-then map of how you move. We match it to the closest of twenty-two archetypes.' },
]

const DETAILS = [
  { t: 'Why a slope, not a score', b: 'A score says “you’re a 6/10 on warmth.” A slope says “cool with strangers, warm with your people” — more accurate, and more useful. People aren’t their average.' },
  { t: 'Both ways, not just up or down', b: 'Not every pattern is a straight trend. You might be steady at the extremes but rattled in the middle — a real “it depends both ways.” Facets fits the bend too, so that gets named, not flattened to “no pattern.”' },
  { t: 'Baseline vs. slope', b: 'Two different reads. Your baseline is where you rest by default; your slope is how far a situation moves you from there. We report both — and lean on the slope when matching.' },
  { t: 'Flexibility', b: 'Average the size of all your slopes and you get flexibility: how much of a chameleon you are. Some barely move; some are a different person per room.' },
  { t: 'How we match you', b: 'We line your signature up against twenty-two archetypes and take the nearest — straight-line distance across every situation×behaviour slope and bend, nudged a little by your baseline.' },
  { t: 'How sure we are', b: 'Confidence is how far ahead your match is over the runner-up, times how much of you we actually measured. A flat read from few answers stays honestly tentative.' },
  { t: 'The adaptive deep-dive', b: 'If one situation swings you unusually hard, Facets quietly asks a few more questions on just that axis — to tell a rock-solid pattern from a genuine “both ways.”' },
  { t: 'Facets, not a box', b: 'Your main archetype covers the situations it’s about. Any other situation you shift hard on gets its own facet — the archetype that best explains you there — so a full code reads like VAULT · CLUTCH · FUMES.' },
  { t: 'The why behind the shift', b: 'Two people can pull back from strangers just as much — one to stay safe, one to save energy. After your biggest swings we ask what’s behind them. It never changes your archetype; it names what runs it.' },
  { t: 'Comparing two people', b: 'Send a friend your compare link. Once they finish, we line your signatures up cell by cell: where you shift the same way, where you pull opposite ways, and where one of you moves while the other doesn’t.' },
]

export function MethodPage() {
  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3.5">
          <Link to="/" className={`rounded text-sm font-medium tracking-wide text-white/60 transition-colors hover:text-white ${ring}`}>
            <span aria-hidden="true">←</span> Facets
          </Link>
          <Link to="/" className={`rounded-beam bg-accent/15 px-4 py-2 text-sm font-medium text-accent-soft shadow-glow transition-colors hover:bg-accent/25 ${ring}`}>
            Take the test <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-28 pt-14 sm:pt-20">
        {/* Hero */}
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-accent-soft/70">The method</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
            How Facets{' '}
            <span className="bg-gradient-to-r from-accent via-accent-soft to-accent-alt bg-clip-text text-transparent">
              measures you.
            </span>
          </h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            Most tests ask what you’re like and sort you into a box. Facets measures something harder —
            and more true: <span className="text-white/90">how you change as the situation changes</span>,
            then reads the pattern. Here’s exactly how, with the real engine running underneath.
          </p>
        </Reveal>

        {/* Interactive lab */}
        <section className="mt-16">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Try it</p>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">
              Sculpt a signature. Meet your archetype.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
              This isn’t a mockup — it’s the engine’s own <span className="text-white/80">matcher run in
              reverse</span>. Set how each behaviour shifts as a situation rises (add a{' '}
              <span className="text-white/80">“both ways” bend</span> where one slope can’t tell the story),
              tune your resting lean, and watch the <span className="text-white/80">same code that writes
              your result</span> name the nearest of twenty-two archetypes — live.
            </p>
          </Reveal>
          <Reveal delay={0.1}><div className="mt-6"><SignatureSculptor /></div></Reveal>
        </section>

        {/* Pipeline */}
        <section className="mt-20">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">The technique, end to end</p>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">
              Four steps, every question.
            </h2>
          </Reveal>
          <div className="mt-8 flex flex-col gap-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={0.06 * i}>
                <div className="flex gap-5 rounded-beam border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20">
                  <span className="font-mono text-sm tabular-nums text-accent-soft/70">{s.n}</span>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-display text-lg font-semibold text-white">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-white/65">{s.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Ranking interactive */}
        <section className="mt-20">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Step 02, up close</p>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">
              Your ranking is the weight.
            </h2>
          </Reveal>
          <Reveal delay={0.1}><div className="mt-6"><RankingDemo /></div></Reveal>
        </section>

        {/* What it reads */}
        <section className="mt-20 grid gap-10 sm:grid-cols-2">
          <Reveal>
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-accent-soft/60">What we turn up</p>
                <h2 className="mt-2 font-display text-xl font-semibold leading-tight sm:text-2xl">Six situations</h2>
                <p className="mt-1 text-sm leading-relaxed text-white/55">The dials a moment can climb. We watch what each does to you.</p>
              </div>
              <div className="flex flex-col gap-4">
                {CONTENT.axes.map((a, i) => (
                  <div key={a.id} className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-white/80">{a.name}</span>
                    <Dial low={a.lowLabel} high={a.highLabel} accent={ACCENTS[i % ACCENTS.length]} pos={0.5 + 0.18 * Math.sin(i * 1.3)} />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-accent-soft/60">What moves</p>
                <h2 className="mt-2 font-display text-xl font-semibold leading-tight sm:text-2xl">Six behaviours</h2>
                <p className="mt-1 text-sm leading-relaxed text-white/55">The ways you can shift as a situation rises or falls.</p>
              </div>
              <div className="flex flex-col gap-4">
                {CONTENT.dims.map((d, i) => (
                  <div key={d.id} className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-white/80">{d.name}</span>
                    <Dial low={d.lowLabel} high={d.highLabel} accent={ACCENTS[(i + 3) % ACCENTS.length]} pos={0.5 - 0.18 * Math.sin(i * 1.1)} />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* The fine print */}
        <section className="mt-20">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">The fine print</p>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">
              From a grid of slopes to a person.
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {DETAILS.map((c, i) => (
              <Reveal key={c.t} delay={0.05 * i}>
                <div className="flex h-full flex-col gap-1.5 rounded-beam border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="font-display text-base font-semibold text-white">{c.t}</h3>
                  <p className="text-sm leading-relaxed text-white/60">{c.b}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/65">
              And it all runs in your browser — no email, no signup, your answers never leave your
              device. Curious what the twenty-two shapes look like? Browse the{' '}
              <Link to="/archetypes" className={`rounded font-medium text-accent-soft underline-offset-4 hover:underline ${ring}`}>field guide</Link>.
            </p>
          </Reveal>
        </section>

        {/* Closing CTA */}
        <section className="mt-20">
          <Reveal>
            <div className="flex flex-col items-center gap-5 rounded-beam border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
              <h2 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">See your own slopes.</h2>
              <p className="max-w-md text-sm leading-relaxed text-white/60">
                Five minutes, and your full signature is yours — no email, no signup, no catch.
              </p>
              <Link to="/" className={`mt-1 rounded-beam bg-accent px-7 py-3 text-sm font-semibold text-ink shadow-glow transition-transform hover:-translate-y-0.5 ${ring}`}>
                Take the test <span aria-hidden="true">→</span>
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
    </div>
  )
}
