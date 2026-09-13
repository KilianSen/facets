import { Link } from '../router/router'
import { Beam } from '../ui/Beam'
import { Reveal } from '../ui/Reveal'
import { CONTENT } from '../content'
import { ArchetypeCard } from './ArchetypeCard'
import { SignatureGraph } from './SignatureGraph'
import { getArchetype, accentOf, groupOf, relatedArchetypes } from './archetypeMeta'

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'

export function ArchetypeDetailPage({ id }: { id: string }) {
  const archetype = getArchetype(id)

  if (!archetype) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-5 px-5 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">404 · no such type</p>
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
          That archetype doesn’t exist.
        </h1>
        <p className="text-sm leading-relaxed text-white/60">
          The link may be stale, or the code got mangled on the way here.
        </p>
        <div className="flex flex-col items-center gap-2">
          <Link
            to="/archetypes"
            className={`rounded-beam bg-accent/15 px-5 py-2.5 text-sm font-medium text-accent-soft shadow-glow transition-colors hover:bg-accent/25 ${ring}`}
          >
            Browse all archetypes →
          </Link>
          <Link
            to="/"
            className={`rounded text-xs text-white/40 transition-colors hover:text-white/70 ${ring}`}
          >
            Back home
          </Link>
        </div>
      </div>
    )
  }

  const accent = accentOf(id)
  const group = groupOf(id)
  const related = relatedArchetypes(id)

  // Plain-language baseline leans: each dim with a non-zero lean → its verb phrase, strongest first.
  const baseline = archetype.baseline ?? {}
  const leans = CONTENT.dims
    .map(d => ({ dim: d, value: baseline[d.id] ?? 0 }))
    .filter(x => x.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-5 py-10 sm:py-14">
      {/* 1 · Top bar */}
      <Reveal>
        <nav className="flex items-center justify-between text-sm">
          <Link
            to="/archetypes"
            className={`rounded text-white/50 transition-colors hover:text-white/85 ${ring}`}
          >
            ← All archetypes
          </Link>
          <Link
            to="/"
            className={`rounded font-medium text-accent-soft transition-colors hover:text-accent ${ring}`}
          >
            Take the test →
          </Link>
        </nav>
      </Reveal>

      {/* 2 · Hero — the trading-card moment */}
      <Reveal delay={0.06}>
        <div className="relative">
          {/* accent radial glow behind the card */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-8 -top-16 bottom-0 opacity-40 blur-3xl"
            style={{ background: `radial-gradient(60% 55% at 50% 0%, ${accent}, transparent 70%)` }}
          />
          <Beam glow className="relative">
            <div className="flex flex-col gap-5 px-6 py-10 sm:px-10 sm:py-12">
              {group && (
                <span
                  className="text-xs font-semibold uppercase tracking-[0.3em]"
                  style={{ color: accent }}
                >
                  A {group.label} type
                </span>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <h1 className="font-display text-5xl font-bold leading-[0.95] text-white sm:text-7xl">
                  {archetype.name}
                </h1>
                <span
                  className="w-fit rounded-full border px-3 py-1 font-mono text-xs tracking-[0.2em]"
                  style={{ color: accent, borderColor: `${accent}66`, background: `${accent}12` }}
                >
                  {archetype.code}
                </span>
              </div>

              <p className="text-lg font-medium text-white/85 sm:text-xl" style={{ color: accent }}>
                {archetype.tagline}
              </p>

              <p className="max-w-prose text-base leading-relaxed text-white/70 sm:text-lg">
                {archetype.copy}
              </p>
            </div>
          </Beam>
        </div>
      </Reveal>

      {/* 3 · How you shift */}
      <Reveal delay={0.12}>
        <section className="flex flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">How you shift</h2>
            <p className="text-sm leading-relaxed text-white/55">
              Each dial below moves as the situation climbs from low to high — that shift <em>is</em> the type.
            </p>
          </header>
          <SignatureGraph archetype={archetype} accent={accent} />
        </section>
      </Reveal>

      {/* 4 · Baseline lean — only when authored */}
      {leans.length > 0 && (
        <Reveal delay={0.16}>
          <section className="flex flex-col gap-4">
            <header className="flex flex-col gap-1">
              <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">Your baseline lean</h2>
              <p className="text-sm leading-relaxed text-white/55">
                Before any situation tips the scales — where this type rests by default.
              </p>
            </header>
            <div className="flex flex-wrap gap-2.5">
              {leans.map(({ dim, value }) => (
                <div
                  key={dim.id}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-2.5 pr-4"
                >
                  <span
                    className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                    style={{ color: accent, background: `${accent}1a` }}
                  >
                    {dim.name}
                  </span>
                  <span className="text-sm text-white/80">
                    {value > 0 ? dim.highLabel : dim.lowLabel}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* 5 · If not this… */}
      {related.length > 0 && (
        <Reveal delay={0.2}>
          <section className="flex flex-col gap-5">
            <header className="flex flex-col gap-1">
              <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">If not this…</h2>
              {group && (
                <p className="text-sm leading-relaxed text-white/55">
                  Others who pivot on {group.label}.
                </p>
              )}
            </header>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {related.map(a => (
                <ArchetypeCard key={a.id} archetype={a} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* 6 · Closing CTA */}
      <Reveal delay={0.24}>
        <Beam className="overflow-hidden">
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
                Which one are you?
              </h2>
              <p className="text-sm text-white/55">Take the test and see how you actually show up.</p>
            </div>
            <Link
              to="/"
              className={`shrink-0 rounded-beam bg-accent/15 px-6 py-3 text-sm font-medium text-accent-soft shadow-glow transition-colors hover:bg-accent/25 ${ring}`}
            >
              Take the test →
            </Link>
          </div>
        </Beam>
      </Reveal>
    </div>
  )
}
