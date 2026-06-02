import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuizFlow } from './QuizFlow'
import type { Question } from '../engine/types'

describe('QuizFlow', () => {
  beforeEach(() => localStorage.clear())

  it('single-tap fallback: a case-less question records a single answer and completes', async () => {
    const onComplete = vi.fn()
    const questions: Question[] = [
      { id: 'q1', prompt: 'First question?', kind: 'flavor', options: [{ id: 'X', label: 'Pick X', vector: {} }] },
    ]
    render(<QuizFlow questions={questions} onComplete={onComplete} />)
    await userEvent.click(screen.getByText('Pick X'))
    expect(onComplete).toHaveBeenCalledWith([{ questionId: 'q1', mode: 'single', optionId: 'X' }])
  })

  it('conditional question goes straight to rank → map → result', async () => {
    const onComplete = vi.fn()
    const withCases: Question[] = [{
      id: 'q1', prompt: 'Depends?', kind: 'backbone', axis: 'closeness',
      cases: [{ id: 'a', label: 'Case A', axisLevel: 1 }, { id: 'b', label: 'Case B', axisLevel: 0 }],
      options: [{ id: 'X', label: 'Resp X', vector: {} }, { id: 'Y', label: 'Resp Y', vector: {} }],
    }]
    render(<QuizFlow questions={withCases} onComplete={onComplete} />)
    // No "It depends" step — the ranker shows immediately with the prompt.
    expect(screen.getByText('Depends?')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Next')) // confirm default ranking
    await userEvent.click(screen.getAllByText('Resp X')[0]) // map case A
    await userEvent.click(screen.getAllByText('Resp Y')[1]) // map case B
    await userEvent.click(screen.getByText(/See result/))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0][0][0].mode).toBe('depends')
  })
})
