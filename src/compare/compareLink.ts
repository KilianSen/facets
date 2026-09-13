import { decodeAnswers } from '../share/permalink'

/** A pending invite: someone sent a compare link and this browser is taking the test to answer it. */
export const PENDING_COMPARE_KEY = 'fptic.compare.v1'

/** `a` / `b` are encoded answer sets (see permalink.ts); `an` / `bn` optional display names. */
export interface CompareParams { a: string; an?: string; b?: string; bn?: string }
export interface PendingCompare { a: string; an?: string; bn?: string }

export const MAX_NAME = 24

/** Trim a user-typed display name to something safe to put on a page and in a URL. */
export function cleanName(s: string | null | undefined): string {
  return (s ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME)
}

/** `/compare?a=…&an=…[&b=…&bn=…]` — no backend: both answer sets travel in the link. */
export function compareUrl(p: CompareParams, origin = ''): string {
  const q = new URLSearchParams({ a: p.a })
  if (cleanName(p.an)) q.set('an', cleanName(p.an))
  if (p.b) q.set('b', p.b)
  if (cleanName(p.bn)) q.set('bn', cleanName(p.bn))
  return `${origin}/compare?${q.toString()}`
}

/** Parse a compare query string; null unless `a` decodes to a real answer set. */
export function parseCompare(search: string): CompareParams | null {
  const q = new URLSearchParams(search)
  const a = q.get('a')
  if (!a || !decodeAnswers(a)?.length) return null
  const b = q.get('b')
  return {
    a,
    an: cleanName(q.get('an')) || undefined,
    b: b && decodeAnswers(b)?.length ? b : undefined,
    bn: cleanName(q.get('bn')) || undefined,
  }
}

export function savePending(p: PendingCompare): void {
  try { localStorage.setItem(PENDING_COMPARE_KEY, JSON.stringify(p)) } catch { /* ignore */ }
}

export function loadPending(): PendingCompare | null {
  try {
    const p = JSON.parse(localStorage.getItem(PENDING_COMPARE_KEY) ?? 'null')
    if (p && typeof p.a === 'string' && decodeAnswers(p.a)?.length) {
      return { a: p.a, an: cleanName(p.an) || undefined, bn: cleanName(p.bn) || undefined }
    }
  } catch { /* ignore */ }
  return null
}

export function clearPending(): void {
  try { localStorage.removeItem(PENDING_COMPARE_KEY) } catch { /* ignore */ }
}
