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
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="text-xs uppercase tracking-[0.25em] text-white/50">You are</span>
      <h1 className="font-display text-4xl font-bold leading-tight">{archetype.name}</h1>
      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[11px] tracking-wider text-accent-soft">{archetype.code}</span>
      <p className="text-sm text-white/80">{archetype.tagline}</p>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-white/70">{archetype.copy}</p>
      <span className="mt-3 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent-soft">{matchBand(confidence)}</span>
      {runnerUpName && <span className="text-xs text-white/40">with a streak of {runnerUpName}</span>}
    </div>
  )
}
