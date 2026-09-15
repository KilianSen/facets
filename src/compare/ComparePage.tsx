import { useState, type ReactNode } from 'react'
import { Link, navigate, useSearch } from '../router/router'
import { Reveal } from '../ui/Reveal'
import { SiteNav } from '../ui/SiteNav'
import { CONTENT } from '../content'
import {
  computeProfile, compareProfiles, syncBand, facetCode,
  type Answer, type CompareRow, type Profile,
  selectObserverQuestions, computeObserverReport, type ObserverGapItem,
} from '../engine'
import { QuizFlow } from '../quiz/QuizFlow'
import { decodeAnswers, encodeAnswers, sameAnswers } from '../share/permalink'
import { accentOf, getArchetype } from '../archetypes/archetypeMeta'
import { RESULT_STORAGE_KEY } from '../app/App'
import { STORAGE_KEY } from '../quiz/useQuizState'
import { btnGhost, btnPrimary, btnSecondary, btnSmall, card, eyebrow, panel, ring, stamp, tag } from '../ui/styles'
import { compareUrl, parseCompare, savePending, cleanName, MAX_NAME, type CompareParams } from './compareLink'

/** This browser's own finished run, if any — lets an invitee compare without retaking. */
function ownAnswers(): Answer[] {
  try {
    const p = JSON.parse(localStorage.getItem(RESULT_STORAGE_KEY) ?? 'null')
    return Array.isArray(p?.answers) ? p.answers : []
  } catch { return [] }
}

interface Person { answers: Answer[]; profile: Profile; name: string; isYou: boolean }

function toPerson(encoded: string, name: string | undefined, own: Answer[]): Person | null {
  const answers = decodeAnswers(encoded)
  if (!answers?.length) return null
  const profile = computeProfile(answers, CONTENT)
  return {
    answers,
    profile,
    name: name || getArchetype(profile.archetype.id)?.name || 'Someone',
    // Compare decoded answers, not strings: an old v1 link and a fresh v2 encoding can be the same run.
    isYou: own.length > 0 && sameAnswers(own, answers),
  }
}

const dimOf = (id: string) => CONTENT.dims.find(d => d.id === id)!
const axisOf = (id: string) => CONTENT.axes.find(a => a.id === id)!

/** The situation a row is about: the high end for a trend, the middle for a both-ways bend. */
function where(r: CompareRow): string {
  const ax = axisOf(r.axisId)
  return r.kind === 'slope' ? `When ${ax.highLabel}` : `When ${ax.name.toLowerCase()} sits in the middle`
}

/** What a person does in that situation, given their value on the row. */
function act(r: CompareRow, v: number): string {
  const d = dimOf(r.dimId)
  return r.kind === 'slope' ? (v >= 0 ? d.highLabel : d.lowLabel) : (v < 0 ? d.highLabel : d.lowLabel)
}

function CopyLink({ label = 'Copy link' }: { label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className={btnSmall}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href)
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        } catch { /* clipboard unavailable */ }
      }}
    >
      {copied ? 'Link copied ✓' : label}
    </button>
  )
}

function Broken() {
  return (
    <section className="flex flex-col items-center gap-5 py-16 text-center">
      <p className={eyebrow}>compare · link broken</p>
      <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight">This compare link doesn’t work.</h1>
      <p className="text-[15px] text-ink-soft">It may have been cut off when it was pasted. Ask for the link again.</p>
      <Link to="/" className={btnPrimary}>Take the test →</Link>
    </section>
  )
}

function ProfileCard({ p, label, tilt }: { p: Person; label: string; tilt: string }) {
  const arch = getArchetype(p.profile.archetype.id)
  const accent = arch ? accentOf(arch.id) : '#FF5A36'
  const name = arch ? arch.name : p.profile.archetype.id
  const to = arch ? `/archetypes/${arch.id}` : '#'
  return (
    <div className={`${card} ${tilt} overflow-hidden`}>
      <div aria-hidden="true" className="h-3 border-b-2 border-ink" style={{ background: accent }} />
      <div className="flex min-w-0 flex-col gap-1.5 px-3 pb-12 pt-3 sm:px-5 sm:pt-4">
        <span className={`${eyebrow} truncate`}>{label}</span>
        <Link to={to} className={`rounded font-serif text-2xl font-bold leading-tight tracking-tight hover:underline sm:text-3xl ${ring}`}>
          {name}
        </Link>
        <span className="text-[10px] font-bold tracking-[0.12em] text-ink-soft">{facetCode(p.profile.archetype.id, p.profile.facets ?? [], CONTENT)}</span>
      </div>
    </div>
  )
}

function Invite({
  inviter,
  params,
  own,
  onStartObserver,
}: {
  inviter: Person
  params: CompareParams
  own: Answer[]
  onStartObserver?: (name?: string) => void
}) {
  const [name, setName] = useState('')
  const arch = getArchetype(inviter.profile.archetype.id)
  const archId = arch ? arch.id : inviter.profile.archetype.id
  const code = facetCode(archId, inviter.profile.facets ?? [], CONTENT)
  const bn = cleanName(name) || undefined

  if (inviter.isYou) {
    return (
      <section className="flex flex-col items-center gap-5 py-10 text-center">
        <span className={`${tag} bg-coral-soft`}>Your invite</span>
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight">This is your own compare link.</h1>
        <p className="max-w-md text-[15px] leading-relaxed text-ink-soft">
          Send it to a friend. Once they finish the test, you’ll both see where you click, where you clash,
          and what each of you doesn’t see coming.
        </p>
        <CopyLink label="Copy invite link" />
      </section>
    )
  }

  function takeFresh() {
    savePending({ a: params.a, an: params.an, bn })
    // A fresh run: drop any finished or half-done run so "/" lands on the start, not an old result.
    try { localStorage.removeItem(RESULT_STORAGE_KEY); localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    navigate('/')
  }

  return (
    <section className="flex flex-col items-center gap-7 text-center">
      <Reveal><span className={`${tag} bg-coral-soft`}>Compare</span></Reveal>
      <Reveal delay={0.04}>
        <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          {params.an ? `${params.an} wants to see how you two compare.` : 'Someone wants to see how you two compare.'}
        </h1>
      </Reveal>

      <Reveal delay={0.08} className="w-full max-w-sm">
        <div className={`${card} -rotate-1 overflow-hidden text-left`}>
          <div aria-hidden="true" className="h-4 border-b-2 border-ink" style={{ background: accentOf(archId) }} />
          <div className="flex flex-col gap-1 p-5">
            <span className={eyebrow}>{params.an ? `${params.an} is` : 'They’re'}</span>
            <span className="font-serif text-4xl font-bold leading-tight tracking-tight">{arch?.name ?? archId}</span>
            {arch?.tagline && <span className="font-serif italic text-ink-soft">{arch.tagline}</span>}
            <span className={`${stamp} mt-2 w-fit`}>{code}</span>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <p className="max-w-md text-[15px] leading-relaxed text-ink-soft">
          Take the test and we’ll line your signatures up: where you shift the same way, where you pull in
          opposite directions, and where one of you moves and the other doesn’t notice.
        </p>
      </Reveal>

      <Reveal delay={0.16} className="flex w-full max-w-sm flex-col items-center gap-4">
        <label className="flex w-full flex-col gap-1.5 text-left text-sm font-semibold">
          <span>Your name <span className="font-normal text-ink-soft">(optional — so they know it’s you)</span></span>
          <input
            value={name}
            maxLength={MAX_NAME}
            onChange={e => setName(e.target.value)}
            className={`rounded-full border-2 border-ink bg-white px-4 py-2.5 text-[15px] font-normal placeholder:text-ink-faint ${ring}`}
            placeholder="e.g. Sam"
          />
        </label>
        <div className="flex flex-col items-center gap-3 w-full">
          {own.length > 0 && (
            <button type="button" className={`${btnPrimary} w-full`} onClick={() => navigate(compareUrl({ ...params, b: encodeAnswers(own), bn }))}>
              Compare with my result →
            </button>
          )}
          <button type="button" className={`${own.length > 0 ? btnSecondary : btnPrimary} w-full`} onClick={takeFresh}>
            {own.length > 0 ? 'Retake the test first' : 'Take the test →'}
          </button>
        </div>

        <div className="mt-3 flex w-full flex-col gap-2 rounded-card border-2 border-dashed border-ink bg-paper p-4 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">How you see them</span>
          <p className="text-xs leading-relaxed text-ink">
            Answer the way {params.an || 'they'} would actually act. You’ll see where your read of them differs from their own.
          </p>
          <button
            type="button"
            className={`${btnSecondary} mt-1 w-full text-xs`}
            onClick={() => onStartObserver?.(bn)}
          >
            Answer {selectObserverQuestions(CONTENT).length} questions about {params.an || 'them'} →
          </button>
        </div>
      </Reveal>
    </section>
  )
}

const CHIP_BG = { a: '#FFE2D9', b: '#DBE4FF', both: '#D3F9D8', still: '#FFFFFF' } as const

function Chip({ who, what, tone }: { who: string; what: string; tone: keyof typeof CHIP_BG }) {
  return (
    <span
      className={`inline-flex max-w-full items-baseline gap-1.5 rounded-full border-2 border-ink px-3 py-1 text-sm ${tone === 'still' ? 'border-dashed text-ink-faint' : ''}`}
      style={{ background: CHIP_BG[tone] }}
    >
      <span className="truncate font-bold">{who}</span>
      <span>{what}</span>
    </span>
  )
}

function Section({ title, blurb, children }: { title: string; blurb: string; children: ReactNode }) {
  return (
    <Reveal>
      <section className="flex flex-col gap-3">
        <div className="px-1">
          <h2 className="font-serif text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-ink-soft">{blurb}</p>
        </div>
        <ul className="flex flex-col gap-2.5">{children}</ul>
      </section>
    </Reveal>
  )
}

function ComparisonView({ a, b }: { a: Person; b: Person }) {
  const cmp = compareProfiles(a.profile, b.profile, CONTENT, a.answers, b.answers)
  const [baseA, baseB] = a.name === b.name ? [`${a.name} A`, `${b.name} B`] : [a.name, b.name]
  const nameA = a.isYou ? `${baseA} (you)` : baseA
  const nameB = b.isYou ? `${baseB} (you)` : baseB
  const pct = Math.round(cmp.sync * 100)
  const motives = cmp.sharedMotives
    .map(id => CONTENT.motives?.motives.find(m => m.id === id))
    .filter((m): m is NonNullable<typeof m> => !!m)
  const nothing = cmp.clicks.length + cmp.clashes.length + cmp.blindSpots.length === 0
  const row = `${panel} flex flex-col gap-2.5 px-4 py-3.5`

  return (
    <div className="flex flex-col gap-12">
      <Reveal>
        <section className="flex flex-col items-center gap-10">
          <div className="relative grid w-full grid-cols-2 gap-3 sm:gap-6">
            <ProfileCard p={a} label={nameA} tilt="-rotate-2" />
            <ProfileCard p={b} label={nameB} tilt="rotate-2" />
            <div className="absolute bottom-0 left-1/2 flex h-24 w-24 -translate-x-1/2 translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-ink bg-coral shadow-hard sm:h-28 sm:w-28">
              <span className="font-serif text-3xl font-bold leading-none tabular-nums sm:text-4xl">{pct}%</span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">in sync</span>
            </div>
          </div>
          <span className={`${tag} mt-4 bg-white px-4 py-1 text-sm`}>{syncBand(cmp.sync)}</span>
        </section>
      </Reveal>

      {cmp.clicks.length > 0 && (
        <Section title="Where you click" blurb="Same situation, same shift — the things you’ll never have to explain to each other.">
          {cmp.clicks.map(r => (
            <li key={`${r.axisId}.${r.dimId}`} className={row}>
              <span className="font-serif text-lg font-semibold leading-snug">{where(r)}…</span>
              <div className="flex flex-wrap gap-2"><Chip who="you both" what={act(r, r.a)} tone="both" /></div>
            </li>
          ))}
        </Section>
      )}

      {cmp.clashes.length > 0 && (
        <Section title="Where you clash" blurb="Same situation, opposite pull. This is where the friction — or the balance — lives.">
          {cmp.clashes.map(r => (
            <li key={`${r.axisId}.${r.dimId}`} className={row}>
              <span className="font-serif text-lg font-semibold leading-snug">{where(r)}…</span>
              <div className="flex flex-wrap gap-2">
                <Chip who={nameA} what={act(r, r.a)} tone="a" />
                <Chip who={nameB} what={act(r, r.b)} tone="b" />
              </div>
            </li>
          ))}
        </Section>
      )}

      {cmp.blindSpots.length > 0 && (
        <Section title="Blind spots" blurb="One of you changes here; the other stays exactly the same — and may not see it coming.">
          {cmp.blindSpots.map(r => {
            const moverA = r.mover === 'a'
            return (
              <li key={`${r.axisId}.${r.dimId}`} className={row}>
                <span className="font-serif text-lg font-semibold leading-snug">{where(r)}…</span>
                <div className="flex flex-wrap gap-2">
                  <Chip who={moverA ? nameA : nameB} what={act(r, moverA ? r.a : r.b)} tone={moverA ? 'a' : 'b'} />
                  <Chip who={moverA ? nameB : nameA} what="no change" tone="still" />
                </div>
              </li>
            )
          })}
        </Section>
      )}

      {nothing && <p className="text-center text-[15px] text-ink-soft">You two barely overlap — you each move on completely different things.</p>}

      {motives.length > 0 && (
        <Reveal>
          <section className={`${card} bg-coral-soft p-5`}>
            <h2 className={eyebrow}>What runs you both</h2>
            {motives.map(m => (
              <p key={m.id} className="mt-2 text-[15px]">
                Your swings share a motive: <span className="font-serif text-xl font-bold">{m.name}</span> — {m.tagline}.
              </p>
            ))}
          </section>
        </Reveal>
      )}

      <div className="flex flex-col items-center gap-4">
        <CopyLink label="Copy this comparison" />
        {!a.isYou && !b.isYou && <Link to="/" className={btnGhost}>Take the test yourself</Link>}
      </div>
    </div>
  )
}

function ObserverFlowView({
  targetName,
  onComplete,
  onCancel,
}: {
  targetName: string
  onComplete: (answers: Answer[]) => void
  onCancel: () => void
}) {
  const questions = selectObserverQuestions(CONTENT)
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <span className={eyebrow}>Observer Read</span>
          <h1 className="font-serif text-2xl font-bold">What would {targetName} do?</h1>
          <p className="text-xs text-ink-soft">
            {questions.length} questions · Every “you” means {targetName}. Answer the way they’d actually act, not how they’d describe themselves.
          </p>
        </div>
        <button type="button" onClick={onCancel} className={btnGhost}>Cancel</button>
      </div>
      <QuizFlow questions={questions} onComplete={onComplete} />
    </div>
  )
}

const GAP_TAG: Record<ObserverGapItem['kind'], { label: string; bg: string; color: string }> = {
  stronger: { label: 'They see a bigger shift', bg: '#D3F9D8', color: '#2B8A3E' },
  weaker: { label: 'They see a smaller shift', bg: '#FFF3BF', color: '#8F5B00' },
  opposite: { label: 'They see the opposite', bg: '#FFE3E3', color: '#C92A2A' },
  aligned: { label: 'Same read', bg: '#FFFFFF', color: '#6B6B6B' },
}

function GapList({ title, blurb, items }: { title: string; blurb: string; items: ObserverGapItem[] }) {
  return (
    <Reveal>
      <section className="flex flex-col gap-3">
        <div className="px-1">
          <h2 className="font-serif text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-ink-soft">{blurb}</p>
        </div>
        <ul className="flex flex-col gap-3">
          {items.map(item => (
            <li key={`${item.axisId}-${item.dimId}`} className={`${panel} flex flex-col gap-2 px-4 py-3.5`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-serif text-lg font-semibold">{item.headline}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                  style={{ background: GAP_TAG[item.kind].bg, color: GAP_TAG[item.kind].color }}
                >
                  {GAP_TAG[item.kind].label}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-ink">{item.explanation}</p>
            </li>
          ))}
        </ul>
      </section>
    </Reveal>
  )
}

function ObserverGrowthView({ subject, observer, observerName }: { subject: Person; observer: Answer[]; observerName: string }) {
  const report = computeObserverReport(subject.answers, observer, CONTENT, subject.name, observerName)

  return (
    <div className="flex flex-col gap-10">
      <Reveal>
        <section className="flex flex-col items-center gap-6 text-center">
          <span className={`${tag} bg-coral-soft`}>Observer read</span>
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">
            How {observerName} sees {subject.name}
          </h1>
          <p className="max-w-md text-[15px] leading-relaxed text-ink-soft">{report.summary}</p>
          {report.congruence !== null && (
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-ink bg-coral shadow-hard sm:h-28 sm:w-28">
              <span className="font-serif text-3xl font-bold leading-none tabular-nums sm:text-4xl">{Math.round(report.congruence * 100)}%</span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">agreement</span>
            </div>
          )}
        </section>
      </Reveal>

      {report.blindSpots.length > 0 && (
        <GapList
          title="Read differently"
          blurb={`Where ${observerName}’s answers describe a clearly different shift from ${subject.name}’s own.`}
          items={report.blindSpots}
        />
      )}

      {report.clearMirror.length > 0 && (
        <GapList
          title="Read the same"
          blurb={`Strong shifts ${observerName} and ${subject.name} describe the same way.`}
          items={report.clearMirror}
        />
      )}

      <div className="flex flex-col items-center gap-4 pt-4">
        <CopyLink label="Copy this read" />
        <Link to="/" className={btnGhost}>Take the test yourself</Link>
      </div>
    </div>
  )
}

/** `/compare?a=…[&b=…][&o=…]` — an invite (one run), side by side (two runs), or someone's observer read of `a`. */
export function ComparePage() {
  // Subscribed, so invite → side-by-side (same path, new query) re-renders.
  const params = parseCompare(useSearch())
  const own = ownAnswers()
  const [isObserving, setIsObserving] = useState(false)
  const [observerName, setObserverName] = useState('')

  const a = params ? toPerson(params.a, params.an, own) : null
  const b = params?.b ? toPerson(params.b, params.bn, own) : null
  const observer = params?.o ? decodeAnswers(params.o) : null

  return (
    <div className="min-h-screen w-full">
      <SiteNav />
      <main className="mx-auto flex w-full max-w-2xl flex-col px-4 py-10 sm:py-14">
        {!params || !a ? (
          <Broken />
        ) : isObserving ? (
          <ObserverFlowView
            targetName={a.name}
            onComplete={obsAnswers => {
              navigate(compareUrl({ a: params.a, an: params.an, o: encodeAnswers(obsAnswers), on: observerName || undefined }))
              setIsObserving(false)
            }}
            onCancel={() => setIsObserving(false)}
          />
        ) : observer?.length ? (
          <ObserverGrowthView subject={a} observer={observer} observerName={params.on ?? 'Someone'} />
        ) : !b ? (
          <Invite
            inviter={a}
            params={params}
            own={own}
            onStartObserver={name => {
              setObserverName(name ?? '')
              setIsObserving(true)
            }}
          />
        ) : (
          <ComparisonView a={a} b={b} />
        )}
      </main>
    </div>
  )
}
