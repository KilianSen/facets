import { describe, it, expect, vi } from 'vitest'
import { inlineFontFaces } from './fontEmbed'

const GOOGLE = `
/* cyrillic */
@font-face { font-family: 'Fraunces'; font-style: normal; font-weight: 400 800; src: url(https://fonts.gstatic.com/s/fraunces/cyr.woff2) format('woff2'); unicode-range: U+0301, U+0400-045F; }
/* latin */
@font-face { font-family: 'Fraunces'; font-style: normal; font-weight: 400 800; src: url(https://fonts.gstatic.com/s/fraunces/latin.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131; }
`
const FONTSHARE = `@font-face { font-family: 'Satoshi'; src: url('//cdn.fontshare.com/wf/sat.woff2') format('woff2'), url('//cdn.fontshare.com/wf/sat.woff') format('woff'); font-weight: 700; font-style: normal; }`

describe('inlineFontFaces', () => {
  it('keeps only the Latin subset and inlines its font file', async () => {
    const fetchAsDataUrl = vi.fn(async (url: string) => `data:font/woff2;base64,${btoa(url)}`)
    const css = await inlineFontFaces(GOOGLE, 'https://fonts.googleapis.com/css2?family=Fraunces', fetchAsDataUrl)
    expect(fetchAsDataUrl).toHaveBeenCalledTimes(1)
    expect(fetchAsDataUrl).toHaveBeenCalledWith('https://fonts.gstatic.com/s/fraunces/latin.woff2')
    expect(css).toContain("src: url(data:font/woff2;base64,")
    expect(css).toContain("format('woff2')")
    expect(css).not.toContain('cyr.woff2')
    expect(css).toContain('unicode-range: U+0000-00FF')
  })

  it('recognises the Latin subset in the form browsers serialize it (U+0-FF)', async () => {
    const serialized = `@font-face { font-family: "Fraunces Variable"; src: url("/assets/latin-ext.woff2") format("woff2-variations"); unicode-range: U+100-2BA, U+2BD-2C5; }
@font-face { font-family: "Fraunces Variable"; src: url("/assets/latin.woff2") format("woff2-variations"); unicode-range: U+0-FF, U+131, U+152-153; }`
    const fetchAsDataUrl = vi.fn(async () => 'data:font/woff2;base64,AAAA')
    await inlineFontFaces(serialized, 'https://example.com/facets/', fetchAsDataUrl)
    expect(fetchAsDataUrl).toHaveBeenCalledTimes(1)
    expect(fetchAsDataUrl).toHaveBeenCalledWith('https://example.com/assets/latin.woff2')
  })

  it('resolves protocol-relative URLs and uses only the first source of an unsubsetted face', async () => {
    const fetchAsDataUrl = vi.fn(async () => 'data:font/woff2;base64,AAAA')
    const css = await inlineFontFaces(FONTSHARE, 'https://api.fontshare.com/v2/css?f[]=satoshi@700', fetchAsDataUrl)
    expect(fetchAsDataUrl).toHaveBeenCalledWith('https://cdn.fontshare.com/wf/sat.woff2')
    expect(css).not.toContain('sat.woff')
    expect(css.match(/url\(/g)).toHaveLength(1)
  })

  it('drops a face whose file cannot be fetched instead of failing the export', async () => {
    const css = await inlineFontFaces(FONTSHARE, 'https://api.fontshare.com/v2/css', async () => { throw new Error('offline') })
    expect(css).toBe('')
  })
})
