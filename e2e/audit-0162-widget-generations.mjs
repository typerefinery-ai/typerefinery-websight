/**
 * docs/issues/0162 — do all authored pages embed the SAME widget generation?
 *
 * 0162: `composer-public` and `vizandform` embed the Composer from its **GitHub Pages** deployment,
 * and that bundle is stale — it carries none of the action-feedback strings, so any demo or test run
 * on those pages exercises months-old code. The issue calls it "a silent fork of the product", which
 * is right: nothing fails, the page just runs a different build.
 *
 * A fork that nobody can see is a fork that keeps widening. Measured 2026-08-16:
 *
 *     gh-pages widget.js   183,669 B   "Promoted into the incident" x0   "Object removed" x0
 *     local    widget.js   288,594 B   x3                                x1
 *
 * The gh-pages figure is **byte-identical to the one 0162 recorded on 2026-08-11** — nobody has
 * republished — while the local bundle has grown ~28 KB since. So the gap is not static, it is
 * opening.
 *
 * This enumerates every authored page that embeds a widget, groups them by origin, and reports the
 * generations side by side. It asserts nothing about which origin is *correct* — that is 0162's
 * open question (retire the pages, or republish the deployment) — it just makes the fork visible.
 *
 *     node e2e/audit-0162-widget-generations.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const ROOT = '/content/typerefinery-showcase/pages/os-triage'
const PKG = path.resolve(
  __dirname,
  '../tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage',
)

// Strings that only exist in builds carrying the action-feedback work — a generation marker that
// means something to a reader, unlike a hash.
const MARKERS = ['Promoted into the incident', 'Object removed']

const pages = []
;(function walk(d, rel = '') {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    const child = path.join(d, e.name)
    if (fs.existsSync(path.join(child, '.content.xml'))) pages.push(`${rel}${e.name}`)
    walk(child, `${rel}${e.name}/`)
  }
})(PKG)

const origins = new Map()
const rows = []
for (const rel of pages) {
  const r = await fetch(`${CMS}${ROOT}/${rel}.html`, { headers: { Authorization: auth } })
  if (!r.ok) continue
  const html = await r.text()
  for (const m of html.matchAll(/<iframe[^>]*src="([^"]+)"/g)) {
    const src = m[1]
    if (!/widget|github\.io/i.test(src)) continue
    // ⚠️ Group by the bundle's BASE URL, not its origin. The GitHub Pages bundle lives at
    // /widget-graph-viz-composer/widget.js, so an origin-only key produced github.io/widget.js and
    // reported the bundle 'unreachable' — a probe that cannot fetch the thing it is comparing.
    let origin
    try {
      const u = new URL(src, 'https://cms.typerefinery.localhost:8101')
      const dir = u.pathname.replace(/\/[^/]*\.html?$/, '').replace(/\/$/, '')
      origin = u.origin + dir
    } catch {
      continue
    }
    rows.push({ page: rel, origin })
    if (!origins.has(origin)) origins.set(origin, [])
    origins.get(origin).push(rel)
  }
}

console.log(`authored pages scanned: ${pages.length} · widget embeds found: ${rows.length}\n`)
const report = []
for (const [origin, pageList] of [...origins.entries()].sort()) {
  let size = null
  let markers = null
  try {
    const res = await fetch(`${origin}/widget.js`)
    if (res.ok) {
      const text = await res.text()
      size = text.length
      markers = MARKERS.map((s) => `${s.split(' ')[0]}×${text.split(s).length - 1}`).join(' ')
    }
  } catch {
    /* unreachable origin */
  }
  report.push({ origin, pages: pageList, size, markers })
  console.log(`${origin}`)
  console.log(`   widget.js: ${size === null ? '(unreachable)' : `${size.toLocaleString()} B`}   markers: ${markers || '—'}`)
  console.log(`   embedded by: ${pageList.join(', ')}`)
}

// ⚠️ Compare only WITHIN a widget family. The first version reported the overview widget's
// "Promoted×0" beside the composer's "Promoted×3" as if that were drift — but those markers are
// composer-specific, so the overview bundle is *correctly* missing them. Comparing across families
// manufactures a finding, which is the mirror of the fork this audit exists to catch.
const familyOf = (origin) => (/overview/i.test(origin) ? 'overview' : /composer|graph-viz-composer/i.test(origin) ? 'composer' : 'other')
const families = new Map()
for (const r of report) {
  const f = familyOf(r.origin)
  if (!families.has(f)) families.set(f, [])
  families.get(f).push(r)
}

console.log('\n--- verdict ---')
let forked = 0
for (const [family, list] of families) {
  if (list.length <= 1) {
    console.log(`  ✅ ${family}: one generation (${list[0]?.pages.length || 0} page(s))`)
    continue
  }
  forked++
  const sizes = list.filter((r) => r.size !== null).map((r) => r.size)
  const spread = sizes.length > 1 ? Math.max(...sizes) - Math.min(...sizes) : null
  console.log(`  ⚠️ ${family}: ${list.length} DIFFERENT generations embedded by authored pages`)
  if (spread !== null) console.log(`     bundle spread: ${spread.toLocaleString()} B`)
  for (const r of list) console.log(`       ${r.size === null ? '(unreachable)' : `${r.size.toLocaleString()} B`}  ${r.markers || '—'}  <- ${r.pages.join(', ')}`)
}
if (forked) {
  console.log("\n  That is 0162's silent fork, still open. This audit does not say which generation is")
  console.log('  right — retiring the pages and republishing the deployment are both live options on')
  console.log('  0162. It says the fork exists, which pages are on the wrong side, and how wide it is.')
}

fs.writeFileSync(path.join(__dirname, 'audit-0162-widget-generations.json'), JSON.stringify(report, null, 2))
console.log('  written: e2e/audit-0162-widget-generations.json')
process.exit(forked ? 1 : 0)
