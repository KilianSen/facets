import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArchetypeHeader } from './ArchetypeHeader'
import { SignatureMap } from './SignatureMap'
import { DimensionRanges } from './DimensionRanges'
import { BaselineReadout } from './BaselineReadout'
import { matchBand } from './matchBand'
import type { Archetype, BehaviorDim } from '../engine/types'

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
})

describe('SignatureMap', () => {
  it('names the conditional premise above the tells', () => {
    render(<SignatureMap contingencies={[{ axis: 'closeness', dim: 'warmth', slope: 3, text: 'When close, you get warm.' }]} />)
    expect(screen.getByText(/how you shift/i)).toBeInTheDocument()
    expect(screen.getByText('When close, you get warm.')).toBeInTheDocument()
  })
  it('shows a consistency message when empty', () => {
    render(<SignatureMap contingencies={[]} />)
    expect(screen.getByText(/consistent/)).toBeInTheDocument()
  })
})

describe('DimensionRanges', () => {
  it('renders the dimension name and its endpoint labels', () => {
    render(<DimensionRanges dims={[DIMS[0]]} ranges={{ warmth: { min: -1, max: 2, typical: 0.5 } }} />)
    expect(screen.getByText('Warmth')).toBeInTheDocument()
    expect(screen.getByText('stay cool')).toBeInTheDocument()
    expect(screen.getByText('get warm')).toBeInTheDocument()
  })
})

describe('BaselineReadout', () => {
  it('describes the strongest baseline leans (via dim labels) and a flexibility level', () => {
    render(<BaselineReadout dims={DIMS} baseline={{ warmth: 1.5, boldness: -1 }} flexibility={1.8} />)
    expect(screen.getByText(/get warm/)).toBeInTheDocument()     // warmth+ -> high label
    expect(screen.getByText(/play it safe/)).toBeInTheDocument() // boldness- -> low label
  })
})
