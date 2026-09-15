import type { Archetype } from '../engine/types'
import { describeContingency, describeCurvature, CURVE_MEANINGFUL } from '../engine'
import { CONTENT } from '../content'
import { eyebrow, panel } from '../ui/styles'
import { GemMini, SignatureGem } from '../signature/SignatureGem'
import { archetypeShifts, shapeFromArchetype } from '../signature/shape'

/**
 * The archetype's signature: its gem and morph (the same geometry a result uses), then every shift it's
 * built from spelled out as a sentence. Falls back to a flat read for The Constant.
 */
export function SignatureGraph({ archetype, accent }: { archetype: Archetype; accent: string }) {
  const shifts = archetypeShifts(archetype)
  const shape = shapeFromArchetype(archetype)

  if (shifts.length === 0) {
    return (
      <div className={`${panel} flex flex-col items-center gap-4 p-5 sm:flex-row`}>
        <GemMini shape={shape} accent={accent} className="h-24 w-24 shrink-0" />
        <p className="text-[15px] text-ink-soft">
          Flat across the board — the situation barely moves the needle. Same small, even shape everywhere.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={`${panel} p-4 sm:p-5`}>
        <SignatureGem shape={shape} accent={accent} label="Its shape" columns />
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {shifts.map(s => {
          const axis = CONTENT.axes.find(a => a.id === s.axisId)
          const dim = CONTENT.dims.find(d => d.id === s.dimId)
          if (!axis || !dim) return null
          const curvy = Math.abs(s.curvature) >= CURVE_MEANINGFUL && Math.abs(s.curvature) > Math.abs(s.slope)
          return (
            <li key={`${s.axisId}.${s.dimId}`} className={`${panel} p-4`}>
              <p className={eyebrow}>{axis.name} → {dim.name} · {curvy ? 'both ways' : s.slope >= 0 ? 'rises' : 'falls'}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed">
                {curvy
                  ? describeCurvature(s.axisId, s.dimId, s.curvature, CONTENT)
                  : describeContingency(s.axisId, s.dimId, s.slope, CONTENT)}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
