/**
 * Download Satoshi from Fontshare into src/fonts/satoshi/ (gitignored). The ITF Free Font License lets us
 * self-host it for our own site, but not redistribute the files through a public repository, and not
 * subset or convert them — so we fetch the official package at build time and ship its WOFF2 unchanged.
 * Skips the download when the files are already there. With --optional, a failed download only warns.
 * Run: npx tsx scripts/fetch-fonts.ts [--optional]
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateRawSync } from 'node:zlib'

const PACKAGE_URL = 'https://api.fontshare.com/v2/fonts/download/satoshi'
const OUT = join(process.cwd(), 'src/fonts/satoshi')
/** path suffix inside the zip → file name in OUT */
const WANTED: Record<string, string> = {
  'Fonts/WEB/fonts/Satoshi-Variable.woff2': 'Satoshi-Variable.woff2',
  'License/FFL.txt': 'FFL.txt',
}

/** Minimal zip reader: walks the central directory, handles stored and deflated entries. */
function unzip(buf: Buffer): Map<string, Buffer> {
  let eocd = buf.length - 22
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--
  if (eocd < 0) throw new Error('not a zip archive')
  const files = new Map<string, Buffer>()
  let p = buf.readUInt32LE(eocd + 16)
  for (let i = buf.readUInt16LE(eocd + 10); i > 0; i--) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('corrupt zip central directory')
    const method = buf.readUInt16LE(p + 10)
    const size = buf.readUInt32LE(p + 20)
    const nameLen = buf.readUInt16LE(p + 28)
    const local = buf.readUInt32LE(p + 42)
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen)
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
    const raw = buf.subarray(start, start + size)
    if (method === 0) files.set(name, raw)
    else if (method === 8) files.set(name, inflateRawSync(raw))
    p += 46 + nameLen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32)
  }
  return files
}

async function main() {
  if (Object.values(WANTED).every(f => existsSync(join(OUT, f)))) return
  const res = await fetch(PACKAGE_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const files = [...unzip(Buffer.from(await res.arrayBuffer()))]
  mkdirSync(OUT, { recursive: true })
  for (const [suffix, out] of Object.entries(WANTED)) {
    const data = files.find(([name]) => name.endsWith(suffix))?.[1]
    if (!data) throw new Error(`${suffix} is missing from the package`)
    if (out.endsWith('.woff2') && data.toString('latin1', 0, 4) !== 'wOF2') throw new Error(`${out} is not a WOFF2 file`)
    writeFileSync(join(OUT, out), data)
  }
  console.log('fetch-fonts: saved Satoshi to src/fonts/satoshi/')
}

main().catch(err => {
  const msg = `fetch-fonts: could not download Satoshi (${err instanceof Error ? err.message : err})`
  if (process.argv.includes('--optional')) {
    console.warn(`${msg}; the site will fall back to system fonts`)
  } else {
    console.error(msg)
    process.exit(1)
  }
})
