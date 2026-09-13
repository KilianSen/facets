import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArchetypeHeader } from './ArchetypeHeader'
import { SignatureSection } from './SignatureSection'
import { DimensionStory } from './DimensionStory'
import { matchBand } from './matchBand'
import type { Archetype, BehaviorDim, Contingency, Profile } from '../engine/types'

const arch: Archetype = { id: 'vault', code: 'VAULT', name: 'The Vault', tagline: 'selective', copy: 'Selective warmth.', signature: {} }
const DIMS: BehaviorDim[] = [
  { id: 'warmth', name: 'Warmth', lowLabel: 'stay cool', highLabel: 'get warm' },
  { id: 'boldness', name: 'Boldness', lowLabel: 'play it safe', highLabel: 'take the risk' },
]

describe('matchBand', () => {
  it('maps confidence to a qualitative band (never a percentage)', () => {
    expect(matchBand(0.8)).toBe('Strong match')
    expect(matchBand(0.5)).toBe('Solid match')
    expect(matchBand(0.1)).toBe('Slight lean')
  })
  it('never deflates a completed run: the realistic floor (~0.50) is at least a Solid match', () => {
    // Completed runs answer all axes; confidence clusters ~[0.50, 0.63]. None should read "Slight lean".
    expect(matchBand(0.50)).toBe('Solid match')
    expect(matchBand(0.515)).toBe('Solid match')
    expect(matchBand(0.6)).toBe('Strong match')
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
    expect(screen.getByText('Strong match')).toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })
  it('shows a runner-up streak when provided', () => {
    render(<ArchetypeHeader archetype={arch} confidence={0.82} runnerUpName="The Nurturer" />)
    expect(screen.getByText(/streak of The Nurturer/)).toBeInTheDocument()
  })
  it('shows secondary facets and the full code in place of the runner-up line', () => {
    const clutch: Archetype = { id: 'clutch', code: 'CLUTCH', name: 'The Clutch', tagline: 'rises', copy: '', signature: {} }
    render(
      <ArchetypeHeader
        archetype={arch} confidence={0.82} runnerUpName="The Nurturer"
        code="VAULT · CLUTCH" facets={[{ archetype: clutch, lens: 'under pressure' }]}
      />,
    )
    expect(screen.getByText('VAULT · CLUTCH')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /The Clutch under pressure/ })).toHaveAttribute('href', '/archetypes/clutch')
    expect(screen.queryByText(/streak of/)).not.toBeInTheDocument()
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

  it('marks the shifts that back the archetype and exposes a per-shift tooltip', () => {
    // warmth agrees with the prototype (slope +3 vs +3) → supporting; boldness has no prototype value.
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
    // Exactly one chip claims to support the match, and it carries the archetype name.
    const supporting = screen
      .getAllByRole('button')
      .filter(b => /supports your the vault match/i.test(b.getAttribute('aria-label') ?? ''))
    expect(supporting).toHaveLength(1)
    expect(supporting[0].className).toContain('border-accent/40')
    // The tooltip spells the shift out in plain language.
    expect(screen.getByText(/you get warm as .* rises/i)).toBeInTheDocument()
    // The caption points the lit lines at the matched archetype.
    expect(screen.getByText(/point to The Vault/)).toBeInTheDocument()
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
