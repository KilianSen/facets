import { describe, it, expect } from 'vitest'
import { AXES } from './axes'
import { DIMS } from './dimensions'

describe('content primitives', () => {
  it('defines 6 axes with unique ids and labels', () => {
    expect(AXES).toHaveLength(6)
    expect(new Set(AXES.map(a => a.id)).size).toBe(6)
    for (const a of AXES) { expect(a.name).toBeTruthy(); expect(a.lowLabel).toBeTruthy(); expect(a.highLabel).toBeTruthy() }
  })
  it('defines 6 dimensions with unique ids and labels', () => {
    expect(DIMS).toHaveLength(6)
    expect(new Set(DIMS.map(d => d.id)).size).toBe(6)
    for (const d of DIMS) { expect(d.name).toBeTruthy(); expect(d.lowLabel).toBeTruthy(); expect(d.highLabel).toBeTruthy() }
  })
})
