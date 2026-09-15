import { useEffect, useRef, useState } from 'react'
import type { MotiveOption, SituationAxis } from '../engine/types'
import { Reveal } from '../ui/Reveal'
import { Mark } from '../ui/Mark'
import { btnGhost, card, optionClass, tag } from '../ui/styles'

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
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10">
      <Reveal key={`why-${index}`} className="flex flex-col gap-5">
        <div className="flex items-center justify-between px-1">
          <span className={`${tag} bg-coral-soft`}>Why you shift</span>
          {steps.length > 1 && <span className="text-sm font-bold tabular-nums">{index + 1} of {steps.length}</span>}
        </div>

        <div className={`${card} px-5 py-6 sm:px-8 sm:py-8`}>
          <h1 ref={headingRef} tabIndex={-1} className="font-serif text-3xl font-bold leading-tight tracking-tight focus-visible:outline-none sm:text-4xl">
            You swing hard on <Mark>{step.axis.name}</Mark>.
          </h1>
          {step.tell && (
            <p className="mt-4 border-l-4 border-coral pl-4 font-serif text-lg italic leading-snug text-ink-soft">{step.tell}</p>
          )}
        </div>

        <p className="px-1 text-sm font-bold">Honestly — what’s really behind that?</p>
        <ul aria-label="Possible reasons" className="flex flex-col gap-2.5">
          {step.options.map(o => (
            <li key={o.motiveId}>
              <button type="button" onClick={() => next({ axisId: step.axis.id, motiveId: o.motiveId })} className={optionClass(false)}>
                {o.label}
              </button>
            </li>
          ))}
        </ul>

        <button type="button" onClick={() => next()} className={`${btnGhost} self-center`}>
          Not sure — skip
        </button>
      </Reveal>
    </div>
  )
}
