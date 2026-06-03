import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App, RESULT_STORAGE_KEY } from './App'
import { STORAGE_KEY } from '../quiz/useQuizState'
import { computeProfile } from '../engine'
import { CONTENT } from '../content'
import { selectQuestions } from '../content/selectQuestions'
import { encodeAnswers } from '../share/permalink'
import type { Answer, Question } from '../engine/types'

const DIMS = CONTENT.dims.map(d => d.id)

// A clean single-dim contingency (boldness): high-level cases pick the boldest option, low the least.
// This drives several axes' swing to ~4 (> SWING_THRESHOLD), so the sharpen prompt is guaranteed.
function swingAnswer(q: Question): Answer {
  if (q.kind !== 'backbone' || !q.cases) return { questionId: q.id, mode: 'single', optionId: q.options[0].id }
  const mapping: Record<string, string> = {}
  for (const c of q.cases) {
    const target = (c.axisLevel - 0.5) * 4 // boldness target at this level
    let best = q.options[0], bestDist = Infinity
    for (const o of q.options) {
      const dist = DIMS.reduce((acc, d) => acc + ((o.vector[d] ?? 0) - (d === 'boldness' ? target : 0)) ** 2, 0)
      if (dist < bestDist) { bestDist = dist; best = o }
    }
    mapping[c.id] = best.id
  }
  return { questionId: q.id, mode: 'depends', ranking: q.cases.map(c => c.id), mapping }
}

// Seed an in-progress run that is one question from done, carrying a big swing in the prior answers.
function seedSwingRunAtLastQuestion(): Question[] {
  const qs = selectQuestions(CONTENT, 'short')
  const answers = qs.slice(0, -1).map(swingAnswer)
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, index: qs.length - 1, questionIds: qs.map(q => q.id) }))
  return qs
}

// Click through whatever screen is showing (depends groups, single options, or the sharpen prompt)
// until the result appears. `onPrompt` decides what to do when the sharpen prompt shows up.
async function driveToResult(onPrompt: 'sharpen' | 'skip') {
  for (let i = 0; i < 50; i++) {
    if (screen.queryByText('Take it again')) return
    const promptBtn = screen.queryByRole('button', { name: onPrompt === 'sharpen' ? /Pin down my/ : /Skip to my results/ })
    if (promptBtn) { await userEvent.click(promptBtn); continue }
    if (screen.queryByRole('button', { name: 'Continue' })) {
      // Diagonal mapping (case i → option i): on the parallel sharpen items this is high→bold, mid→neutral,
      // low→reserved — a clean, consistent contingency that reads "solid".
      const groups = screen.getAllByRole('radiogroup')
      for (let gi = 0; gi < groups.length; gi++) {
        const radios = within(groups[gi]).getAllByRole('radio')
        await userEvent.click(radios[Math.min(gi, radios.length - 1)])
      }
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    } else if (screen.queryByRole('group')) {
      await userEvent.click(within(screen.getByRole('group')).getAllByRole('button')[0])
    } else {
      break // an interstitial (e.g. the "reading your signature" beat) — fall through to findBy
    }
  }
}

describe('App', () => {
  beforeEach(() => { localStorage.clear(); window.history.replaceState(null, '', '/') })

  it('shows the landing page with both run modes', () => {
    render(<App />)
    expect(screen.getAllByText(/it depends/i).length).toBeGreaterThan(0) // the landing leans on the theme
    expect(screen.getByText('Quick read')).toBeInTheDocument()
    expect(screen.getByText('Deep dive')).toBeInTheDocument()
  })

  it('labels each mode with its length', () => {
    render(<App />)
    expect(screen.getByText(/24 questions/)).toBeInTheDocument()
    expect(screen.getByText(/60 questions/)).toBeInTheDocument()
  })

  it('Quick read starts a ~24-question short run', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('Quick read'))
    expect(screen.getByText('Question 1 of 24')).toBeInTheDocument()
  })

  it('Deep dive starts the full 60-question run', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('Deep dive'))
    expect(screen.getByText('Question 1 of 60')).toBeInTheDocument()
  })

  it('restores a cached result on mount instead of the landing page', () => {
    localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(computeProfile([], CONTENT)))
    render(<App />)
    expect(screen.getByText('Take it again')).toBeInTheDocument()
    expect(screen.queryByText('Quick read')).not.toBeInTheDocument()
  })

  it('"Take it again" clears the cached result and returns to landing', async () => {
    localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(computeProfile([], CONTENT)))
    render(<App />)
    await userEvent.click(screen.getByText('Take it again'))
    expect(screen.getByText('Quick read')).toBeInTheDocument()
    expect(localStorage.getItem(RESULT_STORAGE_KEY)).toBeNull()
  })

  it('completes a full short run, shows the interstitial, then renders the result', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('Quick read'))
    // Drive every question; if the sharpen prompt happens to fire, skip it to reach the result.
    await driveToResult('skip')
    // The 900ms "reading your signature" beat then lands on the result.
    expect(await screen.findByText('Take it again', {}, { timeout: 2000 })).toBeInTheDocument()
  })

  it('offers to sharpen the standout axis after a big-swing run; Skip goes straight to the result', async () => {
    seedSwingRunAtLastQuestion()
    render(<App />)
    await userEvent.click(screen.getByText(/Continue your run/))
    await driveToResult('skip') // answers the last question, then the prompt appears
    // We saw and dismissed the prompt, landing on the result without a deep-dive section.
    expect(await screen.findByText('Take it again', {}, { timeout: 2000 })).toBeInTheDocument()
    expect(screen.queryByText('Your deep-dive')).not.toBeInTheDocument()
  })

  it('opt-in runs the parallel sharpen round and the result reports a verdict', async () => {
    seedSwingRunAtLastQuestion()
    render(<App />)
    await userEvent.click(screen.getByText(/Continue your run/))
    // Answer the last base question, opt into the prompt, then drive the appended parallel items.
    await driveToResult('sharpen')
    expect(await screen.findByText('Take it again', {}, { timeout: 2000 })).toBeInTheDocument()
    // The deep-dive payoff is shown (radio[0]-per-case ⇒ consistent answers ⇒ a "solid" read).
    expect(screen.getByText('Your deep-dive')).toBeInTheDocument()
    expect(screen.getByText(/rock-solid read/)).toBeInTheDocument()
  })

  it('restores a result from a #r= permalink, taking precedence over a cached result', () => {
    localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(computeProfile([], CONTENT)))
    const answers: Answer[] = [{ questionId: 'closeness_1', mode: 'single', optionId: 'A' }]
    window.location.hash = `#r=${encodeAnswers(answers)}`
    render(<App />)
    expect(screen.getByText('Take it again')).toBeInTheDocument()
    expect(screen.queryByText('Quick read')).not.toBeInTheDocument()
  })

  it('restores a result from a /r/<id>?a= share link', () => {
    const answers: Answer[] = [{ questionId: 'closeness_1', mode: 'single', optionId: 'A' }]
    window.history.replaceState(null, '', `/r/vault?a=${encodeAnswers(answers)}`)
    render(<App />)
    expect(screen.getByText('Take it again')).toBeInTheDocument()
    expect(screen.queryByText('Quick read')).not.toBeInTheDocument()
  })

  it('falls back to the landing page on a malformed permalink', () => {
    window.location.hash = '#r=not~valid~base64'
    render(<App />)
    expect(screen.getByText('Quick read')).toBeInTheDocument()
  })

  it('offers to continue an in-progress run and resumes at the saved index', async () => {
    const ids = selectQuestions(CONTENT, 'short').map(q => q.id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: [], index: 3, questionIds: ids }))
    render(<App />)
    expect(screen.getByText(/Continue your run \(3\/24\)/)).toBeInTheDocument()
    await userEvent.click(screen.getByText(/Continue your run/))
    expect(screen.getByText('Question 4 of 24')).toBeInTheDocument()
  })
})
