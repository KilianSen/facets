import '@testing-library/jest-dom'

// Node 22 ships a partial `localStorage` stub (missing `clear()`) that shadows jsdom's
// implementation on the test global — and it also shadows `window.localStorage`. jsdom's
// real backing Storage is exposed internally as `_localStorage` on its window, and vitest
// sets `globalThis.jsdom` to the JSDOM instance. Install that real Storage onto the global
// so both the tests and the reducer share a working localStorage. (`any` casts are needed
// because `_localStorage` / `globalThis.jsdom` are jsdom/vitest internals, not typed.)
const jsdomInstance = (globalThis as { jsdom?: { window?: unknown } }).jsdom
if (jsdomInstance && jsdomInstance.window) {
  const w = jsdomInstance.window as any
  const realStorage = (key: '_localStorage' | '_sessionStorage', prop: 'localStorage' | 'sessionStorage'): Storage | undefined =>
    w[key] ?? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(w), prop)?.get?.call(w)

  const ls = realStorage('_localStorage', 'localStorage')
  if (ls && typeof ls.clear === 'function') {
    Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true, writable: true })
  }
  const ss = realStorage('_sessionStorage', 'sessionStorage')
  if (ss && typeof ss.clear === 'function') {
    Object.defineProperty(globalThis, 'sessionStorage', { value: ss, configurable: true, writable: true })
  }
}
