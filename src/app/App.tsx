import { useState, useEffect } from 'react'
import {
  computeProfile, sharpenReadout, sharpenConfident, SWING_THRESHOLD, SHARPEN_MIN,
  motiveAxes, motiveQuestionId, strongestTell, pickFirmUpQuestions, asRanked,
  pickDuelQuestions, pickLifeQuestions, pickCollideDilemmas,
  type Answer, type AxisId, type Profile, type Question,
} from '../engine'
import { CONTENT } from '../content'
import { selectQuestions, pickSharpenQuestions } from '../content/selectQuestions'
import { QuizFlow } from '../quiz/QuizFlow'
import { SharpenPrompt } from '../quiz/SharpenPrompt'
import { ChapterIntro } from '../quiz/ChapterIntro'
import { MotivePrompt, type MotivePick } from '../quiz/MotivePrompt'
import { CrossroadsPrompt } from '../quiz/CrossroadsPrompt'
import { CROSSROADS_DILEMMAS, findCrossroadsDilemma, isCrossroadsAnswer, type CrossroadsDilemma } from '../content/crossroads'
import { ResultPage } from '../result/ResultPage'
import { STORAGE_KEY, loadProgress, type StoredProgress } from '../quiz/useQuizState'
import { decodeAnswers, encodeAnswers } from '../share/permalink'
import { LandingPage } from '../archetypes/LandingPage'
import { loadPending, clearPending, compareUrl } from '../compare/compareLink'
import { navigate } from '../router/router'

export const RESULT_STORAGE_KEY = 'fptic.result.v1'
/**
 * The firm-up round for the current run: the ids it appended (asked ranked; [] when nothing needed it). Its
 * presence means the round already happened, so it runs at most once. Kept apart from the quiz progress because
 * questions are stored by id, which alone would reload a flavor item as a single tap.
 */
export const FIRM_UP_STORAGE_KEY = 'fptic.firmup.v1'
/**
 * The deep dive's progress; its presence means the current run is a deep dive. Each field is set as its step starts:
 * `duel` / `life` hold the ids those chapters appended, `why` marks the motive beat, `collide` the crossroads still to
 * show (shrinking as they're answered or skipped), `sharpen` the situations chapter 3 checks.
 */
export const DEEP_STORAGE_KEY = 'fptic.deep.v1'
interface DeepProgress { duel?: string[]; why?: boolean; life?: string[]; collide?: string[]; sharpen?: AxisId[] }

const CHAPTERS = [
  {
    title: 'Which one are you?',
    blurb: 'A few head-to-head questions on the situations that define you — the ones where your type and its closest look-alikes would answer differently. This is where a close call gets settled.',
  },
  {
    title: 'Across your life',
    blurb: 'Your biggest shift and a few everyday situations, asked again at work, when dating, with friends and with family — so you see where the setting changes you, not just the situation.',
  },
  {
    title: 'When situations collide',
    blurb: 'What you do when two of your big shifts pull opposite ways — and a closer look at whether each one holds up every time.',
  },
]

type RunMode = 'short' | 'deep'
type View = 'landing' | 'quiz' | 'chapter' | 'motives' | 'crossroads' | 'sharpen' | 'computing' | 'result'

/** Sharpen items already appended to the running list, per situation. */
function sharpenInRun(questions: Question[]): { axisId: string; askedIds: string[] }[] {
  const byAxis = new Map<string, string[]>()
  for (const q of questions) {
    if (!q.reserve || q.acrossSettings || !q.axis) continue
    byAxis.set(q.axis, [...(byAxis.get(q.axis) ?? []), q.id])
  }
  return [...byAxis].map(([axisId, askedIds]) => ({ axisId, askedIds }))
}

/** Situations with a big enough swing to sharpen (above threshold, with sharpen items), strongest first. */
function sharpenableAxes(profile: Profile): AxisId[] {
  const swing = profile.axisSwing ?? {}
  return CONTENT.axes
    .map(a => a.id)
    .filter(id => (swing[id] ?? 0) >= SWING_THRESHOLD && pickSharpenQuestions(CONTENT, id, new Set(), 1).length > 0)
    .sort((x, y) => (swing[y] ?? 0) - (swing[x] ?? 0))
}

const isMotiveAnswer = (a: Answer) => CONTENT.axes.some(ax => a.questionId === motiveQuestionId(ax.id))

interface CachedResult { profile: Profile; answers: Answer[] }

function saveResult(profile: Profile, answers: Answer[]): void {
  try { localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify({ profile, answers })) } catch { /* ignore */ }
}

function loadResult(): CachedResult | null {
  try {
    const raw = localStorage.getItem(RESULT_STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (p && p.profile) return { profile: p.profile, answers: Array.isArray(p.answers) ? p.answers : [] }
      if (p && p.archetype) return { profile: p as Profile, answers: [] } // legacy bare-profile cache
    }
  } catch { /* ignore */ }
  return null
}

function saveFirmUp(ids: string[]): void {
  try { localStorage.setItem(FIRM_UP_STORAGE_KEY, JSON.stringify(ids)) } catch { /* ignore */ }
}

/** The firm-up ids for this run, or null if the round hasn't happened. */
function loadFirmUp(): string[] | null {
  try {
    const p = JSON.parse(localStorage.getItem(FIRM_UP_STORAGE_KEY) ?? 'null')
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : null
  } catch { return null }
}

function saveDeep(p: DeepProgress): void {
  try { localStorage.setItem(DEEP_STORAGE_KEY, JSON.stringify(p)) } catch { /* ignore */ }
}

/** The deep dive's progress, or null when this run is a quick read. */
function loadDeep(): DeepProgress | null {
  try {
    const p = JSON.parse(localStorage.getItem(DEEP_STORAGE_KEY) ?? 'null')
    return p && typeof p === 'object' && !Array.isArray(p) ? (p as DeepProgress) : null
  } catch { return null }
}

function fromPermalink(): CachedResult | null {
  try {
    // New canonical share param `?a=`; legacy client permalink `#r=` still honored.
    const a = new URLSearchParams(window.location.search).get('a')
      ?? window.location.hash.match(/[#&]r=([^&]+)/)?.[1]
      ?? null
    if (!a) return null
    const answers = decodeAnswers(a)
    if (answers && answers.length) return { profile: computeProfile(answers, CONTENT), answers }
  } catch { /* ignore */ }
  return null
}

function clearStored(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(RESULT_STORAGE_KEY)
    localStorage.removeItem(FIRM_UP_STORAGE_KEY)
    localStorage.removeItem(DEEP_STORAGE_KEY)
  } catch { /* ignore */ }
}

/** Rebuild a stored run; top-up and head-to-head items come back ranked, as they were asked. */
function questionsFromIds(ids: string[], rankedIds: string[] = []): Question[] {
  const byId = new Map(CONTENT.questions.map(q => [q.id, q]))
  const ranked = new Set(rankedIds)
  return ids.map(id => byId.get(id)).filter((q): q is Question => !!q).map(q => (ranked.has(q.id) ? asRanked(q) : q))
}

export function App() {
  // An incomplete in-progress run (e.g. a mid-sharpen refresh) suppresses the cached result, so a
  // refresh offers "Continue your run" (with the appended parallel questions) instead of jumping to
  // the stale base result.
  const [cached] = useState(() => {
    const stored = loadProgress()
    const incomplete = !!stored && stored.index < stored.questionIds.length
    return fromPermalink() ?? (incomplete ? null : loadResult())
  })
  const [resume, setResume] = useState<StoredProgress | null>(() => (cached ? null : loadProgress()))
  const [view, setView] = useState<View>(cached ? 'result' : 'landing')
  const [profile, setProfile] = useState<Profile | null>(cached?.profile ?? null)
  const [answers, setAnswers] = useState<Answer[]>(cached?.answers ?? [])
  const [questions, setQuestions] = useState<Question[]>([])
  // Bumped to force a fresh QuizFlow when we append questions and re-enter the quiz.
  const [quizKey, setQuizKey] = useState(0)
  const [chapter, setChapter] = useState<{ index: number; go: () => void } | null>(null)
  const [offerAxis, setOfferAxis] = useState<string | null>(null)
  const [whyAxes, setWhyAxes] = useState<string[]>([])
  const [crossroadsDilemma, setCrossroadsDilemma] = useState<CrossroadsDilemma | null>(null)
  // Someone's compare invite this browser is answering (set from /compare before taking the test).
  const [pending] = useState(() => loadPending())

  function start(mode: RunMode) {
    clearStored()
    setResume(null)
    // Both modes open with the quick read; a deep dive then adds its chapters.
    if (mode === 'deep') saveDeep({})
    setQuestions(selectQuestions(CONTENT))
    setView('quiz')
  }

  function continueRun() {
    if (!resume) return
    const qs = questionsFromIds(resume.questionIds, [...(loadFirmUp() ?? []), ...(loadDeep()?.duel ?? [])])
    if (qs.length !== resume.questionIds.length) { clearStored(); setResume(null); return }
    setQuestions(qs)
    setView('quiz')
  }

  // Extend the persisted run with more questions, positioned at the first new one. Writing storage first means
  // the remounted QuizFlow (fresh `quizKey`) initialises straight onto it — and a refresh resumes there.
  function prepareAppend(newList: Question[], a: Answer[]) {
    const index = questions.length
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: a, index, questionIds: newList.map(q => q.id) })) } catch { /* ignore */ }
    setQuestions(newList)
  }

  function reenter() {
    setQuizKey(k => k + 1)
    setView('quiz')
  }

  function appendAndReenter(newList: Question[], a: Answer[]) {
    prepareAppend(newList, a)
    reenter()
  }

  function showChapter(index: number, go: () => void) {
    setChapter({ index, go })
    setView('chapter')
  }

  // After the base run (and the optional "why" beat): offer to sharpen the single strongest swing axis.
  function offerSharpenOrFinish(computed: Profile) {
    const [axisId] = sharpenableAxes(computed)
    if (axisId) { setOfferAxis(axisId); setView('sharpen'); return }
    setView('computing')
  }

  function offerCrossroadsOrSharpen(computed: Profile, currentAnswers: Answer[]) {
    const swings = computed.axisSwing ?? {}
    const activeSwings = Object.entries(swings)
      .filter(([_, s]) => s >= 2.0)
      .sort((a, b) => b[1] - a[1])
    if (activeSwings.length >= 2) {
      const d = findCrossroadsDilemma(activeSwings[0][0], activeSwings[1][0])
      const alreadyAnswered = currentAnswers.some(a => isCrossroadsAnswer(a.questionId) && a.questionId === d?.id)
      if (d && !alreadyAnswered) {
        setCrossroadsDilemma(d)
        setView('crossroads')
        return
      }
    }
    offerSharpenOrFinish(computed)
  }

  // Deep dive after the "why" beat: chapter 2 (across your life), then chapter 3 (crossroads, then sharpen every
  // strong swing), then the result. Every step records itself before it starts, so each happens once.
  function continueDeep(computed: Profile, a: Answer[]) {
    const deep = loadDeep() ?? {}
    if (deep.life === undefined) {
      const life = pickLifeQuestions(computed, a, CONTENT)
      saveDeep({ ...deep, life: life.map(q => q.id) })
      if (life.length > 0) { prepareAppend([...questions, ...life], a); showChapter(1, reenter); return }
    }
    if (deep.collide === undefined) {
      const dilemmas = pickCollideDilemmas(computed, a, CONTENT)
      saveDeep({ ...loadDeep(), collide: dilemmas.map(d => d.id) })
      if (dilemmas.length > 0 || sharpenableAxes(computed).length > 0) { showChapter(2, () => continueDeep(computed, a)); return }
    }
    const next = CROSSROADS_DILEMMAS.find(d => d.id === loadDeep()?.collide?.[0])
    if (next) { setCrossroadsDilemma(next); setView('crossroads'); return }
    if (loadDeep()?.sharpen === undefined) {
      const axes = sharpenableAxes(computed)
      saveDeep({ ...loadDeep(), sharpen: axes })
      const items = axes.flatMap(axisId => pickSharpenQuestions(CONTENT, axisId, new Set(), SHARPEN_MIN))
      if (items.length > 0) { appendAndReenter([...questions, ...items], a); return }
    }
    setView('computing')
  }

  function afterWhy(computed: Profile, a: Answer[]) {
    if (loadDeep()) continueDeep(computed, a)
    else offerCrossroadsOrSharpen(computed, a)
  }

  function finishCrossroads(optionId?: string) {
    const d = crossroadsDilemma
    let next = answers
    if (optionId && d) {
      next = [...answers.filter(a => a.questionId !== d.id), { questionId: d.id, mode: 'single', optionId }]
      setAnswers(next)
      if (profile) saveResult(profile, next)
    }
    setCrossroadsDilemma(null)
    const deep = loadDeep()
    if (deep?.collide) {
      saveDeep({ ...deep, collide: deep.collide.filter(id => id !== d?.id) })
      if (profile) continueDeep(profile, next)
      else setView('computing')
      return
    }
    if (profile) offerSharpenOrFinish(profile)
    else setView('computing')
  }

  // The measured run is final: ask what's behind the biggest swings (once), then the next step.
  function afterMeasuredRun(computed: Profile, a: Answer[]) {
    const deep = loadDeep()
    if (deep?.why) { continueDeep(computed, a); return }
    if (deep) saveDeep({ ...deep, why: true })
    const why = a.some(isMotiveAnswer) ? [] : motiveAxes(computed.signature, CONTENT)
    if (why.length > 0) { setWhyAxes(why); setView('motives'); return }
    afterWhy(computed, a)
  }

  function handleComplete(a: Answer[]) {
    const computed = computeProfile(a, CONTENT)
    saveResult(computed, a)
    setProfile(computed)
    setAnswers(a)

    // Mid-sharpen (always the last step): keep adding parallel items on any situation whose verdict isn't confident
    // yet, until each is or its reserve runs out, then finalise.
    const sharpening = sharpenInRun(questions)
    if (sharpening.length > 0) {
      const readouts = sharpenReadout(a, CONTENT)
      for (const { axisId, askedIds } of sharpening) {
        const readout = readouts.find(r => r.axisId === axisId)
        if (!readout || sharpenConfident(readout.instability, readout.n)) continue
        const next = pickSharpenQuestions(CONTENT, axisId, new Set(askedIds), 1)
        if (next.length > 0) { appendAndReenter([...questions, ...next], a); return }
      }
      setView('computing')
      return
    }

    // Base run just finished: where the read rests on a single ranked answer, ask a few more ranked questions on
    // exactly those cells before anything else (once per run).
    if (loadFirmUp() === null) {
      const extra = pickFirmUpQuestions(computed, a, CONTENT)
      saveFirmUp(extra.map(q => q.id))
      if (extra.length > 0) { appendAndReenter([...questions, ...extra], a); return }
    }

    // Deep dive, chapter 1: settle the headline against its closest look-alikes.
    const deep = loadDeep()
    if (deep && deep.duel === undefined) {
      const duel = pickDuelQuestions(computed, a, CONTENT)
      saveDeep({ ...deep, duel: duel.map(q => q.id) })
      if (duel.length > 0) { prepareAppend([...questions, ...duel], a); showChapter(0, reenter); return }
    }
    afterMeasuredRun(computed, a)
  }

  // Motive answers ride along in the answer list (so permalinks and compares carry them) but never
  // feed the measurement, so the profile computed at the end of the base run stays valid.
  function finishMotives(picks: MotivePick[]) {
    const next: Answer[] = [
      ...answers.filter(a => !isMotiveAnswer(a)),
      ...picks.map((p): Answer => ({ questionId: motiveQuestionId(p.axisId), mode: 'single', optionId: p.motiveId })),
    ]
    setAnswers(next)
    setWhyAxes([])
    if (!profile) { setView('computing'); return }
    saveResult(profile, next)
    afterWhy(profile, next)
  }

  function beginSharpen() {
    if (!offerAxis) return
    const items = pickSharpenQuestions(CONTENT, offerAxis, new Set(), SHARPEN_MIN)
    setOfferAxis(null)
    if (items.length === 0) { setView('computing'); return }
    appendAndReenter([...questions, ...items], answers)
  }

  function skipSharpen() {
    setOfferAxis(null)
    setView('computing')
  }

  function restart() {
    clearStored()
    setResume(null)
    setProfile(null)
    setAnswers([])
    setQuestions([])
    // Drop any /r/<id>?a= or #r= so a refresh after restart doesn't re-restore the shared result.
    try { window.history.replaceState(null, '', '/') } catch { /* ignore */ }
    setView('landing')
  }

  function openComparison() {
    if (!pending || answers.length === 0) return
    clearPending()
    navigate(compareUrl({ a: pending.a, an: pending.an, b: encodeAnswers(answers), bn: pending.bn }))
  }

  // Brief "reading your signature" beat before results (result is already persisted, so a
  // refresh during the beat rehydrates straight to 'result').
  useEffect(() => {
    if (view !== 'computing') return
    const id = setTimeout(() => setView('result'), 900)
    return () => clearTimeout(id)
  }, [view])

  if (view === 'landing') {
    const inProgress = !!resume && resume.questionIds.length > 0 && resume.index < resume.questionIds.length
    return (
      <LandingPage
        resume={inProgress ? { index: resume!.index, total: resume!.questionIds.length } : null}
        invite={pending ? { name: pending.an } : null}
        onStart={start}
        onContinue={continueRun}
      />
    )
  }

  if (view === 'quiz') {
    // Once a sharpen item has been appended, Back can't cross back into earlier questions (editing
    // them would leave the round latched to a now-stale axis).
    const firstSharpen = questions.findIndex(q => q.reserve && !q.acrossSettings)
    return <QuizFlow key={quizKey} questions={questions} minIndex={firstSharpen === -1 ? 0 : firstSharpen} onComplete={handleComplete} />
  }

  if (view === 'chapter' && chapter) {
    const { title, blurb } = CHAPTERS[chapter.index]
    return (
      <ChapterIntro
        number={chapter.index + 1}
        total={CHAPTERS.length}
        title={title}
        blurb={blurb}
        onContinue={() => { const { go } = chapter; setChapter(null); go() }}
      />
    )
  }

  if (view === 'motives' && profile) {
    const steps = whyAxes.map(id => ({
      axis: CONTENT.axes.find(a => a.id === id)!,
      tell: strongestTell(profile.signature, id, CONTENT),
      options: CONTENT.motives?.byAxis[id] ?? [],
    }))
    return <MotivePrompt steps={steps} onDone={finishMotives} />
  }

  if (view === 'crossroads' && crossroadsDilemma) {
    const axisA = CONTENT.axes.find(a => a.id === crossroadsDilemma.axes[0])!
    const axisB = CONTENT.axes.find(a => a.id === crossroadsDilemma.axes[1])!
    return (
      <CrossroadsPrompt
        dilemma={crossroadsDilemma}
        axisA={axisA}
        axisB={axisB}
        onSelect={optId => finishCrossroads(optId)}
        onSkip={() => finishCrossroads()}
      />
    )
  }

  if (view === 'sharpen' && offerAxis) {
    const axis = CONTENT.axes.find(a => a.id === offerAxis)!
    return <SharpenPrompt axis={axis} onSharpen={beginSharpen} onSkip={skipSharpen} />
  }

  if (view === 'computing') {
    return (
      <div role="status" className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
        <div aria-hidden="true" className="flex gap-2.5">
          {[0, 1, 2].map(i => (
            <span key={i} className="h-5 w-5 animate-bounce rounded-full border-2 border-ink bg-coral" style={{ animationDelay: `${i * 140}ms` }} />
          ))}
        </div>
        <p className="font-serif text-2xl font-semibold tracking-tight">Reading your signature…</p>
      </div>
    )
  }

  return (
    <ResultPage
      profile={profile!}
      content={CONTENT}
      answers={answers}
      onRestart={restart}
      compareWith={pending && answers.length > 0 ? { name: pending.an, onOpen: openComparison } : undefined}
    />
  )
}
