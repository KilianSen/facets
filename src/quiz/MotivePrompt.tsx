import { useEffect, useRef, useState } from 'react'
import type { MotiveOption, SituationAxis } from '../engine/types'
import { Reveal } from '../ui/Reveal'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'

export interface MotiveStep { axis: SituationAxis; tell: string | null; options: MotiveOption[] }
export interface MotivePick { axisId: string; motiveId: string }

/**
 * The "why" beat after the base run: for each of the user's biggest swings, show them their own shift
 * and ask what's behind it. One tap per swing, each skippable. Never changes the archetype — it tells
 * the result what runs the pattern.
 */
export function MotivePrompt({ steps, onDone }: { steps: MotiveStep[]; onDone: (picks: MotivePick[]) => void }) {
  const [index, setIndex] = useState(0)
  const [picks, setPicks] = useState<MotivePick[]>([])
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => { headingRef.current?.focus() }, [index])

  const step = steps[index]
  if (!step) return null

  function next(pick?: MotivePick) {
    const all = pick ? [...picks, pick] : picks
    if (index + 1 >= steps.length) { onDone(all); return }
    setPicks(all)
    setIndex(index + 1)
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-5 py-12">
      <Reveal key={`why-${index}`} className="flex flex-col gap-6">
        <p className="text-xs uppercase tracking-[0.3em] text-accent-soft/70">
          Why you shift{steps.length > 1 && <span className="text-white/35"> · {index + 1} of {steps.length}</span>}
        </p>
        <div className="flex flex-col gap-3">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl font-bold leading-[1.1] focus-visible:outline-none">
            You swing hard on <span className="text-accent-soft">{step.axis.name}</span>.
          </h1>
          {step.tell && <p className="border-l-2 border-accent/40 pl-3 text-sm leading-relaxed text-white/75">{step.tell}</p>}
          <p className="text-sm text-white/55">Honestly — what’s really behind that?</p>
        </div>

        <ul aria-label="Possible reasons" className="flex flex-col gap-2.5">
          {step.options.map(o => (
            <li key={o.motiveId}>
              <button
                type="button"
                onClick={() => next({ axisId: step.axis.id, motiveId: o.motiveId })}
                className={`w-full rounded-beam border border-white/10 bg-white/[0.04] px-4 py-3.5 text-left text-sm text-white/85 transition-colors hover:border-accent/40 hover:bg-accent/10 ${ring}`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>

        <button type="button" onClick={() => next()} className={`self-center rounded text-xs text-white/40 transition-colors hover:text-white/70 ${ring}`}>
          Not sure — skip
        </button>
      </Reveal>
    </div>
  )
}
