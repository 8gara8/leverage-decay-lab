// Rasterise public/og-image.svg -> public/og-image.png (1200×630) for the social
// card (SPEC.md §3, Phase 5). Social crawlers (Facebook/X/LINE) don't render SVG
// og:image, so we commit a PNG and regenerate it from the SVG when the design
// changes.
//
// @resvg/resvg-js is intentionally NOT a project dependency — this is an
// authoring-time tool, and SPEC.md §13 keeps the shipped app dependency-light.
// So install it into a throwaway dir and point this script at it:
//
//   TMP=$(mktemp -d)
//   ( cd "$TMP" && npm install --no-save @resvg/resvg-js )
//   OG_RESVG_BASE="$TMP/node_modules" node scripts/gen-og.mjs
//   rm -rf "$TMP"
//
// If resvg is already resolvable from the project, just run `node scripts/gen-og.mjs`.
//
// CJK glyphs (槓桿衰減實驗室…) need a font that covers Traditional Chinese; resvg
// ships none, so we point it at fonts present on the build box and fall back
// gracefully if a path is missing.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pub = resolve(__dirname, '..', 'public')

// Resolve resvg relative to OG_RESVG_BASE when given (a throwaway install),
// otherwise relative to this script.
const require = createRequire(
  process.env.OG_RESVG_BASE ? resolve(process.env.OG_RESVG_BASE, '_.cjs') : import.meta.url,
)
const { Resvg } = require('@resvg/resvg-js')

// Prefer a Traditional-Chinese-capable font for CJK, DejaVu for Latin.
const FONT_CANDIDATES = [
  '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
]
const fontFiles = FONT_CANDIDATES.filter((p) => existsSync(p))

const svg = readFileSync(resolve(pub, 'og-image.svg'), 'utf8')
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: { fontFiles, loadSystemFonts: true, defaultFontFamily: 'WenQuanYi Zen Hei' },
})
const png = resvg.render().asPng()
writeFileSync(resolve(pub, 'og-image.png'), png)
console.log(`og-image.png written (${png.length} bytes); fonts: ${fontFiles.join(', ') || 'system'}`)
