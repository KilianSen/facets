import { useRef } from 'react'
import type { Answer, Content, Profile } from '../engine/types'
import { sharpenReadout, motiveReadout, computeFacets, facetCode } from '../engine'
import { ArchetypeHeader, type HeaderFacet } from './ArchetypeHeader'
import { SignatureSection } from './SignatureSection'
import { SharpenVerdict } from './SharpenVerdict'
import { MotiveSection } from './MotiveSection'
import { DimensionStory } from './DimensionStory'
import { accentOf } from '../archetypes/archetypeMeta'
import { Beam } from '../ui/Beam'
import { Reveal } from '../ui/Reveal'
import { ShareBar } from '../share/ShareBar'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'

export function ResultPage({
  profile, content, answers, onRestart, compareWith,
}: {
  profile: Profile
  content: Content
  answers: Answer[]
  onRestart: () => void
  /** set when this run answers someone's compare invite */
  compareWith?: { name?: string; onOpen: () => void }
}) {
  const archetype = content.archetypes.find(a => a.id === profile.archetype.id)!
  const runnerUp = profile.archetype.runnerUpId
    ? content.archetypes.find(a => a.id === profile.archetype.runnerUpId)
    : undefined
  const cardRef = useRef<HTMLDivElement>(null)
  const accent = accentOf(profile.archetype.id)
  // Verdict from any opt-in sharpen round — derived from the answers, so it survives permalink/resume.
  const readouts = sharpenReadout(answers, content)
  const motives = motiveReadout(answers, content)
  // Legacy cached profiles predate facets; derive them from the stored signature.
  const facets = profile.facets ?? computeFacets(profile.signature, profile.archetype.id, content)
  const headerFacets: HeaderFacet[] = facets.flatMap(f => {
    const a = content.archetypes.find(x => x.id === f.archetypeId)
    const axis = content.axes.find(x => x.id === f.axisId)
    return a && axis ? [{ archetype: a, lens: axis.lens ?? axis.name.toLowerCase() }] : []
  })

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-7 px-5 py-12">
      {compareWith && (
        <Reveal>
          <button
            type="button"
            onClick={compareWith.onOpen}
            className={`w-full rounded-beam bg-accent/15 px-5 py-3 text-sm font-medium text-accent-soft shadow-glow transition-colors hover:bg-accent/25 ${ring}`}
          >
            See how you compare with {compareWith.name ?? 'them'} →
          </button>
        </Reveal>
      )}
      <div ref={cardRef} className="flex flex-col gap-7">
        <Reveal>
          <Beam glow innerClassName="bg-gradient-to-br from-fuchsia-500/20 via-transparent to-blue-500/20 px-6 py-10">
            <ArchetypeHeader
              archetype={archetype}
              confidence={profile.archetype.confidence}
              runnerUpName={runnerUp?.name}
              facets={headerFacets}
              code={facetCode(archetype.id, facets, content)}
            />
          </Beam>
        </Reveal>
        <Reveal delay={0.08}>
          <SignatureSection
            signature={profile.signature}
            baseline={profile.baseline}
            contingencies={profile.topContingencies}
            flexibility={profile.flexibility}
            dims={content.dims}
            accent={accent}
            archetype={archetype}
          />
        </Reveal>
        {motives.reads.length > 0 && <Reveal delay={0.1}><MotiveSection readout={motives} axes={content.axes} /></Reveal>}
        {readouts.length > 0 && <Reveal delay={0.12}><SharpenVerdict axes={content.axes} readouts={readouts} /></Reveal>}
      </div>

      <Reveal delay={0.18}><DimensionStory dims={content.dims} ranges={profile.dimensionRanges} /></Reveal>

      <Reveal delay={0.26} className="flex flex-col items-center gap-4">
        <ShareBar archetypeId={profile.archetype.id} answers={answers} cardRef={cardRef} />
        <button
          type="button"
          onClick={onRestart}
          className={`rounded text-sm text-white/50 transition-colors hover:text-white/80 ${ring}`}
        >
          Take it again
        </button>
      </Reveal>
    </div>
  )
}
