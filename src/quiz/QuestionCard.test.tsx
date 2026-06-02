import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionCard } from './QuestionCard'
import type { Question } from '../engine/types'

const q: Question = {
  id: 'q', prompt: 'How do you react?', kind: 'backbone', axis: 'closeness',
  cases: [{ id: 'a', label: 'A', axisLevel: 1 }],
  options: [{ id: 'X', label: 'Option X', vector: {} }],
}

describe('QuestionCard', () => {
  it('fires onSingle when an option is clicked', async () => {
    const onSingle = vi.fn()
    render(<QuestionCard question={q} onSingle={onSingle} onDepends={() => {}} />)
    await userEvent.click(screen.getByText('Option X'))
    expect(onSingle).toHaveBeenCalledWith('X')
  })
  it('shows "It depends" only when the question has cases, and fires onDepends', async () => {
    const onDepends = vi.fn()
    render(<QuestionCard question={q} onSingle={() => {}} onDepends={onDepends} />)
    await userEvent.click(screen.getByText(/It depends/))
    expect(onDepends).toHaveBeenCalled()
  })
})
