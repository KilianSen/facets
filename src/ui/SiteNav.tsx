import { Link } from '../router/router'
import { btnSmall, ring } from './styles'

/** The shared top bar for browse pages: wordmark, two text links, and the test CTA. */
export function SiteNav({ cta = true }: { cta?: boolean }) {
  const text = `hidden rounded text-sm font-semibold text-ink-soft transition-colors hover:text-ink sm:inline ${ring}`
  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className={`rounded font-serif text-2xl font-bold tracking-tight ${ring}`}>
          Facets<span className="text-coral">.</span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link to="/archetypes" className={text}>Archetypes</Link>
          <Link to="/method" className={text}>How it works</Link>
          {cta && <Link to="/" className={`${btnSmall} bg-coral`}>Take the test</Link>}
        </nav>
      </div>
    </header>
  )
}
