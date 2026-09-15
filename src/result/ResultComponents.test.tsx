import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArchetypeHeader } from './ArchetypeHeader'
import { SignatureSection } from './SignatureSection'
import { DimensionStory } from './DimensionStory'
import { SettingsSection } from './SettingsSection'
import { matchBand } from './matchBand'
import type { Archetype, BehaviorDim, Contingency, Profile } from '../engine/types'

const arch: Archetype = { id: 'vault', code: 'VAULT', name: 'The Vault', tagline: 'selective', copy: 'Selective warmth.', signature: {} }
const DIMS: BehaviorDim[] = [
  { id: 'warmth', name: 'Warmth', lowLabel: 'stay cool', highLabel: 'get warm' },
  { id: 'boldness', name: 'Boldness', lowLabel: 'play it safe', highLabel: 'take the risk' },
]

describe('matchBand', () => {
  it('maps confidence to a qualitative read (never a percentage)', () => {
    expect(matchBand(0.9)).toBe('Clear read')
    expect(matchBand(0.55)).toBe('Solid read')
    expect(matchBand(0.1)).toBe('Loose read')
  })
  it('uses the calibrated boundaries', () => {
    // Typical one-type people sit ~0.86 (Clear); blends ~0.71 (Solid); random clickers ~0.59 but rarely ≥ 0.75.
    expect(matchBand(0.75)).toBe('Clear read')
    expect(matchBand(0.74)).toBe('Solid read')
    expect(matchBand(0.5)).toBe('Solid read')
    expect(matchBand(0.49)).toBe('Loose read')
  })
})

describe('ArchetypeHeader', () => {
  it('makes the human name the heading and shows the code as a badge', () => {
    render(<ArchetypeHeader archetype={arch} confidence={0.82} />)
    expect(screen.getByRole('heading', { name: 'The Vault' })).toBeInTheDocument()
    expect(screen.getByText('VAULT')).toBeInTheDocument()
  })
  it('shows a qualitative band, not a percentage', () => {
    render(<ArchetypeHeader archetype={arch} confidence={0.82} />)
    expect(screen.getByText('Clear read')).toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })
  it('gives the near-miss runner-up its own card that can join the 3D comparison', async () => {
    const nurturer: Archetype = { id: 'nurturer', code: 'NURTUR', name: 'The Nurturer', tagline: 'softens', copy: '', signature: { stakes: { warmth: 3 } } }
    const onCompare = vi.fn()
    render(<ArchetypeHeader archetype={arch} confidence={0.82} runnerUp={nurturer} onCompare={onCompare} />)
    expect(screen.getByText('So close')).toBeInTheDocument()
    expect(screen.getByText('You almost got…')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'The Nurturer' })).toHaveAttribute('href', '/archetypes/nurturer')
    await userEvent.click(screen.getByRole('button', { name: 'Compare The Nurturer in 3D' }))
    expect(onCompare).toHaveBeenCalledWith('nurturer')
  })
  it('names the co-stars under the headline and gives each a card with the shift that earned it', () => {
    const clutch: Archetype = { id: 'clutch', code: 'CLUTCH', name: 'The Clutch', tagline: 'rises', copy: '', signature: { stakes: { composure: 3 } } }
    render(
      <ArchetypeHeader
        archetype={arch} confidence={0.82} code="VAULT · CLUTCH"
        facets={[{ archetype: clutch, lens: 'under pressure', axisId: 'stakes', tell: 'When the stakes are high, you stay calm.' }]}
        onCompare={() => {}} comparingId="clutch"
      />,
    )
    expect(screen.getByText('VAULT · CLUTCH')).toBeInTheDocument()
    expect(screen.getByText('with')).toBeInTheDocument()
    expect(screen.getAllByText('The Clutch')).toHaveLength(2) // headline + card
    expect(screen.getByText('Your co-stars')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'The Clutch' })).toHaveAttribute('href', '/archetypes/clutch')
    expect(screen.getByText('Under pressure, I’m…')).toBeInTheDocument()
    expect(screen.getByText('When the stakes are high, you stay calm.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compare The Clutch in 3D' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('SignatureSection', () => {
  const signature: Profile['signature'] = {
    closeness: { warmth: { slope: 3, curvature: 0, levels: [] }, boldness: { slope: 0, curvature: 0, levels: [] } },
  }
  const contingencies: Contingency[] = [{ axis: 'closeness', dim: 'warmth', slope: 3, text: 'When close, you get warm.' }]

  it('spells out the strongest tell and a baseline lean beneath the graph', () => {
    render(
      <SignatureSection
        signature={signature}
        baseline={{ warmth: 1.5 }}
        contingencies={contingencies}
        flexibility={1.8}
        dims={DIMS}
        accent="#22d3ee"
      />,
    )
    expect(screen.getByText('When close, you get warm.')).toBeInTheDocument()
    expect(screen.getByText(/tend to get warm/)).toBeInTheDocument()  // baseline lean -> high label
    expect(screen.getByText(/situational/)).toBeInTheDocument()       // flexibility read
  })

  it('falls back to a consistency message when nothing swings', () => {
    render(
      <SignatureSection
        signature={{ closeness: { warmth: { slope: 0, curvature: 0, levels: [] } } }}
        baseline={{}}
        contingencies={[]}
        flexibility={0.3}
        dims={DIMS}
        accent="#22d3ee"
      />,
    )
    expect(screen.getByText(/consistent/)).toBeInTheDocument()
  })

  it('surfaces a non-monotonic bend as a "both ways" tell instead of calling it consistent', () => {
    render(
      <SignatureSection
        signature={{ closeness: { warmth: { slope: 0, curvature: -3, levels: [] } } }}
        baseline={{}}
        contingencies={[{
          axis: 'closeness', dim: 'warmth', slope: 0, curvature: -3, kind: 'curve',
          text: 'When closeness sits in the middle, you get warm; at either extreme, you stay cool.',
        }]}
        flexibility={0}
        dims={DIMS}
        accent="#22d3ee"
      />,
    )
    expect(screen.getByText(/both ways/i)).toBeInTheDocument()
    expect(screen.getByText(/at either extreme/i)).toBeInTheDocument()
    expect(screen.queryByText(/remarkably consistent/i)).not.toBeInTheDocument()
  })

  it('draws the signature as a gem you can explore situation by situation, with the archetype as a ghost', async () => {
    const sig: Profile['signature'] = {
      closeness: {
        warmth: { slope: 3, curvature: 0, levels: [] },
        boldness: { slope: 2, curvature: 0, levels: [] },
      },
    }
    const matched: Archetype = {
      id: 'vault', code: 'VAULT', name: 'The Vault', tagline: 'selective', copy: 'x',
      signature: { closeness: { warmth: 3 } },
    }
    render(
      <SignatureSection
        signature={sig}
        baseline={{ warmth: 1.5 }}
        contingencies={contingencies}
        flexibility={1.8}
        dims={DIMS}
        accent="#22d3ee"
        archetype={matched}
      />,
    )
    const situations = screen.getByRole('group', { name: 'Situations' })
    // Opens on the situation that moves you most…
    expect(within(situations).getByRole('button', { name: 'Closeness' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('↑ get warm')).toBeInTheDocument()
    // …and any other situation can be explored.
    await userEvent.click(within(situations).getByRole('button', { name: 'Stakes' }))
    expect(within(situations).getByRole('button', { name: 'Stakes' })).toHaveAttribute('aria-pressed', 'true')
    // The matched archetype is drawn behind as a labelled dashed outline.
    expect(screen.getByText(/dashed outline is The Vault/)).toBeInTheDocument()
    expect(screen.getByText(/- - - The Vault/)).toBeInTheDocument()
  })
})

describe('DimensionStory', () => {
  it('groups a wide-range dim under "shifts most" and a leaned narrow dim under "constant"', () => {
    render(
      <DimensionStory
        dims={DIMS}
        ranges={{
          boldness: { min: -1.5, max: 1.5, typical: 0 }, // wide range -> swings
          warmth: { min: 0.8, max: 1.2, typical: 1 },    // narrow, leaned -> anchor
        }}
      />,
    )
    expect(screen.getByText(/What shifts most/i)).toBeInTheDocument()
    expect(screen.getByText(/What’s constant about you/i)).toBeInTheDocument()
    expect(screen.getByText('play it safe → take the risk')).toBeInTheDocument()
    expect(screen.getByText(/you get warm/)).toBeInTheDocument()
  })

  it('shows a middle-of-the-road fallback when nothing anchors or swings', () => {
    render(<DimensionStory dims={DIMS} ranges={{ warmth: { min: 0, max: 0, typical: 0 }, boldness: { min: 0, max: 0, typical: 0 } }} />)
    expect(screen.getByText(/near the middle/i)).toBeInTheDocument()
  })
})

describe('SettingsSection', () => {
  // Plenty of answers and some raw offset, but no claim cleared the engine's bars.
  const quiet = (setting: 'romance' | 'work' | 'social' | 'family') =>
    ({ setting, sampleSize: 9, questions: 3, offsets: { warmth: 0.6, boldness: -0.4 }, claims: [] })

  it('shows nothing without a claim, however many answers or raw offsets there are', () => {
    const { container } = render(
      <SettingsSection reports={{ romance: quiet('romance'), work: quiet('work'), social: quiet('social'), family: quiet('family') }} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows each claim with its setting and how many questions back it', () => {
    const text = 'At work, you take charge more than you do elsewhere in the same situations.'
    render(
      <SettingsSection
        reports={{
          romance: quiet('romance'), social: quiet('social'), family: quiet('family'),
          work: { ...quiet('work'), claims: [{ dimId: 'lead', offset: 2, questions: 4, text }] },
        }}
      />,
    )
    expect(screen.getByText('Where the setting matters')).toBeInTheDocument()
    expect(screen.getByText('Work')).toBeInTheDocument()
    expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.getByText('Seen across 4 questions.')).toBeInTheDocument()
    expect(screen.queryByText('Dating')).not.toBeInTheDocument()
  })
})
