import { useSyncExternalStore, type AnchorHTMLAttributes, type ReactNode } from 'react'

/**
 * Minimal client router. The app is a static-hosted SPA with real per-route index.html shells
 * (see scripts/gen-share.ts), so links are genuine <a href> — they work without JS and unfurl —
 * and we intercept same-origin clicks for instant in-app navigation.
 */
const listeners = new Set<() => void>()

const rawBase = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/'
export const ROUTE_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase

export function splitUrl(url: string): { pathname: string; suffix: string } {
  const match = url.match(/^([^?#]*)(.*)$/)
  return { pathname: match?.[1] ?? url, suffix: match?.[2] ?? '' }
}

export function toHref(pathWithQuery: string): string {
  if (/^https?:\/\//i.test(pathWithQuery)) return pathWithQuery
  const { pathname, suffix } = splitUrl(pathWithQuery)
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${ROUTE_BASE}${clean}${suffix}`
}

export function stripBase(pathWithQuery: string): string {
  const { pathname, suffix } = splitUrl(pathWithQuery)
  if (ROUTE_BASE && (pathname === ROUTE_BASE || pathname.startsWith(ROUTE_BASE + '/'))) {
    const stripped = pathname.slice(ROUTE_BASE.length)
    const clean = stripped.startsWith('/') ? stripped : `/${stripped}`
    return `${clean}${suffix}`
  }
  return pathWithQuery
}

export function navigate(to: string): void {
  const target = /^https?:\/\//i.test(to) ? to : toHref(stripBase(to))
  if (target === window.location.pathname + window.location.search + window.location.hash) return
  window.history.pushState(null, '', target)
  window.scrollTo(0, 0)
  listeners.forEach(l => l())
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  window.addEventListener('popstate', cb)
  return () => { listeners.delete(cb); window.removeEventListener('popstate', cb) }
}

/** The current pathname (with base path stripped), re-rendering on navigate()/back/forward. */
export function usePath(): string {
  return useSyncExternalStore(subscribe, () => stripBase(window.location.pathname), () => '/')
}

/** The current query string — for pages whose state lives in it (a same-path navigate changes only this). */
export function useSearch(): string {
  return useSyncExternalStore(subscribe, () => window.location.search, () => '')
}

export function Link({
  to, children, ...rest
}: { to: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const href = /^https?:\/\//i.test(to) ? to : toHref(stripBase(to))
  return (
    <a
      href={href}
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
