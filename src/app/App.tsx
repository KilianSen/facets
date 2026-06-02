import { useState } from 'react'
import { computeProfile, type Answer, type Profile, type Question } from '../engine'
import { CONTENT } from '../content'
import { selectQuestions, type RunMode } from '../content/selectQuestions'
import { QuizFlow } from '../quiz/QuizFlow'
import { ResultPage } from '../result/ResultPage'
import { STORAGE_KEY, loadProgress, type StoredProgress } from '../quiz/useQuizState'

export const RESULT_STORAGE_KEY = 'fptic.result.v1'

type View = 'landing' | 'quiz' | 'result'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950'

function loadResult(): Profile | null {
  try {
    const raw = localStorage.getItem(RESULT_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Profile
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
  const [cached] = useState(loadResult)
  const [resume, setResume] = useState<StoredProgress | null>(() => (cached ? null : loadProgress()))
  const [view, setView] = useState<View>(cached ? 'result' : 'landing')
  const [profile, setProfile] = useState<Profile | null>(cached)
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

  function handleComplete(answers: Answer[]) {
    const computed = computeProfile(answers, CONTENT)
    try { localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(computed)) } catch { /* ignore */ }
    setProfile(computed)
    setView('result')
  }

  function restart() {
    clearStored()
    setResume(null)
    setProfile(null)
    setQuestions([])
    setView('landing')
  }

  if (view === 'landing') {
    const inProgress = !!resume && resume.questionIds.length > 0 && resume.index < resume.questionIds.length
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
        <h1 className="text-3xl font-bold">The personality test that lets you say "it depends."</h1>
        <p className="text-sm text-white/70">Most tests force one box. Here you set the context for each question — and get a map of how you actually shift.</p>

        {inProgress && (
          <button
            type="button"
            onClick={continueRun}
            className={`rounded-2xl bg-sky-400/20 px-6 py-3 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-400/30 ${ring}`}
          >
            Continue your run ({resume!.index}/{resume!.questionIds.length})
          </button>
        )}

        <div className="flex flex-col items-center gap-2">
          {inProgress && <span className="text-xs text-white/40">or start fresh</span>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => start('short')}
              className={`flex flex-col items-center gap-0.5 rounded-2xl bg-white/10 px-6 py-3 transition-colors hover:bg-white/20 ${ring}`}
            >
              <span className="text-sm font-medium">Quick read</span>
              <span className="text-xs text-white/50">~24 questions · ~5 min</span>
            </button>
            <button
              type="button"
              onClick={() => start('deep')}
              className={`flex flex-col items-center gap-0.5 rounded-2xl border border-white/15 px-6 py-3 transition-colors hover:bg-white/10 ${ring}`}
            >
              <span className="text-sm font-medium text-white/80">Deep dive</span>
              <span className="text-xs text-white/50">~60 questions · ~10 min · sharper result</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'quiz') return <QuizFlow questions={questions} onComplete={handleComplete} />

  return <ResultPage profile={profile!} content={CONTENT} onRestart={restart} />
}
