import { describe, it, expect } from 'vitest'
import { reorderByIds } from './reorder'

describe('reorderByIds', () => {
  it('moves an item down to the target position', () => {
    expect(reorderByIds(['a', 'b', 'c'], 'a', 'c')).toEqual(['b', 'c', 'a'])
  })
  it('moves an item up to the target position', () => {
    expect(reorderByIds(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b'])
  })
  it('is a no-op when active === over or ids are unknown', () => {
    expect(reorderByIds(['a', 'b', 'c'], 'b', 'b')).toEqual(['a', 'b', 'c'])
    expect(reorderByIds(['a', 'b', 'c'], 'x', 'a')).toEqual(['a', 'b', 'c'])
  })
})
