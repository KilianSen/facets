import { Link } from '../router/router'
import { Reveal } from '../ui/Reveal'
import { Mark } from '../ui/Mark'
import { SiteNav } from '../ui/SiteNav'
import { btnPrimary, eyebrow, tag } from '../ui/styles'
import { ARCHETYPE_GROUPS, getArchetype } from './archetypeMeta'
import { ArchetypeCard } from './ArchetypeCard'

export function ArchetypesPage() {
  return (
    <div className="min-h-screen w-full">
      <SiteNav />

      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
        <Reveal><p className={eyebrow}>The field guide</p></Reveal>
        <Reveal delay={0.04}>
          <h1 className="mt-3 max-w-3xl font-serif text-5xl font-bold leading-[1] tracking-tight sm:text-7xl">
            {ARCHETYPE_GROUPS.reduce((n, g) => n + g.archetypeIds.length, 0)} ways <Mark>people shift</Mark>
          </h1>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            These are the archetypes. Each one is a <span className="font-semibold text-ink">pattern of how someone
            changes</span> as a single situation rises — closeness, audience, stakes, power, initiative, or
            energy — plus the shape-shifters who pivot on more than one, and the constant who barely moves at
            all. Nobody is one box. This is the shape of how you actually shift.
          </p>
        </Reveal>

        <div className="mt-16 flex flex-col gap-16 sm:mt-20 sm:gap-20">
          {ARCHETYPE_GROUPS.map(group => {
            const archetypes = group.archetypeIds.map(getArchetype).filter((a): a is NonNullable<typeof a> => !!a)
            return (
              <Reveal key={group.id}>
                <section aria-labelledby={`group-${group.id}`}>
                  <div className="flex flex-col gap-2 border-b-2 border-ink pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true" className="h-6 w-6 rounded-full border-2 border-ink" style={{ background: group.accent }} />
                      <h2 id={`group-${group.id}`} className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">{group.label}</h2>
                      <span className={`${tag} bg-white tabular-nums`}>{archetypes.length}</span>
                    </div>
                    <p className="text-sm font-semibold text-ink-soft">{group.spectrum}</p>
                  </div>
                  <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">{group.blurb}</p>
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {archetypes.map(a => <ArchetypeCard key={a.id} archetype={a} />)}
                  </div>
                </section>
              </Reveal>
            )
          })}
        </div>

        <Reveal>
          <div className="mt-24 flex flex-col items-center gap-5 rounded-card border-2 border-ink bg-ink px-6 py-14 text-center text-paper">
            <p className="font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Don't know which one you are?</p>
            <p className="max-w-md text-[15px] leading-relaxed text-paper/75">
              You're probably a few of these at once. The test reads which way you actually lean — and how
              far you swing when the situation turns up.
            </p>
            <Link to="/" className={`${btnPrimary} mt-1 shadow-none`}>Take the test →</Link>
          </div>
        </Reveal>
      </main>
    </div>
  )
}
