import { Link } from '../router/router'
import { Reveal } from '../ui/Reveal'
import { ARCHETYPE_GROUPS, getArchetype } from './archetypeMeta'
import { ArchetypeCard } from './ArchetypeCard'

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'

export function ArchetypesPage() {
  return (
    <div className="min-h-screen w-full">
      {/* Top bar — minimal, sticky, glass over ink */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3.5">
          <Link
            to="/"
            className={`rounded text-sm font-medium tracking-wide text-white/60 transition-colors hover:text-white ${ring}`}
          >
            <span aria-hidden="true">←</span> FPTIC
          </Link>
          <Link
            to="/"
            className={`rounded-beam bg-accent/15 px-4 py-2 text-sm font-medium text-accent-soft shadow-glow transition-colors hover:bg-accent/25 ${ring}`}
          >
            Take the test <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-14 sm:pt-20">
        {/* Editorial header */}
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-accent-soft/70">The Field Guide</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold leading-[1.02] sm:text-6xl">
            20 ways
            <br className="hidden sm:block" /> people shift
          </h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            These are the archetypes. Each one is a <span className="text-white/90">pattern of how someone
            changes</span> as a single situation rises — closeness, audience, stakes, power, initiative, or
            energy — plus the shape-shifters who pivot on more than one, and the constant who barely moves at
            all. Nobody is one box. This is the shape of your "it depends."
          </p>
        </Reveal>

        {/* The gallery — one section per group, accent does the organising */}
        <div className="mt-16 flex flex-col gap-20 sm:mt-20 sm:gap-24">
          {ARCHETYPE_GROUPS.map((group, i) => {
            const archetypes = group.archetypeIds
              .map(getArchetype)
              .filter((a): a is NonNullable<typeof a> => !!a)

            return (
              <Reveal key={group.id} delay={i === 0 ? 0 : 0.04}>
                <section aria-labelledby={`group-${group.id}`}>
                  <div className="flex flex-col gap-2 border-l-2 pl-4" style={{ borderColor: group.accent }}>
                    <div className="flex items-baseline gap-3">
                      <h2
                        id={`group-${group.id}`}
                        className="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
                        style={{ color: group.accent }}
                      >
                        {group.label}
                      </h2>
                      <span className="font-mono text-xs tabular-nums text-white/30">
                        {String(archetypes.length).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
                      {group.spectrum}
                    </p>
                    <p className="max-w-xl text-sm leading-relaxed text-white/65">{group.blurb}</p>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {archetypes.map(a => (
                      <ArchetypeCard key={a.id} archetype={a} />
                    ))}
                  </div>
                </section>
              </Reveal>
            )
          })}
        </div>

        {/* Closing CTA */}
        <Reveal delay={0.04}>
          <div className="mt-24 flex flex-col items-center gap-5 rounded-beam border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
            <p className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
              Don't know which one you are?
            </p>
            <p className="max-w-md text-sm leading-relaxed text-white/60">
              You're probably a few of these at once. The test reads which way you actually lean — and how
              far you swing when the situation turns up.
            </p>
            <Link
              to="/"
              className={`mt-1 rounded-beam bg-accent px-7 py-3 text-sm font-semibold text-ink shadow-glow transition-transform hover:-translate-y-0.5 ${ring}`}
            >
              Take the test <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Reveal>
      </main>
    </div>
  )
}
