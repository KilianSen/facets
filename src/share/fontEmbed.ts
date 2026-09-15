/**
 * Web fonts for image exports. html-to-image embeds fonts by reading the page's stylesheets, but ours
 * come from Google Fonts / Fontshare — cross-origin sheets whose rules the browser won't expose, so the
 * export throws. Instead we fetch those stylesheets ourselves (both hosts allow CORS), keep only the
 * Latin subsets, inline each face's first font file as a data URL, and hand html-to-image the result.
 */

const FONT_HOSTS = /fonts\.googleapis\.com|api\.fontshare\.com/

/** Turn @font-face rules into self-contained ones: Latin subsets only, first src inlined as a data URL. */
export async function inlineFontFaces(
  css: string,
  baseHref: string,
  fetchAsDataUrl: (url: string) => Promise<string>,
): Promise<string> {
  const blocks = css.match(/@font-face\s*\{[^}]*\}/g) ?? []
  // Unsubsetted faces have no unicode-range; subsetted ones keep only the basic Latin block.
  const latin = blocks.filter(b => !/unicode-range/i.test(b) || /U\+0000-00FF/i.test(b))
  const inlined = await Promise.all(latin.map(async block => {
    const src = block.match(/src:\s*([^;]+);/)
    const url = src?.[1].match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/)?.[1]
    if (!src || !url) return null
    try {
      const data = await fetchAsDataUrl(new URL(url, baseHref).href)
      const format = /\.woff2(\?|$)/.test(url) ? 'woff2' : /\.woff(\?|$)/.test(url) ? 'woff' : 'truetype'
      return block.replace(src[0], `src: url(${data}) format('${format}');`)
    } catch {
      return null // a face we can't fetch just falls back to a system font
    }
  }))
  return inlined.filter((b): b is string => !!b).join('\n')
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

let cached: Promise<string> | null = null

/** Self-contained CSS for the page's web fonts ('' if none or unavailable). Built once, then cached. */
export function getFontEmbedCSS(): Promise<string> {
  cached ??= (async () => {
    const hrefs = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')]
      .map(l => l.href)
      .filter(href => FONT_HOSTS.test(href))
    const fetchAsDataUrl = async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`font ${res.status}`)
      return blobToDataUrl(await res.blob())
    }
    const parts = await Promise.all(hrefs.map(async href => {
      try {
        const res = await fetch(href)
        return res.ok ? inlineFontFaces(await res.text(), href, fetchAsDataUrl) : ''
      } catch {
        return ''
      }
    }))
    return parts.filter(Boolean).join('\n')
  })()
  return cached
}

/** html-to-image options that make exports work with our cross-origin fonts. */
export async function exportFontOptions(): Promise<{ fontEmbedCSS: string } | { skipFonts: true }> {
  const css = await getFontEmbedCSS()
  return css ? { fontEmbedCSS: css } : { skipFonts: true }
}
