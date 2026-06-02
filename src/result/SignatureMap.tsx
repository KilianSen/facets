import type { Contingency } from '../engine/types'

export function SignatureMap({ contingencies }: { contingencies: Contingency[] }) {
  if (contingencies.length === 0) {
    return <p className="text-sm text-white/60">You stay remarkably consistent across situations.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm uppercase tracking-widest text-white/50">Your tells</h2>
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
