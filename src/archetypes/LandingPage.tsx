import { Reveal } from '../ui/Reveal'
import { Link } from '../router/router'
import { ArchetypeCard } from './ArchetypeCard'
import { ARCHETYPES_IN_ORDER } from './archetypeMeta'

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'

// A varied half-dozen pulled from across the gallery groups (every ~3rd tile), so the teaser reads as
// a spread of different "shapes" rather than four neighbours from one cluster.
const TEASER = ARCHETYPES_IN_ORDER.filter((_, i) => i % 3 === 0).slice(0, 6)

// A tiny rising/falling tick — the "it depends" slope motif, reused as the step glyphs.
function Tick({ slope, accent }: { slope: number; accent: string }) {
  const off = Math.max(-10, Math.min(10, slope * 5))
  return (
    <svg viewBox="0 0 40 24" className="h-6 w-10" aria-hidden="true">
      <line x1="3" y1="12" x2="37" y2="12" stroke="white" strokeOpacity="0.1" strokeDasharray="3 4" />
      <line x1="3" y1={12 + off} x2="37" y2={12 - off} stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="37" cy={12 - off} r="3" fill={accent} />
    </svg>
  )
}

const STEPS = [
  {
    n: '01',
    slope: 0,
    accent: '#22d3ee',
    title: 'Say "it depends"',
    body: 'Every question lets you split the answer by context instead of forcing a single box.',
  },
  {
    n: '02',
    slope: 1.6,
    accent: '#818cf8',
    title: 'Rank and map your move',
    body: 'Order the situations that pull at you, then map how you actually behave in each one.',
  },
  {
    n: '03',
    slope: -1.6,
    accent: '#d946ef',
    title: 'Get your signature',
    body: 'See how you shift as the stakes rise — and the archetype that move makes you.',
  },
]

export function LandingPage({
  resume, onStart, onContinue,
}: {
  resume: { index: number; total: number } | null
  onStart: (mode: 'short' | 'deep') => void
  onContinue: () => void
}) {
  return (
    <div className="relative mx-auto w-full max-w-5xl px-5 pb-24 pt-16 sm:pt-24">
      {/* Layered radial glows — the dark "beam" hero wash. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute right-[-10%] top-12 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute left-1/3 top-[34rem] h-72 w-72 rounded-full bg-indigo-500/15 blur-[130px]" />
      </div>

      {/* 1 — Hero */}
      <header className="flex flex-col items-start gap-6 sm:max-w-3xl">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.4em] text-accent-soft/70">FPTIC</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h1 className="font-display text-5xl font-bold leading-[1.02] sm:text-7xl">
            The personality test that lets you say{' '}
            <span className="bg-gradient-to-r from-accent via-accent-soft to-accent-alt bg-clip-text text-transparent">
              it depends.
            </span>
          </h1>
        </Reveal>
        <Reveal delay={0.13}>
          <p className="max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Most tests force one box. Here you set the context for each question — and walk away with a
            map of how you actually shift.
          </p>
        </Reveal>

        {/* 2 — Primary CTAs */}
        <Reveal delay={0.2} className="flex w-full flex-col gap-4">
          {resume && (
            <div className="flex flex-col items-start gap-2">
              <button
                type="button"
                onClick={onContinue}
                className={`rounded-beam bg-accent/15 px-6 py-3 text-sm font-medium text-accent-soft shadow-glow transition-colors hover:bg-accent/25 ${ring}`}
              >
                Continue your run ({resume.index}/{resume.total})
              </button>
              <span className="pl-1 text-xs text-white/40">or start fresh</span>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <button
              type="button"
              onClick={() => onStart('short')}
              className={`group flex flex-1 flex-col items-start gap-1 rounded-beam bg-white/10 px-6 py-4 text-left shadow-glow transition-all hover:-translate-y-0.5 hover:bg-white/15 ${ring}`}
            >
              <span className="text-base font-semibold text-white">Quick read</span>
              <span className="text-xs text-white/55">~24 questions · ~5 min</span>
            </button>
            <button
              type="button"
              onClick={() => onStart('deep')}
              className={`group flex flex-1 flex-col items-start gap-1 rounded-beam border border-white/15 px-6 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.06] ${ring}`}
            >
              <span className="text-base font-semibold text-white/85">Deep dive</span>
              <span className="text-xs text-white/55">~60 questions · ~10 min · sharper result</span>
            </button>
          </div>
        </Reveal>
      </header>

      {/* 3 — How it works */}
      <section className="mt-28">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">How it works</p>
          <h2 className="mt-2 max-w-xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
            You don't have one mode. The test is built to catch that.
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={0.08 * i}>
              <div className="flex h-full flex-col gap-4 rounded-beam border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs tracking-widest text-white/35">{s.n}</span>
                  <Tick slope={s.slope} accent={s.accent} />
                </div>
                <h3 className="font-display text-xl font-semibold leading-tight text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/65">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 4 — Archetype teaser */}
      <section className="mt-28">
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent-soft/60">The cast</p>
              <h2 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                20 ways to shift.
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">
                Each archetype is a different answer to "it depends" — a distinct shape for how the
                situation moves you.
              </p>
            </div>
            <Link
              to="/archetypes"
              className={`shrink-0 rounded-beam px-1 text-sm font-medium text-accent-soft transition-colors hover:text-accent ${ring}`}
            >
              Explore all 20 archetypes →
            </Link>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEASER.map((a, i) => (
            <Reveal key={a.id} delay={0.05 * i}>
              <ArchetypeCard archetype={a} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* 5 — Closing CTA band */}
      <section className="mt-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-beam border border-white/10 bg-white/[0.03] px-6 py-14 text-center sm:px-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -bottom-24 mx-auto h-56 w-[28rem] rounded-full bg-accent/15 blur-[110px]"
            />
            <h2 className="font-display text-3xl font-bold leading-tight sm:text-5xl">
              So — what does it{' '}
              <span className="bg-gradient-to-r from-accent-soft to-accent-alt bg-clip-text text-transparent">
                depend
              </span>{' '}
              on for you?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60">
              Five minutes to a map of how you actually move. No single box required.
            </p>
            <button
              type="button"
              onClick={() => onStart('short')}
              className={`mt-8 rounded-beam bg-accent px-8 py-3.5 text-sm font-semibold text-ink shadow-glow transition-transform hover:-translate-y-0.5 ${ring}`}
            >
              Start the test
            </button>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
