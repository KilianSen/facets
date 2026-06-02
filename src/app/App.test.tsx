import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'

describe('App', () => {
  beforeEach(() => localStorage.clear())

  it('shows the landing page and starts the quiz', async () => {
    render(<App />)
    expect(screen.getByText(/it depends/i)).toBeInTheDocument()
    await userEvent.click(screen.getByText('Start the test'))
    expect(screen.getByText('1 / 8')).toBeInTheDocument()
  })
})
