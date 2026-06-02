import { useState, type RefObject } from 'react'
import { toPng } from 'html-to-image'
import type { Answer } from '../engine/types'
import { encodeAnswers } from './permalink'

const btn = 'rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'

export function ShareBar({ answers, cardRef }: { answers: Answer[]; cardRef: RefObject<HTMLElement | null> }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}#r=${encodeAnswers(answers)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* clipboard unavailable */ }
  }

  async function saveImage() {
    if (!cardRef.current) return
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: '#08080c' })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'fptic-result.png'
      a.click()
    } catch { /* export failed */ }
  }

  return (
    <div className="flex justify-center gap-2">
      <button type="button" onClick={copyLink} className={btn}>{copied ? 'Link copied ✓' : 'Copy link'}</button>
      <button type="button" onClick={saveImage} className={btn}>Save image</button>
    </div>
  )
}
