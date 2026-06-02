import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DependsCard } from './DependsCard'

const cases = [{ id: 'a', label: 'Case A', axisLevel: 1 }, { id: 'b', label: 'Case B', axisLevel: 0 }]
const options = [{ id: 'X', label: 'Resp X', vector: {} }, { id: 'Y', label: 'Resp Y', vector: {} }]

function setup(over: Partial<Parameters<typeof DependsCard>[0]> = {}) {
  const onReorder = vi.fn(), onMap = vi.fn(), onFillAll = vi.fn()
  render(
    <DependsCard
      cases={cases} options={options} ranking={['a', 'b']} mapping={{}}
      onReorder={onReorder} onMap={onMap} onFillAll={onFillAll}
      {...over}
    />,
  )
  return { onReorder, onMap, onFillAll }
}

describe('DependsCard (folded rank + map)', () => {
  it('shows one labelled response group per case', () => {
    setup()
    expect(screen.getByRole('radiogroup', { name: 'Case A' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Case B' })).toBeInTheDocument()
  })

  it('maps a response within a case', async () => {
    const { onMap } = setup()
    const groupA = screen.getByRole('radiogroup', { name: 'Case A' })
    await userEvent.click(within(groupA).getByText('Resp X'))
    expect(onMap).toHaveBeenCalledWith('a', 'X')
  })

  it('reorders a case with the ↑/↓ fallback controls', async () => {
    const { onReorder } = setup()
    await userEvent.click(screen.getByLabelText('move Case B up'))
    expect(onReorder).toHaveBeenCalledWith(['b', 'a'])
  })

  it('exposes a drag handle per context for drag-to-reorder', () => {
    setup()
    expect(screen.getByLabelText('drag to reorder Case A')).toBeInTheDocument()
    expect(screen.getByLabelText('drag to reorder Case B')).toBeInTheDocument()
  })

  it('"same for all" fills every case with one response', async () => {
    const { onFillAll } = setup()
    await userEvent.click(screen.getByRole('button', { name: /same for all: Resp X/i }))
    expect(onFillAll).toHaveBeenCalledWith('X')
  })

  it('supports arrow-key selection within a case (roving radiogroup)', async () => {
    const { onMap } = setup()
    within(screen.getByRole('radiogroup', { name: 'Case A' })).getAllByRole('radio')[0].focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onMap).toHaveBeenCalledWith('a', 'Y')
  })
})
