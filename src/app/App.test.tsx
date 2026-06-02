import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App, RESULT_STORAGE_KEY } from './App'
import { STORAGE_KEY } from '../quiz/useQuizState'
import { computeProfile } from '../engine'
import { CONTENT } from '../content'
import { selectQuestions } from '../content/selectQuestions'
import { encodeAnswers } from '../share/permalink'
import type { Answer } from '../engine/types'

describe('App', () => {
  beforeEach(() => { localStorage.clear(); window.location.hash = '' })

  it('shows the landing page with both run modes', () => {
    render(<App />)
    expect(screen.getByText(/it depends/i)).toBeInTheDocument()
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
    // Drive every question: depends screens have a "Continue" + radiogroups; singles have option buttons.
    for (let i = 0; i < 35; i++) {
      if (screen.queryByText(/Reading your signature/) || screen.queryByText('Take it again')) break
      if (screen.queryByRole('button', { name: 'Continue' })) {
        for (const g of screen.getAllByRole('radiogroup')) {
          await userEvent.click(within(g).getAllByRole('radio')[0])
        }
        await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
      } else {
        await userEvent.click(within(screen.getByRole('group')).getAllByRole('button')[0])
      }
    }
    // The 900ms "reading your signature" beat then lands on the result.
    expect(await screen.findByText('Take it again', {}, { timeout: 2000 })).toBeInTheDocument()
  })

  it('restores a result from a #r= permalink, taking precedence over a cached result', () => {
    localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(computeProfile([], CONTENT)))
    const answers: Answer[] = [{ questionId: 'closeness_1', mode: 'single', optionId: 'A' }]
    window.location.hash = `#r=${encodeAnswers(answers)}`
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
