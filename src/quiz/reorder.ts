/** Move `activeId` to `overId`'s position within `ids` (drag-to-reorder). Pure + testable. */
export function reorderByIds(ids: string[], activeId: string, overId: string): string[] {
  const from = ids.indexOf(activeId)
  const to = ids.indexOf(overId)
  if (from === -1 || to === -1 || from === to) return ids
  const next = [...ids]
  next.splice(to, 0, next.splice(from, 1)[0])
  return next
}
