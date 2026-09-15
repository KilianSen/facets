# Facets

**A personality test for everyone that lets you say "it depends".**

Most personality tests make you pick one answer and flatten you into a type. Facets asks how you
actually show up, and when one answer doesn't fit, you split it by context instead. Your result
shows how you shift as a situation turns up, and the archetype, facets and motives behind that shift.

You get the full result the moment you finish. No signup, no email, no paywall. Everything runs in
your browser, and nothing you answer is sent anywhere.

**Live:** https://kiliansen.github.io/facets/

## What it measures

Six behaviour dimensions:

| Dimension  | Low end         | High end      |
| ---------- | --------------- | ------------- |
| Warmth     | stay cool       | get warm      |
| Approach   | pull back       | lean in       |
| Directness | stay diplomatic | get blunt     |
| Boldness   | play it safe    | take the risk |
| Lead       | follow          | take charge   |
| Composure  | get rattled     | stay calm     |

Each one is measured against six situational axes: **closeness**, **stakes**, **audience**,
**energy**, **power** and **initiative**. The result is a slope per axis rather than a single score,
so "blunt with strangers, gentle with friends" is a finding, not noise.

## Features

- **Quick read** (~7 min): an adaptive set of questions that tops up thin spots automatically.
- **Deep dive** (~12 min): the quick read plus three chapters: head-to-head ("Which one are you?"),
  across your life (romance, work, social and family), and when situations collide (crossroads
  dilemmas, plus a sharpen round on every strong swing).
- **58 archetypes** with a browsable gallery and a detail page for each.
- **Compare mode**: send a link, and see side by side where two people match and where they clash.
- **Shareable results**: permalinks, story images, and a static link-preview card per archetype.
- **The method page** explains exactly how answers become a result.

## Tech

React 18, TypeScript, Vite, Tailwind CSS and Framer Motion, tested with Vitest and Testing Library.
It's a fully static site with no backend: results live in the URL and in the browser.

## Development

Requires Node 20+.

```sh
npm install
npm run dev        # start the dev server
npm test           # run the test suite once
npm run test:watch # run tests in watch mode
npm run build      # typecheck, build, and generate share pages
npm run preview    # serve the production build locally
```

Before `dev` and `build`, `scripts/fetch-fonts.ts` downloads the Satoshi font into `src/fonts/satoshi/`
(gitignored, see [Fonts](#fonts)). It only downloads once. If it fails, `dev` carries on with system
fonts, but `build` stops.

`npm run build` also runs `scripts/gen-share.ts`, which renders an Open Graph image and a static
share page for every archetype, plus the gallery, method, compare and 404 pages. Two environment
variables control the output:

| Variable    | Default                        | Purpose                                                   |
| ----------- | ------------------------------ | --------------------------------------------------------- |
| `BASE_PATH` | `/facets/` in production       | Path the site is served from                              |
| `SITE_URL`  | unset (relative preview URLs)  | Absolute origin for `og:image` / `og:url`; set it for deploys |

The `scripts/calibrate-stability.ts` and `scripts/feasibility-stability.ts` scripts are one-off
calibration probes for the adaptive-depth thresholds. Run them with `npx tsx <script>`.

### Project layout

```
src/
  app/         app shell and top-level flow
  quiz/        question cards and the quiz flow
  engine/      scoring, adaptive depth, archetype matching, compare
  content/     dimensions, axes, questions, archetypes
  result/      result page sections
  archetypes/  landing page, gallery, archetype detail pages
  compare/     compare mode
  share/       permalinks, story images, font embedding for exports
  signature/   the 3D signature crystal
  method/      the method page
  router/      tiny base-path-aware router
scripts/       build-time share page generation and calibration probes
```

## Deployment

Pushes to `main` or `adaptive-depth` test, build and deploy to GitHub Pages via
`.github/workflows/deploy.yml`.

## License

The code and content are released under the [MIT License](LICENSE).

### Fonts

Fonts are third-party and are **not** covered by the MIT License:

- **Fraunces** by The Fraunces Project Authors, under the SIL Open Font License 1.1. Installed from
  [`@fontsource-variable/fraunces`](https://fontsource.org/fonts/fraunces), which includes the license.
- **Satoshi** by Indian Type Foundry, under the [ITF Free Font License](https://www.fontshare.com/licenses/itf-ffl).
  The license allows self-hosting for our own site but not redistributing the files through a
  repository, so they're not committed. `scripts/fetch-fonts.ts` downloads the official package from
  Fontshare and ships its WOFF2 unchanged.
- **DM Serif Display**, under the SIL Open Font License 1.1. It's used at build time for link-preview
  images and bundled in `scripts/fonts/` with its license (`OFL-DMSerifDisplay.txt`).
