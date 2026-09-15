import { Check } from 'lucide-react'

/** The small numbered key on an answer (press 1–n); a check once chosen. Decorative for a11y. */
export function KeyHint({ n, checked }: { n: number; checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-ink text-[11px] font-bold ${
        checked ? 'bg-ink text-paper' : 'bg-paper text-ink'
      }`}
    >
      {checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n}
    </span>
  )
}
