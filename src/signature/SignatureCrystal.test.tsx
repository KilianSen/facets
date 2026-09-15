import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignatureCrystal } from './SignatureCrystal'
import { shapeFromArchetype } from './shape'
import { CONTENT } from '../content'

const arch = (id: string) => shapeFromArchetype(CONTENT.archetypes.find(a => a.id === id)!)

describe('SignatureCrystal', () => {
  it('describes where the crystals stand tallest', () => {
    render(<SignatureCrystal shape={arch('clutch')} accent="#E3A008" />)
    expect(screen.getByRole('img', { name: /Tallest at Stakes/ })).toBeInTheDocument()
  })

  it('draws a comparison shape see-through and says so', () => {
    const { container } = render(<SignatureCrystal shape={arch('clutch')} accent="#E3A008" ghost={arch('vault')} ghostLabel="The Vault" />)
    expect(screen.getByRole('img', { name: /The Vault is drawn see-through for comparison/ })).toBeInTheDocument()
    expect(container.querySelectorAll('path[data-ghost="true"]').length).toBeGreaterThan(0)
  })

  it('describes a steady signature', () => {
    render(<SignatureCrystal shape={arch('constant')} accent="#868E96" />)
    expect(screen.getByRole('img', { name: /six even crystals/ })).toBeInTheDocument()
  })

  it('tapping a crystal selects its situation', async () => {
    const onSelect = vi.fn()
    const { container } = render(<SignatureCrystal shape={arch('clutch')} accent="#E3A008" onSelect={onSelect} />)
    await userEvent.click(container.querySelector('path[data-axis="stakes"]')!)
    expect(onSelect).toHaveBeenCalledWith('stakes')
  })

  it('a drag turns it instead of selecting', () => {
    const onSelect = vi.fn()
    const { container } = render(<SignatureCrystal shape={arch('clutch')} accent="#E3A008" onSelect={onSelect} />)
    const svg = screen.getByRole('img')
    const before = container.innerHTML
    const face = container.querySelector('path[data-axis="stakes"]')!
    fireEvent.pointerDown(svg, { clientX: 100, clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(svg, { clientX: 160, clientY: 100, pointerId: 1 })
    fireEvent.pointerUp(svg, { clientX: 160, clientY: 100, pointerId: 1 })
    fireEvent.click(face)
    expect(onSelect).not.toHaveBeenCalled()
    expect(container.innerHTML).not.toBe(before)
  })

  it('turns with the arrow keys', () => {
    const { container } = render(<SignatureCrystal shape={arch('vault')} accent="#E4572E" />)
    const before = container.innerHTML
    fireEvent.keyDown(screen.getByRole('img'), { key: 'ArrowRight' })
    expect(container.innerHTML).not.toBe(before)
  })
})
