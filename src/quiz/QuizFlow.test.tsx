import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuizFlow } from './QuizFlow'
import type { Question } from '../engine/types'

const backbone: Question[] = [{
  id: 'q1', prompt: 'Depends?', kind: 'backbone', axis: 'closeness',
  cases: [{ id: 'a', label: 'Case A', axisLevel: 1 }, { id: 'b', label: 'Case B', axisLevel: 0 }],
  options: [{ id: 'X', label: 'Resp X', vector: {} }, { id: 'Y', label: 'Resp Y', vector: {} }],
}]

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

  it('backbone: answering people in order ranks them, then Continue commits', async () => {
    const onComplete = vi.fn()
    render(<QuizFlow questions={backbone} onComplete={onComplete} />)
    expect(screen.getByText('Depends?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()

    // Start with Case B (most true), then Case A opens by itself as the last one left.
    await userEvent.click(screen.getByRole('button', { name: /Case B/ }))
    await userEvent.click(within(screen.getByRole('radiogroup', { name: 'Response for Case B' })).getByText('Resp Y'))
    await userEvent.click(within(screen.getByRole('radiogroup', { name: 'Response for Case A' })).getByText('Resp X'))
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0][0][0]).toEqual({
      questionId: 'q1', mode: 'depends', ranking: ['b', 'a'], mapping: { a: 'X', b: 'Y' },
    })
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

  it('answers the open person with number keys and commits with Enter', async () => {
    const onComplete = vi.fn()
    render(<QuizFlow questions={backbone} onComplete={onComplete} />)
    await userEvent.click(screen.getByRole('button', { name: /Case A/ }))
    await userEvent.keyboard('1') // Case A → Resp X; Case B opens
    await userEvent.keyboard('2') // Case B → Resp Y
    await userEvent.keyboard('{Enter}')
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0][0][0]).toMatchObject({ ranking: ['a', 'b'], mapping: { a: 'X', b: 'Y' } })
  })

  it('names the "It depends" fork after the situation', () => {
    const questions: Question[] = [{
      id: 'q1', prompt: 'Stakes?', kind: 'flavor', axis: 'stakes',
      cases: [{ id: 'a', label: 'A', axisLevel: 1 }, { id: 'b', label: 'B', axisLevel: 0 }],
      options: [{ id: 'X', label: 'X', vector: {} }],
    }]
    render(<QuizFlow questions={questions} onComplete={() => {}} />)
    expect(screen.getByRole('button', { name: /It depends what’s at stake/ })).toBeInTheDocument()
  })

  it('Back returns to the previous question', async () => {
    const questions: Question[] = [
      { id: 'q1', prompt: 'First?', kind: 'flavor', options: [{ id: 'X', label: 'Pick X', vector: {} }] },
      { id: 'q2', prompt: 'Second?', kind: 'flavor', options: [{ id: 'Z', label: 'Pick Z', vector: {} }] },
    ]
    render(<QuizFlow questions={questions} onComplete={() => {}} />)
    await userEvent.click(screen.getByText('Pick X'))
    expect(screen.getByText('Second?')).toBeInTheDocument()
    await userEvent.click(screen.getByText(/Back/))
    expect(screen.getByText('First?')).toBeInTheDocument()
  })

  it('shows progress as a labelled progressbar with question indicator', () => {
    const questions: Question[] = [
      { id: 'q1', prompt: 'First?', kind: 'flavor', options: [{ id: 'X', label: 'X', vector: {} }] },
      { id: 'q2', prompt: 'Second?', kind: 'flavor', options: [{ id: 'Y', label: 'Y', vector: {} }] },
    ]
    render(<QuizFlow questions={questions} onComplete={() => {}} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '2')
    expect(screen.getByText(/Question 1/)).toBeInTheDocument()
  })
})
