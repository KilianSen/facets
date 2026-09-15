import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/** A short, snappy rise-in for mounts. Inert when the user prefers reduced motion. */
export function Reveal({
  children, delay = 0, className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: [0.2, 0.9, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
