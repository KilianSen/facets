import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuizFlow } from './QuizFlow'
import type { Question } from '../engine/types'

describe('QuizFlow', () => {
  beforeEach(() => localStorage.clear())

  it('flavor question is single-tap and completes on one click', async () => {
    const onComplete = vi.fn()
    const questions: Question[] = [
      { id: 'q1', prompt: 'First?', kind: 'flavor', options: [{ id: 'X', label: 'Pick X', vector: {} }] },
    ]
    render(<QuizFlow questions={questions} onComplete={onComplete} />)
    await userEvent.click(screen.getByText('Pick X'))
    expect(onComplete).toHaveBeenCalledWith([{ questionId: 'q1', mode: 'single', optionId: 'X' }])
  })

  it('backbone question shows the folded depends card and commits a depends answer', async () => {
    const onComplete = vi.fn()
    const questions: Question[] = [{
      id: 'q1', prompt: 'Depends?', kind: 'backbone', axis: 'closeness',
      cases: [{ id: 'a', label: 'Case A', axisLevel: 1 }, { id: 'b', label: 'Case B', axisLevel: 0 }],
      options: [{ id: 'X', label: 'Resp X', vector: {} }, { id: 'Y', label: 'Resp Y', vector: {} }],
    }]
    render(<QuizFlow questions={questions} onComplete={onComplete} />)
    expect(screen.getByText('Depends?')).toBeInTheDocument()
    await userEvent.click(within(screen.getByRole('radiogroup', { name: 'Case A' })).getByText('Resp X'))
    await userEvent.click(within(screen.getByRole('radiogroup', { name: 'Case B' })).getByText('Resp Y'))
    await userEvent.click(screen.getByText('Continue'))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0][0][0].mode).toBe('depends')
  })

  it('selects a flavor option with the matching number key (desktop)', async () => {
    const onComplete = vi.fn()
    const questions: Question[] = [
      { id: 'q1', prompt: 'First?', kind: 'flavor', options: [{ id: 'X', label: 'Pick X', vector: {} }, { id: 'Y', label: 'Pick Y', vector: {} }] },
    ]
    render(<QuizFlow questions={questions} onComplete={onComplete} />)
    await userEvent.keyboard('2')
    expect(onComplete).toHaveBeenCalledWith([{ questionId: 'q1', mode: 'single', optionId: 'Y' }])
  })

  it('Back returns to the previous question', async () => {
    const onComplete = vi.fn()
    const questions: Question[] = [
      { id: 'q1', prompt: 'First?', kind: 'flavor', options: [{ id: 'X', label: 'Pick X', vector: {} }] },
      { id: 'q2', prompt: 'Second?', kind: 'flavor', options: [{ id: 'Z', label: 'Pick Z', vector: {} }] },
    ]
    render(<QuizFlow questions={questions} onComplete={onComplete} />)
    await userEvent.click(screen.getByText('Pick X')) // → q2
    expect(screen.getByText('Second?')).toBeInTheDocument()
    await userEvent.click(screen.getByText(/Back/))
    expect(screen.getByText('First?')).toBeInTheDocument()
  })

  it('shows a first-run coach-mark on the folded depends screen and dismisses it', async () => {
    const questions: Question[] = [{
      id: 'q1', prompt: 'Depends?', kind: 'backbone', axis: 'closeness',
      cases: [{ id: 'a', label: 'Case A', axisLevel: 1 }, { id: 'b', label: 'Case B', axisLevel: 0 }],
      options: [{ id: 'X', label: 'Resp X', vector: {} }, { id: 'Y', label: 'Resp Y', vector: {} }],
    }]
    render(<QuizFlow questions={questions} onComplete={() => {}} />)
    expect(screen.getByText(/New here\?/)).toBeInTheDocument()
    await userEvent.click(screen.getByText('Got it'))
    expect(screen.queryByText(/New here\?/)).not.toBeInTheDocument()
  })

  it('shows progress as a labelled progressbar', () => {
    const questions: Question[] = [
      { id: 'q1', prompt: 'First?', kind: 'flavor', options: [{ id: 'X', label: 'X', vector: {} }] },
      { id: 'q2', prompt: 'Second?', kind: 'flavor', options: [{ id: 'Y', label: 'Y', vector: {} }] },
    ]
    render(<QuizFlow questions={questions} onComplete={() => {}} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '2')
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
  })
})
