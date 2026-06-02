import { useState } from 'react'
import { computeProfile, type Answer, type Profile } from '../engine'
import { CONTENT } from '../content'
import { QuizFlow } from '../quiz/QuizFlow'
import { ResultPage } from '../result/ResultPage'
import { STORAGE_KEY } from '../quiz/useQuizState'

type View = 'landing' | 'quiz' | 'result'

export function App() {
  const [view, setView] = useState<View>('landing')
  const [profile, setProfile] = useState<Profile | null>(null)

  function handleComplete(answers: Answer[]) {
    setProfile(computeProfile(answers, CONTENT))
    setView('result')
  }

  function restart() {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setProfile(null)
    setView('landing')
  }

  if (view === 'landing') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
        <h1 className="text-3xl font-bold">The personality test that lets you say "it depends."</h1>
        <p className="text-sm text-white/70">Every question has a depends path. Answer honestly — context and all.</p>
        <button type="button" onClick={() => setView('quiz')} className="rounded-2xl bg-white/10 px-6 py-3 text-sm hover:bg-white/20">
          Start the test
        </button>
      </div>
    )
  }

  if (view === 'quiz') return <QuizFlow questions={CONTENT.questions} onComplete={handleComplete} />

  return <ResultPage profile={profile!} content={CONTENT} onRestart={restart} />
}
