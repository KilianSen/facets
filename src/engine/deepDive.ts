import type { Answer, Archetype, AxisId, Content, Profile, Question } from './types'
import { axesOf, axisResidual } from './cast'
import { asRanked } from './firmUp'
import { measuredDims } from './rules'
import { findCrossroadsDilemma, isCrossroadsAnswer, type CrossroadsDilemma } from '../content/crossroads'

/**
 * The deep dive's chapters — each answers something a quick read can't:
 * 1. Which one are you? — head-to-head questions where a type and its closest rivals would answer differently.
 * 2. Across your life — your biggest shift plus the situations where you're steady, asked at work, dating, with
 *    friends and family.
 * 3. When situations collide — a crossroads for the pairs of situations you swing on hardest.
 * (Chapter 3's sharpen check reuses the sharpen round, on every strong swing.)
 */

/** Head-to-head questions per deep dive (simulated: retest agreement 70% → 75% for ~3 extra questions). */
export const DUEL_CAP = 6
/** Closest rivals each type is checked against. */
export const DUEL_RIVALS = 2
/**
 * Across-your-life questions go mostly where you're steady. On a situation you swing hard on, the swing alone already
 * picks the strongest answer in every setting, so a setting's pull can't show (simulated: ~20% of real setting
 * effects caught there, ~60–75% on steady situations, no false claims either way). Your biggest swing still gets a
 * few for the story.
 */
export const LIFE_STEADY_AXES = 3
/** Items per steady situation: every setting needs three questions per behaviour for a setting claim. */
export const LIFE_PER_AXIS = 3
/** Items on your biggest swing, when it swings at least LIFE_SWING. */
export const LIFE_STORY_ITEMS = 1
export const LIFE_SWING = 2
/** A pair of situations collides when both swing at least this hard… */
export const COLLIDE_SWING = 2
/** …and the chapter asks at most this many, strongest pairs first. */
export const COLLIDE_MAX = 3

/** Where a prototype's shape sits at a situation level: its slope plus its bend (orthogonal to the slope). */
const bendBasis = (level: number) => ((level - 0.5) ** 2 * 4 - 1 / 3) * 1.5

/** The option a type would pick for one case of a question. */
function typePick(q: Question, a: Archetype, level: number) {
  const dims = measuredDims(q)
  let best = q.options[0], bestErr = Infinity
  for (const o of q.options) {
    const err = dims.reduce((s, d) => {
      const target = (a.signature[q.axis!]?.[d] ?? 0) * (level - 0.5) + (a.curve?.[q.axis!]?.[d] ?? 0) * bendBasis(level)
      return s + ((o.vector[d] ?? 0) - target) ** 2
    }, 0)
    if (err < bestErr) { bestErr = err; best = o }
  }
  return best
}

/** The types closest to `id` on its own situations, closest first. */
export function rivalsOf(profile: Profile, id: string, content: Content, count = DUEL_RIVALS): Archetype[] {
  const a = content.archetypes.find(x => x.id === id)
  if (!a) return []
  const axes = [...axesOf(a)]
  return content.archetypes
    .filter(r => r.id !== id && axesOf(r).size > 0 && [...axesOf(r)].some(x => axes.includes(x)))
    .map(r => ({ r, d: axes.reduce((s, ax) => s + axisResidual(profile.signature, ax, axesOf(r).has(ax) ? r : null, content), 0) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, count)
    .map(x => x.r)
}

/**
 * Chapter 1: unasked base questions on the headline's (and first co-star's) situations where the type and its
 * closest rivals would answer most differently, asked ranked.
 */
export function pickDuelQuestions(profile: Profile, answers: Answer[], content: Content, cap = DUEL_CAP): Question[] {
  const asked = new Set(answers.map(a => a.questionId))
  const contenders = [profile.archetype.id, ...(profile.facets ?? []).slice(0, 1).map(f => f.archetypeId)]
  const score = new Map<Question, number>()
  for (const id of contenders) {
    const a = content.archetypes.find(x => x.id === id)
    if (!a) continue
    const axes = axesOf(a)
    for (const rival of rivalsOf(profile, id, content)) {
      for (const q of content.questions) {
        if (q.reserve || !q.axis || !q.cases || asked.has(q.id) || !axes.has(q.axis)) continue
        let s = 0
        for (const c of q.cases) {
          const pa = typePick(q, a, c.axisLevel), pr = typePick(q, rival, c.axisLevel)
          s += Math.sqrt(measuredDims(q).reduce((sum, d) => sum + ((pa.vector[d] ?? 0) - (pr.vector[d] ?? 0)) ** 2, 0))
        }
        if (s > 0) score.set(q, (score.get(q) ?? 0) + s)
      }
    }
  }
  return [...score.entries()].sort((x, y) => y[1] - x[1]).slice(0, cap).map(([q]) => asRanked(q))
}

export interface HeadToHeadEntry {
  archetype: Archetype
  /** share of your shift on the headline's situations this type explains (0..1) */
  share: number
}

/**
 * Chapter 1's verdict, rebuilt from the signature so a shared link shows it too: how much of your shift on the
 * headline's situations the headline explains, next to its closest look-alikes. Null for a type with no situations or
 * a flat read there.
 */
export function headToHead(profile: Profile, content: Content, count = DUEL_RIVALS): { axes: AxisId[]; lead: HeadToHeadEntry; rivals: HeadToHeadEntry[] } | null {
  const lead = content.archetypes.find(a => a.id === profile.archetype.id)
  const axes = lead ? [...axesOf(lead)] : []
  if (!lead || axes.length === 0) return null
  const total = axes.reduce((s, ax) => s + axisResidual(profile.signature, ax, null, content), 0)
  if (total <= 0) return null
  const share = (a: Archetype) =>
    Math.max(0, 1 - axes.reduce((s, ax) => s + axisResidual(profile.signature, ax, axesOf(a).has(ax) ? a : null, content), 0) / total)
  return {
    axes,
    lead: { archetype: lead, share: share(lead) },
    rivals: rivalsOf(profile, lead.id, content, count).map(r => ({ archetype: r, share: share(r) })),
  }
}

/** Situations by swing, strongest first (ties keep catalog order). */
function bySwing(profile: Profile, content: Content): AxisId[] {
  const swing = profile.axisSwing ?? {}
  return content.axes.map(a => a.id).sort((x, y) => (swing[y] ?? 0) - (swing[x] ?? 0))
}

/** Chapter 2: an item or two on your biggest swing (for the story), then the steady situations (for the setting read). */
export function pickLifeQuestions(profile: Profile, answers: Answer[], content: Content): Question[] {
  const asked = new Set(answers.map(a => a.questionId))
  const unasked = (axisId: AxisId) => content.questions.filter(q => q.acrossSettings && q.axis === axisId && !asked.has(q.id))
  const ordered = bySwing(profile, content)
  const biggest = ordered[0]
  const story = (profile.axisSwing?.[biggest] ?? 0) >= LIFE_SWING ? unasked(biggest).slice(0, LIFE_STORY_ITEMS) : []
  const steady = [...ordered].reverse()
    .filter(axisId => story.length === 0 || axisId !== biggest)
    .map(axisId => unasked(axisId).slice(0, LIFE_PER_AXIS))
    .filter(items => items.length > 0)
    .slice(0, LIFE_STEADY_AXES)
    .flat()
  return [...story, ...steady]
}

/** Chapter 3: crossroads for the strongest pairs of situations you swing on, not yet answered. */
export function pickCollideDilemmas(profile: Profile, answers: Answer[], content: Content): CrossroadsDilemma[] {
  const swing = profile.axisSwing ?? {}
  const axes = bySwing(profile, content).filter(id => (swing[id] ?? 0) >= COLLIDE_SWING)
  const answered = new Set(answers.filter(a => isCrossroadsAnswer(a.questionId)).map(a => a.questionId))
  const pairs: { d: CrossroadsDilemma; strength: number }[] = []
  for (let i = 0; i < axes.length; i++) {
    for (let j = i + 1; j < axes.length; j++) {
      const d = findCrossroadsDilemma(axes[i], axes[j])
      if (d && !answered.has(d.id)) pairs.push({ d, strength: (swing[axes[i]] ?? 0) + (swing[axes[j]] ?? 0) })
    }
  }
  return pairs.sort((x, y) => y.strength - x.strength).slice(0, COLLIDE_MAX).map(p => p.d)
}
