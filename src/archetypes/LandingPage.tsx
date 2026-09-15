import { ArrowRight, Check } from 'lucide-react'
import { Reveal } from '../ui/Reveal'
import { Mark } from '../ui/Mark'
import { SiteNav } from '../ui/SiteNav'
import { Link } from '../router/router'
import { btnGhost, btnPrimary, card, eyebrow, panel, ring, tag } from '../ui/styles'
import { ArchetypeCard } from './ArchetypeCard'
import { ARCHETYPES_IN_ORDER } from './archetypeMeta'

// A varied half-dozen pulled from across the gallery groups (every ~3rd tile), so the teaser reads as
// a spread of different "shapes" rather than neighbours from one cluster.
const TEASER = ARCHETYPES_IN_ORDER.filter((_, i) => i % 3 === 0).slice(0, 6)

// The promise that actually sets this test apart: you finish, you get your result — no wall, no catch.
const PROMISES = ['No signup', 'No email', 'Your result on the spot', 'Stays in your browser', '~7 min']

const STEPS = [
  {
    n: '1',
    title: 'Answer honestly',
    body: 'When one answer doesn’t fit, say “it depends” and split it by context instead of forcing a single choice.',
  },
  {
    n: '2',
    title: 'Start with what’s most you',
    body: 'Answer for the person or moment it’s most true for first, then the next. The order you answer in is how much each one counts.',
  },
  {
    n: '3',
    title: 'Get your signature',
    body: 'See how you shift as the situation turns up — and the archetype, facets and motives that shift makes you.',
  },
]

const mode = `group flex flex-col items-start gap-1 rounded-card border-2 border-ink px-5 py-4 text-left shadow-hard transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-px hover:shadow-hard-lg active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${ring}`

/** The hero illustration: a prompt card answered "it depends" — people numbered in the order answered. */
function DemoCard() {
  const rows = [
    { who: 'Your best friend', does: 'Call them right now' },
    { who: 'A classmate you vibe with', does: 'Drop a “you good?”' },
    { who: 'A random mutual', does: 'Keep scrolling' },
  ]
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-sm pt-4">
      <div className={`${card} -rotate-2 p-5`}>
        <p className={eyebrow}>The situation</p>
        <p className="mt-2 font-serif text-xl font-semibold leading-snug">They post a story crying in their car at 1am. You…</p>
        <ol className="mt-4 flex flex-col gap-2">
          {rows.map((r, i) => (
            <li key={r.who} className={`${panel} flex items-center gap-3 px-3 py-2`}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-ink text-xs font-bold text-paper">{i + 1}</span>
              <span className="flex min-w-0 flex-col">
                <span className="font-serif text-sm font-semibold leading-tight">{r.who}</span>
                <span className="text-xs text-ink-soft">{r.does}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <span className={`${tag} absolute -right-1 top-0 rotate-[5deg] bg-coral px-3 py-1 text-sm shadow-hard-sm`}>it depends</span>
    </div>
  )
}

export function LandingPage({
  resume, invite = null, onStart, onContinue,
}: {
  resume: { index: number; total: number } | null
  /** a compare invite this visitor is answering */
  invite?: { name?: string } | null
  onStart: (mode: 'short' | 'deep') => void
  onContinue: () => void
}) {
  return (
    <div className="min-h-screen w-full">
      <SiteNav cta={false} />

      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        {/* 1 — Hero */}
        <section className="grid items-center gap-12 pb-20 pt-10 sm:pt-16 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
          <div className="flex flex-col gap-6">
            {invite && (
              <Reveal>
                <p className={`${tag} w-fit bg-coral-soft px-3 py-1`}>
                  {invite.name ?? 'A friend'} invited you to compare — finish the test and we’ll line you up.
                </p>
              </Reveal>
            )}
            <Reveal><p className={eyebrow}>Facets · a personality test for everyone</p></Reveal>
            <Reveal delay={0.04}>
              <h1 className="font-serif text-[2.9rem] font-bold leading-[0.98] tracking-tight sm:text-7xl">
                Find out how you <Mark>actually</Mark> show up.
              </h1>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="max-w-lg text-lg leading-relaxed text-ink-soft">
                A personality test that respects you. Take it and see your full result the moment you finish —
                no email, no signup, no catch.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <ul className="flex flex-wrap gap-2">
                {PROMISES.map(p => (
                  <li key={p} className={`${tag} bg-white py-1`}>
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.14} className="flex flex-col gap-3 pt-2">
              {resume && (
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={onContinue} className={btnPrimary}>
                    Continue your run ({resume.index}/{resume.total})
                  </button>
                  <span className="text-sm text-ink-soft">or start fresh:</span>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => onStart('short')} className={`${mode} bg-coral`}>
                  <span className="flex w-full items-center justify-between">
                    <span className="font-serif text-2xl font-bold">Quick read</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold">~35 questions · ~7 min</span>
                </button>
                <button type="button" onClick={() => onStart('deep')} className={`${mode} bg-white`}>
                  <span className="flex w-full items-center justify-between">
                    <span className="font-serif text-2xl font-bold">Deep dive</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-ink-soft">~50 questions · ~12 min · three extra chapters</span>
                </button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.12}><DemoCard /></Reveal>
        </section>
      </main>

      {/* 2 — What makes it different */}
      <section className="border-y-2 border-ink bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
          <Reveal>
            <p className={eyebrow}>What makes it different</p>
            <h2 className="mt-3 max-w-2xl font-serif text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              Real life is “it depends.” Most tests pretend it isn’t.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Other tests force you into one box. Here, when the honest answer is “it depends,” you can say so —
              set the context, and walk away with a map of how you actually shift.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={0.05 * i}>
                <div className="flex h-full flex-col gap-3 rounded-card border-2 border-ink bg-paper p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-coral font-serif text-xl font-bold">{s.n}</span>
                  <h3 className="font-serif text-2xl font-bold leading-tight">{s.title}</h3>
                  <p className="text-[15px] leading-relaxed text-ink-soft">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <Link to="/method" className={`${btnGhost} mt-8`}>See exactly how we measure you →</Link>
          </Reveal>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
        {/* 3 — Archetype teaser */}
        <section className="pt-20">
          <Reveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={eyebrow}>The cast</p>
                <h2 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">{ARCHETYPES_IN_ORDER.length} ways to show up.</h2>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-soft">
                  Each archetype is a portrait of how a person shows up — and how that shifts when the situation changes.
                </p>
              </div>
              <Link to="/archetypes" className={`${btnGhost} shrink-0`}>Explore all {ARCHETYPES_IN_ORDER.length} archetypes →</Link>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEASER.map((a, i) => (
              <Reveal key={a.id} delay={0.04 * i}><ArchetypeCard archetype={a} /></Reveal>
            ))}
          </div>
        </section>

        {/* 4 — Closing CTA */}
        <section className="pt-20">
          <Reveal>
            <div className="flex flex-col items-center rounded-card border-2 border-ink bg-ink px-6 py-16 text-center text-paper sm:px-12">
              <h2 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
                Ready to <span className="text-coral">meet yourself?</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-paper/75">
                Seven minutes, and your full result is yours — no email, no signup, no catch.
              </p>
              <button type="button" onClick={() => onStart('short')} className={`${btnPrimary} mt-8 shadow-none`}>
                Start the test
              </button>
            </div>
          </Reveal>
        </section>

        <footer className="pt-10 text-center text-sm text-ink-faint">Facets · runs entirely in your browser</footer>
      </main>
    </div>
  )
}
