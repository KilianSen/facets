import { describe, it, expect } from 'vitest'
import { selectQuestions, pickSharpenQuestions } from './selectQuestions'
import type { Content, Question } from '../engine/types'

function q(id: string, axis: string, kind: 'backbone' | 'flavor', reserve = false): Question {
  return {
    id, axis, kind, reserve, prompt: id,
    cases: [{ id: `${id}_h`, label: 'h', axisLevel: 1 }, { id: `${id}_l`, label: 'l', axisLevel: 0 }],
    options: [{ id: 'A', label: 'a', vector: {} }, { id: 'B', label: 'b', vector: {} }],
  }
}

const content: Content = {
  axes: [
    { id: 'ax1', name: 'Ax1', lowLabel: 'lo', highLabel: 'hi' },
    { id: 'ax2', name: 'Ax2', lowLabel: 'lo', highLabel: 'hi' },
  ],
  dims: [{ id: 'warmth', name: 'Warmth', lowLabel: 'lo', highLabel: 'hi' }],
  archetypes: [{ id: 'x', code: 'X', name: 'X', tagline: '', copy: '', signature: {} }],
  questions: [
    q('ax1_b1', 'ax1', 'backbone'), q('ax1_b2', 'ax1', 'backbone'),
    q('ax2_b1', 'ax2', 'backbone'), q('ax2_b2', 'ax2', 'backbone'),
    q('ax1_f1', 'ax1', 'flavor'), q('ax1_f2', 'ax1', 'flavor'), q('ax1_f3', 'ax1', 'flavor'),
    q('ax2_f1', 'ax2', 'flavor'), q('ax2_f2', 'ax2', 'flavor'), q('ax2_f3', 'ax2', 'flavor'),
  ],
}

// Deterministic rng cycling through a fixed sequence.
function seededRng(seq: number[]): () => number {
  let i = 0
  return () => seq[i++ % seq.length]
}

describe('selectQuestions', () => {
  it('returns a subset capped at target, covering every axis', () => {
    const picked = selectQuestions(content, seededRng([0.1, 0.7, 0.3, 0.9]), { target: 6, minPerAxis: 2 })
    expect(picked.length).toBeLessThanOrEqual(6)
    // every chosen question is from the bank, no duplicates
    const ids = picked.map(x => x.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const x of picked) expect(content.questions.some(y => y.id === x.id)).toBe(true)
    // every axis covered with >= minPerAxis
    for (const axis of content.axes) {
      expect(picked.filter(x => x.axis === axis.id).length).toBeGreaterThanOrEqual(2)
    }
  })

  it('always includes all backbone questions', () => {
    const picked = selectQuestions(content, seededRng([0.2, 0.5]), { target: 6 })
    for (const b of content.questions.filter(x => x.kind === 'backbone')) {
      expect(picked.some(x => x.id === b.id)).toBe(true)
    }
  })

  it('is deterministic for a given rng sequence', () => {
    const a = selectQuestions(content, seededRng([0.4, 0.1, 0.8, 0.2]), { target: 6 })
    const b = selectQuestions(content, seededRng([0.4, 0.1, 0.8, 0.2]), { target: 6 })
    expect(a.map(x => x.id)).toEqual(b.map(x => x.id))
  })
})

const withReserve: Content = {
  ...content,
  questions: [
    ...content.questions,
    q('ax1_sh1', 'ax1', 'backbone', true), q('ax1_sh2', 'ax1', 'backbone', true),
    q('ax1_sh3', 'ax1', 'backbone', true), q('ax1_sh4', 'ax1', 'backbone', true),
    q('ax2_sh1', 'ax2', 'backbone', true),
  ],
}

describe('reserve questions are held out of the quick read', () => {
  it('never selects reserve, even with room to spare', () => {
    const picked = selectQuestions(withReserve, seededRng([0.1, 0.7, 0.3, 0.9]), { target: 12, minPerAxis: 2 })
    expect(picked.some(x => x.reserve)).toBe(false)
  })
})

describe('pickSharpenQuestions', () => {
  it('returns only reserve questions for the requested axis', () => {
    const picked = pickSharpenQuestions(withReserve, 'ax1', new Set(), 4)
    expect(picked).toHaveLength(4)
    for (const x of picked) {
      expect(x.reserve).toBe(true)
      expect(x.axis).toBe('ax1')
    }
  })

  it('respects the requested count', () => {
    const picked = pickSharpenQuestions(withReserve, 'ax1', new Set(), 2)
    expect(picked).toHaveLength(2)
  })

  it('excludes already-asked ids', () => {
    const picked = pickSharpenQuestions(withReserve, 'ax1', new Set(['ax1_sh1', 'ax1_sh2']), 4)
    expect(picked.map(x => x.id)).not.toContain('ax1_sh1')
    expect(picked.map(x => x.id)).not.toContain('ax1_sh2')
    expect(picked.length).toBe(2)
  })

  it('returns empty when the axis has no remaining reserve', () => {
    expect(pickSharpenQuestions(withReserve, 'ax2', new Set(['ax2_sh1']), 2)).toEqual([])
  })
})
