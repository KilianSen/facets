import type { ReactNode } from 'react'

/** A flat coral highlighter stroke behind a word — the editorial emphasis mark. */
export function Mark({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded-[0.18em] bg-coral px-[0.12em] text-ink [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">
      {children}
    </mark>
  )
}
