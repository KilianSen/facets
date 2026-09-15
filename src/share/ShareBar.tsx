import { useState, type ReactNode, type RefObject } from 'react'
import { toPng } from 'html-to-image'
import type { Answer } from '../engine/types'
import { shareUrl, encodeAnswers } from './permalink'
import { compareUrl, cleanName, MAX_NAME } from '../compare/compareLink'
import { exportFontOptions } from './fontEmbed'
import { btnSmall, panel, ring } from '../ui/styles'
import { ROUTE_BASE } from '../router/router'

export function ShareBar({ archetypeId, answers, cardRef, extra }: {
  archetypeId: string
  answers: Answer[]
  cardRef: RefObject<HTMLElement | null>
  /** extra share actions shown first in the row (e.g. the story card) */
  extra?: ReactNode
}) {
  const [copied, setCopied] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [name, setName] = useState('')
  const [inviteCopied, setInviteCopied] = useState(false)

  async function copy(text: string, flag: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text)
      flag(true)
      setTimeout(() => flag(false), 1600)
    } catch { /* clipboard unavailable */ }
  }

  async function saveImage() {
    if (!cardRef.current) return
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: '#FAF7F2', ...(await exportFontOptions()) })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'facets-result.png'
      a.click()
    } catch { /* export failed */ }
  }

  const siteOrigin = typeof window !== 'undefined' ? `${window.location.origin}${ROUTE_BASE}` : ''
  const inviteLink = () => compareUrl({ a: encodeAnswers(answers), an: cleanName(name) || undefined }, siteOrigin)

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-2.5">
        {extra}
        {/* A permalink needs the answers; a result restored from a legacy cache has none, so hide it. */}
        {answers.length > 0 && (
          <button type="button" onClick={() => copy(shareUrl(archetypeId, answers, siteOrigin), setCopied)} className={btnSmall}>
            {copied ? 'Link copied ✓' : 'Copy link'}
          </button>
        )}
        <button type="button" onClick={saveImage} className={btnSmall}>Save image</button>
        {answers.length > 0 && (
          <button type="button" onClick={() => setInviting(v => !v)} aria-expanded={inviting} className={`${btnSmall} bg-coral`}>
            Compare with a friend
          </button>
        )}
      </div>

      {inviting && answers.length > 0 && (
        <div className={`${panel} flex w-full flex-col gap-3 p-4`}>
          <p className="text-sm leading-relaxed text-ink-soft">
            Send your friend a link. Once they finish the test, you’ll both see where you click, where you clash,
            and each other’s blind spots.
          </p>
          <div className="flex gap-2">
            <input
              value={name}
              maxLength={MAX_NAME}
              onChange={e => setName(e.target.value)}
              aria-label="Your name (optional)"
              placeholder="Your name (optional)"
              className={`min-w-0 flex-1 rounded-full border-2 border-ink bg-paper px-4 py-2 text-sm placeholder:text-ink-faint ${ring}`}
            />
            <button type="button" onClick={() => copy(inviteLink(), setInviteCopied)} className={btnSmall}>
              {inviteCopied ? 'Invite copied ✓' : 'Copy invite link'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
