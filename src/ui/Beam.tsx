import type { ReactNode } from 'react'

/**
 * An animated conic-gradient "beam" border (the product's signature surface treatment).
 * A spinning gradient fills behind a slightly-inset dark panel, leaving a 1px luminous edge.
 */
export function Beam({
  children, className = '', innerClassName = '', spin = true, glow = false,
}: {
  children: ReactNode
  className?: string
  innerClassName?: string
  spin?: boolean
  glow?: boolean
}) {
  return (
    <div className={`relative overflow-hidden rounded-beam p-px ${glow ? 'shadow-glow' : ''} ${className}`}>
      <div
        aria-hidden="true"
        className={`absolute inset-[-150%] ${spin ? 'animate-beam-spin' : ''}`}
        style={{ background: 'conic-gradient(from 90deg, #22d3ee, #818cf8, #d946ef, #22d3ee)' }}
      />
      <div className={`relative rounded-[calc(1.125rem-1px)] bg-ink/90 backdrop-blur-sm ${innerClassName}`}>
        {children}
      </div>
    </div>
  )
}
