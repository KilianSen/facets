import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArchetypeHeader } from './ArchetypeHeader'
import { SignatureMap } from './SignatureMap'
import { DimensionRanges } from './DimensionRanges'
import type { Archetype, BehaviorDim } from '../engine/types'

const arch: Archetype = { id: 'vault', code: 'VAULT', name: 'The Vault', tagline: 'selective', copy: 'Selective warmth.', signature: {} }

describe('result components', () => {
  it('ArchetypeHeader renders code, name, and confidence', () => {
    render(<ArchetypeHeader archetype={arch} confidence={0.82} />)
    expect(screen.getByText('VAULT')).toBeInTheDocument()
    expect(screen.getByText(/82% match/)).toBeInTheDocument()
  })
  it('SignatureMap renders contingency sentences', () => {
    render(<SignatureMap contingencies={[{ axis: 'closeness', dim: 'warmth', slope: 3, text: 'When close, you get warm.' }]} />)
    expect(screen.getByText('When close, you get warm.')).toBeInTheDocument()
  })
  it('SignatureMap shows a consistency message when empty', () => {
    render(<SignatureMap contingencies={[]} />)
    expect(screen.getByText(/consistent/)).toBeInTheDocument()
  })
  it('DimensionRanges renders a bar per dimension', () => {
    const dims: BehaviorDim[] = [{ id: 'warmth', name: 'Warmth', lowLabel: 'lo', highLabel: 'hi' }]
    render(<DimensionRanges dims={dims} ranges={{ warmth: { min: -1, max: 2, typical: 0.5 } }} />)
    expect(screen.getByText('Warmth')).toBeInTheDocument()
  })
})
