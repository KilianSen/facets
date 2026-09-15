import { Link } from '../router/router'
import { Reveal } from '../ui/Reveal'
import { SiteNav } from '../ui/SiteNav'
import { CONTENT } from '../content'
import { btnGhost, btnPrimary, card, eyebrow, stamp, tag, tint } from '../ui/styles'
import { ArchetypeCard } from './ArchetypeCard'
import { SignatureGraph } from './SignatureGraph'
import { SignatureCrystal } from '../signature/SignatureCrystal'
import { shapeFromArchetype } from '../signature/shape'
import { getArchetype, accentOf, groupOf, relatedArchetypes } from './archetypeMeta'

export function ArchetypeDetailPage({ id }: { id: string }) {
  const archetype = getArchetype(id)

  if (!archetype) {
    return (
      <div className="min-h-screen w-full">
        <SiteNav />
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 px-5 py-24 text-center">
          <p className={eyebrow}>404 · no such type</p>
          <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight">That archetype doesn’t exist.</h1>
          <p className="text-[15px] leading-relaxed text-ink-soft">The link may be stale, or the code got mangled on the way here.</p>
          <div className="flex flex-col items-center gap-3">
            <Link to="/archetypes" className={btnPrimary}>Browse all archetypes →</Link>
            <Link to="/" className={btnGhost}>Back home</Link>
          </div>
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

  const h2 = 'font-serif text-3xl font-bold tracking-tight'

  return (
    <div className="min-h-screen w-full">
      <SiteNav />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-14 px-4 py-10 sm:px-6 sm:py-14">
        <Reveal>
          <Link to="/archetypes" className={btnGhost}>← All archetypes</Link>
        </Reveal>

        <Reveal delay={0.04}>
          <article className={`${card} overflow-hidden`}>
            <div aria-hidden="true" className="h-5 border-b-2 border-ink" style={{ background: accent }} />
            <div className="grid md:grid-cols-[1.25fr_1fr]">
              <div className="flex flex-col gap-4 px-6 py-8 sm:px-10 sm:py-10">
                {group && <span className={`${tag} w-fit`} style={{ background: tint(accent) }}>A {group.label} type</span>}
                <h1 className="font-serif text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl">{archetype.name}</h1>
                <span className={`${stamp} w-fit text-xs`}>{archetype.code}</span>
                <p className="font-serif text-2xl italic text-ink-soft">{archetype.tagline}</p>
                <p className="max-w-prose text-lg leading-relaxed text-ink-soft">{archetype.copy}</p>
              </div>
              <figure className="flex flex-col items-center justify-center border-t-2 border-ink bg-paper-deep px-3 py-4 md:border-l-2 md:border-t-0">
                <SignatureCrystal shape={shapeFromArchetype(archetype)} accent={accent} className="h-64 w-full" />
                <figcaption className="text-center text-xs text-ink-soft">Its signature in 3D · drag to turn</figcaption>
              </figure>
            </div>
          </article>
        </Reveal>

        <Reveal delay={0.08}>
          <section className="flex flex-col gap-4">
            <header className="flex flex-col gap-1">
              <h2 className={h2}>How you shift</h2>
              <p className="text-[15px] leading-relaxed text-ink-soft">
                Each dial below moves as the situation climbs from low to high — that shift <em>is</em> the type.
              </p>
            </header>
            <SignatureGraph archetype={archetype} accent={accent} />
          </section>
        </Reveal>

        {leans.length > 0 && (
          <Reveal delay={0.1}>
            <section className="flex flex-col gap-4">
              <header className="flex flex-col gap-1">
                <h2 className={h2}>Your baseline lean</h2>
                <p className="text-[15px] leading-relaxed text-ink-soft">Before any situation tips the scales — where this type rests by default.</p>
              </header>
              <div className="flex flex-wrap gap-2.5">
                {leans.map(({ dim, value }) => (
                  <div key={dim.id} className="flex items-center gap-2 rounded-full border-2 border-ink bg-white py-1 pl-1 pr-4">
                    <span className="rounded-full border-2 border-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ background: tint(accent) }}>
                      {dim.name}
                    </span>
                    <span className="text-sm font-medium">{value > 0 ? dim.highLabel : dim.lowLabel}</span>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {related.length > 0 && (
          <Reveal delay={0.12}>
            <section className="flex flex-col gap-5">
              <header className="flex flex-col gap-1">
                <h2 className={h2}>If not this…</h2>
                {group && <p className="text-[15px] leading-relaxed text-ink-soft">Others who pivot on {group.label}.</p>}
              </header>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {related.map(a => <ArchetypeCard key={a.id} archetype={a} />)}
              </div>
            </section>
          </Reveal>
        )}

        <Reveal delay={0.14}>
          <div className="flex flex-col items-center gap-5 rounded-card border-2 border-ink bg-ink px-6 py-12 text-center text-paper sm:flex-row sm:justify-between sm:text-left">
            <div className="flex flex-col gap-1">
              <h2 className="font-serif text-3xl font-bold tracking-tight">Which one are you?</h2>
              <p className="text-[15px] text-paper/75">Take the test and see how you actually show up.</p>
            </div>
            <Link to="/" className={`${btnPrimary} shrink-0 shadow-none`}>Take the test →</Link>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
