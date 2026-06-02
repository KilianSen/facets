import { useState } from 'react'
import type { Case } from '../engine/types'

export function DependsRanker({ cases, onConfirm }: { cases: Case[]; onConfirm: (rankedCaseIds: string[]) => void }) {
  const [order, setOrder] = useState<Case[]>(cases)

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= order.length) return
    const next = [...order]
    ;[next[i], next[j]] = [next[j], next[i]]
    setOrder(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/70">Move the most-true to the top.</p>
      <ul className="flex flex-col gap-2">
        {order.map((c, i) => (
          <li key={c.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <span className="text-sm text-white/80">{c.label}</span>
            <span className="flex gap-1">
              <button type="button" aria-label={`move ${c.label} up`} onClick={() => move(i, -1)} className="px-2 text-white/60 hover:text-white">↑</button>
              <button type="button" aria-label={`move ${c.label} down`} onClick={() => move(i, 1)} className="px-2 text-white/60 hover:text-white">↓</button>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => onConfirm(order.map(c => c.id))} className="self-start rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
        Next
      </button>
    </div>
  )
}
