import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App, RESULT_STORAGE_KEY } from './App'
import { STORAGE_KEY } from '../quiz/useQuizState'
import { computeProfile } from '../engine'
import { CONTENT } from '../content'
import { selectQuestions } from '../content/selectQuestions'

describe('App', () => {
  beforeEach(() => localStorage.clear())

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

  it('offers to continue an in-progress run and resumes at the saved index', async () => {
    const ids = selectQuestions(CONTENT, 'short').map(q => q.id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: [], index: 3, questionIds: ids }))
    render(<App />)
    expect(screen.getByText(/Continue your run \(3\/24\)/)).toBeInTheDocument()
    await userEvent.click(screen.getByText(/Continue your run/))
    expect(screen.getByText('Question 4 of 24')).toBeInTheDocument()
  })
})
