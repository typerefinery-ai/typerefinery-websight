/**
 * Do the docs' relative links point at files that exist?
 *
 * `audit-doc-integrity.mjs` catches control-byte damage; nothing catches a link to a file that was
 * never there. Both failures this tooling has actually produced were filename guesses:
 *
 *   - a `cat >>` onto a guessed `0174-*.md` created a STRAY DUPLICATE issue file rather than
 *     appending to the real one (2026-08-16, repaired);
 *   - links written to `0137-implement-decision-0022-converge-the-panels.md` when the file is
 *     `0137-implement-decision-0022-converge-panels-into-the-template.md` (same day).
 *
 * The register has no version control (docs/issues/0092), so a broken cross-reference is not
 * recoverable by `git log` — it just quietly stops leading anywhere. This is the cheap standing check.
 *
 * Anchors (`#section`), external URLs and `mailto:` are ignored; a link to a directory is fine if the
 * directory exists.
 *
 *     node e2e/audit-doc-links.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const ROOTS = ['docs', '.']

const files = []
const walk = (dir, depth = 0) => {
  if (depth > 6) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (/^(node_modules|\.git|graphify-out|dist|target|\.backup)$/.test(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, depth + 1)
    else if (entry.name.endsWith('.md')) files.push(full)
  }
}
walk(path.join(WORKSPACE, 'docs'))
for (const name of fs.readdirSync(WORKSPACE)) {
  if (name.endsWith('.md')) files.push(path.join(WORKSPACE, name))
}

const broken = []
let checked = 0
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  // [label](target) — target up to the first space (markdown titles) or closing paren.
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    let target = m[1]
    if (/^(https?:|mailto:|#|tel:)/i.test(target)) continue
    target = target.split('#')[0]
    if (!target) continue
    checked++
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target))
    if (!fs.existsSync(resolved)) {
      broken.push({ file: path.relative(WORKSPACE, file), target, line: text.slice(0, m.index).split('\n').length })
    }
  }
}

console.log(`${files.length} markdown file(s) · ${checked} relative link(s) checked\n`)
if (!broken.length) {
  console.log('every relative link resolves')
  process.exit(0)
}

const byFile = new Map()
for (const b of broken) {
  if (!byFile.has(b.file)) byFile.set(b.file, [])
  byFile.get(b.file).push(b)
}

// --fix repairs ONLY the unambiguous case: the link's basename starts with a 4-digit register id
// (an issue or a decision), and exactly ONE file in the target directory carries that id. That is
// the shape every failure so far has taken — the id was right, the slug was guessed — so the repair
// is a rename lookup, not a judgement call. Anything ambiguous is listed and left alone.
if (process.argv.includes('--fix')) {
  const STAMP = new Date().toISOString().replace(/[:.]/g, '-')
  const BACKUP = path.join(WORKSPACE, 'docs/.backup', `doc-links-${STAMP}`)
  const indexOf = new Map()
  const dirIndex = (dir) => {
    if (!indexOf.has(dir)) {
      const byId = new Map()
      if (fs.existsSync(dir)) {
        for (const name of fs.readdirSync(dir)) {
          const id = (name.match(/^(\d{4})-/) || [])[1]
          if (!id || !name.endsWith('.md')) continue
          if (!byId.has(id)) byId.set(id, [])
          byId.get(id).push(name)
        }
      }
      indexOf.set(dir, byId)
    }
    return indexOf.get(dir)
  }

  let fixed = 0
  const unfixable = []
  for (const [file, list] of byFile.entries()) {
    const full = path.join(WORKSPACE, file)
    let text = fs.readFileSync(full, 'utf8')
    const original = text
    for (const b of list) {
      const dir = path.resolve(path.dirname(full), path.dirname(b.target))
      const id = (path.basename(b.target).match(/^(\d{4})-/) || [])[1]
      const candidates = id ? dirIndex(dir).get(id) || [] : []
      if (candidates.length !== 1) {
        unfixable.push(`${file} -> ${b.target} (${!id ? 'no register id' : `${candidates.length} candidates`})`)
        continue
      }
      const replacement = path.posix.join(path.dirname(b.target), candidates[0])
      text = text.split(b.target).join(replacement)
      fixed++
    }
    if (text !== original) {
      fs.mkdirSync(BACKUP, { recursive: true })
      fs.writeFileSync(path.join(BACKUP, file.replace(/[\\/]/g, '__')), original)
      fs.writeFileSync(full, text)
    }
  }
  console.log(`\nrepaired ${fixed} link(s) by register id · backups in docs/.backup/doc-links-${STAMP}`)
  if (unfixable.length) {
    console.log(`\n${unfixable.length} left for a human (ambiguous or no id):`)
    for (const u of unfixable) console.log(`  ${u}`)
  }
  process.exit(0)
}
for (const [file, list] of [...byFile.entries()].sort()) {
  console.log(`${file}`)
  for (const b of list) console.log(`  line ${b.line}: ${b.target}`)
}
console.log(`\n${broken.length} broken link(s) in ${byFile.size} file(s)`)
process.exit(1)
