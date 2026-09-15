import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Download, Share2, X } from 'lucide-react'
import { StoryCard, STORY_H, STORY_W, type StoryData } from './StoryCard'
import { dataUrlToBlob, STORY_FILENAME } from './story'
import { exportFontOptions, getFontEmbedCSS } from './fontEmbed'
import { btnPrimary, btnSecondary, btnSmall, ring } from '../ui/styles'
import { ROUTE_BASE } from '../router/router'

const PREVIEW_SCALE = 0.9
type Status = 'idle' | 'working' | 'done' | 'error'

/**
 * "Share to story": opens a preview of the 9:16 story card, then hands a 1080×1920 PNG to the native
 * share sheet (straight into Instagram / TikTok stories on phones) or saves it where sharing files
 * isn't supported. Rendered in the browser — nothing is uploaded.
 */
export function StoryShare({ data }: { data: StoryData }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const cardRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const host = typeof window !== 'undefined' ? `${window.location.host}${ROUTE_BASE}` : ''

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    void getFontEmbedCSS() // warm the font cache so Share is quick
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function renderFile(): Promise<File> {
    if (!cardRef.current) throw new Error('story card not mounted')
    const url = await toPng(cardRef.current, { pixelRatio: 3, backgroundColor: '#FAF7F2', cacheBust: true, ...(await exportFontOptions()) })
    return new File([dataUrlToBlob(url)], STORY_FILENAME, { type: 'image/png' })
  }

  function save(file: File) {
    if (typeof URL.createObjectURL !== 'function') return
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function share() {
    setStatus('working')
    try {
      const file = await renderFile()
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Facets signature', text: `I’m ${data.name}. What’s your signature?` })
      } else {
        save(file)
      }
      setStatus('done')
    } catch (e) {
      // Closing the share sheet isn't a failure.
      setStatus((e as Error)?.name === 'AbortError' ? 'idle' : 'error')
    }
  }

  async function download() {
    setStatus('working')
    try {
      save(await renderFile())
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  const message = {
    idle: 'Post it to your story and see who matches you.',
    working: 'Making your card…',
    done: 'Ready ✓',
    error: 'Couldn’t make the image here — try Save image, or take a screenshot.',
  }[status]

  return (
    <>
      <button type="button" onClick={() => { setStatus('idle'); setOpen(true) }} className={`${btnSmall} bg-coral`}>
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        Share to story
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="story-title"
            className="flex max-h-full w-full max-w-sm flex-col gap-3 overflow-y-auto rounded-card border-2 border-ink bg-paper p-4 shadow-hard-lg"
          >
            <div className="flex items-center justify-between">
              <h2 id="story-title" className="font-serif text-xl font-bold tracking-tight">Your story card</h2>
              <button ref={closeRef} type="button" aria-label="Close" onClick={() => setOpen(false)} className={`rounded-full border-2 border-ink bg-white p-1 ${ring}`}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mx-auto shrink-0 overflow-hidden" style={{ width: STORY_W * PREVIEW_SCALE, height: STORY_H * PREVIEW_SCALE }}>
              <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }}>
                <StoryCard ref={cardRef} data={data} host={host} />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={share} disabled={status === 'working'} className={btnPrimary}>
                <Share2 className="h-4 w-4" aria-hidden="true" />
                Share
              </button>
              <button type="button" onClick={download} disabled={status === 'working'} className={btnSecondary}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Save image
              </button>
            </div>
            <p role="status" className="text-center text-xs text-ink-soft">{message}</p>
          </div>
        </div>
      )}
    </>
  )
}
