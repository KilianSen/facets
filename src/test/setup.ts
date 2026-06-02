import '@testing-library/jest-dom'

// Expose jsdom's fully-functional localStorage/sessionStorage on the Node global
// so tests can use localStorage.clear() etc. (Node 22 ships a stub without clear()).
// vitest's populateGlobal does not include localStorage in its key list, so Node 22's
// stub is picked up instead of jsdom's implementation. We capture and re-export it here.
if (typeof globalThis.jsdom !== 'undefined') {
  // When running in the jsdom environment, vitest sets globalThis.jsdom to the JSDOM instance.
  const jsdomWindow = (globalThis as any).jsdom.window as Window
  const jsdomLS = Object.getOwnPropertyDescriptor(jsdomWindow, '_localStorage') !== undefined
    ? jsdomWindow._localStorage
    : (Object.getOwnPropertyDescriptor(Object.getPrototypeOf(jsdomWindow), 'localStorage')
        ?.get?.call(jsdomWindow))

  if (jsdomLS && typeof jsdomLS.clear === 'function') {
    Object.defineProperty(globalThis, 'localStorage', {
      value: jsdomLS,
      writable: true,
      configurable: true,
    })
  }
  const jsdomSS = (Object.getOwnPropertyDescriptor(Object.getPrototypeOf(jsdomWindow), 'sessionStorage')
      ?.get?.call(jsdomWindow))
  if (jsdomSS && typeof jsdomSS.clear === 'function') {
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: jsdomSS,
      writable: true,
      configurable: true,
    })
  }
}
