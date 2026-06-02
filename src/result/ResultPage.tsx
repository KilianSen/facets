import type { Content, Profile } from '../engine/types'
import { ArchetypeHeader } from './ArchetypeHeader'
import { SignatureMap } from './SignatureMap'
import { DimensionRanges } from './DimensionRanges'

export function ResultPage({ profile, content, onRestart }: { profile: Profile; content: Content; onRestart: () => void }) {
  const archetype = content.archetypes.find(a => a.id === profile.archetype.id)!
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-5 py-12">
      <ArchetypeHeader archetype={archetype} confidence={profile.archetype.confidence} />
      <SignatureMap contingencies={profile.topContingencies} />
      <DimensionRanges dims={content.dims} ranges={profile.dimensionRanges} />
      <button type="button" onClick={onRestart} className="self-center text-sm text-white/50 hover:text-white/80">
        Take it again
      </button>
    </div>
  )
}
