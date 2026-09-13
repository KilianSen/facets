import { useState, type ReactNode } from 'react'
import { Link, navigate, useSearch } from '../router/router'
import { Beam } from '../ui/Beam'
import { Reveal } from '../ui/Reveal'
import { CONTENT } from '../content'
import {
  computeProfile, compareProfiles, syncBand, facetCode,
  type Answer, type CompareRow, type Profile,
} from '../engine'
import { decodeAnswers, encodeAnswers, sameAnswers } from '../share/permalink'
import { accentOf, getArchetype } from '../archetypes/archetypeMeta'
import { RESULT_STORAGE_KEY } from '../app/App'
import { STORAGE_KEY } from '../quiz/useQuizState'
import { compareUrl, parseCompare, savePending, cleanName, MAX_NAME, type CompareParams } from './compareLink'

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink'
const primaryBtn = `rounded-beam bg-accent/15 px-5 py-2.5 text-sm font-medium text-accent-soft shadow-glow transition-colors hover:bg-accent/25 ${ring}`
const quietBtn = `rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/15 ${ring}`

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
      className={quietBtn}
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
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">compare · link broken</p>
      <h1 className="font-display text-3xl font-bold leading-tight">This compare link doesn’t work.</h1>
      <p className="text-sm text-white/60">It may have been cut off when it was pasted. Ask for the link again.</p>
      <Link to="/" className={primaryBtn}>Take the test →</Link>
    </section>
  )
}

function Invite({ inviter, params, own }: { inviter: Person; params: CompareParams; own: Answer[] }) {
  const [name, setName] = useState('')
  const arch = getArchetype(inviter.profile.archetype.id)!
  const accent = accentOf(arch.id)
  const code = facetCode(arch.id, inviter.profile.facets ?? [], CONTENT)
  const bn = cleanName(name) || undefined

  if (inviter.isYou) {
    return (
      <section className="flex flex-col items-center gap-5 py-10 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-accent-soft/70">Your invite</p>
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">This is your own compare link.</h1>
        <p className="max-w-md text-sm leading-relaxed text-white/65">
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
      <Reveal><p className="text-xs uppercase tracking-[0.3em] text-accent-soft/70">Compare</p></Reveal>
      <Reveal delay={0.05}>
        <h1 className="font-display text-3xl font-bold leading-[1.1] sm:text-5xl">
          {params.an ? `${params.an} wants to see how you two compare.` : 'Someone wants to see how you two compare.'}
        </h1>
      </Reveal>

      <Reveal delay={0.1} className="w-full max-w-sm">
        <Beam glow innerClassName="flex flex-col items-center gap-1.5 px-6 py-6">
          <span className="text-xs uppercase tracking-[0.25em] text-white/45">{params.an ? `${params.an} is` : 'They’re'}</span>
          <span className="font-display text-3xl font-bold" style={{ color: accent }}>{arch.name}</span>
          <span className="font-mono text-[11px] tracking-wider text-white/55">{code}</span>
          <span className="text-sm text-white/70">{arch.tagline}</span>
        </Beam>
      </Reveal>

      <Reveal delay={0.15}>
        <p className="max-w-md text-sm leading-relaxed text-white/65">
          Take the test and we’ll line your signatures up: where you shift the same way, where you pull in
          opposite directions, and where one of you moves and the other doesn’t notice.
        </p>
      </Reveal>

      <Reveal delay={0.2} className="flex w-full max-w-sm flex-col items-center gap-4">
        <label className="flex w-full flex-col gap-1.5 text-left text-xs text-white/50">
          Your name <span className="text-white/30">(optional — so they know it’s you)</span>
          <input
            value={name}
            maxLength={MAX_NAME}
            onChange={e => setName(e.target.value)}
            className={`rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 ${ring}`}
            placeholder="e.g. Sam"
          />
        </label>
        <div className="flex flex-col items-center gap-2">
          {own.length > 0 && (
            <button type="button" className={primaryBtn} onClick={() => navigate(compareUrl({ ...params, b: encodeAnswers(own), bn }))}>
              Compare with my result →
            </button>
          )}
          <button type="button" className={own.length > 0 ? quietBtn : primaryBtn} onClick={takeFresh}>
            {own.length > 0 ? 'Retake the test first' : 'Take the test →'}
          </button>
        </div>
      </Reveal>
    </section>
  )
}

function PersonHead({ p, label }: { p: Person; label: string }) {
  const arch = getArchetype(p.profile.archetype.id)!
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 text-center">
      <span className="max-w-full truncate text-xs uppercase tracking-[0.2em] text-white/50">{label}</span>
      <Link to={`/archetypes/${arch.id}`} className={`rounded font-display text-xl font-bold leading-tight sm:text-2xl ${ring}`} style={{ color: accentOf(arch.id) }}>
        {arch.name}
      </Link>
      <span className="font-mono text-[10px] tracking-wider text-white/45">{facetCode(arch.id, p.profile.facets ?? [], CONTENT)}</span>
    </div>
  )
}

function Chip({ who, what, tone }: { who: string; what: string; tone: 'a' | 'b' | 'both' | 'still' }) {
  const cls = {
    a: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
    b: 'border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100',
    both: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
    still: 'border-white/10 bg-white/[0.03] text-white/50',
  }[tone]
  return (
    <span className={`inline-flex max-w-full items-baseline gap-1.5 rounded-full border px-3 py-1 text-xs ${cls}`}>
      <span className="truncate font-medium">{who}</span>
      <span className="opacity-80">{what}</span>
    </span>
  )
}

function Section({ title, blurb, children }: { title: string; blurb: string; children: ReactNode }) {
  return (
    <Reveal>
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm uppercase tracking-widest text-white/60">{title}</h2>
          <p className="text-xs text-white/40">{blurb}</p>
        </div>
        <ul className="flex flex-col gap-2">{children}</ul>
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
  const row = 'flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3'

  return (
    <div className="flex flex-col gap-10">
      <Reveal>
        <Beam glow innerClassName="bg-gradient-to-br from-cyan-500/15 via-transparent to-fuchsia-500/15 px-5 py-8">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <PersonHead p={a} label={nameA} />
            <span aria-hidden="true" className="font-display text-2xl text-white/30">×</span>
            <PersonHead p={b} label={nameB} />
          </div>
          <div className="mt-7 flex flex-col items-center gap-1">
            <span className="font-display text-5xl font-bold tabular-nums">{pct}%</span>
            <span className="text-xs uppercase tracking-[0.25em] text-white/50">in sync</span>
            <span className="mt-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent-soft">{syncBand(cmp.sync)}</span>
          </div>
        </Beam>
      </Reveal>

      {cmp.clicks.length > 0 && (
        <Section title="Where you click" blurb="Same situation, same shift — the things you’ll never have to explain to each other.">
          {cmp.clicks.map(r => (
            <li key={`${r.axisId}.${r.dimId}`} className={row}>
              <span className="text-sm text-white/85">{where(r)}…</span>
              <div className="flex flex-wrap gap-2"><Chip who="you both" what={act(r, r.a)} tone="both" /></div>
            </li>
          ))}
        </Section>
      )}

      {cmp.clashes.length > 0 && (
        <Section title="Where you clash" blurb="Same situation, opposite pull. This is where the friction — or the balance — lives.">
          {cmp.clashes.map(r => (
            <li key={`${r.axisId}.${r.dimId}`} className={row}>
              <span className="text-sm text-white/85">{where(r)}…</span>
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
                <span className="text-sm text-white/85">{where(r)}…</span>
                <div className="flex flex-wrap gap-2">
                  <Chip who={moverA ? nameA : nameB} what={act(r, moverA ? r.a : r.b)} tone={moverA ? 'a' : 'b'} />
                  <Chip who={moverA ? nameB : nameA} what="no change" tone="still" />
                </div>
              </li>
            )
          })}
        </Section>
      )}

      {nothing && (
        <p className="text-center text-sm text-white/60">
          You two barely overlap — you each move on completely different things.
        </p>
      )}

      {motives.length > 0 && (
        <Reveal>
          <section className="flex flex-col gap-2 rounded-xl border-l-2 border-accent/60 bg-accent/5 px-4 py-3">
            <h2 className="text-sm uppercase tracking-widest text-white/60">What runs you both</h2>
            {motives.map(m => (
              <p key={m.id} className="text-sm text-white/85">
                Your swings share a motive: <span className="font-medium text-accent-soft">{m.name}</span> — {m.tagline}.
              </p>
            ))}
          </section>
        </Reveal>
      )}

      <div className="flex flex-col items-center gap-3">
        <CopyLink label="Copy this comparison" />
        {!a.isYou && !b.isYou && (
          <Link to="/" className={`rounded text-xs text-white/45 transition-colors hover:text-white/75 ${ring}`}>
            Take the test yourself
          </Link>
        )}
      </div>
    </div>
  )
}

/** `/compare?a=…[&b=…]` — an invite (one answer set) or a finished side-by-side (two). */
export function ComparePage() {
  // Subscribed, so invite → side-by-side (same path, new query) re-renders.
  const params = parseCompare(useSearch())
  const own = ownAnswers()
  const a = params ? toPerson(params.a, params.an, own) : null
  const b = params?.b ? toPerson(params.b, params.bn, own) : null

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-5 py-10 sm:py-14">
      <nav className="flex items-center justify-between text-sm">
        <Link to="/" className={`rounded text-white/50 transition-colors hover:text-white/85 ${ring}`}>← Facets</Link>
        <Link to="/archetypes" className={`rounded font-medium text-accent-soft transition-colors hover:text-accent ${ring}`}>
          The archetypes →
        </Link>
      </nav>
      {!params || !a ? <Broken /> : !b ? <Invite inviter={a} params={params} own={own} /> : <ComparisonView a={a} b={b} />}
    </div>
  )
}
