import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/** Blur-in + rise reveal for high-impact mounts. Inert when the user prefers reduced motion. */
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
      initial={reduce ? false : { opacity: 0, filter: 'blur(10px)', y: 12 }}
      animate={reduce ? undefined : { opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
