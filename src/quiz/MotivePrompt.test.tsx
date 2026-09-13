import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotivePrompt, type MotiveStep } from './MotivePrompt'
import { CONTENT } from '../content'

const step = (axisId: string, tell: string | null): MotiveStep => ({
  axis: CONTENT.axes.find(a => a.id === axisId)!,
  tell,
  options: CONTENT.motives!.byAxis[axisId],
})

describe('MotivePrompt', () => {
  it('walks each swing, collecting picks and honouring skips', async () => {
    const onDone = vi.fn()
    render(<MotivePrompt steps={[step('closeness', 'When it’s someone close, you get warm.'), step('stakes', null)]} onDone={onDone} />)

    expect(screen.getByRole('heading', { name: /swing hard on Closeness/ })).toBeInTheDocument()
    expect(screen.getByText('When it’s someone close, you get warm.')).toBeInTheDocument()
    expect(screen.getByText(/1 of 2/)).toBeInTheDocument()
    await userEvent.click(within(screen.getByRole('list', { name: 'Possible reasons' })).getAllByRole('button')[0])

    expect(screen.getByRole('heading', { name: /swing hard on Stakes/ })).toBeInTheDocument()
    expect(onDone).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Not sure — skip' }))

    expect(onDone).toHaveBeenCalledWith([{ axisId: 'closeness', motiveId: CONTENT.motives!.byAxis.closeness[0].motiveId }])
  })

  it('offers every authored reason for the axis', () => {
    render(<MotivePrompt steps={[step('initiative', null)]} onDone={() => {}} />)
    const buttons = within(screen.getByRole('list', { name: 'Possible reasons' })).getAllByRole('button')
    expect(buttons.map(b => b.textContent)).toEqual(CONTENT.motives!.byAxis.initiative.map(o => o.label))
  })
})
