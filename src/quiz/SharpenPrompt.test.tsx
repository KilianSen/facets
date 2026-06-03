import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SharpenPrompt } from './SharpenPrompt'
import type { SituationAxis } from '../engine/types'

const axis: SituationAxis = { id: 'closeness', name: 'Closeness', lowLabel: "it's a stranger", highLabel: "it's someone close" }

describe('SharpenPrompt', () => {
  it('names the standout axis', () => {
    render(<SharpenPrompt axis={axis} onSharpen={() => {}} onSkip={() => {}} />)
    expect(screen.getByRole('heading')).toHaveTextContent('Closeness')
    expect(screen.getByText(/it's someone close/)).toBeInTheDocument()
  })

  it('opts in via the sharpen button', async () => {
    const onSharpen = vi.fn()
    render(<SharpenPrompt axis={axis} onSharpen={onSharpen} onSkip={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Pin down my Closeness/ }))
    expect(onSharpen).toHaveBeenCalledOnce()
  })

  it('skips to results', async () => {
    const onSkip = vi.fn()
    render(<SharpenPrompt axis={axis} onSharpen={() => {}} onSkip={onSkip} />)
    await userEvent.click(screen.getByRole('button', { name: /Skip to my results/ }))
    expect(onSkip).toHaveBeenCalledOnce()
  })
})
