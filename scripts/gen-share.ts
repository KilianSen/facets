/**
 * Build-time generator for static social unfurl (Phase 4, Path A).
 * For each archetype: render a 1200x630 OG card -> dist/og/<id>.png (Satori -> resvg),
 * and write dist/r/<id>/index.html (the built SPA + per-archetype OG/Twitter meta).
 * Run after `vite build`. Optional env SITE_URL makes og:image/url absolute.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { ARCHETYPES } from '../src/content/archetypes'
import { CONTENT } from '../src/content'
import { crystalSvg } from '../src/signature/crystal'
import { shapeFromArchetype } from '../src/signature/shape'
import { accentOf } from '../src/archetypes/archetypeMeta'

const DIST = 'dist'
const SITE_URL = (process.env.SITE_URL ?? '').replace(/\/$/, '')

async function loadFont(): Promise<ArrayBuffer> {
  const localPaths = [
    join(process.cwd(), 'scripts/fonts/DMSerifDisplay-Regular.ttf'),
    join(process.cwd(), 'fonts/DMSerifDisplay-Regular.ttf'),
  ]
  for (const p of localPaths) {
    if (existsSync(p)) {
      const buf = readFileSync(p)
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    }
  }

  const urls = [
    'https://raw.githubusercontent.com/google/fonts/main/ofl/dmserifdisplay/DMSerifDisplay-Regular.ttf',
    'https://raw.githubusercontent.com/google/fonts/main/ofl/archivoblack/ArchivoBlack-Regular.ttf',
    'https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/static/SpaceGrotesk-Bold.ttf',
  ]
  for (const u of urls) {
    try {
      const r = await fetch(u)
      if (r.ok) return await r.arrayBuffer()
    } catch { /* try next */ }
  }
  throw new Error('gen-share: could not fetch a display font for OG images')
}

type El = { type: string; props: { style: Record<string, unknown>; children?: unknown } }
const el = (type: string, style: Record<string, unknown>, children?: unknown): El => ({ type, props: { style: { display: 'flex', ...style }, children } })

function card(a: (typeof ARCHETYPES)[number]): El {
  // Same system as the app: cream paper, ink frame, coral stamp, and the archetype's 3D crystal
  // signature (the same geometry the site draws). Flat — no gradients.
  const crystal = crystalSvg(shapeFromArchetype(a), CONTENT, { yaw: -0.35, pitch: 0.42, accent: accentOf(a.id), width: 380, height: 320 })
  const img = {
    type: 'img',
    props: {
      src: `data:image/svg+xml;base64,${Buffer.from(crystal).toString('base64')}`,
      width: 494, height: 416,
      style: { position: 'absolute', right: '40px', top: '96px' },
    },
  }
  return el('div', {
    width: '1200px', height: '630px', flexDirection: 'column', justifyContent: 'center',
    padding: '64px', position: 'relative', backgroundColor: '#FAF7F2', color: '#151515', fontFamily: 'Display',
    border: '14px solid #151515',
  }, [
    img,
    el('div', { flexDirection: 'column', maxWidth: '640px' }, [
      el('div', { fontSize: '30px', marginBottom: '18px' }, 'Facets.'),
      el('div', { fontSize: '36px', color: '#55504B' }, 'I am'),
      el('div', { fontSize: '96px', lineHeight: '1', margin: '6px 0 28px' }, a.name),
      el('div', { alignItems: 'center', gap: '20px', flexWrap: 'wrap' }, [
        el('div', { fontSize: '26px', backgroundColor: '#FF5A36', border: '4px solid #151515', borderRadius: '999px', padding: '6px 22px' }, a.code),
        el('div', { fontSize: '32px', color: '#55504B' }, a.tagline),
      ]),
    ]),
    el('div', { position: 'absolute', bottom: '44px', left: '64px', fontSize: '26px', color: '#55504B' }, 'a personality test for everyone'),
  ])
}

function injectMeta(tpl: string, m: { title: string; desc: string; image?: string; url: string }): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  let h = tpl
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(m.title)}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(m.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(m.desc)}$2`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(m.desc)}$2`)
  const extra =
    `<meta property="og:url" content="${esc(m.url)}" />` +
    (m.image
      ? `<meta property="og:image" content="${esc(m.image)}" />` +
        `<meta name="twitter:card" content="summary_large_image" />` +
        `<meta name="twitter:image" content="${esc(m.image)}" />`
      : '')
  return h.replace('</head>', `${extra}</head>`)
}

async function main() {
  const font = await loadFont()
  const template = readFileSync(join(DIST, 'index.html'), 'utf8')
  mkdirSync(join(DIST, 'og'), { recursive: true })

  for (const a of ARCHETYPES) {
    const svg = await satori(card(a), {
      width: 1200, height: 630,
      fonts: [{ name: 'Display', data: font, weight: 400, style: 'normal' }],
    })
    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
      font: { fontBuffers: [Buffer.from(font)], defaultFontFamily: 'Display', loadSystemFonts: false },
    }).render().asPng()
    writeFileSync(join(DIST, 'og', `${a.id}.png`), png)

    const image = `${SITE_URL}/og/${a.id}.png`
    // Share/result unfurl page (/r/<id>) — boots the SPA result with per-archetype meta.
    const shareHtml = injectMeta(template, { title: `I'm ${a.name} — Facets`, desc: a.copy, image, url: `${SITE_URL}/r/${a.id}` })
    mkdirSync(join(DIST, 'r', a.id), { recursive: true })
    writeFileSync(join(DIST, 'r', a.id, 'index.html'), shareHtml)

    // Browse/detail page (/archetypes/<id>) — the SPA archetype page, same OG card, browse-framed meta.
    const detailHtml = injectMeta(template, { title: `${a.name} — Facets archetype`, desc: a.copy, image, url: `${SITE_URL}/archetypes/${a.id}` })
    mkdirSync(join(DIST, 'archetypes', a.id), { recursive: true })
    writeFileSync(join(DIST, 'archetypes', a.id, 'index.html'), detailHtml)
  }

  // Gallery index (/archetypes).
  const galleryHtml = injectMeta(template, {
    title: `The ${ARCHETYPES.length} Facets archetypes`,
    desc: 'Every way people shift across situations — closeness, audience, stakes, power, initiative, energy. The Facets field guide.',
    url: `${SITE_URL}/archetypes`,
  })
  mkdirSync(join(DIST, 'archetypes'), { recursive: true })
  writeFileSync(join(DIST, 'archetypes', 'index.html'), galleryHtml)

  // Method explainer (/method) — static shell so the page deep-links and unfurls.
  const methodHtml = injectMeta(template, {
    title: 'How Facets works — the method',
    desc: 'How Facets measures you: say “it depends”, map your move across each situation, and we fit the slope. The shape of how you shift becomes your signature.',
    url: `${SITE_URL}/method`,
  })
  mkdirSync(join(DIST, 'method'), { recursive: true })
  writeFileSync(join(DIST, 'method', 'index.html'), methodHtml)

  // Compare invite / side-by-side (/compare?a=…&b=…) — both answer sets live in the query string.
  const compareHtml = injectMeta(template, {
    title: 'How do we compare? — Facets',
    desc: 'Take Facets and line your signatures up: where you click, where you clash, and each other’s blind spots.',
    url: `${SITE_URL}/compare`,
  })
  mkdirSync(join(DIST, 'compare'), { recursive: true })
  writeFileSync(join(DIST, 'compare', 'index.html'), compareHtml)

  // Fallback shell for GitHub Pages SPA client routing
  writeFileSync(join(DIST, '404.html'), template)

  console.log(`gen-share: wrote ${ARCHETYPES.length} OG cards + share/detail pages + gallery + method + compare + 404.html${SITE_URL ? ` (SITE_URL=${SITE_URL})` : ' (relative URLs)'}`)
}

main().catch(e => { console.error(e); process.exit(1) })
