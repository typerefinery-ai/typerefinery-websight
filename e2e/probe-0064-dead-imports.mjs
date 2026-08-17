/**
 * docs/issues/0064 Option 2a — which algorithms carry a dead `stixorm` import?
 *
 * ~700 ms of every ~830 ms `/viz-data/*` call is `stixorm.module.*` import paid fresh per request.
 * Removing it where it is unused is most of the win. Proven on four routes now.
 *
 * ⚠️ 0064 insists this be decided **empirically, not by static analysis** — its own example is `parse`,
 * shadowed by a local parameter, which a reader or a linter calls "used" when the stixorm one is not.
 * So this reports the evidence and does NOT decide: for each algorithm it lists the stixorm imports,
 * every symbol they bind, how many times each symbol is read, and whether the module has any dynamic
 * name lookup that would make the counts meaningless.
 *
 * A symbol read only by its own assignment is a CANDIDATE, not a verdict — the verdict comes from
 * removing it, re-running the route and comparing payloads with `compare-vizdata-payload.mjs`.
 *
 *     node e2e/probe-0064-dead-imports.mjs [flowId]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = path.resolve(__dirname, '..', '..')
const SRC = path.join(WORKSPACE, 'typerefinery/services/totaljs-flow/database/demo/database.json')
const ONLY = process.argv[2]

const db = JSON.parse(fs.readFileSync(SRC, 'utf8'))
const flows = Array.isArray(db) ? db : (db.flows || Object.values(db))

/** The route component serves a RELATIVE /viz-data url; the fetch component uses an absolute one. */
const ROUTE_COMPONENT = 'cfbhsf66dd'
const DYNAMIC = ['globals(', 'locals(', 'eval(', 'exec(', '__import__', 'getattr(']

for (const f of flows) {
  const fid = f.id || f.reference
  if (ONLY && fid !== ONLY) continue
  const design = f.design || {}
  const route = Object.entries(design).find(([, n]) =>
    n.component === ROUTE_COMPONENT && typeof n.config?.url === 'string' && n.config.url.startsWith('/viz-data/'))
  if (!route) continue

  const algos = Object.entries(design).filter(([, n]) => typeof n.config?.algorithm === 'string')
  if (!algos.length) continue

  console.log(`\n=== ${route[1].config.url}  (${fid}, ${Object.keys(design).length} nodes) ===`)
  for (const [nid, n] of algos) {
    const alg = n.config.algorithm
    const lines = alg.split('\n')
    const stixImports = lines
      .map((l, i) => ({ i: i + 1, l: l.trim() }))
      .filter((x) => /^(from|import)\s+stixorm\b/.test(x.l))
    const dynamic = DYNAMIC.filter((d) => alg.includes(d))

    console.log(`  ${nid} (${n.component}) — ${lines.length} lines, ${stixImports.length} stixorm import(s)` +
      (dynamic.length ? `  ⚠️ dynamic lookup: ${dynamic.join(' ')}` : ''))

    for (const s of stixImports) {
      // Symbols this import binds: `from X import a, b` -> a,b ; `import X.Y` -> X
      //
      // ⚠️ Python allows a PARENTHESISED multi-line import:
      //     from stixorm.module.typedb_lib.instructions import (
      //         Result, Instructions, ...
      //     )
      // A first version read only the first physical line, took `(` as the symbol name, and then
      // reported "29 other references" for it — a count of every line containing a bracket. Gather
      // the continuation lines before splitting.
      let spec = s.l.replace(/^from\s+\S+\s+import\s+/, '').replace(/^import\s+/, '')
      if (/\($/.test(spec) || (spec.includes('(') && !spec.includes(')'))) {
        spec = spec.replace(/\(/, '')
        for (let k = s.i; k < lines.length; k++) {
          spec += ' ' + lines[k]
          if (lines[k].includes(')')) break
        }
        spec = spec.replace(/\)/g, '')
      }
      const m = /^from\s/.test(s.l)
      const symbols = m
        ? spec.split(',').map((x) => x.trim().split(/\s+as\s+/).pop().trim()).filter((x) => /^[A-Za-z_]\w*$/.test(x))
        : [spec.split('.')[0].trim()]
      for (const sym of symbols) {
        const re = new RegExp(`\\b${sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
        const uses = lines.filter((l, i) => i + 1 !== s.i && re.test(l))
        console.log(`     line ${String(s.i).padStart(4)}  ${sym}: ${uses.length} other reference(s)`)
        for (const u of uses.slice(0, 3)) console.log(`             ${u.trim().slice(0, 96)}`)
        // A binding used only to assign something that is itself never read is the shape that was
        // dead on unattached-split.
        for (const u of uses) {
          const asg = /^\s*([A-Za-z_]\w*)\s*=\s*[^=]/.exec(u)
          if (!asg) continue
          const target = asg[1]
          const tre = new RegExp(`\\b${target}\\b`, 'g')
          const tUses = lines.filter((l) => tre.test(l)).length
          if (tUses <= 1) console.log(`             🔎 assigns ${target}, which is referenced ${tUses}× — CANDIDATE`)
        }
      }
    }
  }
}
console.log('\nCandidates are evidence, not verdicts. Remove, re-run the route, and compare with')
console.log('compare-vizdata-payload.mjs before believing it (docs/issues/0064: decide it empirically).')
