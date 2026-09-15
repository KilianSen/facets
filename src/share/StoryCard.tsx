import { forwardRef, Fragment } from 'react'
import type { AxisId } from '../engine/types'
import { CrystalStill } from '../signature/CrystalStill'
import type { SignatureShape } from '../signature/shape'

export interface StoryData {
  name: string
  tagline: string
  accent: string
  /** the read band, e.g. "Solid read" */
  band: string
  coStars: { name: string; accent: string }[]
  /** one first-person line: what no type covers, or the strongest tell */
  also?: string
  alsoLabel?: string
  shape: SignatureShape
  colors?: Record<AxisId, string>
  cap?: number
}

/** Story size in CSS px; exported at 3× → 1080 × 1920. */
export const STORY_W = 360
export const STORY_H = 640

/**
 * The 9:16 card someone posts to their story: crystal up top, "I'm <type> with <co-stars>", one line
 * that's true about them, and an invitation. Flat cream / ink / coral like the app.
 */
export const StoryCard = forwardRef<HTMLDivElement, { data: StoryData; host?: string }>(function StoryCard({ data, host }, ref) {
  const coStars = data.coStars.slice(0, 3)
  return (
    <div ref={ref} style={{ width: STORY_W, height: STORY_H }} className="flex flex-col bg-paper p-3 font-sans text-ink">
      <div className="flex h-full flex-col overflow-hidden rounded-[22px] border-[3px] border-ink bg-paper">
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <span className="font-serif text-xl font-bold tracking-tight">Facets<span className="text-coral">.</span></span>
          <span className="rounded-full border-2 border-ink bg-coral-soft px-2.5 py-0.5 text-[11px] font-bold">{data.band}</span>
        </div>

        <div className="mx-3 overflow-hidden rounded-2xl border-[3px] border-ink bg-paper-deep" style={{ height: 232 }}>
          <div aria-hidden="true" className="h-2.5 border-b-[3px] border-ink" style={{ background: data.accent }} />
          <CrystalStill shape={data.shape} accent={data.accent} colors={data.colors} cap={data.cap} className="h-[220px] w-full" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-5 pt-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft">I’m</span>
          <h2 className="font-serif text-[40px] font-bold leading-[0.95] tracking-tight">{data.name}</h2>
          {coStars.length > 0 && (
            <p className="mt-2 font-serif text-[17px] font-semibold leading-snug">
              <span className="font-normal italic text-ink-soft">with </span>
              {coStars.map((c, i) => (
                <Fragment key={c.name}>
                  {i > 0 && (i === coStars.length - 1 ? ' & ' : ', ')}
                  <span className="underline decoration-[4px] underline-offset-[5px]" style={{ textDecorationColor: c.accent }}>{c.name}</span>
                </Fragment>
              ))}
            </p>
          )}
          <p className="mt-1.5 font-serif text-[15px] italic leading-snug text-ink-soft">{data.tagline}</p>

          {data.also && (
            <div className="mb-3 mt-auto rounded-xl border-2 border-ink bg-white px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft">{data.alsoLabel ?? 'Also true about me'}</p>
              <p className="mt-1 text-[13px] leading-snug">{data.also}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t-[3px] border-ink bg-coral px-4 py-2.5">
          <span className="font-serif text-[15px] font-bold">What’s your signature?</span>
          {host && <span className="text-[11px] font-bold">{host}</span>}
        </div>
      </div>
    </div>
  )
})
