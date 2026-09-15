import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { AxisId } from '../engine/types'
import { CONTENT } from '../content'
import { ring } from '../ui/styles'
import { crystalScene, CRYSTAL_FLOOR, CRYSTAL_INK, GHOST_OPACITY, PITCH, type CrystalLabel } from './crystal'
import { situationStrength, type SignatureShape } from './shape'

const PAPER = '#FAF7F2'
const IDLE_AFTER_MS = 2500
const SPIN_RAD_PER_MS = 0.00025

const clampPitch = (p: number) => Math.max(PITCH.min, Math.min(PITCH.max, p))

/**
 * The signature as a 3D crystal cluster (see crystal.ts). Drag or use the arrow keys to turn it; it
 * spins slowly when left alone (never with reduced motion, and only while on screen). Tapping a crystal
 * selects its situation.
 */
export function SignatureCrystal({
  shape, accent, selected, onSelect, cap, ghost, ghostLabel, ghostAccent, colors, className = '', initialYaw = -0.35,
}: {
  shape: SignatureShape
  /** per-situation crystal colour (e.g. by the type that explains each situation) */
  colors?: Record<AxisId, string>
  ghostAccent?: string
  /** a comparison shape drawn as see-through crystals (e.g. the matched archetype) */
  ghost?: SignatureShape
  ghostLabel?: string
  accent: string
  selected?: AxisId | null
  onSelect?: (axisId: AxisId) => void
  cap?: number
  className?: string
  initialYaw?: number
}) {
  const reduce = useReducedMotion()
  const [view, setView] = useState({ yaw: initialYaw, pitch: PITCH.initial })
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number; moved: boolean } | null>(null)
  const justDragged = useRef(false)
  const lastInteraction = useRef(0)

  useEffect(() => {
    if (reduce || typeof requestAnimationFrame !== 'function') return
    let raf = 0
    let last = performance.now()
    let visible = true
    const el = svgRef.current
    const io = el && typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
      : null
    if (io && el) io.observe(el)
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      if (visible && !drag.current && now - lastInteraction.current > IDLE_AFTER_MS) {
        setView(v => ({ ...v, yaw: v.yaw + dt * SPIN_RAD_PER_MS }))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); io?.disconnect() }
  }, [reduce])

  const scene = crystalScene(shape, CONTENT, { yaw: view.yaw, pitch: view.pitch, accent, selected, cap, ghost, ghostAccent, colors })

  const tallest = CONTENT.axes
    .map(a => ({ name: a.name, s: situationStrength(shape, a.id) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 2)
    .map(x => x.name)
  const label = (tallest.length
    ? `3D signature: one crystal per situation. Tallest at ${tallest.join(' and ')}.`
    : '3D signature: six even crystals — you barely change across situations.')
    + (ghost && ghostLabel ? ` ${ghostLabel} is drawn see-through for comparison.` : '')
    + (tallest.length ? ' Drag or use the arrow keys to turn it.' : '')

  const labelEl = (l: CrystalLabel) => (
    <text
      key={l.axisId}
      x={l.x} y={l.y}
      textAnchor="middle"
      data-axis={l.axisId}
      fill={CRYSTAL_INK}
      stroke={PAPER}
      strokeWidth={4}
      paintOrder="stroke"
      className={`text-[12px] ${l.axisId === selected ? 'font-black' : 'font-semibold'} ${onSelect ? 'cursor-pointer' : ''}`}
    >
      {l.name}
    </text>
  )

  function onPointerDown(e: PointerEvent<SVGSVGElement>) {
    drag.current = { x: e.clientX, y: e.clientY, yaw: view.yaw, pitch: view.pitch, moved: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true
    setView({ yaw: d.yaw + dx * 0.012, pitch: clampPitch(d.pitch + dy * 0.006) })
  }
  function endDrag() {
    justDragged.current = drag.current?.moved ?? false
    drag.current = null
    lastInteraction.current = performance.now()
  }
  function onClick(e: MouseEvent<SVGSVGElement>) {
    if (justDragged.current) { justDragged.current = false; return }
    const axisId = (e.target as Element).getAttribute?.('data-axis')
    if (axisId && onSelect) onSelect(axisId)
  }
  function onKeyDown(e: KeyboardEvent<SVGSVGElement>) {
    const step = { ArrowLeft: [-0.25, 0], ArrowRight: [0.25, 0], ArrowUp: [0, -0.08], ArrowDown: [0, 0.08] }[e.key]
    if (!step) return
    e.preventDefault()
    lastInteraction.current = performance.now()
    setView(v => ({ yaw: v.yaw + step[0], pitch: clampPitch(v.pitch + step[1]) }))
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${scene.width} ${scene.height}`}
      role="img"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`cursor-grab touch-pan-y select-none rounded-xl active:cursor-grabbing ${ring} ${className}`}
    >
      <path d={scene.floor} fill={CRYSTAL_FLOOR} stroke={CRYSTAL_INK} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="5 5" />
      {/* Labels behind the cluster first (crystals may cover them), then faces, then the near labels. */}
      {scene.labels.filter(l => l.depth < 0).map(labelEl)}
      {scene.faces.map((f, i) => f.ghost ? (
        <path
          key={i} d={f.d} fill={f.fill} fillOpacity={GHOST_OPACITY}
          stroke={CRYSTAL_INK} strokeOpacity={0.85} strokeWidth={1.4} strokeDasharray="4 3" strokeLinejoin="round"
          data-axis={f.axisId} data-ghost="true" className={onSelect ? 'cursor-pointer' : undefined}
        />
      ) : (
        <path key={i} d={f.d} fill={f.fill} stroke={CRYSTAL_INK} strokeWidth={f.selected ? 2.6 : 1.4} strokeLinejoin="round" data-axis={f.axisId} className={onSelect ? 'cursor-pointer' : undefined} />
      ))}
      {scene.labels.filter(l => l.depth >= 0).map(labelEl)}
    </svg>
  )
}
