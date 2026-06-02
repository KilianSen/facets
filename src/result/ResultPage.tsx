import type { Content, Profile } from '../engine/types'
import { ArchetypeHeader } from './ArchetypeHeader'
import { SignatureMap } from './SignatureMap'
import { DimensionRanges } from './DimensionRanges'
import { BaselineReadout } from './BaselineReadout'

export function ResultPage({ profile, content, onRestart }: { profile: Profile; content: Content; onRestart: () => void }) {
  const archetype = content.archetypes.find(a => a.id === profile.archetype.id)!
  const runnerUp = profile.archetype.runnerUpId
    ? content.archetypes.find(a => a.id === profile.archetype.runnerUpId)
    : undefined
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-5 py-12">
      <ArchetypeHeader archetype={archetype} confidence={profile.archetype.confidence} runnerUpName={runnerUp?.name} />
      <SignatureMap contingencies={profile.topContingencies} />
      <BaselineReadout dims={content.dims} baseline={profile.baseline} flexibility={profile.flexibility} />
      <DimensionRanges dims={content.dims} ranges={profile.dimensionRanges} />
      <button
        type="button"
        onClick={onRestart}
        className="self-center rounded text-sm text-white/50 transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      >
        Take it again
      </button>
    </div>
  )
}
