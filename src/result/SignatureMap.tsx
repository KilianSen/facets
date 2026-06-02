import type { Contingency } from '../engine/types'

export function SignatureMap({ contingencies }: { contingencies: Contingency[] }) {
  if (contingencies.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <h2 className="text-sm uppercase tracking-widest text-white/50">Your tells</h2>
        <p className="text-sm text-white/60">You stay remarkably consistent across situations.</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm uppercase tracking-widest text-white/50">Your tells</h2>
        <p className="text-xs text-white/50">You don’t have one mode — here’s how you shift.</p>
      </div>
      <ul className="flex flex-col gap-2">
        {contingencies.map(c => (
          <li key={`${c.axis}.${c.dim}`} className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white/85">
            {c.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
