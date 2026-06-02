import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CaseMapper } from './CaseMapper'

const cases = [{ id: 'a', label: 'Case A', axisLevel: 1 }]
const options = [{ id: 'X', label: 'Resp X', vector: {} }]

describe('CaseMapper', () => {
  it('maps a case to an option', async () => {
    const onMap = vi.fn()
    render(<CaseMapper cases={cases} options={options} mapping={{}} onMap={onMap} canCommit={false} onCommit={() => {}} />)
    await userEvent.click(screen.getByText('Resp X'))
    expect(onMap).toHaveBeenCalledWith('a', 'X')
  })
  it('disables commit until canCommit is true', () => {
    const { rerender } = render(<CaseMapper cases={cases} options={options} mapping={{}} onMap={() => {}} canCommit={false} onCommit={() => {}} />)
    expect(screen.getByText(/See result/)).toBeDisabled()
    rerender(<CaseMapper cases={cases} options={options} mapping={{ a: 'X' }} onMap={() => {}} canCommit onCommit={() => {}} />)
    expect(screen.getByText(/See result/)).toBeEnabled()
  })
})
