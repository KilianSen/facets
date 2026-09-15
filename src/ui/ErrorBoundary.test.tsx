import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function ProblemChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Explosion in child')
  }
  return <div>Healthy content</div>
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Healthy content')).toBeInTheDocument()
  })

  it('catches render error and displays the recovery screen', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went sideways.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset & restart/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
    spy.mockRestore()
  })

  it('resets localStorage when reset button is clicked', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem('fptic.quiz.v1', '{"test":1}')
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>,
    )
    const resetBtn = screen.getByRole('button', { name: /reset & restart/i })
    fireEvent.click(resetBtn)
    expect(localStorage.getItem('fptic.quiz.v1')).toBeNull()
    spy.mockRestore()
  })
})
