import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Root } from '../app/Root'
import { RESULT_STORAGE_KEY } from '../app/App'
import { CONTENT } from '../content'
import { computeProfile } from '../engine'
import { encodeAnswers, decodeAnswers } from '../share/permalink'
import { compareUrl, loadPending } from './compareLink'
import type { Answer } from '../engine/types'

// closeness_1 cases: c0 = best friend (level 1), c1 = classmate (0.5), c2 = random mutual (0).
// Option A = warm + lean in (+2), B = neutral, C = cool + pull back (−2).
const depends = (mapping: Record<string, string>): Answer[] => [{
  questionId: 'closeness_1', mode: 'depends',
  ranking: ['closeness_1_c0', 'closeness_1_c1', 'closeness_1_c2'], mapping,
}]
const warmUpClose = depends({ closeness_1_c0: 'A', closeness_1_c1: 'B', closeness_1_c2: 'C' })
const coolUpClose = depends({ closeness_1_c0: 'C', closeness_1_c1: 'B', closeness_1_c2: 'A' })

const at = (url: string) => window.history.replaceState(null, '', url)
const saveOwn = (answers: Answer[]) =>
  localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify({ profile: computeProfile(answers, CONTENT), answers }))

beforeEach(() => { localStorage.clear(); at('/') })

describe('ComparePage — side by side', () => {
  it('names both people and shows where they clash', () => {
    at(compareUrl({ a: encodeAnswers(warmUpClose), an: 'Sam', b: encodeAnswers(coolUpClose), bn: 'Alex' }))
    render(<Root />)
    expect(screen.getByText('The Vault')).toBeInTheDocument()
    expect(screen.getByText('The Open Book')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Where you clash' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Where you click' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Sam').length).toBeGreaterThan(0)
    expect(screen.getAllByText('get warm').length).toBeGreaterThan(0)
    expect(screen.getAllByText('stay cool').length).toBeGreaterThan(0)
    expect(screen.getByText('Opposite poles')).toBeInTheDocument()
  })

  it('reads two identical signatures as mirror images, and tells unnamed twins apart', () => {
    at(compareUrl({ a: encodeAnswers(warmUpClose), b: encodeAnswers(warmUpClose) }))
    render(<Root />)
    expect(screen.getByRole('heading', { name: 'Where you click' })).toBeInTheDocument()
    expect(screen.getByText('Mirror images')).toBeInTheDocument()
    expect(screen.getByText('The Vault A')).toBeInTheDocument()
    expect(screen.getByText('The Vault B')).toBeInTheDocument()
  })

  it('marks which side is you', () => {
    saveOwn(coolUpClose)
    at(compareUrl({ a: encodeAnswers(warmUpClose), an: 'Sam', b: encodeAnswers(coolUpClose), bn: 'Alex' }))
    render(<Root />)
    expect(screen.getAllByText('Alex (you)').length).toBeGreaterThan(0)
    expect(screen.queryByText('Sam (you)')).not.toBeInTheDocument()
  })
})

describe('ComparePage — invite', () => {
  it('invites a newcomer to take the test and remembers the invite', async () => {
    const a = encodeAnswers(warmUpClose)
    at(compareUrl({ a, an: 'Sam' }))
    render(<Root />)
    expect(screen.getByText(/Sam wants to see how you two compare/)).toBeInTheDocument()
    await userEvent.type(screen.getByPlaceholderText('e.g. Sam'), 'Alex')
    await userEvent.click(screen.getByRole('button', { name: 'Take the test →' }))
    expect(loadPending()).toEqual({ a, an: 'Sam', bn: 'Alex' })
    expect(window.location.pathname).toBe('/')
  })

  it('lets someone with a finished run compare straight away', async () => {
    saveOwn(coolUpClose)
    at(compareUrl({ a: encodeAnswers(warmUpClose), an: 'Sam' }))
    render(<Root />)
    await userEvent.click(screen.getByRole('button', { name: /Compare with my result/ }))
    expect(decodeAnswers(new URLSearchParams(window.location.search).get('b')!)).toEqual(coolUpClose)
    expect(screen.getByRole('heading', { name: 'Where you clash' })).toBeInTheDocument()
  })

  it('recognises your own invite link', () => {
    saveOwn(warmUpClose)
    at(compareUrl({ a: encodeAnswers(warmUpClose) }))
    render(<Root />)
    expect(screen.getByText(/your own compare link/)).toBeInTheDocument()
  })

  it('explains a broken link', () => {
    at('/compare?a=garbage')
    render(<Root />)
    expect(screen.getByText(/compare link doesn’t work/)).toBeInTheDocument()
  })
})
