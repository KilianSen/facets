import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { toHref, stripBase, ROUTE_BASE, Link, splitUrl } from './router'

describe('router base path utilities', () => {
  it('splits URLs into pathname and suffix correctly', () => {
    expect(splitUrl('/compare?a=123#test')).toEqual({ pathname: '/compare', suffix: '?a=123#test' })
    expect(splitUrl('/archetypes')).toEqual({ pathname: '/archetypes', suffix: '' })
    expect(splitUrl('/?test=1')).toEqual({ pathname: '/', suffix: '?test=1' })
  })

  it('toHref prefixes path with ROUTE_BASE', () => {
    expect(toHref('/archetypes')).toBe(`${ROUTE_BASE}/archetypes`)
    expect(toHref('archetypes')).toBe(`${ROUTE_BASE}/archetypes`)
    expect(toHref('/compare?a=1')).toBe(`${ROUTE_BASE}/compare?a=1`)
    expect(toHref('https://external.com/path')).toBe('https://external.com/path')
  })

  it('stripBase removes ROUTE_BASE from pathname', () => {
    if (ROUTE_BASE) {
      expect(stripBase(`${ROUTE_BASE}/archetypes`)).toBe('/archetypes')
      expect(stripBase(`${ROUTE_BASE}/`)).toBe('/')
      expect(stripBase(`${ROUTE_BASE}`)).toBe('/')
      expect(stripBase(`${ROUTE_BASE}/compare?a=1`)).toBe('/compare?a=1')
    } else {
      expect(stripBase('/archetypes')).toBe('/archetypes')
      expect(stripBase('/')).toBe('/')
    }
  })

  it('Link renders base-aware href and navigates on click', () => {
    render(<Link to="/archetypes">Explore</Link>)
    const link = screen.getByRole('link', { name: 'Explore' })
    expect(link.getAttribute('href')).toBe(`${ROUTE_BASE}/archetypes`)

    fireEvent.click(link)
    expect(window.location.pathname).toBe(`${ROUTE_BASE}/archetypes` || '/')
  })
})
