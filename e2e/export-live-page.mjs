/**
 * Export a page that exists only in the running CMS into the content package.
 *
 * docs/issues/0194. `author-stix-update-form.mjs` now exports as it authors, but that does not help a
 * page written by some other tool — or by hand. `incident-update` is exactly that case: Act 2's
 * central node form, authored by `author-incident-update-form.mjs`, live-only and invisible to the
 * package↔live audit until it learned to walk live.
 *
 * ⚠️ Re-running the original authoring script would work and is the WRONG lever here: it would
 * re-create Act 2's central form to fix a packaging gap. This copies what is already there.
 *
 * Uses the same primitives as the audit, so what is written is what the audit will compare:
 * `makeLiveJsonDeep` (which handles Sling's two depth traps) and `pageToVaultXml`.
 *
 *     node e2e/export-live-page.mjs <path-under-os-triage>          # dry run
 *     node e2e/export-live-page.mjs <path-under-os-triage> --apply
 *
 * e.g. node e2e/export-live-page.mjs forms/stixorm-forms/stix-forms/sdo-forms/incident-forms/incident-update --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pageToVaultXml, parseVaultXml } from './vault-xml.mjs'
import { makeLiveJsonDeep } from './live-json.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const CMS = process.env.CMS_BASE_HTTP || 'http://localhost:8113'
const AUTH = 'Basic ' + Buffer.from('wsadmin:wsadmin').toString('base64')
const APPLY = process.argv.includes('--apply')
const REL = process.argv.slice(2).find((a) => !a.startsWith('--'))
const liveJsonDeep = makeLiveJsonDeep(CMS, AUTH)

if (!REL) {
  console.error('usage: node e2e/export-live-page.mjs <path-under-os-triage> [--apply]')
  process.exit(2)
}

const BASE = '/content/typerefinery-showcase/pages/os-triage'
const pagePath = `${BASE}/${REL.replace(/^\/+|\/+$/g, '')}`
const pkgFile = path.join(
  WORKSPACE,
  'typerefinery-websight/tests/content/src/main/content/jcr_root',
  pagePath.replace(/^\//, ''),
  '.content.xml',
)

const tree = await liveJsonDeep(pagePath)
if (!tree) {
  console.error(`could not read ${pagePath} — is it a real page and is the CMS up?`)
  process.exit(1)
}
if (tree['jcr:content'] === undefined) {
  console.error(`${pagePath} has no jcr:content — it is a folder, not a page. Refusing to export.`)
  process.exit(1)
}

const xml = pageToVaultXml(tree)
let reparsed = null
try { reparsed = parseVaultXml(xml) } catch (e) { /* reported below */ }

console.log(`live page : ${pagePath}`)
console.log(`package   : ${path.relative(WORKSPACE, pkgFile).replace(/\\/g, '/')}`)
console.log(`exists    : ${fs.existsSync(pkgFile) ? 'yes — would be OVERWRITTEN' : 'no — new file'}`)
console.log(`serialised: ${xml.length} bytes · re-parse ${reparsed ? 'OK' : '🚩 FAILED'}`)

// A file this tool cannot read back is a file the reconciliation cannot compare — never write it.
if (!reparsed) { console.error('refusing to write: the serialised XML does not re-parse'); process.exit(1) }

if (!APPLY) {
  console.log('\ndry run. Re-run with --apply to write.')
  process.exit(0)
}

fs.mkdirSync(path.dirname(pkgFile), { recursive: true })
fs.writeFileSync(pkgFile, xml)
console.log('\n✅ written. Run audit-package-vs-live-content.mjs to confirm it now compares clean.')
