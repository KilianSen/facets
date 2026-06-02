import type { Archetype } from '../engine/types'

export function ArchetypeHeader({ archetype, confidence }: { archetype: Archetype; confidence: number }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl bg-gradient-to-br from-fuchsia-500/20 to-blue-500/20 px-6 py-10 text-center">
      <span className="text-xs uppercase tracking-widest text-white/60">You are</span>
      <h1 className="text-3xl font-bold">{archetype.code}</h1>
      <p className="text-sm text-white/80">{archetype.name} · {archetype.tagline}</p>
      <p className="mt-3 max-w-prose text-sm text-white/70">{archetype.copy}</p>
      <span className="mt-2 text-xs text-white/40">{Math.round(confidence * 100)}% match</span>
    </div>
  )
}
