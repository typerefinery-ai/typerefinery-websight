/**
 * Vault `.content.xml` primitives, shared between the tools that read and write authored content.
 *
 * Extracted from `audit-package-vs-live-content.mjs` (docs/issues/0194), where the serialiser already
 * existed for `--write-live-only`. `author-stix-update-form.mjs` needs the same thing to write a form
 * it has just authored back into `tests/content` — and duplicating it would have been the wrong shape:
 * two serialisers producing subtly different XML for the same tree is how a package↔live audit starts
 * reporting drift that is really a formatting difference.
 *
 * Nothing here is new behaviour; the functions are moved verbatim so the audit's output is unchanged.
 */

export const escapeXml = (v) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
   .replace(/\r/g, '&#xd;').replace(/\n/g, '&#xa;')

export const unescapeXml = (v) =>
  v.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&#xd;/gi, '\r').replace(/&#xa;/gi, '\n').replace(/&amp;/g, '&')

/**
 * Vault ISO9075-encodes element names that XML cannot express — a child named "0" is stored as
 * <_x0030_>. Decode for comparison with live JSON names (which are the real JCR names); without
 * this, every numbered child reports as a pkg-only/live-only PAIR (652 of the first run's ~890
 * "structural drift" lines were this artifact).
 */
export const decodeName = (n) => n.replace(/_x([0-9a-fA-F]{4})_/g, (_, h) => String.fromCharCode(parseInt(h, 16)))

/**
 * Inverse of decodeName — vault ISO9075 encoding for element names XML cannot express.
 *
 * ⚠️ The COLON is excluded, and that is a fix, not a loosening. ISO9075 encodes characters that are
 * invalid in an XML name; `:` is the namespace separator and is perfectly valid. The original class
 * (`[^\w.\-]`) matched it, so serialising a page turned `jcr:content` into `jcr_x003a_content` — and
 * `audit-package-vs-live-content.mjs` then skipped the file as "not a page", because it looks for a
 * literal `jcr:content`. Every `.content.xml` already in the package writes `<jcr:content>`.
 *
 * Latent until docs/issues/0194 exported a whole PAGE through this; the audit's own `--write-live-only`
 * only ever serialises subtrees below `jcr:content`, where no namespaced child name occurs.
 */
export const encodeName = (n) => n.replace(/^[0-9]|[^\w.\-:]/g, (c) => `_x${c.charCodeAt(0).toString(16).padStart(4, '0')}_`)

/** Minimal vault-XML → tree. Returns {name, props, children[]} for jcr:root. */
export function parseVaultXml(xml) {
  const tokens = [...xml.matchAll(/<(\/?)([\w:.\-]+)((?:"[^"]*"|[^>"])*?)(\/?)>/gs)]
  const root = { name: '(root)', props: {}, children: [] }
  const stack = [root]
  for (const [, close, name, attrText, selfClose] of tokens) {
    if (name.startsWith('?')) continue
    if (close) { stack.pop(); continue }
    const node = { name: decodeName(name), props: {}, children: [] }
    for (const [, k, v] of attrText.matchAll(/([\w:.\-]+)="([^"]*)"/g)) node.props[k] = unescapeXml(v)
    stack[stack.length - 1].children.push(node)
    if (!selfClose) stack.push(node)
  }
  return root.children[0] // jcr:root
}

/** Serialize a live JSON subtree as vault XML, indented to sit at `depth` levels (4 spaces each). */
export function serializeNode(name, node, depth) {
  const pad = '    '.repeat(depth)
  const attrs = [`jcr:primaryType="${node['jcr:primaryType'] || 'nt:unstructured'}"`]
  for (const [k, v] of Object.entries(node)) {
    if (k === 'jcr:primaryType' || k.startsWith('jcr:created')) continue
    if (v === null || typeof v === 'object') continue
    const val = typeof v === 'boolean' ? `{Boolean}${v}` : String(v)
    attrs.push(`${k}="${escapeXml(val) === '' ? '\\0' : escapeXml(val)}"`)
  }
  const children = Object.entries(node).filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v))
  const open = `${pad}<${encodeName(name)}\n${pad}    ${attrs.join(`\n${pad}    `)}`
  if (!children.length) return `${open}/>\n`
  return `${open}>\n${children.map(([cn, cv]) => serializeNode(cn, cv, depth + 1)).join('')}${pad}</${encodeName(name)}>\n`
}

/**
 * A whole page as a `.content.xml` file — the `jcr:root` wrapper plus the page's children.
 *
 * docs/issues/0194. The namespace list and the `ws:Page` primary type are copied from the files
 * already in the package, not invented.
 */
export const pageToVaultXml = (tree) => {
  const children = Object.entries(tree).filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v))
  const head =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0"' +
    ' xmlns:ws="http://ds.pl/websight" xmlns:sling="http://sling.apache.org/jcr/sling/1.0"\n' +
    `    jcr:primaryType="${tree['jcr:primaryType'] || 'ws:Page'}"`
  if (!children.length) return `${head}/>\n`
  return `${head}>\n${children.map(([n, v]) => serializeNode(n, v, 1)).join('')}</jcr:root>\n`
}
