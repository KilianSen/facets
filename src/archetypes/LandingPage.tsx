import { Reveal } from '../ui/Reveal'
import { Link } from '../router/router'
import { ArchetypeCard } from './ArchetypeCard'
import { ARCHETYPES_IN_ORDER } from './archetypeMeta'

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'

// A varied half-dozen pulled from across the gallery groups (every ~3rd tile), so the teaser reads as
// a spread of different "shapes" rather than four neighbours from one cluster.
const TEASER = ARCHETYPES_IN_ORDER.filter((_, i) => i % 3 === 0).slice(0, 6)

// The promise that actually sets this test apart: you finish, you get your result — no wall, no catch.
const PROMISES = ['No signup', 'No email', 'Your result on the spot', 'Stays in your browser', '~5 min']

const STEPS = [
  {
    n: '01',
    slope: 0,
    accent: '#22d3ee',
    title: 'Answer honestly',
    body: 'When one box doesn’t fit, say “it depends” and split your answer by context instead of forcing a single choice.',
  },
  {
    n: '02',
    slope: 1.6,
    accent: '#818cf8',
    title: 'Rank what pulls at you',
    body: 'Order the situations that tug hardest, then map how you actually behave in each one.',
  },
  {
    n: '03',
    slope: -1.6,
    accent: '#d946ef',
    title: 'Get your signature',
    body: 'See how you shift as the stakes rise — and the archetype that shift makes you.',
  },
]

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3 text-accent-soft" aria-hidden="true" fill="none">
      <path d="M3 8.5l3 3 7-7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// A tiny rising/falling beam — the "it depends" slope motif, reused as the step glyphs. Mirrors the
// archetype fingerprint look: a gradient line resting at centre with a faint fill under it.
function Tick({ slope, accent, uid }: { slope: number; accent: string; uid: string }) {
  const off = Math.max(-10, Math.min(10, slope * 5))
  return (
    <svg viewBox="0 0 40 24" className="h-6 w-10" aria-hidden="true">
      <defs>
        <linearGradient id={`tick-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={accent} stopOpacity="0.2" />
          <stop offset="1" stopColor={accent} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`tick-${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.18" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="3" y1="12" x2="37" y2="12" stroke="white" strokeOpacity="0.1" strokeDasharray="3 4" />
      <path d={`M 3 ${12 + off} L 37 ${12 - off} L 37 12 L 3 12 Z`} fill={`url(#tick-${uid}-fill)`} />
      <line x1="3" y1={12 + off} x2="37" y2={12 - off} stroke={`url(#tick-${uid})`} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="37" cy={12 - off} r="3" fill={accent} />
    </svg>
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
    <div className="relative w-full px-5 pb-24 pt-16 sm:px-8 sm:pt-24 lg:px-12 xl:px-20">
      {/* Layered radial glows — the dark "beam" hero wash. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute right-[-10%] top-12 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute left-1/3 top-[34rem] h-72 w-72 rounded-full bg-indigo-500/15 blur-[130px]" />
      </div>

      {/* 1 — Hero */}
      <header className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.4em] text-accent-soft/70">Facets · personality test</p>
        </Reveal>
        {invite && (
          <Reveal delay={0.03}>
            <p className="rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent-soft">
              {invite.name ?? 'A friend'} invited you to compare — finish the test and we’ll line you up.
            </p>
          </Reveal>
        )}
        <Reveal delay={0.06}>
          <h1 className="font-display text-[2.5rem] font-bold leading-[1.05] sm:text-6xl xl:text-7xl">
            Find out how you{' '}
            <span className="bg-gradient-to-r from-accent via-accent-soft to-accent-alt bg-clip-text text-transparent">
              actually show up.
            </span>
          </h1>
        </Reveal>
        <Reveal delay={0.13}>
          <p className="max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            A personality test that respects you. Take it and see your full result the moment you
            finish — no email, no signup, no catch.
          </p>
        </Reveal>

        {/* The no-gatekeeping promise — the thing that actually sets this apart. */}
        <Reveal delay={0.18}>
          <ul className="flex flex-wrap justify-center gap-2">
            {PROMISES.map(p => (
              <li
                key={p}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70"
              >
                <Check />
                {p}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* 2 — Primary CTAs */}
        <Reveal delay={0.24} className="flex w-full flex-col gap-4">
          {resume && (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onContinue}
                className={`rounded-beam bg-accent/15 px-6 py-3 text-sm font-medium text-accent-soft shadow-glow transition-colors hover:bg-accent/25 ${ring}`}
              >
                Continue your run ({resume.index}/{resume.total})
              </button>
              <span className="text-xs text-white/40">or start fresh</span>
            </div>
          )}

          <div className="flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Choose your depth</p>
            <div className="flex w-full flex-col gap-3 sm:max-w-xl sm:flex-row sm:items-stretch">
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
          </div>
        </Reveal>
      </header>

      {/* 3 — What makes it different (the "it depends" mechanic lives here now, as a feature) */}
      <section className="mt-28">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">What makes it different</p>
          <h2 className="mt-2 max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Real life is “it depends.” Most tests pretend it isn’t.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/65">
            Other tests force you into one box. Here, when the honest answer is “it depends,” you can
            say so — set the context, and walk away with a map of how you actually shift.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={0.08 * i}>
              <div className="flex h-full flex-col gap-4 rounded-beam border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs tracking-widest text-white/35">{s.n}</span>
                  <Tick slope={s.slope} accent={s.accent} uid={s.n} />
                </div>
                <h3 className="font-display text-xl font-semibold leading-tight text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/65">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <Link
            to="/method"
            className={`mt-6 inline-flex items-center gap-1 rounded text-sm font-medium text-accent-soft transition-colors hover:text-accent ${ring}`}
          >
            See exactly how we measure you →
          </Link>
        </Reveal>
      </section>

      {/* 4 — Archetype teaser */}
      <section className="mt-28">
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent-soft/60">The cast</p>
              <h2 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                22 ways to show up.
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">
                Each archetype is a portrait of how a person shows up — and how that shifts when the
                situation changes.
              </p>
            </div>
            <Link
              to="/archetypes"
              className={`shrink-0 rounded-beam px-1 text-sm font-medium text-accent-soft transition-colors hover:text-accent ${ring}`}
            >
              Explore all 22 archetypes →
            </Link>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
              Ready to{' '}
              <span className="bg-gradient-to-r from-accent-soft to-accent-alt bg-clip-text text-transparent">
                meet yourself?
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60">
              Five minutes, and your full result is yours — no email, no signup, no catch.
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
