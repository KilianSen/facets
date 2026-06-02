import { useState } from 'react'
import { computeProfile, type Answer, type Profile, type Question } from '../engine'
import { CONTENT } from '../content'
import { selectQuestions, type RunMode } from '../content/selectQuestions'
import { QuizFlow } from '../quiz/QuizFlow'
import { ResultPage } from '../result/ResultPage'
import { STORAGE_KEY } from '../quiz/useQuizState'

type View = 'landing' | 'quiz' | 'result'

export function App() {
  const [view, setView] = useState<View>('landing')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  function start(mode: RunMode) {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setQuestions(selectQuestions(CONTENT, mode))
    setView('quiz')
  }

  function handleComplete(answers: Answer[]) {
    setProfile(computeProfile(answers, CONTENT))
    setView('result')
  }

  function restart() {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setProfile(null)
    setQuestions([])
    setView('landing')
  }

  if (view === 'landing') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
        <h1 className="text-3xl font-bold">The personality test that lets you say "it depends."</h1>
        <p className="text-sm text-white/70">Every question has a depends path. Answer honestly — context and all.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => start('short')} className="rounded-2xl bg-white/10 px-6 py-3 text-sm hover:bg-white/20">
            Quick read
          </button>
          <button type="button" onClick={() => start('deep')} className="rounded-2xl border border-white/15 px-6 py-3 text-sm text-white/80 hover:bg-white/10">
            Deep dive
          </button>
        </div>
      </div>
    )
  }

  if (view === 'quiz') return <QuizFlow questions={questions} onComplete={handleComplete} />

  return <ResultPage profile={profile!} content={CONTENT} onRestart={restart} />
}
