import { useSyncExternalStore, type AnchorHTMLAttributes, type ReactNode } from 'react'

/**
 * Minimal client router. The app is a static-hosted SPA with real per-route index.html shells
 * (see scripts/gen-share.ts), so links are genuine <a href> — they work without JS and unfurl —
 * and we intercept same-origin clicks for instant in-app navigation.
 */
const listeners = new Set<() => void>()

export function navigate(to: string): void {
  if (to === window.location.pathname + window.location.search + window.location.hash) return
  window.history.pushState(null, '', to)
  window.scrollTo(0, 0)
  listeners.forEach(l => l())
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  window.addEventListener('popstate', cb)
  return () => { listeners.delete(cb); window.removeEventListener('popstate', cb) }
}

/** The current pathname, re-rendering on navigate()/back/forward. */
export function usePath(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname, () => '/')
}

/** The current query string — for pages whose state lives in it (a same-path navigate changes only this). */
export function useSearch(): string {
  return useSyncExternalStore(subscribe, () => window.location.search, () => '')
}

export function Link({
  to, children, ...rest
}: { to: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return (
    <a
      href={to}
      onClick={e => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        navigate(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
