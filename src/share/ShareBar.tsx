import { useState, type RefObject } from 'react'
import { toPng } from 'html-to-image'
import type { Answer } from '../engine/types'
import { shareUrl, encodeAnswers } from './permalink'
import { compareUrl, cleanName, MAX_NAME } from '../compare/compareLink'

const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'
const btn = `rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/15 ${ring}`

export function ShareBar({ archetypeId, answers, cardRef }: { archetypeId: string; answers: Answer[]; cardRef: RefObject<HTMLElement | null> }) {
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
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: '#08080c' })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'facets-result.png'
      a.click()
    } catch { /* export failed */ }
  }

  const inviteLink = () => compareUrl({ a: encodeAnswers(answers), an: cleanName(name) || undefined }, window.location.origin)

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        {/* A permalink needs the answers; a result restored from a legacy cache has none, so hide it. */}
        {answers.length > 0 && (
          <button type="button" onClick={() => copy(shareUrl(archetypeId, answers, window.location.origin), setCopied)} className={btn}>
            {copied ? 'Link copied ✓' : 'Copy link'}
          </button>
        )}
        <button type="button" onClick={saveImage} className={btn}>Save image</button>
        {answers.length > 0 && (
          <button type="button" onClick={() => setInviting(v => !v)} aria-expanded={inviting} className={btn}>
            Compare with a friend
          </button>
        )}
      </div>

      {inviting && answers.length > 0 && (
        <div className="flex w-full flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs leading-relaxed text-white/60">
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
              className={`min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 ${ring}`}
            />
            <button type="button" onClick={() => copy(inviteLink(), setInviteCopied)} className={btn}>
              {inviteCopied ? 'Invite copied ✓' : 'Copy invite link'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
