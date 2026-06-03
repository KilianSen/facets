/**
 * Build-time generator for static social unfurl (Phase 4, Path A).
 * For each archetype: render a 1200x630 OG card -> dist/og/<id>.png (Satori -> resvg),
 * and write dist/r/<id>/index.html (the built SPA + per-archetype OG/Twitter meta).
 * Run after `vite build`. Optional env SITE_URL makes og:image/url absolute.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { ARCHETYPES } from '../src/content/archetypes'

const DIST = 'dist'
const SITE_URL = (process.env.SITE_URL ?? '').replace(/\/$/, '')

async function loadFont(): Promise<ArrayBuffer> {
  const urls = [
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
  return el('div', {
    width: '1200px', height: '630px', flexDirection: 'column', justifyContent: 'center',
    padding: '80px', position: 'relative', backgroundColor: '#08080c', color: 'white', fontFamily: 'Display',
    backgroundImage:
      'radial-gradient(900px 900px at 8% -25%, rgba(34,211,238,0.28), transparent), radial-gradient(750px 750px at 120% 25%, rgba(217,70,239,0.24), transparent)',
  }, [
    el('div', { fontSize: '26px', letterSpacing: '10px', color: '#67e8f9', marginBottom: '14px' }, 'FPTIC'),
    el('div', { fontSize: '34px', color: 'rgba(255,255,255,0.55)' }, 'You are'),
    el('div', { fontSize: '108px', lineHeight: '1', margin: '4px 0 22px' }, a.name),
    el('div', { alignItems: 'center', gap: '18px' }, [
      el('div', { fontSize: '26px', color: '#67e8f9', border: '2px solid rgba(34,211,238,0.45)', borderRadius: '999px', padding: '6px 20px' }, a.code),
      el('div', { fontSize: '32px', color: 'rgba(255,255,255,0.8)' }, a.tagline),
    ]),
    el('div', { position: 'absolute', bottom: '60px', left: '80px', fontSize: '26px', color: 'rgba(255,255,255,0.5)' }, 'the personality test that lets you say “it depends”'),
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
    const shareHtml = injectMeta(template, { title: `I'm ${a.name} — FPTIC`, desc: a.copy, image, url: `${SITE_URL}/r/${a.id}` })
    mkdirSync(join(DIST, 'r', a.id), { recursive: true })
    writeFileSync(join(DIST, 'r', a.id, 'index.html'), shareHtml)

    // Browse/detail page (/archetypes/<id>) — the SPA archetype page, same OG card, browse-framed meta.
    const detailHtml = injectMeta(template, { title: `${a.name} — FPTIC archetype`, desc: a.copy, image, url: `${SITE_URL}/archetypes/${a.id}` })
    mkdirSync(join(DIST, 'archetypes', a.id), { recursive: true })
    writeFileSync(join(DIST, 'archetypes', a.id, 'index.html'), detailHtml)
  }

  // Gallery index (/archetypes).
  const galleryHtml = injectMeta(template, {
    title: 'The 20 FPTIC archetypes',
    desc: 'Every way people shift across situations — closeness, audience, stakes, power, initiative, energy. The FPTIC field guide.',
    url: `${SITE_URL}/archetypes`,
  })
  mkdirSync(join(DIST, 'archetypes'), { recursive: true })
  writeFileSync(join(DIST, 'archetypes', 'index.html'), galleryHtml)

  console.log(`gen-share: wrote ${ARCHETYPES.length} OG cards + share/detail pages + gallery${SITE_URL ? ` (SITE_URL=${SITE_URL})` : ' (relative URLs)'}`)
}

main().catch(e => { console.error(e); process.exit(1) })
