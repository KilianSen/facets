# FPTIC Phase 4 — Static social unfurl (per-archetype OG cards) — design

**Date:** 2026-06-02
**Status:** approved, in implementation
**Branch:** `phase4-og` (off `main` after Phase 3)

## Decision (confirmed)
Path A — **fully static**, no backend. Link previews show a **per-archetype** OG card
(everyone who gets The Vault shares the same designed image). Stays a pure Vite/static deploy.

## How it works
- Share URL becomes server-readable: `…/r/<archetypeId>?a=<encoded answers>` (query, which a
  crawler's GET carries; path identifies the archetype). The legacy `#r=` client permalink keeps working.
- At **build time** a script generates, for each of the 20 archetypes:
  - `dist/og/<id>.png` — a 1200×630 card (Satori → resvg), beam/glow look (static gradient),
    archetype name + code + tagline + footer.
  - `dist/r/<id>/index.html` — a copy of the built `index.html` with per-archetype OG/Twitter
    meta injected (`og:title`, `og:description`, `og:image` → `/og/<id>.png`,
    `twitter:card=summary_large_image`).
- A **crawler** hitting `/r/vault?a=…` is served the static `dist/r/vault/index.html` → sees Vault's
  card + meta (no server, no JS). A **human** loads the same page; the SPA reads `?a=`, recomputes
  via `computeProfile`, and shows their full personalized result (parity with today).
- `og:image` is relative by default; an optional `SITE_URL` build env makes it absolute (best
  crawler compatibility). Documented in the deploy checklist.

## Pieces
- `share/permalink.ts`: add `shareUrl(archetypeId, answers)`; `App.fromPermalink` reads `?a=` (then
  legacy `#r=`).
- `ShareBar`: "Copy link" builds the `/r/<id>?a=` URL (needs the archetype id).
- `scripts/gen-share.ts` (run via `tsx`, postbuild): renders the 20 PNGs + 20 share pages. Loads a
  distinctive display TTF (fetched from the Google Fonts repo, with fallback). Build:
  `tsc -b && vite build && tsx scripts/gen-share.ts`.

## Testing
- TDD the pure logic: `shareUrl` format; `#r=`/`?a=` decode round-trip; App restores from a `?a=`
  query (mirrors the existing `#r=` test).
- **Run `gen-share` against a real build** here to verify it emits PNGs + pages (this path, unlike a
  serverless function, is verifiable locally).
- Gate: full `npm test` + `npm run build` (incl. gen-share) clean.

## Caveat
Real-world unfurl (how a given platform renders the card) is confirmed by pasting a deployed link
into a link debugger — included as a checklist. Per-archetype image (not per-exact-result) is the
deliberate Path-A tradeoff.
