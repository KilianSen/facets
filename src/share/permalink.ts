import type { Answer } from '../engine/types'

/**
 * Encode a run's answers into a compact, URL-safe string for a shareable permalink.
 * The result is reproducible: decoding + computeProfile rebuilds the exact result, so no
 * server or stored result is needed.
 */
export function encodeAnswers(answers: Answer[]): string {
  const json = JSON.stringify(answers)
  // encodeURIComponent first so btoa (latin1-only) accepts any unicode; then base64url.
  return btoa(encodeURIComponent(json)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeAnswers(s: string): Answer[] | null {
  if (!s) return null
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
    const parsed = JSON.parse(decodeURIComponent(atob(b64)))
    return Array.isArray(parsed) ? (parsed as Answer[]) : null
  } catch {
    return null
  }
}
