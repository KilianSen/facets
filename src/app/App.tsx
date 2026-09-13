import { useState, useEffect } from 'react'
import {
  computeProfile, sharpenReadout, sharpenConfident, SWING_THRESHOLD, SHARPEN_MIN,
  motiveAxes, motiveQuestionId, strongestTell,
  type Answer, type Profile, type Question,
} from '../engine'
import { CONTENT } from '../content'
import { selectQuestions, pickSharpenQuestions, type RunMode } from '../content/selectQuestions'
import { QuizFlow } from '../quiz/QuizFlow'
import { SharpenPrompt } from '../quiz/SharpenPrompt'
import { MotivePrompt, type MotivePick } from '../quiz/MotivePrompt'
import { ResultPage } from '../result/ResultPage'
import { STORAGE_KEY, loadProgress, type StoredProgress } from '../quiz/useQuizState'
import { decodeAnswers, encodeAnswers } from '../share/permalink'
import { LandingPage } from '../archetypes/LandingPage'
import { loadPending, clearPending, compareUrl } from '../compare/compareLink'
import { navigate } from '../router/router'

export const RESULT_STORAGE_KEY = 'fptic.result.v1'

type View = 'landing' | 'quiz' | 'motives' | 'sharpen' | 'computing' | 'result'

/** Reserve (sharpen) questions already appended to the running list, if any (single axis by design). */
function reserveInRun(questions: Question[]): { axisId: string; askedIds: string[] } | null {
  const r = questions.filter(q => q.reserve)
  if (r.length === 0 || !r[0].axis) return null
  return { axisId: r[0].axis, askedIds: r.map(q => q.id) }
}

/** The strongest swing axis worth offering to sharpen (above threshold, with reserve content). */
function topSwingAxis(profile: Profile): string | null {
  const swing = profile.axisSwing ?? {}
  let best: string | null = null
  let bestV = -1
  for (const axis of CONTENT.axes) {
    const v = swing[axis.id] ?? 0
    if (v >= SWING_THRESHOLD && v > bestV && pickSharpenQuestions(CONTENT, axis.id, new Set(), 1).length > 0) {
      bestV = v
      best = axis.id
    }
  }
  return best
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
  } catch { /* ignore */ }
}

function questionsFromIds(ids: string[]): Question[] {
  const byId = new Map(CONTENT.questions.map(q => [q.id, q]))
  return ids.map(id => byId.get(id)).filter((q): q is Question => !!q)
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
  // Bumped to force a fresh QuizFlow when we append parallel sharpen items and re-enter the quiz.
  const [quizKey, setQuizKey] = useState(0)
  const [offerAxis, setOfferAxis] = useState<string | null>(null)
  const [whyAxes, setWhyAxes] = useState<string[]>([])
  // Someone's compare invite this browser is answering (set from /compare before taking the test).
  const [pending] = useState(() => loadPending())

  function start(mode: RunMode) {
    clearStored()
    setResume(null)
    setQuestions(selectQuestions(CONTENT, mode))
    setView('quiz')
  }

  function continueRun() {
    if (!resume) return
    const qs = questionsFromIds(resume.questionIds)
    if (qs.length !== resume.questionIds.length) { clearStored(); setResume(null); return }
    setQuestions(qs)
    setView('quiz')
  }

  // Extend the persisted run with more questions and re-enter the quiz at the first new one. Writing
  // storage first means the remounted QuizFlow (fresh `quizKey`) initialises straight onto it.
  function appendAndReenter(newList: Question[], a: Answer[]) {
    const index = questions.length
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: a, index, questionIds: newList.map(q => q.id) })) } catch { /* ignore */ }
    setQuestions(newList)
    setQuizKey(k => k + 1)
    setView('quiz')
  }

  // After the base run (and the optional "why" beat): offer to sharpen the single strongest swing axis.
  function offerSharpenOrFinish(computed: Profile) {
    const axisId = topSwingAxis(computed)
    if (axisId) { setOfferAxis(axisId); setView('sharpen'); return }
    setView('computing')
  }

  function handleComplete(a: Answer[]) {
    const computed = computeProfile(a, CONTENT)
    saveResult(computed, a)
    setProfile(computed)
    setAnswers(a)

    // Mid-sharpen: keep adding parallel items on this axis until the verdict is confident or we
    // exhaust the reserve, then finalise.
    const inRun = reserveInRun(questions)
    if (inRun) {
      const readout = sharpenReadout(a, CONTENT).find(r => r.axisId === inRun.axisId)
      const confident = readout ? sharpenConfident(readout.instability, readout.n) : true
      if (!confident) {
        const next = pickSharpenQuestions(CONTENT, inRun.axisId, new Set(inRun.askedIds), 1)
        if (next.length > 0) { appendAndReenter([...questions, ...next], a); return }
      }
      setView('computing')
      return
    }

    // Base run just finished — ask what's behind the biggest swings (once), then the sharpen offer.
    const why = a.some(isMotiveAnswer) ? [] : motiveAxes(computed.signature, CONTENT)
    if (why.length > 0) { setWhyAxes(why); setView('motives'); return }
    offerSharpenOrFinish(computed)
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
    offerSharpenOrFinish(profile)
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
    // Once a sharpen item has been appended, Back can't cross back into the base questions (editing
    // them would leave the round latched to a now-stale axis).
    const firstReserve = questions.findIndex(q => q.reserve)
    return <QuizFlow key={quizKey} questions={questions} minIndex={firstReserve === -1 ? 0 : firstReserve} onComplete={handleComplete} />
  }

  if (view === 'motives' && profile) {
    const steps = whyAxes.map(id => ({
      axis: CONTENT.axes.find(a => a.id === id)!,
      tell: strongestTell(profile.signature, id, CONTENT),
      options: CONTENT.motives?.byAxis[id] ?? [],
    }))
    return <MotivePrompt steps={steps} onDone={finishMotives} />
  }

  if (view === 'sharpen' && offerAxis) {
    const axis = CONTENT.axes.find(a => a.id === offerAxis)!
    return <SharpenPrompt axis={axis} onSharpen={beginSharpen} onSkip={skipSharpen} />
  }

  if (view === 'computing') {
    return (
      <div role="status" className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
        <div
          aria-hidden="true"
          className="h-10 w-10 animate-beam-spin rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent, #22d3ee, #d946ef, transparent)',
            WebkitMask: 'radial-gradient(closest-side, transparent 58%, #000 60%)',
            mask: 'radial-gradient(closest-side, transparent 58%, #000 60%)',
          }}
        />
        <p className="animate-pulse text-sm text-white/60">Reading your signature…</p>
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
