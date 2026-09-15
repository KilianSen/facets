import type { SituationAxis } from '../engine/types'
import { Reveal } from '../ui/Reveal'
import { Mark } from '../ui/Mark'
import { btnGhost, btnPrimary, tag } from '../ui/styles'

/**
 * Offered after the base run when one axis stands out as a big swing. Opt-in: a short, comparable
 * deep-dive on that axis that both sharpens the reading and tells the user whether the swing is a
 * consistent pattern or a genuine "it depends both ways."
 */
export function SharpenPrompt({
  axis, onSharpen, onSkip,
}: {
  axis: SituationAxis
  onSharpen: () => void
  onSkip: () => void
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-6 px-5 py-12">
      <Reveal><span className={`${tag} bg-coral-soft`}>One situation stood out</span></Reveal>
      <Reveal delay={0.04}>
        <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          You swing hard on <Mark>{axis.name}</Mark>.
        </h1>
      </Reveal>
      <Reveal delay={0.08}>
        <p className="text-lg leading-relaxed text-ink-soft">
          You change a lot between when {axis.lowLabel} and when {axis.highLabel}. A few quick, focused
          questions will pin down whether that’s a rock-solid pattern — or you genuinely go both ways.
        </p>
      </Reveal>
      <Reveal delay={0.12} className="flex flex-col items-start gap-4 pt-2">
        <button type="button" onClick={onSharpen} className={btnPrimary}>
          Pin down my {axis.name} →
        </button>
        <button type="button" onClick={onSkip} className={btnGhost}>
          Skip to my results
        </button>
      </Reveal>
    </div>
  )
}
