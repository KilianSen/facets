import type { AxisId } from '../engine/types'
import { CONTENT } from '../content'
import { crystalScene, CRYSTAL_FLOOR, CRYSTAL_INK, PITCH, type CrystalLabel } from './crystal'
import type { SignatureShape } from './shape'

const PAPER = '#FAF7F2'

/** The 3D crystal cluster as a still image — no dragging, no spin — for exports like the story card. */
export function CrystalStill({
  shape, accent, colors, cap, yaw = -0.35, labels = true, className = '',
}: {
  shape: SignatureShape
  accent: string
  colors?: Record<AxisId, string>
  cap?: number
  yaw?: number
  labels?: boolean
  className?: string
}) {
  const scene = crystalScene(shape, CONTENT, { yaw, pitch: PITCH.initial, accent, colors, cap })
  const text = (l: CrystalLabel) => (
    <text
      key={l.axisId} x={l.x} y={l.y} textAnchor="middle"
      fill={CRYSTAL_INK} stroke={PAPER} strokeWidth={4} paintOrder="stroke"
      className="text-[13px] font-bold"
    >
      {l.name}
    </text>
  )
  return (
    <svg viewBox={`0 0 ${scene.width} ${scene.height}`} className={className} aria-hidden="true">
      <path d={scene.floor} fill={CRYSTAL_FLOOR} stroke={CRYSTAL_INK} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="5 5" />
      {scene.faces.map((f, i) => (
        <path key={i} d={f.d} fill={f.fill} stroke={CRYSTAL_INK} strokeWidth={1.6} strokeLinejoin="round" />
      ))}
      {/* A still can't be turned to reveal a hidden label, so all labels sit on top (the paper halo keeps them legible). */}
      {labels && scene.labels.map(text)}
    </svg>
  )
}
