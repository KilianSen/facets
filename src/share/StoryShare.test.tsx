import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StoryShare } from './StoryShare'
import type { StoryData } from './StoryCard'
import { shapeFromArchetype } from '../signature/shape'
import { CONTENT } from '../content'

vi.mock('html-to-image', () => ({ toPng: vi.fn(async () => 'data:image/png;base64,iVBORw0KGgo=') }))

const data: StoryData = {
  name: 'The Fierce Loyalist',
  tagline: 'all-in and all-heat with your people',
  accent: '#E4572E',
  band: 'Solid read',
  coStars: [{ name: 'The Captain', accent: '#3B5BDB' }],
  also: "When it's someone close, I take charge; when it's a stranger, I follow.",
  alsoLabel: 'Also true about me',
  shape: shapeFromArchetype(CONTENT.archetypes.find(a => a.id === 'fierce_loyalist')!),
}

describe('StoryShare', () => {
  const nav = navigator as Navigator & { share?: unknown; canShare?: unknown }
  beforeEach(() => {
    Object.defineProperty(nav, 'share', { value: vi.fn(async () => {}), configurable: true })
    Object.defineProperty(nav, 'canShare', { value: vi.fn(() => true), configurable: true })
  })
  afterEach(() => {
    Object.defineProperty(nav, 'share', { value: undefined, configurable: true })
    Object.defineProperty(nav, 'canShare', { value: undefined, configurable: true })
  })

  it('previews the card: type, co-stars, read and a first-person line', async () => {
    render(<StoryShare data={data} />)
    await userEvent.click(screen.getByRole('button', { name: 'Share to story' }))
    const dialog = screen.getByRole('dialog', { name: 'Your story card' })
    expect(within(dialog).getByRole('heading', { name: 'The Fierce Loyalist' })).toBeInTheDocument()
    expect(within(dialog).getByText('The Captain')).toBeInTheDocument()
    expect(within(dialog).getByText('Solid read')).toBeInTheDocument()
    expect(within(dialog).getByText(/I take charge/)).toBeInTheDocument()
    expect(within(dialog).getByText('What’s your signature?')).toBeInTheDocument()
  })

  it('hands a PNG file to the native share sheet', async () => {
    render(<StoryShare data={data} />)
    await userEvent.click(screen.getByRole('button', { name: 'Share to story' }))
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    await waitFor(() => expect(nav.share).toHaveBeenCalledTimes(1))
    const payload = (nav.share as ReturnType<typeof vi.fn>).mock.calls[0][0] as { files: File[]; text: string }
    expect(payload.files[0].name).toBe('facets-story.png')
    expect(payload.files[0].type).toBe('image/png')
    expect(payload.text).toMatch(/The Fierce Loyalist/)
    expect(await screen.findByText('Ready ✓')).toBeInTheDocument()
  })

  it('treats a dismissed share sheet as no error', async () => {
    Object.defineProperty(nav, 'share', { value: vi.fn(async () => { throw Object.assign(new Error('cancel'), { name: 'AbortError' }) }), configurable: true })
    render(<StoryShare data={data} />)
    await userEvent.click(screen.getByRole('button', { name: 'Share to story' }))
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(await screen.findByText(/Post it to your story/)).toBeInTheDocument()
  })

  it('closes with Escape', async () => {
    render(<StoryShare data={data} />)
    await userEvent.click(screen.getByRole('button', { name: 'Share to story' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
