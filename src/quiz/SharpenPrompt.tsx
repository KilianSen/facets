import type { SituationAxis } from '../engine/types'
import { Reveal } from '../ui/Reveal'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'

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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
      <Reveal><p className="text-xs uppercase tracking-[0.3em] text-accent-soft/70">One axis stood out</p></Reveal>
      <Reveal delay={0.05}>
        <h1 className="font-display text-3xl font-bold leading-[1.1] sm:text-4xl">
          You swing hard on <span className="text-accent-soft">{axis.name}</span>.
        </h1>
      </Reveal>
      <Reveal delay={0.12}>
        <p className="text-sm leading-relaxed text-white/70">
          Your read changes a lot between when {axis.lowLabel} and when {axis.highLabel}. A few
          quick, focused questions will pin down whether that’s a rock-solid pattern — or you genuinely
          go both ways.
        </p>
      </Reveal>

      <Reveal delay={0.2} className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onSharpen}
          className={`rounded-beam bg-accent/15 px-6 py-3 text-sm font-medium text-accent-soft shadow-glow transition-colors hover:bg-accent/25 ${ring}`}
        >
          Pin down my {axis.name} →
        </button>
        <button
          type="button"
          onClick={onSkip}
          className={`rounded text-xs text-white/45 transition-colors hover:text-white/75 ${ring}`}
        >
          Skip to my results
        </button>
      </Reveal>
    </div>
  )
}
