import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DependsFlow } from './DependsFlow'

const cases = [
  { id: 'a', label: 'Best friend', axisLevel: 1 },
  { id: 'b', label: 'Teammate', axisLevel: 0.5 },
  { id: 'c', label: 'Stranger', axisLevel: 0 },
]
const options = [
  { id: 'X', label: 'Call immediately', vector: {} },
  { id: 'Y', label: 'Send a text', vector: {} },
]

function setup(over: Partial<Parameters<typeof DependsFlow>[0]> = {}) {
  const handlers = { onOpen: vi.fn(), onMap: vi.fn(), onFillAll: vi.fn(), onReset: vi.fn() }
  render(<DependsFlow cases={cases} options={options} ranking={[]} mapping={{}} activeCaseId={null} {...handlers} {...over} />)
  return handlers
}

describe('DependsFlow', () => {
  it('asks who to start with, and opens a person on tap', async () => {
    const { onOpen } = setup()
    expect(screen.getByText(/Start with whoever this is most true for/)).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Teammate/ }))
    expect(onOpen).toHaveBeenCalledWith('b')
  })

  it('shows the answers for the open person and maps a choice', async () => {
    const { onMap } = setup({ activeCaseId: 'b' })
    const group = screen.getByRole('radiogroup', { name: 'Response for Teammate' })
    await userEvent.click(within(group).getByRole('radio', { name: 'Send a text' }))
    expect(onMap).toHaveBeenCalledWith('b', 'Y')
  })

  it('numbers people in the order they were answered and shows their answer', () => {
    setup({ ranking: ['c', 'a'], mapping: { c: 'X', a: 'Y' } })
    expect(screen.getByRole('button', { name: /Stranger.*Call immediately.*ranked 1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Best friend.*Send a text.*ranked 2/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Teammate.*Tap to answer/ })).toBeInTheDocument()
    expect(screen.getByText(/Who’s next most like you/)).toBeInTheDocument()
  })

  it('offers one answer for everyone', async () => {
    const { onFillAll } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Same answer for everyone' }))
    await userEvent.click(within(screen.getByRole('group', { name: 'Same answer for everyone' })).getByRole('button', { name: 'Call immediately' }))
    expect(onFillAll).toHaveBeenCalledWith('X')
  })

  it('lets you start the question over once anything is answered', async () => {
    const { onReset } = setup({ ranking: ['a'], mapping: { a: 'X' } })
    await userEvent.click(screen.getByRole('button', { name: 'Start over' }))
    expect(onReset).toHaveBeenCalled()
  })

  it('confirms the ranking once everyone is answered', () => {
    setup({ ranking: ['b', 'a', 'c'], mapping: { a: 'X', b: 'X', c: 'Y' } })
    expect(screen.getByText(/Ranked in the order you answered/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Same answer for everyone' })).not.toBeInTheDocument()
  })
})
