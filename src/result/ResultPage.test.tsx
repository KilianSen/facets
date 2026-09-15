import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResultPage } from './ResultPage'
import { CONTENT } from '../content'
import { computeProfile, computeCast, castFacets, unexplainedTells } from '../engine'
import { sigFrom } from '../engine/testFixtures'
import type { Profile } from '../engine/types'

// A Vault (closeness) who is also clearly Clutch under pressure and Runs on Fumes on their battery.
const signature = sigFrom(CONTENT, {
  closeness: { warmth: 5, approach: 5 },
  stakes: { composure: 4, lead: 3, boldness: 3 },
  energy: { approach: -3, boldness: -3 },
  audience: { directness: -4 }, // a shift no type explains → "Also true about you"
})
const cast = computeCast(signature, {}, CONTENT)
const profile: Profile = {
  ...computeProfile([], CONTENT),
  signature, baseline: {},
  archetype: { id: cast.lead, confidence: cast.confidence, runnerUpId: cast.runnerUpId },
  facets: castFacets(cast),
  unexplained: unexplainedTells(cast, CONTENT),
}
const renderPage = () => render(<ResultPage profile={profile} content={CONTENT} answers={[]} onRestart={() => {}} />)

describe('ResultPage cast', () => {
  it('names the co-stars right under the headline, each with its own card', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'The Vault' })).toBeInTheDocument()
    expect(screen.getByText('Your co-stars')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'The Clutch' })).toHaveAttribute('href', '/archetypes/clutch')
    expect(screen.getByRole('link', { name: 'Runs on Fumes' })).toHaveAttribute('href', '/archetypes/runs_on_fumes')
  })

  it('says plainly what no type in the cast explains', () => {
    renderPage()
    expect(screen.getByText('Also true about you')).toBeInTheDocument()
    expect(screen.getByText(/When you're being watched, you stay diplomatic/)).toBeInTheDocument()
  })

  it('switches the see-through 3D comparison between the main type, a co-star, and none', async () => {
    renderPage()
    const chips = screen.getByRole('group', { name: 'Compare in 3D' })
    expect(within(chips).getByRole('button', { name: /^The Vault/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('img', { name: /The Vault is drawn see-through/ })).toBeInTheDocument()

    // From the co-star's card: the comparison switches and its situation opens below.
    await userEvent.click(screen.getByRole('button', { name: 'Compare The Clutch in 3D' }))
    expect(within(chips).getByRole('button', { name: /^The Clutch/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('img', { name: /The Clutch is drawn see-through/ })).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Situations' })).getByRole('button', { name: 'Stakes' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(within(chips).getByRole('button', { name: 'None' }))
    expect(screen.queryByRole('img', { name: /see-through/ })).not.toBeInTheDocument()
  })
})
