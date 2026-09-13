import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScenarioCard } from './ScenarioCard'

const cases = [
  { id: 'a', label: 'Best friend', axisLevel: 1 },
  { id: 'b', label: 'Teammate', axisLevel: 0.5 },
  { id: 'c', label: 'Stranger', axisLevel: 0 },
]
const options = [
  { id: 'X', label: 'Call immediately', vector: {} },
  { id: 'Y', label: 'Send a text', vector: {} },
]

function setup(over: Partial<Parameters<typeof ScenarioCard>[0]> = {}) {
  const onMap = vi.fn()
  const onSetCaseIndex = vi.fn()
  const onFillAll = vi.fn()
  render(
    <ScenarioCard
      cases={cases}
      options={options}
      mapping={{}}
      caseIndex={0}
      onMap={onMap}
      onSetCaseIndex={onSetCaseIndex}
      onFillAll={onFillAll}
      {...over}
    />,
  )
  return { onMap, onSetCaseIndex, onFillAll }
}

describe('ScenarioCard (Scenario Stepper)', () => {
  it('renders step indicator pills and active context card', () => {
    setup()
    expect(screen.getByRole('button', { name: /Step 1: Best friend/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Step 2: Teammate/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Step 3: Stranger/i })).toBeInTheDocument()
    expect(screen.getByText(/When it’s/i)).toBeInTheDocument()
    expect(screen.getAllByText('Best friend').length).toBeGreaterThan(0)
  })

  it('maps an option when clicked', async () => {
    const { onMap } = setup()
    await userEvent.click(screen.getByRole('radio', { name: /Call immediately/i }))
    expect(onMap).toHaveBeenCalledWith('a', 'X')
  })

  it('switches steps when clicking a step pill', async () => {
    const { onSetCaseIndex } = setup()
    await userEvent.click(screen.getByRole('button', { name: /Step 2: Teammate/i }))
    expect(onSetCaseIndex).toHaveBeenCalledWith(1)
  })

  it('navigates to the next and previous contexts with the stepper buttons', async () => {
    const { onSetCaseIndex } = setup({ caseIndex: 1 })
    await userEvent.click(screen.getByRole('button', { name: /Previous context/i }))
    expect(onSetCaseIndex).toHaveBeenCalledWith(0)

    await userEvent.click(screen.getByRole('button', { name: /Next context/i }))
    expect(onSetCaseIndex).toHaveBeenCalledWith(2)
  })

  it('supports "Same reaction for all" quick action', async () => {
    const { onFillAll } = setup()
    const fillButtons = screen.getAllByRole('button', { name: /Call immediately/i })
    // The fill-all button is the second one in the document
    await userEvent.click(fillButtons[fillButtons.length - 1])
    expect(onFillAll).toHaveBeenCalledWith('X')
  })
})
