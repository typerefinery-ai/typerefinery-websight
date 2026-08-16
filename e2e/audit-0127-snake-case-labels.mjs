/**
 * docs/issues/0127 — how many field LABELS still render raw snake_case?
 *
 * 0127's gap list records "7 of 36 and 10 of 37 distinct labels" from a 2026-08-13 measurement, on two
 * forms. Every other row of that gap list has since proved stale, so this re-counts across every form
 * panel before anyone writes a fix.
 *
 * Labels only — the field `name` attribute is a different concern and belongs to
 * docs/issues/0144 (does the name match the STIX class). Changing a label is display-only.
 *
 * The convention already in the build is Title Case with spaces ("External References", "Granular
 * Marking"), which is what makes the leftovers read as unfinished rather than as a house style.
 *
 *     node e2e/audit-0127-snake-case-labels.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const CMS = 'http://localhost:8113'
const ROOT = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms'
const PKG = path.resolve(
  __dirname,
  '../tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms',
)

const pages = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    if (/-(create|update)$/.test(e.name)) pages.push(path.relative(PKG, path.join(d, e.name)).replace(/\\/g, '/'))
    else walk(path.join(d, e.name))
  }
})(PKG)

// snake_case = lower-case words joined by underscores. A single lower-case word ("name", "description")
// is NOT snake_case and reads fine, so it is not counted — the complaint is the underscores.
const isSnake = (s) => /^[a-z0-9]+(_[a-z0-9]+)+$/.test(s.trim())

const perForm = []
const allSnake = new Map()
for (const rel of pages) {
  const res = await fetch(`${CMS}${ROOT}/${rel}.html`, { headers: { Authorization: auth } })
  if (!res.ok) {
    perForm.push({ rel, http: res.status, distinct: 0, snake: 0, examples: [] })
    continue
  }
  const html = await res.text()
  const labels = [...html.matchAll(/<label[^>]*>([^<]{1,60})<\/label>/g)].map((m) => m[1].trim()).filter(Boolean)
  const distinct = [...new Set(labels)]
  const snake = distinct.filter(isSnake)
  for (const s of snake) allSnake.set(s, (allSnake.get(s) || 0) + 1)
  perForm.push({ rel, http: res.status, distinct: distinct.length, snake: snake.length, examples: snake.slice(0, 6) })
}

perForm.sort((a, b) => b.snake - a.snake || a.rel.localeCompare(b.rel))
console.log(`form panels: ${perForm.length}\n`)
for (const f of perForm) {
  console.log(`  ${String(f.snake).padStart(2)}/${String(f.distinct).padStart(2)} snake  ${f.rel}${f.examples.length ? '  — ' + f.examples.join(', ') : ''}`)
}

const totalDistinct = perForm.reduce((n, f) => n + f.distinct, 0)
const totalSnake = perForm.reduce((n, f) => n + f.snake, 0)
console.log(`\ntotal: ${totalSnake}/${totalDistinct} distinct labels are snake_case (${((totalSnake / totalDistinct) * 100).toFixed(0)}%)`)
console.log(`distinct snake_case strings across the build: ${allSnake.size}`)
console.log([...allSnake.entries()].sort((a, b) => b[1] - a[1]).map(([s, n]) => `  ${s} (${n} form${n > 1 ? 's' : ''})`).join('\n'))

fs.writeFileSync(path.join(__dirname, 'audit-0127-snake-case-labels.json'), JSON.stringify({ perForm, distinct: [...allSnake.entries()] }, null, 2))
console.log('\nwritten: e2e/audit-0127-snake-case-labels.json')
