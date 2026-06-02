import { useRef } from 'react'
import type { Answer, Content, Profile } from '../engine/types'
import { ArchetypeHeader } from './ArchetypeHeader'
import { SignatureMap } from './SignatureMap'
import { DimensionRanges } from './DimensionRanges'
import { BaselineReadout } from './BaselineReadout'
import { Beam } from '../ui/Beam'
import { Reveal } from '../ui/Reveal'
import { ShareBar } from '../share/ShareBar'

export function ResultPage({
  profile, content, answers, onRestart,
}: {
  profile: Profile
  content: Content
  answers: Answer[]
  onRestart: () => void
}) {
  const archetype = content.archetypes.find(a => a.id === profile.archetype.id)!
  const runnerUp = profile.archetype.runnerUpId
    ? content.archetypes.find(a => a.id === profile.archetype.runnerUpId)
    : undefined
  const cardRef = useRef<HTMLDivElement>(null)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-7 px-5 py-12">
      <div ref={cardRef} className="flex flex-col gap-7">
        <Reveal>
          <Beam glow innerClassName="bg-gradient-to-br from-fuchsia-500/20 via-transparent to-blue-500/20 px-6 py-10">
            <ArchetypeHeader archetype={archetype} confidence={profile.archetype.confidence} runnerUpName={runnerUp?.name} />
          </Beam>
        </Reveal>
        <Reveal delay={0.08}><SignatureMap contingencies={profile.topContingencies} /></Reveal>
        <Reveal delay={0.14}><BaselineReadout dims={content.dims} baseline={profile.baseline} flexibility={profile.flexibility} /></Reveal>
        <Reveal delay={0.2}><DimensionRanges dims={content.dims} ranges={profile.dimensionRanges} /></Reveal>
      </div>

      <Reveal delay={0.26} className="flex flex-col items-center gap-4">
        <ShareBar archetypeId={profile.archetype.id} answers={answers} cardRef={cardRef} />
        <button
          type="button"
          onClick={onRestart}
          className="rounded text-sm text-white/50 transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          Take it again
        </button>
      </Reveal>
    </div>
  )
}
