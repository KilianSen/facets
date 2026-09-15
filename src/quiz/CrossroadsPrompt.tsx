import { useEffect, useRef } from 'react'
import type { CrossroadsDilemma } from '../content/crossroads'
import type { SituationAxis } from '../engine/types'
import { Reveal } from '../ui/Reveal'
import { Mark } from '../ui/Mark'
import { btnGhost, card, optionClass, tag } from '../ui/styles'

export function CrossroadsPrompt({
  dilemma,
  axisA,
  axisB,
  onSelect,
  onSkip,
}: {
  dilemma: CrossroadsDilemma
  axisA: SituationAxis
  axisB: SituationAxis
  onSelect: (optionId: string) => void
  onSkip: () => void
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { headingRef.current?.focus() }, [dilemma.id])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10">
      <Reveal className="flex flex-col gap-5">
        <div className="flex items-center justify-between px-1">
          <span className={`${tag} bg-coral-soft`}>The Crossroads</span>
          <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
            {axisA.name} × {axisB.name}
          </span>
        </div>

        <div className={`${card} px-5 py-6 sm:px-8 sm:py-8`}>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">When your two biggest sides collide</p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-1 font-serif text-3xl font-bold leading-tight tracking-tight focus-visible:outline-none sm:text-4xl"
          >
            <Mark>{dilemma.title}</Mark>
          </h1>
          <p className="mt-4 border-l-4 border-coral pl-4 font-serif text-lg leading-relaxed text-ink-soft">
            {dilemma.prompt}
          </p>
        </div>

        <p className="px-1 text-sm font-bold">When it comes down to it, what do you actually do?</p>
        <ul aria-label="Crossroads options" className="flex flex-col gap-2.5">
          {dilemma.options.map(o => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onSelect(o.id)}
                className={`${optionClass(false)} text-left`}
              >
                <span className="font-medium text-ink">{o.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <button type="button" onClick={onSkip} className={`${btnGhost} self-center`}>
          Skip this dilemma
        </button>
      </Reveal>
    </div>
  )
}
