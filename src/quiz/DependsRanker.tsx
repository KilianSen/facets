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

  const btn = 'flex h-11 w-11 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950'

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/70">Order these from most to least like you — most on top.</p>
      <ul className="flex flex-col gap-2">
        {order.map((c, i) => (
          <li key={c.id} className="flex items-center justify-between rounded-xl bg-white/5 py-1 pl-4 pr-1">
            <span className="text-sm text-white/80">{c.label}</span>
            <span className="flex gap-1">
              <button type="button" aria-label={`move ${c.label} up`} onClick={() => move(i, -1)} className={btn}>↑</button>
              <button type="button" aria-label={`move ${c.label} down`} onClick={() => move(i, 1)} className={btn}>↓</button>
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onConfirm(order.map(c => c.id))}
        className="self-start rounded-xl bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      >
        Next
      </button>
    </div>
  )
}
