/**
 * Web fonts for image exports. We build html-to-image's embed CSS ourselves from the page's @font-face
 * rules: Latin subsets only, each face's first font file inlined as a data URL, cached across exports.
 */

/** Turn @font-face rules into self-contained ones: Latin subsets only, first src inlined as a data URL. */
export async function inlineFontFaces(
  css: string,
  baseHref: string,
  fetchAsDataUrl: (url: string) => Promise<string>,
): Promise<string> {
  const blocks = css.match(/@font-face\s*\{[^}]*\}/g) ?? []
  // Unsubsetted faces have no unicode-range; subsetted ones keep only the basic Latin block
  // (written U+0000-00FF in source, serialized as U+0-FF by browsers).
  const latin = blocks.filter(b => !/unicode-range/i.test(b) || /U\+0+-0*FF(?![0-9A-F])/i.test(b))
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
    const fetchAsDataUrl = async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`font ${res.status}`)
      return blobToDataUrl(await res.blob())
    }
    // Fonts are self-hosted, so every sheet is same-origin and its rules are readable.
    const parts = await Promise.all([...document.styleSheets].map(sheet => {
      try {
        const css = [...sheet.cssRules].filter(r => r instanceof CSSFontFaceRule).map(r => r.cssText).join('\n')
        return css ? inlineFontFaces(css, sheet.href ?? document.baseURI, fetchAsDataUrl) : ''
      } catch {
        return '' // an unreadable sheet just contributes no fonts
      }
    }))
    return parts.filter(Boolean).join('\n')
  })()
  return cached
}

/** html-to-image options that embed our web fonts in exports. */
export async function exportFontOptions(): Promise<{ fontEmbedCSS: string } | { skipFonts: true }> {
  const css = await getFontEmbedCSS()
  return css ? { fontEmbedCSS: css } : { skipFonts: true }
}
