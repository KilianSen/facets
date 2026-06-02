import type { Archetype } from '../engine/types'
import { matchBand } from './matchBand'

export function ArchetypeHeader({
  archetype, confidence, runnerUpName,
}: {
  archetype: Archetype
  confidence: number
  runnerUpName?: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl bg-gradient-to-br from-fuchsia-500/20 to-blue-500/20 px-6 py-10 text-center">
      <span className="text-xs uppercase tracking-widest text-white/60">You are</span>
      <h1 className="text-3xl font-bold">{archetype.name}</h1>
      <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[11px] tracking-wider text-white/50">{archetype.code}</span>
      <p className="text-sm text-white/80">{archetype.tagline}</p>
      <p className="mt-3 max-w-prose text-sm text-white/70">{archetype.copy}</p>
      <span className="mt-2 text-xs uppercase tracking-wide text-white/40">{matchBand(confidence)}</span>
      {runnerUpName && <span className="text-xs text-white/40">with a streak of {runnerUpName}</span>}
    </div>
  )
}
