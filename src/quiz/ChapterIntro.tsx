import { Reveal } from '../ui/Reveal'
import { Mark } from '../ui/Mark'
import { btnPrimary, tag } from '../ui/styles'

/** The title card before a deep-dive chapter: what it asks and why, then straight in. */
export function ChapterIntro({
  number, total, title, blurb, onContinue,
}: {
  number: number
  total: number
  title: string
  blurb: string
  onContinue: () => void
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-6 px-5 py-12">
      <Reveal><span className={`${tag} bg-coral-soft`}>Chapter {number} of {total}</span></Reveal>
      <Reveal delay={0.04}>
        <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          <Mark>{title}</Mark>
        </h1>
      </Reveal>
      <Reveal delay={0.08}>
        <p className="text-lg leading-relaxed text-ink-soft">{blurb}</p>
      </Reveal>
      <Reveal delay={0.12} className="pt-2">
        <button type="button" onClick={onContinue} className={btnPrimary}>
          Start chapter {number} →
        </button>
      </Reveal>
    </div>
  )
}
