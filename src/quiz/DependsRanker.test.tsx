import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DependsRanker } from './DependsRanker'

describe('DependsRanker', () => {
  it('reorders and confirms the ranked case ids', async () => {
    const onConfirm = vi.fn()
    render(<DependsRanker cases={[{ id: 'a', label: 'Alpha', axisLevel: 1 }, { id: 'b', label: 'Beta', axisLevel: 0 }]} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByLabelText('move Beta up'))
    await userEvent.click(screen.getByText('Next'))
    expect(onConfirm).toHaveBeenCalledWith(['b', 'a'])
  })
})
