import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Root } from '../app/Root'
import { ArchetypeDetailPage } from './ArchetypeDetailPage'
import { ArchetypesPage } from './ArchetypesPage'
import { ARCHETYPE_GROUPS } from './archetypeMeta'

beforeEach(() => { localStorage.clear(); window.history.replaceState(null, '', '/') })

describe('routing (Root)', () => {
  it('renders the quiz landing at /', () => {
    window.history.replaceState(null, '', '/')
    render(<Root />)
    expect(screen.getByText('Quick read')).toBeInTheDocument()
    expect(screen.getByText('Deep dive')).toBeInTheDocument()
  })

  it('renders the archetype gallery at /archetypes', () => {
    window.history.replaceState(null, '', '/archetypes')
    render(<Root />)
    expect(screen.getByText(/people shift/i)).toBeInTheDocument()
    expect(screen.getByText('The Vault')).toBeInTheDocument()
  })

  it('renders an archetype detail at /archetypes/:id', () => {
    window.history.replaceState(null, '', '/archetypes/performer')
    render(<Root />)
    expect(screen.getByRole('heading', { name: 'The Performer', level: 1 })).toBeInTheDocument()
  })
})

describe('ArchetypesPage', () => {
  it('shows every group and links each archetype to its detail page', () => {
    render(<ArchetypesPage />)
    for (const g of ARCHETYPE_GROUPS) expect(screen.getAllByText(g.label).length).toBeGreaterThan(0)
    // one detail link per archetype across all groups
    const total = ARCHETYPE_GROUPS.reduce((n, g) => n + g.archetypeIds.length, 0)
    const links = screen.getAllByRole('link').filter(a => (a.getAttribute('href') ?? '').startsWith('/archetypes/'))
    expect(links.length).toBe(total)
  })
})

describe('ArchetypeDetailPage', () => {
  it('renders the hero, signature contingency, and baseline lean for a shifting type', () => {
    render(<ArchetypeDetailPage id="vault" />)
    expect(screen.getByRole('heading', { name: 'The Vault', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/When it's someone close, you get warm/i)).toBeInTheDocument() // describeContingency text
    expect(screen.getByText('Your baseline lean')).toBeInTheDocument()
  })

  it('omits the baseline section for The Constant and shows the flat-line signature', () => {
    render(<ArchetypeDetailPage id="constant" />)
    expect(screen.queryByText('Your baseline lean')).not.toBeInTheDocument()
    expect(screen.getByText(/Flat across the board/i)).toBeInTheDocument()
  })

  it('shows a not-found state for an unknown id', () => {
    render(<ArchetypeDetailPage id="not-a-real-id" />)
    expect(screen.getByText(/no such type/i)).toBeInTheDocument()
    expect(screen.getByText(/Browse all archetypes/i)).toBeInTheDocument()
  })
})
