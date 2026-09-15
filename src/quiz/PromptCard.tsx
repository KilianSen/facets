import type { RefObject } from 'react'
import { card, eyebrow } from '../ui/styles'

/** The scenario, set like a dating-app prompt: a small label over big serif type on a raised card. */
export function PromptCard({
  prompt, id, headingRef, label = 'The situation',
}: {
  prompt: string
  id?: string
  headingRef?: RefObject<HTMLHeadingElement>
  label?: string
}) {
  return (
    <div className={`${card} px-5 py-6 sm:px-8 sm:py-8`}>
      <p className={eyebrow}>{label}</p>
      <h2
        id={id}
        ref={headingRef}
        tabIndex={-1}
        className="mt-3 font-serif text-[1.6rem] font-semibold leading-[1.15] tracking-tight focus-visible:outline-none sm:text-[2rem]"
      >
        {prompt}
      </h2>
    </div>
  )
}
