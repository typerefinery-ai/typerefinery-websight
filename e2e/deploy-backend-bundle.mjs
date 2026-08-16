/**
 * decision 0044 Option 1 (DECIDED) — the bundle-only deploy, as one verifiable command.
 *
 * The decision is made and the path is rehearsed; what it left behind was a **six-step runbook with
 * a trap in the middle**, written in prose. This is that runbook, executable:
 *
 *   1. build the backend bundle
 *   2. POST the jar to Felix  /system/console/bundles/<id>   action=update
 *   3. POST /system/console/fsclassloader  clear=true
 *   4. STOP then START the Sightly engine bundle (org.apache.sling.scripting.sightly)
 *   5. verify a RENDERED marker — not just the served .js
 *   6. report
 *
 * ⚠️ Step 4 is the trap the rehearsal existed to find (0044 §2026-08-16, finding 4): after a bundle
 * update the clientlib JS refreshes immediately, but **compiled HTL does not**. Clearing
 * `fsclassloader` alone does not fix it, and a `refresh` of the Sightly bundle does not either — only
 * a full stop/start does, because bundle resources report an unchanging lastModified so the engine
 * never recompiles on its own. Deploying without step 4 leaves pages rendering the OLD templates
 * while every served script looks new, which is the most convincing kind of wrong.
 *
 * ⚠️ Step 5 exists because "the bundle is Active" is not evidence a user sees the change — the same
 * presence-vs-quality trap as docs/issues/0048. The marker must be read out of a RENDERED page.
 *
 * ⚠️ The CMS has stalled silently inside Felix twice in one day (docs/issues/0180 hazard-2), so this
 * defaults to a DRY RUN that only reports what it would do and proves the console is reachable.
 *
 * ✅ **This deploy CANNOT lose authored content — verified 2026-08-16, and worth stating because the
 * workspace's standing hazard "a CMS redeploy REGRESSES" sounds like it applies here.** It does not:
 * that hazard is about the **content package** (`autoInstallPackage`), which is 53 form fixes and 16
 * forms of labels behind live (0144/0150). Inspected the built bundle itself:
 *
 *     Bundle-SymbolicName:     typerefinery-backend
 *     Sling-Bundle-Resources:  /apps/typerefinery,/apps/wcm/dialogs/components/
 *     Sling-Initial-Content:   (absent)
 *     SLING-INF entries:       0
 *
 * So it replaces `/apps` component code and Java classes and never writes `/content` — authored
 * labels, group boxes, read-only fields and component properties all survive it. ⚠️ The corollary is
 * the real caution: anything hand-edited **under `/apps`** on the running instance IS overwritten,
 * because `/apps/typerefinery` is exactly what the bundle ships.
 * Pass --apply to deploy, and prefer doing that with a human watching, per 0044's own gate.
 *
 *     node e2e/deploy-backend-bundle.mjs                 # dry run: probe + plan, changes nothing
 *     node e2e/deploy-backend-bundle.mjs --apply         # execute the runbook
 *     node e2e/deploy-backend-bundle.mjs --apply --skip-build   # reuse the jar already built
 */
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(__dirname, '..')
const CONSOLE = process.env.FELIX_BASE || 'http://localhost:8113/system/console'
const AUTH = 'Basic ' + Buffer.from(`${process.env.CMS_USER || 'wsadmin'}:${process.env.CMS_PASS || 'wsadmin'}`).toString('base64')
const APPLY = process.argv.includes('--apply')
const SKIP_BUILD = process.argv.includes('--skip-build')

// The rendered marker: a page the Acts actually open, and a string that only the current templates
// produce. Both are overridable so this does not rot into a single hardcoded assertion.
const MARKER_URL =
  process.env.MARKER_URL ||
  'http://localhost:8113/content/typerefinery-showcase/pages/os-triage/pages/incidents.html'
const MARKER = process.env.MARKER || 'data-actionType'

const say = (s) => console.log(s)
const post = async (url, body) =>
  fetch(url, {
    method: 'POST',
    headers: { Authorization: AUTH, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  })

// ---- 0. locate the bundle by SYMBOLIC NAME, never by the id in the runbook -----------------------
// 0044's prose says "bundle 139" and "bundle 129". Ids are assigned per install and WILL differ on
// another machine or after a reinstall — deploying to the wrong id is how you update something else.
const list = await fetch(`${CONSOLE}/bundles.json`, { headers: { Authorization: AUTH } })
if (!list.ok) {
  say(`❌ Felix console not reachable: ${CONSOLE}/bundles.json -> ${list.status}`)
  say('   Is the CMS up? (docs/issues/0180 — the manager must be running detached)')
  process.exit(1)
}
const bundles = (await list.json()).data || []
const find = (needle) => bundles.filter((b) => (b.symbolicName || '').includes(needle))
// Exact symbolic name: `typerefinery` alone also matches `typerefinery-frontend`, and the runbook
// updates the BACKEND. The first run of this script hit that and refused to guess, which is the
// behaviour we want — but the right answer is to be specific, not to make the guard looser.
const backend = bundles.filter((b) => (b.symbolicName || '') === (process.env.BACKEND_BSN || 'typerefinery-backend'))
const sightly = find('org.apache.sling.scripting.sightly').filter((b) => !/compiler|runtime|js/.test(b.symbolicName))

say(`Felix console: ${CONSOLE} · ${bundles.length} bundles`)
say(`  backend candidates: ${backend.map((b) => `${b.id} ${b.symbolicName} [${b.state}]`).join(' · ') || '(none)'}`)
say(`  sightly engine    : ${sightly.map((b) => `${b.id} ${b.symbolicName} [${b.state}]`).join(' · ') || '(none)'}`)

if (backend.length !== 1 || sightly.length !== 1) {
  say('\n❌ could not identify exactly one backend bundle and one Sightly engine bundle by symbolic name.')
  say('   Refusing to guess an id — 0044 records the ids as 139/129 on ONE machine, and they are not stable.')
  process.exit(1)
}
const BACKEND_ID = backend[0].id
const SIGHTLY_ID = sightly[0].id

const JAR = path.join(REPO, 'application/backend/target')
const jarName = fs.existsSync(JAR) ? fs.readdirSync(JAR).filter((f) => /\.jar$/.test(f) && !/sources|javadoc/.test(f))[0] : null
say(`\nplan:`)
say(`  1. build            ${SKIP_BUILD ? '(skipped)' : 'mvnw -pl application/backend -am clean install -DskipTests'}`)
say(`  2. update bundle    ${BACKEND_ID} (${backend[0].symbolicName})  jar: ${jarName || '(not built yet)'}`)
say(`  3. fsclassloader    clear=true`)
say(`  4. sightly engine   stop + start bundle ${SIGHTLY_ID}   <-- the step without which HTL stays stale`)
say(`  5. verify marker    ${JSON.stringify(MARKER)} in ${MARKER_URL}`)

// Read the marker BEFORE, so "it is present after" cannot pass on a page that already had it.
const before = await fetch(MARKER_URL, { headers: { Authorization: AUTH } })
const beforeHtml = before.ok ? await before.text() : ''
const markerAlreadyThere = beforeHtml.includes(MARKER)
say(`\nmarker before deploy: ${markerAlreadyThere ? 'PRESENT' : 'absent'} (page http ${before.status})`)

// ⚠️ A marker that is ALREADY present cannot prove the deploy refreshed anything — step 5 would pass
// on a stale page, which is precisely the failure step 5 exists to catch (docs/issues/0048's
// presence-vs-quality trap, and 0044 finding 4's "every served script looked new while the HTML was
// old"). Refuse to pretend otherwise: the operator must name a marker the NEW bundle introduces.
if (markerAlreadyThere) {
  say('\n⚠️ THIS MARKER CANNOT VERIFY THIS DEPLOY — it is already in the page, so step 5 would pass')
  say('   whether or not the templates refreshed. Choose a string the NEW bundle introduces:')
  say('     MARKER="<new string>" MARKER_URL="<page that will render it>" node e2e/deploy-backend-bundle.mjs --apply')
  say('   If this deploy changes only clientlib JS and no HTL, say so explicitly with --allow-weak-marker')
  say('   (step 4 still runs — stale HTL is not worth risking to save 20 seconds).')
}

if (!APPLY) {
  say('\ndry run — console reachable, bundles identified, nothing changed. Re-run with --apply.')
  say('⚠️ 0044 gates the FIRST run on a human watching; the CMS has stalled silently in Felix twice (0180).')
  process.exit(0)
}

if (markerAlreadyThere && !process.argv.includes('--allow-weak-marker')) {
  say('\n❌ refusing to deploy with a marker that cannot verify it. See the note above.')
  process.exit(1)
}

// ---- 1. build ------------------------------------------------------------------------------------
if (!SKIP_BUILD) {
  say('\n[1/5] building backend bundle …')
  execSync(`"${path.join(REPO, 'mvnw.cmd')}" -pl application/backend -am clean install -DskipTests`, {
    cwd: REPO,
    stdio: 'inherit',
  })
}
const jar = fs.readdirSync(JAR).filter((f) => /\.jar$/.test(f) && !/sources|javadoc/.test(f))[0]
if (!jar) {
  say('❌ no jar in application/backend/target after build')
  process.exit(1)
}
const jarPath = path.join(JAR, jar)
say(`      jar: ${jar} (${(fs.statSync(jarPath).size / 1024 / 1024).toFixed(1)} MB)`)

// ---- 2. update the bundle ------------------------------------------------------------------------
say(`\n[2/5] updating bundle ${BACKEND_ID} …`)
const form = new FormData()
form.append('action', 'update')
form.append('bundlefile', new Blob([fs.readFileSync(jarPath)]), jar)
const upd = await fetch(`${CONSOLE}/bundles/${BACKEND_ID}`, { method: 'POST', headers: { Authorization: AUTH }, body: form })
say(`      -> ${upd.status}`)
if (!upd.ok) process.exit(1)

// ---- 3. clear the compiled-script cache ----------------------------------------------------------
say('\n[3/5] clearing fsclassloader …')
say(`      -> ${(await post(`${CONSOLE}/fsclassloader`, { clear: 'true' })).status}`)

// ---- 4. stop/start the Sightly engine (the step the rehearsal existed to find) --------------------
say(`\n[4/5] stop/start Sightly engine bundle ${SIGHTLY_ID} …`)
say(`      stop  -> ${(await post(`${CONSOLE}/bundles/${SIGHTLY_ID}`, { action: 'stop' })).status}`)
await new Promise((r) => setTimeout(r, 3000))
say(`      start -> ${(await post(`${CONSOLE}/bundles/${SIGHTLY_ID}`, { action: 'start' })).status}`)
await new Promise((r) => setTimeout(r, 5000))

// ---- 5. verify a RENDERED marker ------------------------------------------------------------------
say('\n[5/5] verifying the rendered marker …')
let ok = false
for (let waited = 0; waited < 60_000; waited += 3_000) {
  const res = await fetch(MARKER_URL, { headers: { Authorization: AUTH } })
  const html = res.ok ? await res.text() : ''
  if (html.includes(MARKER)) {
    ok = true
    say(`      ✅ ${JSON.stringify(MARKER)} present in the rendered page after ${waited / 1000}s`)
    break
  }
  await new Promise((r) => setTimeout(r, 3000))
}
if (!ok) {
  say(`      ❌ marker still absent after 60s — HTL may still be stale. Check bundle ${SIGHTLY_ID} state`)
  say('         and re-read decision 0044 finding 4 before concluding the deploy worked.')
  process.exit(1)
}

const after = await fetch(`${CONSOLE}/bundles.json`, { headers: { Authorization: AUTH } })
const states = ((await after.json()).data || []).filter((b) => [BACKEND_ID, SIGHTLY_ID].includes(b.id))
say(`\nbundle states: ${states.map((b) => `${b.id} ${b.state}`).join(' · ')}`)
say('\n✅ deploy complete. NEXT, per 0044: run the four headed walks and the per-issue post-deploy verifications.')
