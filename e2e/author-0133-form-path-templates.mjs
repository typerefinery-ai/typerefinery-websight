/**
 * docs/issues/0133 step 3b — the authored templates consume the SERVED form path.
 *
 * The viz embeds' EVENT_PROXY config for `embed-viz-event-open-stixorm-forms-object`
 * currently assembles the URL from three fields:
 *
 *   …/stixorm-forms/{{config.object_family}}/{{config.object_group}}/{{config.object_form}}-forms/{{config.object_form}}-update.html
 *
 * The flows now serve `form_path` per node (0133 step 2) and both widget forks pass it
 * through the event (step 3a), so the template becomes:
 *
 *   …/stixorm-forms/{{config.form_path}}-update.html
 *
 * Walks every candidate page, finds `_events_` children whose topic is the open-object
 * topic AND whose config still assembles from the trio, and rewrites ONLY that config
 * via the component-property servlet (read-back verified). The connection-form templates
 * (`{family}` single-brace placeholders) are a different mechanism and are left alone.
 *
 *     node e2e/author-0133-form-path-templates.mjs            # report
 *     node e2e/author-0133-form-path-templates.mjs --apply
 */
const auth = { Authorization: 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64') }
const CMS = 'http://localhost:8113'
const PROP_SERVLET = 'https://cms.typerefinery.localhost:8101/bin/typerefinery/component-property'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const FORMS = '/content/typerefinery-showcase/pages/os-triage/forms'
const PAGES = ['overview-local', 'overview-public', 'composer-local', 'composer-public', 'vizandform-local']
const TOPIC = 'embed-viz-event-open-stixorm-forms-object'
const OLD_FRAGMENT = '{{config.object_family}}/{{config.object_group}}/{{config.object_form}}-forms/{{config.object_form}}-update.html'
const NEW_FRAGMENT = '{{config.form_path}}-update.html'
const APPLY = process.argv.includes('--apply')

const read = async (path) => {
  const res = await fetch(`${CMS}${path}.json`, { headers: auth })
  return res.ok ? res.json() : null
}

// depth-first walk of a page's jcr:content, collecting _events_ children
const findEventNodes = async (path, depth = 0) => {
  if (depth > 8) return []
  const node = await read(`${path}.tidy.1`.replace('.tidy.1', '')) // plain node read
  return [] // unused — replaced by recursive JSON walk below
}

let totalFixed = 0
for (const page of PAGES) {
  const base = `${FORMS}/${page}/jcr:content`
  const res = await fetch(`${CMS}${base}.tidy.infinity.json`, { headers: auth })
  if (!res.ok) {
    console.log(`${page}: jcr:content not readable (${res.status}) — skipped`)
    continue
  }
  const tree = await res.json()
  if (Array.isArray(tree)) {
    console.log(`${page}: tree too large for infinity read — needs chunked walk, skipped (report this)`)
    continue
  }
  const hits = []
  const walk = (node, path) => {
    for (const [key, child] of Object.entries(node)) {
      if (child && typeof child === 'object' && !Array.isArray(child)) {
        if (child.topic === TOPIC && typeof child.config === 'string' && child.config.includes(OLD_FRAGMENT)) {
          hits.push({ path: `${base}/${path}${key}`, config: child.config })
        }
        walk(child, `${path}${key}/`)
      }
    }
  }
  walk(tree, '')
  if (!hits.length) {
    console.log(`${page}: no trio-assembling open-object template found (already flipped, or absent)`)
    continue
  }
  for (const hit of hits) {
    const newConfig = hit.config.replace(OLD_FRAGMENT, NEW_FRAGMENT)
    console.log(`${page}: ${hit.path.slice(base.length)}\n    -> ${newConfig.slice(0, 110)}…`)
    if (!APPLY) continue
    const post = await fetch(PROP_SERVLET, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ path: hit.path, name: 'config', value: newConfig }),
    })
    const back = await read(hit.path)
    const landed = back && back.config === newConfig
    console.log(`    ${landed ? '✅ landed' : '❌ DID NOT LAND'} (servlet ${post.status})`)
    if (landed) totalFixed++
  }
}
console.log(APPLY ? `\n${totalFixed} template config(s) flipped. Verify P2-S5/P3-S5 via the walk.` : '\n(report only — pass --apply)')
