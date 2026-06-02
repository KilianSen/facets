# FPTIC Phase 3 — Direction C: Design system, motion & virality — design

**Date:** 2026-06-02
**Status:** approved, in implementation
**Branch:** `phase3-design` (off `main` after Phase 2)

## Decisions (confirmed)
- **Aesthetic: beam/glow North Star** — dark, luminous, animated gradient-beam borders + soft glow.
- **Motion: Framer Motion.**
- **Sharing: client-side permalink (encoded answers) + saveable result image.**

## Aesthetic commitments (frontend-design)
- **Type pairing (distinctive, not AI-default):** display = **Clash Display**, body = **Satoshi**
  (Fontshare CDN). Big, confident display headings; clean body.
- **Atmosphere:** near-black canvas (`#08080c`) with layered low-opacity radial glows
  (cyan + fuchsia) and a faint grain overlay — never flat black.
- **Accent:** electric **cyan/sky** primary with a **fuchsia** secondary; beams use a multi-hue
  conic gradient (cyan→violet→fuchsia).
- **Beam component:** a reusable animated conic-gradient border (spins + hue-drifts) wrapping the
  hero result card and the selected/active option; soft outer glow on accents.
- **Radius scale** ~`14–18px`; defined shadow/glow scale; named keyframes (`beam-spin`, `blur-in`).

## Scope
1. **Tokens** — `index.html` font links; `tailwind.config.js` theme.extend (fontFamily, colors,
   borderRadius, boxShadow, keyframes/animation); `index.css` base atmosphere + grain.
2. **Beam/glow** — `Beam` wrapper component; apply to result hero + selected options; glow on accents.
3. **Motion (Framer Motion)** — blur-in + staggered reveals on each question/options; cross-fade
   between landing/quiz/computing/result (AnimatePresence); dimension bars animate to width on the
   result; computing interstitial pulse. All gated by `useReducedMotion` (respect
   `prefers-reduced-motion`).
4. **Sharing** — `permalink.ts`: `encodeAnswers`/`decodeAnswers` (compact, URL-safe). App reads a
   `#r=…` hash on mount → decode → `computeProfile` → result. ResultPage gains **Copy link** (writes
   the permalink) and **Save image** (`html-to-image` → PNG of the result card).
5. **A11y** — implement the radiogroup roving-tabindex + arrow-key pattern on the response toggles
   (deferred from Phases 1–2); keep focus-visible rings; `prefers-reduced-motion` honored.

## Testing (TDD where logic exists)
- `permalink.ts` encode→decode round-trip (incl. single + depends answers; malformed hash → null).
- App restores a result from a `#r=` permalink.
- Roving-tabindex keyboard selection on a response group.
- Existing 106 tests stay green (motion wrappers must not break text/role queries; Framer Motion
  respects reduced-motion which jsdom reports, so animations are inert in tests).
- Gate: full `npm test` + `npm run build` clean, then an adversarial review.

## Notes
- New deps: `framer-motion`, `html-to-image`.
- Image export + clipboard are browser-API paths (manual verification; logic kept thin).
