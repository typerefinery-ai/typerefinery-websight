/** Walk the os-triage content tree with depth-1 JSON requests and grep for a pattern. */
const BASE = 'https://cms.typerefinery.localhost:8101'
const ROOT = '/content/typerefinery-showcase/pages/os-triage'
const PATTERN = /new\s*object|new\s*form/i
const auth = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const hits = []
let visited = 0
async function walk(path, depth) {
  if (depth > 7) return
  let j
  try {
    const r = await fetch(`${BASE}${path}.1.json`, { headers: { Authorization: auth } })
    if (!r.ok) return
    j = await r.json()
  } catch { return }
  visited++
  for (const [k, v] of Object.entries(j)) {
    if (k.startsWith('jcr:') || k.startsWith('sling:')) {
      if (typeof v === 'string' && PATTERN.test(v)) hits.push(`${path} @${k} = ${v.slice(0, 70)}`)
      continue
    }
    if (v && typeof v === 'object') { await walk(`${path}/${k}`, depth + 1); continue }
    if (typeof v === 'string' && PATTERN.test(v)) hits.push(`${path} @${k} = ${v.slice(0, 70)}`)
    if (PATTERN.test(k)) hits.push(`${path} @KEY ${k}`)
  }
}
await walk(ROOT, 0)
console.log(`visited ${visited} nodes`)
console.log(hits.length ? hits.join('\n') : 'NO MATCHES for /new object|new form/i')
