import type { CaseSetting } from '../engine/types'
import type { SettingOffsets, SettingOffsetReport } from '../engine'
import { card, eyebrow } from '../ui/styles'

const BADGE: Record<CaseSetting, { name: string; color: string; bg: string }> = {
  romance: { name: 'Dating', color: '#D9480F', bg: '#FFE8CC' },
  work: { name: 'Work', color: '#1864AB', bg: '#D0EBFF' },
  social: { name: 'Friends', color: '#2B8A3E', bg: '#D3F9D8' },
  family: { name: 'Family', color: '#5F3DC4', bg: '#E5DBFF' },
}

/** Only the setting claims that clear the engine's bars — raw offsets are mostly question noise, so they stay hidden. */
export function SettingsSection({ reports }: { reports: SettingOffsets }) {
  const claims = (Object.values(reports) as SettingOffsetReport[]).flatMap(r => r.claims.map(c => ({ ...c, setting: r.setting })))
  if (claims.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className={`${eyebrow} px-1`}>Where the setting matters</h2>
      <div className={`${card} flex flex-col divide-y-2 divide-ink/10`}>
        {claims.map(c => (
          <div key={`${c.setting}-${c.dimId}`} className="flex flex-col gap-1.5 p-5">
            <span
              className="w-fit rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
              style={{ background: BADGE[c.setting].bg, color: BADGE[c.setting].color }}
            >
              {BADGE[c.setting].name}
            </span>
            <p className="text-[15px] font-medium leading-relaxed text-ink">{c.text}</p>
            <p className="text-xs text-ink-soft">Seen across {c.questions} questions.</p>
          </div>
        ))}
      </div>
    </section>
  )
}
