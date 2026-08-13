/**
 * docs/issues/0140 — how many Act 2 nodes are still labelled with something that is not a NAME?
 *
 * 0140 records the display shaper emitting type words, ids and timestamps where a human-readable
 * name belongs. Half of it was fixed (`d7a75be`+`c822dc3`, naming by the object's own `name` first).
 * This measures what is left, on the screen the audience actually sees, and classifies each label so
 * the number is arguable rather than impressionistic:
 *
 *   TYPE WORD   the label is a bare STIX type or vocabulary value — `task`, `event`, `availability`
 *   TIMESTAMP   an ISO instant rendered as a name — `2020-10-19T01:01:01.000Z`
 *   RAW ID      a `type--uuid` leaked into the label
 *   NAME        anything else — treated as a genuine name
 *
 * ⚠️ Reads the labels the widget actually paints next to icons, not every `<text>` in the SVG: a
 * first pass took the first 14 text elements and got 14 × "extensions", which is markup the viewer
 * never sees. Measure what is on screen.
 *
 *     node e2e/probe-act2-node-labels.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PAGE = 'https://cms.typerefinery.localhost:8101/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html'
const MAP = path.join(
  __dirname, '..', '..', 'typerefinery', 'services', 'fastapi', 'generated', 'os-triage',
  'context_mem', 'context_map.json',
)
console.log(`current_incident: ${JSON.parse(fs.readFileSync(MAP, 'utf8')).current_incident}\n`)

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const page = await (
  await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: path.join(__dirname, '.auth', 'cms.json'),
    viewport: { width: 1600, height: 1000 },
  })
).newPage()

await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 120_000 })
await page.waitForTimeout(26_000)

const frame = page.frames().find((f) => /widgetdevoverview/.test(f.url()))
if (!frame) { console.log('overview frame not found'); await browser.close(); process.exit(1) }

const labels = await frame.evaluate(() => {
  const svg = document.querySelector('svg')
  const icons = [...svg.querySelectorAll('image')].map((n) => n.getBoundingClientRect())
  // A node label is a <text> whose box sits within ~60px below an icon centre.
  return [...svg.querySelectorAll('text')]
    .map((t) => ({ s: t.textContent.trim(), b: t.getBoundingClientRect() }))
    .filter((t) => t.s && t.b.width > 0)
    .filter((t) =>
      icons.some((i) => Math.abs((t.b.left + t.b.right) / 2 - (i.left + i.right) / 2) < 90 &&
        t.b.top >= i.top && t.b.top - i.bottom < 40),
    )
    .map((t) => t.s)
})

const TYPES = /^(task|event|impact|sighting|identity|indicator|incident|anecdote|observed-data|url|note|artifact|relationship|sequence|user-account|email-addr|email-message|network-traffic|process|malware|attack-flow)$/i
const VOCAB = /^(availability|integrity|confidentiality|new|open|closed|high|medium|low)$/i
// ⚠️ BARE NUMBER must be tested for. 0140 recorded `99` (an impact) and `79563902` (a user-account)
// as labels on 2026-08-12, and the first version of this classifier had no numeric case — so those
// would have fallen through as NAME and the reported tail would have been an undercount presented as
// a finding. A classifier that cannot see a known failure mode is not entitled to say "this is all
// that is left".
const classify = (s) =>
  /^[a-z][a-z0-9-]*--[0-9a-f-]{36}$/i.test(s) ? 'RAW ID'
    : /^\d{4}-\d{2}-\d{2}T[\d:.]+Z?$/.test(s) ? 'TIMESTAMP'
    : /^[\d.,\s]+$/.test(s) ? 'BARE NUMBER'
    : TYPES.test(s) ? 'TYPE WORD'
    : VOCAB.test(s) ? 'VOCAB VALUE'
    : 'NAME'

const counts = {}
const bad = []
for (const s of labels) {
  const k = classify(s)
  counts[k] = (counts[k] || 0) + 1
  if (k !== 'NAME') bad.push(`${k.padEnd(12)} "${s}"`)
}
console.log(`node labels measured: ${labels.length}`)
Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k.padEnd(12)} ${v}`))
if (bad.length) {
  console.log(`\nnot a name (${bad.length} of ${labels.length} — ${Math.round((bad.length / labels.length) * 100)}%):`)
  ;[...new Set(bad)].forEach((b) => console.log('  ' + b))
}
await browser.close()
