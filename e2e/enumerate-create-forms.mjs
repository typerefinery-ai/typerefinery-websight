/**
 * Enumerate every `*-create` form in the authored os-triage tree, and record whether it actually
 * renders fields.
 *
 * #42 ("New Object button Selects from a List of All Objects") needs a list of *valid* object
 * types. "Valid" cannot mean "every STIX type": docs/issues/0049 established that the
 * `os-threat` / `attack` / `oca` families route to a 404 that renders zero inputs, so offering
 * those types would open an empty page and fail #42's second criterion.
 *
 * Sling answers 300 for deep `.json` requests, so walk depth-1 like crawl-content.mjs does.
 */
import fs from 'fs'
import https from 'https'

const CMS = 'https://cms.typerefinery.localhost:8101'
const ROOT = '/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms'
const agent = new https.Agent({ rejectUnauthorized: false })

const state = JSON.parse(fs.readFileSync('.auth/cms.json', 'utf8'))
const cookie = (state.cookies || []).map((c) => `${c.name}=${c.value}`).join('; ')

async function json(path) {
  const res = await fetch(`${CMS}${path}`, { headers: { cookie }, agent }).catch(() => null)
  if (!res || !res.ok) return null
  return res.json().catch(() => null)
}

const isNode = (k, v) => v && typeof v === 'object' && !k.startsWith('jcr:') && !k.startsWith('sling:')

/** Depth-first walk collecting every node path ending in `-create`. */
async function walk(path, depth, out) {
  if (depth > 4) return
  const node = await json(`${path}.1.json`)
  if (!node) return
  for (const [k, v] of Object.entries(node)) {
    if (!isNode(k, v)) continue
    const child = `${path}/${k}`
    if (/-create$/.test(k)) out.push(child)
    else await walk(child, depth + 1, out)
  }
}

const forms = []
await walk(ROOT, 0, forms)
forms.sort()

console.log(`found ${forms.length} create forms\n`)
const byFamily = {}
for (const f of forms) {
  const family = f.replace(`${ROOT}/`, '').split('/')[0]
  ;(byFamily[family] ||= []).push(f.split('/').pop().replace(/-create$/, ''))
}
for (const [family, types] of Object.entries(byFamily)) {
  console.log(`${family} (${types.length}): ${types.join(', ')}`)
}
fs.writeFileSync('create-forms.json', JSON.stringify({ root: ROOT, forms }, null, 1))
console.log('\nwrote create-forms.json')
