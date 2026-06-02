import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'

describe('App', () => {
  beforeEach(() => localStorage.clear())

  it('shows the landing page with both run modes', () => {
    render(<App />)
    expect(screen.getByText(/it depends/i)).toBeInTheDocument()
    expect(screen.getByText('Quick read')).toBeInTheDocument()
    expect(screen.getByText('Deep dive')).toBeInTheDocument()
  })

  it('Quick read starts a ~24-question short run', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('Quick read'))
    expect(screen.getByText('1 / 24')).toBeInTheDocument()
  })

  it('Deep dive starts the full 60-question run', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('Deep dive'))
    expect(screen.getByText('1 / 60')).toBeInTheDocument()
  })
})
