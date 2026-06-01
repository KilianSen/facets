import { type Content, type Signature, type ArchetypeMatch } from './types'

/** Euclidean distance between a user signature and a prototype signature over all axis×dim slopes. */
export function signatureDistance(
  sig: Signature,
  proto: Record<string, Record<string, number>>,
  content: Content,
): number {
  let sum = 0
  for (const axis of content.axes) {
    const protoAxis = proto[axis.id] ?? {}
    for (const dim of content.dims) {
      const userSlope = sig[axis.id]?.[dim.id]?.slope ?? 0
      const protoSlope = protoAxis[dim.id] ?? 0
      const d = userSlope - protoSlope
      sum += d * d
    }
  }
  return Math.sqrt(sum)
}

export function matchArchetype(sig: Signature, content: Content): ArchetypeMatch {
  if (content.archetypes.length === 0) throw new Error('No archetypes defined in content')

  const scored = content.archetypes.map((a, idx) => ({
    id: a.id,
    idx,
    dist: signatureDistance(sig, a.signature, content),
  }))
  scored.sort((a, b) => a.dist - b.dist || a.idx - b.idx) // nearest; tiebreak by catalog order

  const best = scored[0]
  const runnerUp = scored[1]

  let confidence = 1
  if (runnerUp) {
    const denom = best.dist + runnerUp.dist
    confidence = denom === 0 ? 0.5 : Math.max(0, Math.min(1, (runnerUp.dist - best.dist) / denom + 0.5))
  }

  return { id: best.id, confidence, runnerUpId: runnerUp?.id }
}
