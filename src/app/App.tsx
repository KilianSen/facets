import { useState } from 'react'
import { computeProfile, type Answer, type Profile, type Question } from '../engine'
import { CONTENT } from '../content'
import { selectQuestions, type RunMode } from '../content/selectQuestions'
import { QuizFlow } from '../quiz/QuizFlow'
import { ResultPage } from '../result/ResultPage'
import { STORAGE_KEY } from '../quiz/useQuizState'

export const RESULT_STORAGE_KEY = 'fptic.result.v1'

type View = 'landing' | 'quiz' | 'result'

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

export function App() {
  const [cached] = useState(loadResult)
  const [view, setView] = useState<View>(cached ? 'result' : 'landing')
  const [profile, setProfile] = useState<Profile | null>(cached)
  const [questions, setQuestions] = useState<Question[]>([])

  function start(mode: RunMode) {
    clearStored()
    setQuestions(selectQuestions(CONTENT, mode))
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
    setProfile(null)
    setQuestions([])
    setView('landing')
  }

  if (view === 'landing') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
        <h1 className="text-3xl font-bold">The personality test that lets you say "it depends."</h1>
        <p className="text-sm text-white/70">Most tests force one box. Here you set the context for each question — and get a map of how you actually shift.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => start('short')}
            className="flex flex-col items-center gap-0.5 rounded-2xl bg-white/10 px-6 py-3 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            <span className="text-sm font-medium">Quick read</span>
            <span className="text-xs text-white/50">~24 questions · ~6 min</span>
          </button>
          <button
            type="button"
            onClick={() => start('deep')}
            className="flex flex-col items-center gap-0.5 rounded-2xl border border-white/15 px-6 py-3 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            <span className="text-sm font-medium text-white/80">Deep dive</span>
            <span className="text-xs text-white/50">~60 questions · ~15 min · sharper result</span>
          </button>
        </div>
      </div>
    )
  }

  if (view === 'quiz') return <QuizFlow questions={questions} onComplete={handleComplete} />

  return <ResultPage profile={profile!} content={CONTENT} onRestart={restart} />
}
