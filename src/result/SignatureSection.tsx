import type { Archetype, BehaviorDim, Contingency, Profile } from '../engine/types'
import { CURVE_MEANINGFUL } from '../engine'
import { SignatureGem } from '../signature/SignatureGem'
import { shapeFromArchetype, shapeFromSignature } from '../signature/shape'
import { panel, tag } from '../ui/styles'

// Below this magnitude a measured slope is noise/flat, not a tell.
const MEANINGFUL = 0.5

/** One closing sentence: the strongest baseline leans + an overall flexibility read. */
function baselineLine(dims: BehaviorDim[], baseline: Record<string, number>, flexibility: number): string {
  // Real baselines compress toward ~0.1–0.4, so the lean threshold is low.
  const leans = dims
    .map(d => ({ d, v: baseline[d.id] ?? 0 }))
    .filter(x => Math.abs(x.v) >= 0.2)
    .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
    .slice(0, 3)
    .map(x => (x.v >= 0 ? x.d.highLabel : x.d.lowLabel))
  // flexibility is mean |slope|; real values run ~1.4–3.6.
  const flex = flexibility >= 2.5 ? 'highly context-driven' : flexibility >= 1.0 ? 'situational' : 'steady across situations'
  return leans.length > 0
    ? `Across the board you tend to ${leans.join(' · ')} — overall, you're ${flex}.`
    : `You sit near the middle on most things — overall, you're ${flex}.`
}

/**
 * The signature as one block: the gem (where you swing) and its morph (how you change shape), the
 * strongest tells spelled out beneath, and a one-line baseline read to close.
 */
export function SignatureSection({
  signature, baseline, contingencies, flexibility, dims, accent, archetype, axisId, onAxisChange,
}: {
  /** controlled selected situation, shared with the 3D crystal above */
  axisId?: string
  onAxisChange?: (axisId: string) => void
  signature: Profile['signature']
  baseline: Record<string, number>
  contingencies: Contingency[]
  flexibility: number
  dims: BehaviorDim[]
  accent: string
  /** the matched archetype — drawn as a dashed outline behind your gem */
  archetype?: Archetype
}) {
  const line = baselineLine(dims, baseline, flexibility)
  const moves = Object.values(signature).some(ds =>
    Object.values(ds).some(c => Math.abs(c.slope) >= MEANINGFUL || Math.abs(c.curvature) >= CURVE_MEANINGFUL))

  if (!moves) {
    return (
      <section className={`${panel} flex flex-col gap-1.5 p-5 sm:p-6`}>
        <h2 className="font-serif text-2xl font-bold tracking-tight">Your signature</h2>
        <p className="text-[15px]">You stay remarkably consistent across situations.</p>
        <p className="text-sm text-ink-soft">{line}</p>
      </section>
    )
  }

  const tells = contingencies.slice(0, 3)

  return (
    <section className={`${panel} flex flex-col gap-4 p-5 sm:p-6`}>
      <div>
        <h2 className="font-serif text-2xl font-bold tracking-tight">Your signature</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Your shape across six situations — the spikes are where you change most. Tap one to watch yourself shift.
          {archetype && <> The dashed outline is {archetype.name}.</>}
        </p>
      </div>

      <SignatureGem
        shape={shapeFromSignature(signature, baseline)}
        accent={accent}
        ghost={archetype ? shapeFromArchetype(archetype) : undefined}
        ghostLabel={archetype?.name}
        axisId={axisId}
        onAxisChange={onAxisChange}
      />

      {tells.length > 0 && (
        <ul className="flex flex-col gap-2 border-t-2 border-ink pt-4">
          {tells.map(c => (
            <li key={`${c.axis}.${c.dim}`} className="text-[15px] leading-relaxed">
              {c.kind === 'curve' && <span className={`${tag} mr-2 bg-coral-soft align-middle text-[10px] uppercase tracking-wide`}>both ways</span>}
              {c.text}
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-ink-soft">{line}</p>
    </section>
  )
}
