import { useRef, useState } from 'react'
import type { Answer, Archetype, AxisId, Content, Profile } from '../engine/types'
import { sharpenReadout, motiveReadout, computeCast, castFacets, facetCode, strongestTell, axesOf, synthesizeInterplay, computeSettingOffsets, headToHead } from '../engine'
import { ArchetypeHeader, type HeaderFacet } from './ArchetypeHeader'
import { SignatureSection } from './SignatureSection'
import { SettingsSection } from './SettingsSection'
import { SharpenVerdict } from './SharpenVerdict'
import { MotiveSection } from './MotiveSection'
import { InterplaySection } from './InterplaySection'
import { CollideSection } from './CollideSection'
import { HeadToHeadSection } from './HeadToHeadSection'
import { isCrossroadsAnswer } from '../content/crossroads'
import { DimensionStory } from './DimensionStory'
import { UnexplainedSection } from './UnexplainedSection'
import { matchBand } from './matchBand'
import { StoryShare } from '../share/StoryShare'
import type { StoryData } from '../share/StoryCard'
import { firstPerson } from '../share/story'
import { accentOf } from '../archetypes/archetypeMeta'
import { Reveal } from '../ui/Reveal'
import { ShareBar } from '../share/ShareBar'
import { SignatureCrystal } from '../signature/SignatureCrystal'
import { fitExtremes, gemCap, shapeFromArchetype, shapeFromSignature, strongestAxis } from '../signature/shape'
import { btnGhost, btnPrimary, ring } from '../ui/styles'

/** Crystal colour for a situation no type in your cast explains. */
const UNCLAIMED = '#D6CEC2'

interface CastMember { archetype: Archetype; role: string; axisId?: AxisId }

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
  const archetype = content.archetypes.find(a => a.id === profile.archetype.id)
  if (!archetype) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 px-5 py-24 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-faint">result error</p>
        <h1 className="font-serif text-3xl font-bold leading-tight">Unable to find this archetype.</h1>
        <p className="text-[15px] leading-relaxed text-ink-soft">
          This result profile references an unknown or retired archetype.
        </p>
        <button type="button" onClick={onRestart} className={btnPrimary}>Start a fresh run →</button>
      </div>
    )
  }

  const runnerUp = profile.archetype.runnerUpId
    ? content.archetypes.find(a => a.id === profile.archetype.runnerUpId)
    : undefined
  const cardRef = useRef<HTMLDivElement>(null)
  const accent = accentOf(profile.archetype.id)
  // Verdict from any opt-in sharpen round — derived from the answers, so it survives permalink/resume.
  const readouts = sharpenReadout(answers, content)
  const motives = motiveReadout(answers, content)
  // Legacy cached profiles predate the cast; derive it from the stored signature.
  const facets = profile.facets
    ?? castFacets(computeCast(profile.signature, profile.baseline ?? {}, content)).filter(f => f.archetypeId !== profile.archetype.id)
  const coStars: HeaderFacet[] = facets.flatMap(f => {
    const a = content.archetypes.find(x => x.id === f.archetypeId)
    const axes = (f.axes ?? [f.axisId]).map(id => content.axes.find(x => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x)
    return a && axes.length > 0
      ? [{
          archetype: a,
          axes: axes.map(x => x.id),
          lens: axes.map(x => x.lens ?? x.name.toLowerCase()).join(' & '),
          axisId: f.axisId,
          tell: strongestTell(profile.signature, f.axisId, content),
        }]
      : []
  })
  // The runner-up only earns its own "almost" card when it isn't already on screen as a co-star.
  const nearMiss = runnerUp && runnerUp.id !== archetype.id && !coStars.some(f => f.archetype.id === runnerUp.id) ? runnerUp : undefined
  const interplay = synthesizeInterplay(profile, content, answers)
  const settingOffsets = computeSettingOffsets(answers, content)
  // A deep dive settles the headline head-to-head (chapter 1); every deep dive asks across-your-life items, so they mark it.
  const isDeepDive = answers.some(a => content.questions.find(q => q.id === a.questionId)?.acrossSettings)
  const duel = isDeepDive ? headToHead(profile, content) : null

  // One selected situation drives both the 3D crystal (tap a crystal) and the gem's morph below.
  const shape = shapeFromSignature(profile.signature, profile.baseline)
  const [axisId, setAxisId] = useState(() => strongestAxis(shape, content))

  // Colour each crystal by the type in your cast that explains that situation.
  const lead = axesOf(archetype)
  const colors: Record<AxisId, string> = {}
  for (const a of content.axes) colors[a.id] = lead.has(a.id) ? accent : UNCLAIMED
  // Co-stars arrive strongest first, so the first type to claim a situation colours its crystal.
  for (const f of coStars) for (const id of f.axes ?? []) if (colors[id] === UNCLAIMED) colors[id] = accentOf(f.archetype.id)
  const crystalColors = content.axes.some(a => colors[a.id] !== UNCLAIMED) ? colors : undefined

  // Whose crystals to show see-through over yours. One shared scale for the whole cast, so switching
  // the comparison never resizes you.
  const cast: CastMember[] = [
    { archetype, role: 'your type' },
    ...coStars.map(f => ({ archetype: f.archetype, role: f.lens, axisId: f.axisId })),
    ...(nearMiss ? [{ archetype: nearMiss, role: 'almost' }] : []),
  ]
  const castShapes = new Map(cast.map(c => [c.archetype.id, shapeFromArchetype(c.archetype)]))
  const crystalCap = gemCap([shape, ...castShapes.values()], content)
  const [compareId, setCompareId] = useState<string | null>(archetype.id)
  const compared = cast.find(c => c.archetype.id === compareId)
  const comparedShape = compared ? castShapes.get(compared.archetype.id) : undefined
  const fit = comparedShape ? fitExtremes(shape, comparedShape, content) : null
  const axisName = (id: string) => content.axes.find(a => a.id === id)?.name ?? id

  // The story card: headline + co-stars, and one first-person line — what no type covers, else the top tell.
  const firstLeftover = profile.unexplained?.[0]
  const topTell = profile.topContingencies[0]
  const story: StoryData = {
    name: archetype.name,
    tagline: firstPerson(archetype.tagline),
    accent,
    band: matchBand(profile.archetype.confidence),
    coStars: coStars.map(f => ({ name: f.archetype.name, accent: accentOf(f.archetype.id) })),
    also: firstLeftover ? firstPerson(firstLeftover.text) : topTell ? firstPerson(topTell.text) : undefined,
    alsoLabel: firstLeftover ? 'Also true about me' : 'My biggest tell',
    shape, colors: crystalColors, cap: crystalCap,
  }

  function compare(id: string | null, scroll = false) {
    setCompareId(id)
    const c = cast.find(x => x.archetype.id === id)
    // Open the situation that member is about: a co-star's own situation, else the type's strongest one.
    if (c) setAxisId(c.axisId ?? (axesOf(c.archetype).size > 0 ? strongestAxis(castShapes.get(c.archetype.id)!, content) : axisId))
    if (scroll) document.getElementById('signature-3d')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  }

  const chip =
    `inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-2.5 py-1 text-xs font-bold transition-colors ${ring}`

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-8 sm:py-12">
      {compareWith && (
        <Reveal>
          <button type="button" onClick={compareWith.onOpen} className={`${btnPrimary} w-full`}>
            See how you compare with {compareWith.name ?? 'them'} →
          </button>
        </Reveal>
      )}

      <div ref={cardRef} className="flex flex-col gap-6 bg-paper">
        <Reveal>
          <ArchetypeHeader
            archetype={archetype}
            confidence={profile.archetype.confidence}
            facets={coStars}
            runnerUp={nearMiss}
            code={facetCode(archetype.id, facets, content)}
            motiveThroughLine={motives.throughLine}
            onCompare={id => compare(id, true)}
            comparingId={compareId}
            hero={
              <figure id="signature-3d" className="flex flex-col items-center gap-2.5 px-3 pb-4 pt-2">
                <SignatureCrystal
                  shape={shape} accent={accent} selected={axisId} onSelect={setAxisId}
                  cap={crystalCap} colors={crystalColors}
                  ghost={comparedShape} ghostLabel={compared?.archetype.name}
                  ghostAccent={compared ? accentOf(compared.archetype.id) : undefined}
                  className="h-64 w-full sm:h-72"
                />
                <div role="group" aria-label="Compare in 3D" className="flex flex-wrap items-center justify-center gap-1.5">
                  <span className="mr-0.5 text-xs font-bold text-ink-soft">See-through:</span>
                  {cast.map(c => {
                    const on = compareId === c.archetype.id
                    return (
                      <button
                        key={c.archetype.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => compare(c.archetype.id)}
                        className={chip}
                        style={on ? { background: '#151515', color: '#FAF7F2' } : { background: '#FFFFFF' }}
                      >
                        <span aria-hidden="true" className="h-3 w-3 rounded-full border-2 border-current" style={{ background: accentOf(c.archetype.id) }} />
                        {c.archetype.name}
                        <span className="font-medium opacity-60">{c.role}</span>
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    aria-pressed={compareId === null}
                    onClick={() => compare(null)}
                    className={chip}
                    style={compareId === null ? { background: '#151515', color: '#FAF7F2' } : { background: '#FFFFFF' }}
                  >
                    None
                  </button>
                </div>
                <figcaption className="max-w-sm text-center text-xs leading-relaxed text-ink-soft">
                  {compared && fit && (
                    <span className="block text-ink">
                      Closest to {compared.archetype.name} on <span className="font-bold">{axisName(fit.closest)}</span>; furthest on{' '}
                      <span className="font-bold">{axisName(fit.furthest)}</span>.
                    </span>
                  )}
                  {compared && !fit && axesOf(compared.archetype).size === 1 && (
                    <span className="block text-ink">
                      {compared.archetype.name} lives on <span className="font-bold">{axisName([...axesOf(compared.archetype)][0])}</span> — compare that crystal.
                    </span>
                  )}
                  Solid is you; see-through is the type you’re comparing.
                  {crystalColors && ' Each crystal takes the colour of the type that explains it.'} Drag to turn it; tap a crystal to open it below.
                </figcaption>
              </figure>
            }
          />
        </Reveal>
        {duel && duel.rivals.length > 0 && (
          <Reveal delay={0.035}><HeadToHeadSection result={duel} axes={content.axes} /></Reveal>
        )}
        {(profile.unexplained?.length ?? 0) > 0 && (
          <Reveal delay={0.04}><UnexplainedSection items={profile.unexplained!} /></Reveal>
        )}
        {interplay && (
          <Reveal delay={0.05}><InterplaySection insight={interplay} /></Reveal>
        )}
        {answers.some(a => isCrossroadsAnswer(a.questionId)) && (
          <Reveal delay={0.055}><CollideSection answers={answers} axes={content.axes} /></Reveal>
        )}
        <Reveal delay={0.06}>
          <SignatureSection
            signature={profile.signature}
            baseline={profile.baseline}
            contingencies={profile.topContingencies}
            flexibility={profile.flexibility}
            dims={content.dims}
            accent={accent}
            archetype={compared?.archetype}
            axisId={axisId}
            onAxisChange={setAxisId}
          />
        </Reveal>
        <Reveal delay={0.08}><SettingsSection reports={settingOffsets} /></Reveal>
        {motives.reads.length > 0 && <Reveal delay={0.1}><MotiveSection readout={motives} axes={content.axes} /></Reveal>}
        {readouts.length > 0 && <Reveal delay={0.12}><SharpenVerdict axes={content.axes} readouts={readouts} /></Reveal>}
      </div>

      <Reveal delay={0.16}><DimensionStory dims={content.dims} ranges={profile.dimensionRanges} /></Reveal>

      <Reveal delay={0.2} className="flex flex-col items-center gap-5 pt-2">
        <ShareBar archetypeId={profile.archetype.id} answers={answers} cardRef={cardRef} extra={<StoryShare data={story} />} />
        <button type="button" onClick={onRestart} className={btnGhost}>
          Take it again
        </button>
      </Reveal>
    </div>
  )
}
