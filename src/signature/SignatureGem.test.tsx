import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignatureGem, GemMini } from './SignatureGem'
import { shapeFromArchetype } from './shape'
import { CONTENT } from '../content'

const clutch = shapeFromArchetype(CONTENT.archetypes.find(a => a.id === 'clutch')!)

describe('SignatureGem', () => {
  it('opens on the situation that moves the shape most, and names what changes there', () => {
    render(<SignatureGem shape={clutch} accent="#E3A008" />)
    const situations = screen.getByRole('group', { name: 'Situations' })
    expect(within(situations).getByRole('button', { name: 'Stakes' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('img', { name: /Stakes, big swing/ })).toBeInTheDocument()
    expect(screen.getByText('↑ stay calm')).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /Slide from it's trivial to the stakes are high/ })).toBeInTheDocument()
  })

  it('switches the morph to another situation', async () => {
    const onAxisChange = vi.fn()
    render(<SignatureGem shape={clutch} accent="#E3A008" onAxisChange={onAxisChange} />)
    await userEvent.click(within(screen.getByRole('group', { name: 'Situations' })).getByRole('button', { name: 'Closeness' }))
    expect(onAxisChange).toHaveBeenCalledWith('closeness')
    expect(screen.getByRole('img', { name: /as closeness rises/ })).toBeInTheDocument()
    expect(screen.getByText(/Nothing moves much here/)).toBeInTheDocument()
  })

  it('follows a controlled situation', () => {
    render(<SignatureGem shape={clutch} accent="#E3A008" axisId="power" />)
    expect(within(screen.getByRole('group', { name: 'Situations' })).getByRole('button', { name: 'Power' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('labels a ghost outline', () => {
    render(<SignatureGem shape={clutch} accent="#E3A008" ghost={clutch} ghostLabel="The Clutch" />)
    expect(screen.getByText(/- - - The Clutch/)).toBeInTheDocument()
  })
})

describe('GemMini', () => {
  it('is a decorative silhouette', () => {
    const { container } = render(<GemMini shape={clutch} accent="#E3A008" />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
