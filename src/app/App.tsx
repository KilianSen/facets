import { useState, useEffect } from 'react'
import { computeProfile, type Answer, type Profile, type Question } from '../engine'
import { CONTENT } from '../content'
import { selectQuestions, type RunMode } from '../content/selectQuestions'
import { QuizFlow } from '../quiz/QuizFlow'
import { ResultPage } from '../result/ResultPage'
import { STORAGE_KEY, loadProgress, type StoredProgress } from '../quiz/useQuizState'
import { decodeAnswers } from '../share/permalink'
import { Reveal } from '../ui/Reveal'

export const RESULT_STORAGE_KEY = 'fptic.result.v1'

type View = 'landing' | 'quiz' | 'computing' | 'result'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'

interface CachedResult { profile: Profile; answers: Answer[] }

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
  const [cached] = useState(() => fromPermalink() ?? loadResult())
  const [resume, setResume] = useState<StoredProgress | null>(() => (cached ? null : loadProgress()))
  const [view, setView] = useState<View>(cached ? 'result' : 'landing')
  const [profile, setProfile] = useState<Profile | null>(cached?.profile ?? null)
  const [answers, setAnswers] = useState<Answer[]>(cached?.answers ?? [])
  const [questions, setQuestions] = useState<Question[]>([])

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

  function handleComplete(a: Answer[]) {
    const computed = computeProfile(a, CONTENT)
    try { localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify({ profile: computed, answers: a })) } catch { /* ignore */ }
    setProfile(computed)
    setAnswers(a)
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
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
        <Reveal><p className="text-xs uppercase tracking-[0.3em] text-accent-soft/70">FPTIC</p></Reveal>
        <Reveal delay={0.05}>
          <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl">The personality test that lets you say "it depends."</h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="text-sm leading-relaxed text-white/70">Most tests force one box. Here you set the context for each question — and get a map of how you actually shift.</p>
        </Reveal>

        {inProgress && (
          <Reveal delay={0.16}>
            <button type="button" onClick={continueRun} className={`rounded-beam bg-accent/15 px-6 py-3 text-sm font-medium text-accent-soft shadow-glow transition-colors hover:bg-accent/25 ${ring}`}>
              Continue your run ({resume!.index}/{resume!.questionIds.length})
            </button>
          </Reveal>
        )}

        <Reveal delay={0.2} className="flex flex-col items-center gap-2">
          {inProgress && <span className="text-xs text-white/40">or start fresh</span>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => start('short')} className={`flex flex-col items-center gap-0.5 rounded-beam bg-white/10 px-6 py-3 shadow-glow transition-all hover:bg-white/15 ${ring}`}>
              <span className="text-sm font-medium">Quick read</span>
              <span className="text-xs text-white/50">~24 questions · ~5 min</span>
            </button>
            <button type="button" onClick={() => start('deep')} className={`flex flex-col items-center gap-0.5 rounded-beam border border-white/15 px-6 py-3 transition-colors hover:bg-white/10 ${ring}`}>
              <span className="text-sm font-medium text-white/80">Deep dive</span>
              <span className="text-xs text-white/50">~60 questions · ~10 min · sharper result</span>
            </button>
          </div>
        </Reveal>
      </div>
    )
  }

  if (view === 'quiz') return <QuizFlow questions={questions} onComplete={handleComplete} />

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

  return <ResultPage profile={profile!} content={CONTENT} answers={answers} onRestart={restart} />
}
