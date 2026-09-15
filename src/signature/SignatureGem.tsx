import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { AxisId } from '../engine/types'
import { CONTENT } from '../content'
import { eyebrow, ring, tag } from '../ui/styles'
import {
  gemCap, gemPoints, morphPoints, movers, pathOf, polar, situationStrength, strongestAxis,
  type Point, type SignatureShape,
} from './shape'

const INK = '#151515'
const PAPER = '#FAF7F2'
const CORAL = '#FF5A36'

// Both drawings share one frame so labels land in the same places.
const W = 360
const H = 310
const CX = 180
const CY = 158
const R = 96
const GEM = { cx: CX, cy: CY, rMin: 30, rMax: R }
const MORPH = { cx: CX, cy: CY, rIn: 22, rOut: R }

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Plays a 0 → 1 sweep whenever `key` changes (instantly 1 with reduced motion). */
function useSweep(key: string): number {
  const reduce = useReducedMotion()
  const [t, setT] = useState(1)
  useEffect(() => {
    if (reduce) { setT(1); return }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900)
      setT(1 - (1 - p) ** 3)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    setT(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [key, reduce])
  return t
}

/** Text label just outside vertex i, anchored away from the centre. */
function Label({ i, n, children, bold }: { i: number; n: number; children: string; bold?: boolean }) {
  const [x, y] = polar(CX, CY, R + 16, i, n)
  const anchor = x > CX + 4 ? 'start' : x < CX - 4 ? 'end' : 'middle'
  const dy = y < CY - 4 ? -2 : y > CY + 4 ? 12 : 4
  return (
    <text x={x} y={y + dy} textAnchor={anchor} fill={INK} className={`text-[13.5px] ${bold ? 'font-black' : 'font-semibold'}`}>
      {children}
    </text>
  )
}

function Guides({ radii, n }: { radii: number[]; n: number }) {
  return (
    <>
      {radii.map(r => (
        <path key={r} d={pathOf(Array.from({ length: n }, (_, i) => polar(CX, CY, r, i, n)))} fill="none" stroke={INK} strokeOpacity={0.14} strokeWidth={1.5} strokeDasharray="4 5" />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = polar(CX, CY, radii[radii.length - 1], i, n)
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke={INK} strokeOpacity={0.08} strokeWidth={1.5} />
      })}
    </>
  )
}

/** The gem thumbnail for cards: just the silhouette, no labels, no interaction. */
export function GemMini({ shape, accent, className = '' }: { shape: SignatureShape; accent: string; className?: string }) {
  const pts = gemPoints(shape, CONTENT, { cx: 50, cy: 50, rMin: 16, rMax: 44 })
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d={pathOf(pts)} fill={accent} fillOpacity={0.4} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {pts.map(([x, y], i) => <line key={i} x1={50} y1={50} x2={x} y2={y} stroke={INK} strokeOpacity={0.4} strokeWidth={2.5} />)}
    </svg>
  )
}

/**
 * The signature as geometry. Left: the gem — one point per situation, pushed out by how hard it moves
 * you (spiky = shape-shifter, small and even = constant). Right: tap a situation and a six-spoke
 * behaviour shape sweeps from that situation's low end (dashed) to its high end, so you watch yourself
 * change shape. `ghost` draws a second gem dashed behind — e.g. the matched archetype.
 */
export function SignatureGem({
  shape, accent, ghost, ghostLabel, label = 'Your shape', axisId: controlledAxis, onAxisChange, columns = false,
}: {
  shape: SignatureShape
  accent: string
  ghost?: SignatureShape
  ghostLabel?: string
  label?: string
  /** controlled selected situation (defaults to the strongest one) */
  axisId?: AxisId
  onAxisChange?: (axisId: AxisId) => void
  /** lay gem and morph side by side (only where there's room) */
  columns?: boolean
}) {
  const { axes, dims } = CONTENT
  const [ownAxis, setOwnAxis] = useState<AxisId>(() => strongestAxis(shape, CONTENT))
  const axisId = controlledAxis ?? ownAxis
  const axis = axes.find(a => a.id === axisId) ?? axes[0]
  const select = (id: AxisId) => { setOwnAxis(id); onAxisChange?.(id) }

  const [scrub, setScrub] = useState<number | null>(null)
  useEffect(() => setScrub(null), [axisId])
  const sweep = useSweep(axisId)
  const t = scrub ?? sweep

  const cap = gemCap(ghost ? [shape, ghost] : [shape], CONTENT)
  const gem = gemPoints(shape, CONTENT, { ...GEM, cap })
  const ghostGem = ghost ? gemPoints(ghost, CONTENT, { ...GEM, cap }) : null
  const low = morphPoints(shape, axis.id, CONTENT, 0, MORPH)
  const now = morphPoints(shape, axis.id, CONTENT, t, MORPH)
  const moved = movers(shape, axis.id, CONTENT).slice(0, 3)

  const swingWord = (a: AxisId) => {
    const s = situationStrength(shape, a) / cap
    return s >= 0.75 ? 'big swing' : s >= 0.4 ? 'some swing' : s > 0.1 ? 'slight swing' : 'steady'
  }
  const dot = ([x, y]: Point, key: string | number, r = 3.5) => <circle key={key} cx={x} cy={y} r={r} fill={INK} />
  const figure = 'flex flex-col gap-2 rounded-2xl border-2 border-ink bg-paper p-3'

  return (
    <div className="flex flex-col gap-3">
      <div className={`grid gap-3 ${columns ? 'md:grid-cols-2' : ''}`}>
        <figure className={figure}>
          <figcaption className="flex items-baseline justify-between gap-2">
            <span className={eyebrow}>{label}</span>
            {ghost && ghostLabel && <span className="text-[11px] font-semibold text-ink-soft">- - - {ghostLabel}</span>}
          </figcaption>
          <svg viewBox={`0 0 ${W} ${H}`} className="my-auto w-full" role="img" aria-label={`${label}:${axes.map(a => `${a.name}, ${swingWord(a.id)}`).join('; ')}`}>
            <Guides radii={[R]} n={axes.length} />
            {ghostGem && <path d={pathOf(ghostGem)} fill="none" stroke={INK} strokeOpacity={0.55} strokeWidth={2} strokeDasharray="6 5" strokeLinejoin="round" />}
            <path d={pathOf(gem)} fill={accent} fillOpacity={0.32} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            {gem.map(([x, y], i) => <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke={INK} strokeOpacity={0.3} strokeWidth={1.5} />)}
            {gem.map(([x, y], i) => {
              const a = axes[i]
              const selected = a.id === axis.id
              return (
                <g key={a.id} onClick={() => select(a.id)} className="cursor-pointer">
                  <circle cx={x} cy={y} r={18} fill="transparent" />
                  <circle cx={x} cy={y} r={selected ? 8 : 5.5} fill={selected ? CORAL : PAPER} stroke={INK} strokeWidth={2} />
                  <Label i={i} n={axes.length} bold={selected}>{a.name}</Label>
                </g>
              )
            })}
          </svg>
        </figure>

        <figure className={figure}>
          <figcaption className="flex items-baseline justify-between gap-2">
            <span className={eyebrow}>{axis.name}: watch it change</span>
            <span className="text-[11px] font-semibold text-ink-soft">- - - {axis.lowLabel}</span>
          </figcaption>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`How your behaviours change as ${axis.name.toLowerCase()} rises`}>
            <Guides radii={[MORPH.rIn, (MORPH.rIn + MORPH.rOut) / 2, MORPH.rOut]} n={dims.length} />
            <path d={pathOf(low)} fill="none" stroke={INK} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="6 5" strokeLinejoin="round" />
            <path d={pathOf(now)} fill={accent} fillOpacity={0.32} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            {now.map((p, i) => dot(p, i))}
            {dims.map((d, i) => <Label key={d.id} i={i} n={dims.length} bold={moved.some(m => m.dimId === d.id)}>{d.name}</Label>)}
          </svg>
          <input
            type="range" min={0} max={100} value={Math.round(t * 100)}
            onChange={e => setScrub(Number(e.target.value) / 100)}
            aria-label={`Slide from ${axis.lowLabel} to ${axis.highLabel}`}
            className="w-full cursor-pointer" style={{ accentColor: CORAL }}
          />
          <div className="flex justify-between gap-3 text-xs font-semibold text-ink-soft">
            <span>{capitalize(axis.lowLabel)}</span>
            <span className="text-right">{capitalize(axis.highLabel)}</span>
          </div>
          {moved.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {moved.map(m => {
                const d = dims.find(x => x.id === m.dimId)!
                return (
                  <li key={m.dimId} className={`${tag} bg-white`}>
                    {m.curvy ? `${d.name} ${m.bend > 0 ? 'peaks' : 'dips'} mid-way` : `${m.delta > 0 ? '↑' : '↓'} ${m.delta > 0 ? d.highLabel : d.lowLabel}`}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-xs text-ink-soft">Nothing moves much here — you’re the same either way.</p>
          )}
        </figure>
      </div>

      <div role="group" aria-label="Situations" className="flex flex-wrap justify-center gap-1.5">
        {axes.map(a => {
          const selected = a.id === axis.id
          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={selected}
              onClick={() => select(a.id)}
              className={`rounded-full border-2 border-ink px-2.5 py-1 text-xs font-bold transition-colors ${ring} ${selected ? 'bg-ink text-paper' : 'bg-white hover:bg-coral-soft'}`}
            >
              {a.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
