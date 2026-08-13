import { expect, request } from '@playwright/test'
import { step, test, observe } from '../runsheet'
import { FLOW_BASE, SHOWCASE } from '../playwright.config'

/** Act 1 — the "All Incidents" table. Runsheet Act 1 / docs/issues/0005. */

const INCIDENTS = `${SHOWCASE}/pages/incidents.html`

/**
 * The "+ Create" dropdown's entries, scoped so they cannot be confused with the sidebar.
 *
 * The menu renders as `DIV.dropdown-menu.dropdownMenu` (gaining `.show` when open) containing
 * `DIV.dropdown-item` entries — Incident · Note · Artifact · Task. The left sidebar *also* has an
 * item reading "Incident" (`LI.list-group-item`, in the nav list Artifacts · Dashboard · Incidents
 * · Incident · Notes · Options · Tags · Tasks), and it is **always visible**.
 *
 * A bare `getByText(/^\s*Incident\s*$/i)` therefore matched the sidebar, which broke these steps in
 * two different ways:
 *   - **P1-S4/S5/S6** clicked the sidebar link and navigated away instead of opening the modal.
 *   - **P1-S3** asserted "the dropdown item is visible" against the sidebar item, so it **passed
 *     vacuously** — it never demonstrated that the dropdown opened at all.
 *
 * Earlier attempts to scope by container looked for `a, li, button` children and found nothing:
 * the entries are `DIV`s.
 */
const dropdownItem = (page: any, label: RegExp) =>
  page.locator('.dropdown-menu .dropdown-item').filter({ hasText: label }).first()

/**
 * The Create Incident form's frame, scoped **by src**.
 *
 * These steps used `frameLocator('iframe').first()`, which held only while the incidents table
 * rendered nothing. Once the table paints rows (docs/issues/0029, fixed 2026-08-04) the page
 * carries an earlier, empty iframe, so `.first()` selects that instead and the steps time out
 * looking for form fields that are in the *second* frame. Observed order after the fix:
 *
 *   iframes: ["", ".../os-triage/forms/createincident.html"]
 *
 * Naming the frame keeps the step honest whatever else the page grows. Same class of harness
 * fragility as docs/issues/0043 — a locator that only worked because the page was empty.
 */
const createIncidentFrame = (page: any) =>
  page.frameLocator('iframe[src*="createincident"]').first()

/**
 * Submit an item modal. Its buttons ("Cancel" / "Save Changes") live on the **modal chrome in the
 * host page**, not inside the form iframe — the same arrangement the composer's modals use. The
 * frame is kept as a fallback for any form that renders its own submit.
 */
async function submitModal(page: any, frame: any) {
  const pageButton = page.getByRole('button', { name: /save changes|^save$|^create$/i }).first()
  if (await pageButton.count()) {
    await pageButton.click()
    return
  }
  await frame.getByRole('button', { name: /save|create/i }).first().click()
}

/** The table paints its rows asynchronously over TMS; give it room before asserting. */
async function openIncidents(page: any) {
  await page.goto(INCIDENTS, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(5_000)
}

test.describe('Act 1 — All Incidents table', () => {
  /**
   * Act 1 is **destructive**: P1-S5 and P1-S6 each create an incident, and the create API resets
   * the current incident to the new (empty) one. Acts 2 and 3 are data-gated on that incident, so
   * running the full suite in order silently starved them — Promo/Scratch came back with 0 nodes
   * and three genuinely-passing Composer steps reported red. That is the runsheet's R-1 hazard,
   * and it cost a false "regression" hunt.
   *
   * Restore whatever was current before this act, so suite order stops mattering.
   */
  let previousIncident: any = null

  test.beforeAll(async ({ request }) => {
    const res = await request.get(`${FLOW_BASE}/viz-data/overview-default-incident`).catch(() => null)
    const payload = res ? await res.json().catch(() => null) : null
    const incidentNode = (payload?.nodes || []).find((n: any) => n?.original?.type === 'incident')
    previousIncident = incidentNode || null
    if (!previousIncident) console.warn('Act 1: could not identify the current incident; skipping restore')
  })

  test.afterAll(async ({ request }) => {
    if (!previousIncident) return
    const res = await request
      .post(`${FLOW_BASE}/os-triage/incident-context/set-current`, { data: previousIncident })
      .catch(() => null)
    console.log(`Act 1 teardown: restored current incident -> ${previousIncident?.id} (${res?.status()})`)
  })

  step('P1-S1', async ({ page }) => {
    await openIncidents(page)

    const rows = page.locator('table tbody tr')
    await expect
      .poll(async () => await rows.count(), { timeout: 60_000, message: 'incident rows rendered' })
      .toBeGreaterThan(0)

    // Guards docs/issues/0025 — the whole page used to stack ~900px below the fold.
    //
    // Measure the table that actually holds the rows. Bootstrap-table renders **two** `table`
    // elements: a hidden header clone (no layout box, 0 rows) and the real body table. Taking
    // `.first()` picked the clone and asserted `not.toBeNull()` against it, which only passed
    // while the table was empty and the clone was the only one. Observed 2026-08-04:
    //   table[0] box=null rows=0   ·   table[1] 1284x1947 y=228 rows=24
    const box = await page.locator('table:has(tbody tr)').first().boundingBox()
    expect(box, 'table has a layout box').not.toBeNull()
    expect(box!.y, 'table is above the fold').toBeLessThan(1000)

    // The row promises six things; only "rows render" and "above the fold" were asserted
    // (docs/issues/0048, Tier 2). The rest are cheap to check, so check them.
    // docs/issues/0116 — the docx asks for eight Act-1 columns
    // (ID · Name · Author · Tags · Status · Observed · Created · Tasks). Delivered so far:
    //   Created  2026-08-12 — `original.created`, stored on every incident
    //   Status   2026-08-12 — extensions[<os-threat>].investigation_status
    //   Observed 2026-08-12 — count of `observed-data--` ids in other_object_refs
    //   Tasks    2026-08-12 — count of task_refs
    // ❌ Author (`created_by_ref`) and Tags (`labels`) are empty on EVERY row and need decision
    // 0031's write-path change; they are deliberately absent rather than shown blank.
    //
    // Asserting the exact list (rather than "contains") is deliberate: it is what caught this change
    // immediately, and it will catch the next column arriving without its runsheet row.
    // ⚠️ 2026-08-12 — aligned to the docx mockup (`docs/mini-app-source/image2.png`), read directly
    // rather than via a summary of it. The design's header row is
    //     ID | Name | Author | Tags | Status | Observed | Created | Tasks
    // so `Type` and `Description` were dropped: neither is in the design, `Type` read
    // "Extended-Incident" on every row, and since the 0138 dataset reset `Description` is empty on
    // both curated incidents. Author and Tags stay out until they have data (docs/issues/0145).
    // `Action` is not in the mockup either, but it carries the Open button P1-S7 drives — removing
    // working navigation to match a picture would be the wrong trade (docs/issues/0123).
    expect(await page.locator('thead th').allInnerTexts().then((h) => h.map((s) => s.trim()).filter(Boolean)),
      'the promised columns').toEqual(
      ['ID', 'Name', 'Status', 'Observed', 'Created', 'Tasks', 'Action'])

    const col = async (n: number) => await page.locator(`tbody tr td:nth-child(${n})`).allInnerTexts()

    // A column is only worth having if it carries data — a header over blank cells would satisfy the
    // assertion above (docs/issues/0048-class).
    const createdCells = await col(5)
    const dated = createdCells.filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.trim()))
    expect(dated.length, 'every row shows a YYYY-MM-DD Created date').toBe(createdCells.length)

    // ⚠️ Status / Observed / Tasks cannot use that shape. Measured 2026-08-12: only the **2 curated
    // incidents** carry an os-threat extension with any content — the other 190 are CMS-form
    // creations whose extension is an empty shell, so they legitimately read blank/0. Asserting
    // "every row" would fail against honest data; asserting nothing would let the columns go blank
    // unnoticed. Assert instead that the counts are numeric everywhere (never blank, never text) and
    // that the curated rows carry the real values the mockup promises.
    // Observed is column 4 and Tasks column 6 in the mockup order (ID·Name·Status·Observed·Created·Tasks).
    const counts = [...(await col(4)), ...(await col(6))]
    expect(counts.filter((t) => !/^\d+$/.test(t.trim())),
      'Observed and Tasks are numeric on every row (0 is a fact, blank is not)').toEqual([])

    const api2 = await request.newContext({ ignoreHTTPSErrors: true })
    const shapedRows = (await (await api2.get(`${FLOW_BASE}/viz-data/table-all-incidents-shaped`)).json()).data
    await api2.dispose()
    const curated = shapedRows.filter((r: any) => /phishing email/i.test(String(r.name ?? '')))
    expect(curated.length, 'the curated demo incidents are present').toBeGreaterThan(0)
    for (const r of curated) {
      expect(String(r.status), `curated incident "${r.name}" has a recorded status`).not.toBe('')
      expect(Number(r.tasks), `curated incident "${r.name}" reports its tasks`).toBeGreaterThan(0)
      expect(Number(r.observed), `curated incident "${r.name}" reports its observations`).toBeGreaterThan(0)
    }

    // ⚠️ The docs/issues/0115 guard ("no `->` or `<br>` plumbing in Description") is GONE with the
    // column. It is not lost coverage: the shaper still reads `original.description` rather than the
    // frozen display wrapper, and the rule it protected — never render another view's presentation
    // layer as text — now has no surface in this table. If Description ever returns, restore it.

    // ⚠️ The authored content sets `searchEnabled="false"`, which looked like the row's
    // "search box" claim being wrong. It is not: the flow payload carries `search: true`, and the
    // **payload wins** — a search box renders (verified 2026-08-04). Asserting it pins that
    // precedence, which is otherwise easy to break from either side.
    expect(await page.locator('input[type=search], .fixed-table-toolbar input').count(),
      'search box renders (payload search:true overrides authored searchEnabled:false)').toBeGreaterThan(0)

    // "per-row action buttons" — one Open button per row, which is also what P1-S7 drives.
    const rowCount = await rows.count()
    expect(await page.locator('tbody tr td button:has([title="Open"])').count(),
      'every row exposes an Open action').toBe(rowCount)

    // "one row per incident" — compare against the endpoint rather than trusting a non-zero count,
    // which would also pass on the duplicated rows of docs/issues/0023.
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    const shaped = await (await api.get(`${FLOW_BASE}/viz-data/table-all-incidents-shaped`)).json()
    await api.dispose()
    expect(rowCount, 'one row per incident returned by the endpoint').toBe((shaped.data || []).length)

    /**
     * **The TOOLBAR search filters the table** — decision 0032 Option 2's "P1-S1 assertion upgrade",
     * now that decision 0041 Option 2 made it work (`18e58098`).
     *
     * ⚠️ **Assert against the TOOLBAR control specifically, not "an input".** docs/issues/0110's own
     * testing criteria say so, and for a concrete reason: the page carries **two** search
     * affordances — the mockup's toolbar box (which was dead until today) and a separate
     * bootstrap-table filter box on the right **which already worked**. A loose locator would be
     * satisfied by the one that never needed fixing, and this assertion would pass while the feature
     * regressed.
     *
     * ⚠️ **The value must be COMMITTED, not typed.** The input emits on `change`, so typing alone
     * proves nothing — that was the third of the three mismatches this feature needed.
     *
     * The term is taken from live data rather than hardcoded, because the suite creates incidents as
     * it runs and a fixed string would match everything or nothing depending on run order.
     */
    const toolbarSearch = page.locator('input[name="case"], input[placeholder="Incident 1"]').first()
    if (await toolbarSearch.count()) {
      const firstName = (await page.locator('tbody tr td:nth-child(2)').first().innerText()).trim()
      const term = firstName.split(/\s+/).filter((w) => w.length > 3)[0]
      if (term) {
        await toolbarSearch.fill(term)
        await toolbarSearch.press('Enter')
        await page.waitForTimeout(2_000)
        const filtered = await rows.count()
        expect(filtered, `toolbar search on "${term}" filtered the table (was ${rowCount})`)
          .toBeLessThan(rowCount)
        expect(filtered, 'the filter kept the rows that match, rather than emptying the table')
          .toBeGreaterThan(0)

        // Reversible: clearing must bring the rows back, which also proves the first assertion was
        // filtering and not a table that simply broke.
        await toolbarSearch.fill('')
        await toolbarSearch.press('Enter')
        await page.waitForTimeout(2_000)
        expect(await rows.count(), 'clearing the toolbar search restores every row').toBe(rowCount)
      } else {
        observe(test.info(), 'note', 'no usable search term in the first row name; filter not asserted')
      }
    } else {
      observe(test.info(), 'note', 'toolbar search box absent — filter not asserted (say so, do not imply it passed)')
    }

    // Not a failure of this step, but this is where docs/issues/0027 shows itself:
    // in-app created incidents display the type label instead of their own name.
    const text = await rows.allInnerTexts()
    const mislabelled = text.filter((t) => t.includes('Incident Extension')).length
    if (mislabelled > 0) {
      observe(
        test.info(),
        'note',
        `docs/issues/0027 visible here — ${mislabelled}/${text.length} rows read "Incident Extension" instead of the incident name`,
      )
    }
  })

  step('P1-S2', async ({ page }) => {
    // The row's claim is "rows **live-update** over TMS **without a reload**". The old assertion
    // never triggered the flow — it checked that a `table_*` key existed and rows > 0, which says
    // nothing about updating (docs/issues/0048). Do the real thing: clear the rendered rows, trigger
    // the flow, and require them to come back **without navigating**.
    await openIncidents(page)
    const onLoad = await page.locator('tbody tr').count()
    expect(onLoad, 'rows render on load').toBeGreaterThan(0)

    await page.evaluate(() => document.querySelectorAll('tbody tr').forEach((r) => r.remove()))
    expect(await page.locator('tbody tr').count(), 'DOM cleared so a push is unambiguous').toBe(0)

    // Restarting the flow re-fires its senddata node, which now drives the live fetch chain
    // (senddata → fetchinc → maprows → TMS) rather than publishing a stale static payload — see
    // docs/issues/0005. Before that rewiring this push carried a 6-row July snapshot.
    await page.request.get(`${FLOW_BASE}/fapi/streams_restart/f210iy001bt51d/`).catch(() => {})

    await expect
      .poll(async () => await page.locator('tbody tr').count(), {
        timeout: 60_000,
        message: 'rows re-rendered over TMS without a reload',
      })
      .toBeGreaterThan(0)

    // docs/issues/0149 — the push must deliver the SAME TABLE, not just some rows.
    //
    // ⚠️ This table has two data paths, and they had silently diverged: the HTTP route served the
    // six mockup columns while the live push still sent `Name·Type·Description·ID`, so the table
    // reverted the moment anything pushed — on the opening screen, during the very live-update this
    // step demonstrates. Row count alone could not see it, and no other Act-1 step reads the push
    // path, so nothing caught it for four column additions.
    //
    // Compare the rendered header AFTER the push against the shaped route's own column list, so the
    // two definitions cannot drift apart again without this failing.
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    const shaped = await (await api.get(`${FLOW_BASE}/viz-data/table-all-incidents-shaped`)).json()
    await api.dispose()
    const expected = shaped.columns.map((c: any) => String(c.title))
    const rendered = (await page.locator('thead th').allInnerTexts())
      .map((s) => s.trim())
      .filter(Boolean)
    // `Action` is appended by the table component, not by the payload — compare the payload's share.
    expect(rendered.slice(0, expected.length),
      'the pushed payload carries the same columns as the shaped route (docs/issues/0149)')
      .toEqual(expected)

    // …and the payload must be current, not the old snapshot.
    const after = await page.locator('tbody tr').count()
    observe(test.info(), 'note', `TMS push re-rendered ${after} rows (on load: ${onLoad})`)
    expect(after, 'the TMS push carries the full current row set, not a stale snapshot')
      .toBeGreaterThanOrEqual(onLoad)
  })

  step('P1-S3', async ({ page }) => {
    await openIncidents(page)
    const create = page.getByRole('button', { name: /\+?\s*create/i }).first()
    await expect(create).toBeVisible({ timeout: 30_000 })
    await create.click()
    // The dropdown is attached after the button (docs/issues/0005 — it used to be built
    // with jQuery .add(), which never inserts into the DOM).
    //
    // The row claims **four** entries — Incident / Note / Artifact / Task — and only the first was
    // checked (docs/issues/0048, Tier 2). Assert the whole set: a dropdown that lost three of its
    // four items would otherwise pass.
    await expect(dropdownItem(page, /^\s*Incident\s*$/i)).toBeVisible({ timeout: 20_000 })
    const labels = (await page.locator('.dropdown-menu .dropdown-item').allInnerTexts())
      .map((t) => t.trim())
      .filter(Boolean)
    expect(labels, 'the dropdown offers Incident / Note / Artifact / Task')
      .toEqual(expect.arrayContaining(['Incident', 'Note', 'Artifact', 'Task']))

    // Only *Incident* is proven to work end to end (P1-S4/P1-S5). Record what the other three
    // actually open, so the demo's exposure here is measured rather than assumed.
    //
    // ⚠️ Do NOT try to answer this by inspecting the form pages standalone. Three cheaper checks
    // all gave the wrong answer: a regex for `type="submit"` reads false even for createincident;
    // `.infinity.json` truncates deep trees so authored buttons are missing; and counting rendered
    // buttons on the page misses the point entirely, because **"Save Changes" lives on the modal
    // chrome in the host page, not inside the form iframe** — as `submitModal` above documents.
    // The only honest oracle is opening the entry and looking at what appears.
    for (const label of ['Incident', 'Note', 'Artifact', 'Task']) {
      await openIncidents(page)
      await page.getByRole('button', { name: /\+?\s*create/i }).first().click()
      const item = dropdownItem(page, new RegExp(`^\\s*${label}\\s*$`, 'i'))
      if (!(await item.count())) {
        observe(test.info(), 'note', `"+ Create → ${label}": entry not found`)
        continue
      }
      await item.click()
      await page.waitForTimeout(4_000)
      const modal = page.locator('.modal, [role="dialog"]').filter({ hasNot: page.locator('.d-none') }).first()
      const opened = await modal.count()
      const save = await page.getByRole('button', { name: /save changes|^save$|^create$/i }).count()
      const src = await page
        .locator('.modal iframe, [role="dialog"] iframe')
        .first()
        .getAttribute('src')
        .catch(() => null)
      observe(
        test.info(),
        'note',
        `"+ Create → ${label}": modal=${opened ? 'yes' : 'no'}, save-affordance=${save}, form=${(src || '(none)').split('/').pop()}`,
      )
    }
  })

  step('P1-S4', async ({ page }) => {
    await openIncidents(page)
    await page.getByRole('button', { name: /\+?\s*create/i }).first().click()
    await dropdownItem(page, /^\s*Incident\s*$/i).click()

    const frame = createIncidentFrame(page)
    await expect(frame.locator('input, select, textarea').first()).toBeVisible({ timeout: 60_000 })
    const fields = await frame.locator('input, select, textarea').count()
    expect(fields, 'Create Incident form fields').toBeGreaterThan(5)

    /**
     * docs/issues/0048, Tier 2 "partial claim" — this step asserted `fields > 5` where the row
     * promises *"a **blank** Create Incident form (~21 inputs: Name, Date, Severity, TLP, PAP…)"*.
     * Two thirds of that claim went untested: **which** fields, and **blank**.
     *
     * The names are measured from the authored form, not transcribed from the row's prose:
     * `incidenttitle · casedate · severity · tlp · pap · casetitle · selecttags · choosetags`.
     */
    for (const field of ['incidenttitle', 'casedate', 'severity', 'tlp', 'pap']) {
      await expect(
        frame.locator(`[name="${field}"]`).first(),
        `the row names this field — "${field}" is present`,
      ).toHaveCount(1, { timeout: 20_000 })
    }

    /**
     * 🔑 **"Blank" is the half worth having, because it is the half that has broken before.**
     * docs/issues/0156: every Create form silently set `identity_class`, `roles` and `sectors` from
     * the **first vocabulary entry**, so an identity created with only a name was stored as working
     * in *agriculture* — chosen by nobody. `severity`, `tlp` and `pap` here are vocabulary selects of
     * exactly that shape, and an incident that arrives pre-set to a severity nobody chose is a
     * worse version of the same bug: it is the first object a presenter creates on stage.
     *
     * Read the **runtime** values, not the markup — 0156's fabrication was invisible in the served
     * HTML (no `value` attribute is authored; Choices.js selects the first option at runtime).
     *
     * ⚠️ **"Blank" means a different thing for a radio than for a text box, and conflating them
     * produces a false alarm.** The first cut of this assertion read `.value` on every input and went
     * red on **12 fields** — which looked exactly like 0156 reaching Act 1. It was not: `severity`,
     * `tlp` and `pap` are **radio groups**, and a radio's `.value` is its own option value, present by
     * construction whether or not anything is selected. Measured: 12 checkable inputs, **0 checked**,
     * and every text field genuinely empty. The form was right and the assertion was wrong.
     *
     * So ask each control the question that can actually distinguish chosen from unchosen:
     * **checkables → is anything CHECKED; everything else → is the value EMPTY.**
     */
    const state = await frame.locator('input, select, textarea').evaluateAll((els: any[]) => {
      const visible = els.filter(
        (e) => e.type !== 'hidden' && !String(e.className).includes('choices__input'),
      )
      const isCheckable = (e: any) => e.type === 'radio' || e.type === 'checkbox'
      return {
        checked: visible
          .filter((e) => isCheckable(e) && e.checked)
          .map((e) => `${e.getAttribute('name') || '?'}="${e.value}"`),
        valued: visible
          .filter((e) => !isCheckable(e))
          .map((e) => ({ name: e.getAttribute('name') || '?', value: String(e.value ?? '').trim() }))
          .filter((f) => f.value !== '' && f.value !== '{}')
          .map((f) => `${f.name}="${f.value}"`),
      }
    })
    observe(
      test.info(),
      'note',
      `Create Incident on open — checked: ${state.checked.join(' · ') || '(none)'} | valued: ${state.valued.join(' · ') || '(none)'}`,
    )
    expect(
      state.checked,
      'the row says the form opens BLANK — no severity/TLP/PAP may be pre-selected for the user (docs/issues/0156)',
    ).toEqual([])
    expect(
      state.valued,
      'the row says the form opens BLANK — no text field may arrive carrying a value',
    ).toEqual([])
  })

  step('P1-S5', async ({ page }) => {
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    const before = await (await api.get(`${FLOW_BASE}/viz-data/table-all-incidents`)).json()

    await openIncidents(page)
    await page.getByRole('button', { name: /\+?\s*create/i }).first().click()
    await dropdownItem(page, /^\s*Incident\s*$/i).click()

    const frame = createIncidentFrame(page)
    // The Create Incident form's title field is **`incidenttitle`**, not `name` — the flow's
    // mapform node reads `form.incidenttitle` and falls back to "Untitled Incident" without it
    // (docs/flows/createincident-form-flow-f210ot001bt51d.json). Kept tolerant of the trailing
    // space seen on other authored field names (docs/issues/0013).
    const name = frame
      .locator('input[name="incidenttitle"], input[name="incidenttitle "], input[name="name"], input[name="name "]')
      .first()
    await expect(name).toBeVisible({ timeout: 60_000 })
    const incidentName = `Runsheet probe ${new Date().toISOString().slice(11, 19)}`
    await name.click()
    await name.pressSequentially(incidentName, { delay: 20 })

    // decision 0031 (Option 1) — the form's tags and TLP are now stored as STRUCTURED STIX rather
    // than concatenated into `description`. Fill them here so the assertion below has something to
    // check; both are optional on the form, so a build without them still passes the rest.
    const tagsField = frame.locator('input[name="casetitle"], input[name="casetitle "]').first()
    const filledTags = await tagsField.isVisible().catch(() => false)
    if (filledTags) {
      await tagsField.click()
      await tagsField.pressSequentially('phishing, urgent', { delay: 15 })
    }
    // ⚠️ TLP is a RADIO GROUP (four inputs all named `tlp`, labelled White/Green/Amber/Red), not a
    // select — read from the authored form, after a `select[name="tlp"]` locator silently matched
    // nothing and skipped this assertion entirely. Same for `severity` and `pap`.
    const tlpRadios = frame.locator('input[name="tlp"], input[name="tlp "]')
    let filledTlp = false
    const tlpCount = await tlpRadios.count()
    for (let i = 0; i < tlpCount; i++) {
      const v = await tlpRadios.nth(i).getAttribute('value')
      if (/amber/i.test(v ?? '')) {
        await tlpRadios.nth(i).click({ force: true }).catch(() => {})
        filledTlp = true
        break
      }
    }
    if (!filledTlp && tlpCount) {
      await tlpRadios.first().click({ force: true }).catch(() => {})
      filledTlp = true
    }
    observe(test.info(), 'note', `0031 fields filled — tags:${filledTags} tlp:${filledTlp}`)

    // "Save Changes" belongs to the **modal chrome on the host page**, not to the form iframe —
    // the same arrangement as the composer's modals. Try the page first, fall back to the frame.
    await submitModal(page, frame)
    // The create leg is fire-and-forget; poll the endpoint rather than the UI.
    //
    // ⚠️ A growing count alone is a weak signal: the documented `incidenttitle` mapping failure
    // writes "Untitled Incident" and *still* grows the count, so this passed whether or not the
    // typed name landed (docs/issues/0048, Tier 2). Poll for **the name we typed**.
    await expect
      .poll(
        async () => {
          const rows = await (await api.get(`${FLOW_BASE}/viz-data/table-all-incidents`)).json()
          return JSON.stringify(rows).includes(incidentName) ? 'found' : `${rows.length} rows, incidentName absent`
        },
        { timeout: 90_000, message: `the incident named "${incidentName}" was created (not "Untitled Incident")` },
      )
      .toBe('found')

    // …and the row's second claim: the create **resets the default incident**. R-1 in the runsheet
    // exists precisely because this side effect is real and destructive, yet it was never asserted.
    await expect
      .poll(
        async () => {
          const res = await api.get(`${FLOW_BASE}/viz-data/overview-default-incident`, { timeout: 60_000 })
          return res.ok() ? JSON.stringify(await res.json()).includes(incidentName) : false
        },
        { timeout: 90_000, message: 'the newly created incident became the default (the R-1 hazard)' },
      )
      .toBe(true)

    // decision 0031 (Option 1) — the values the STANDARD settles must now be stored as STIX, not
    // concatenated into prose. ⚠️ Guarded here because the failure mode is invisible: adding a
    // property the class does not accept makes the algorithm crash behind an HTTP 200
    // (docs/issues/0142, docs/issues/0093), so the incident would simply not appear — and the
    // "was it created" poll above would already have failed, but with no hint of the cause.
    const created = (await (await api.get(`${FLOW_BASE}/viz-data/table-all-incidents`)).json())
      .find((r: any) => String(r.name ?? '').includes(incidentName))
    expect(created, 'the created incident is readable back').toBeTruthy()
    const stix = created.original ?? {}
    observe(test.info(), 'note',
      `0031 stored — labels:${JSON.stringify(stix.labels)} markings:${JSON.stringify(stix.object_marking_refs)}`)

    if (filledTags) {
      expect(stix.labels, 'tags are stored as core STIX `labels`, not in the description')
        .toEqual(expect.arrayContaining(['phishing', 'urgent']))
      expect(String(stix.description ?? ''), 'tags no longer duplicated into the description')
        .not.toContain('tags=')
    }
    if (filledTlp) {
      // The TLP marking-definition ids are FIXED by STIX 2.1, so this is a lookup, not a convention.
      expect(String(JSON.stringify(stix.object_marking_refs ?? [])),
        'TLP is stored as an object_marking_refs marking-definition')
        .toMatch(/marking-definition--/)
      expect(String(stix.description ?? ''), 'TLP no longer duplicated into the description')
        .not.toContain('tlp=')
    }
    // ⬜ severity / pap / casedate deliberately REMAIN in the description — decision 0031 leaves
    // them unmapped (pap is not core STIX; casedate's meaning is an open question to the owner; and
    // severity's home, `IncidentCoreExt.criticality`, needs a vocabulary→integer mapping that is a
    // judgement rather than a lookup). Asserting they are absent would be asserting work nobody
    // has agreed to do.
    await api.dispose()
  })

  step('P1-S6', async ({ page }) => {
    await openIncidents(page)
    await page.getByRole('button', { name: /\+?\s*create/i }).first().click()
    await dropdownItem(page, /^\s*Incident\s*$/i).click()
    const frame = createIncidentFrame(page)
    // The Create Incident form's title field is **`incidenttitle`**, not `name` — the flow's
    // mapform node reads `form.incidenttitle` and falls back to "Untitled Incident" without it
    // (docs/flows/createincident-form-flow-f210ot001bt51d.json). Kept tolerant of the trailing
    // space seen on other authored field names (docs/issues/0013).
    const name = frame
      .locator('input[name="incidenttitle"], input[name="incidenttitle "], input[name="name"], input[name="name "]')
      .first()
    await expect(name).toBeVisible({ timeout: 60_000 })
    const probe = `Runsheet nav ${new Date().toISOString().slice(11, 19)}`
    await name.click()
    await name.pressSequentially(probe, { delay: 20 })
    // "Save Changes" belongs to the **modal chrome on the host page**, not to the form iframe —
    // the same arrangement as the composer's modals. Try the page first, fall back to the frame.
    const startUrl = page.url()
    await submitModal(page, frame)

    // FORM_SUCCESS → modal callback → navigate. Skipped during a TotalJS busy window (0014).
    //
    // ⚠️ The old assertion was `toHaveURL(/incident/i)`, which the starting page
    // (`…/pages/incidents.html`) already satisfies — true before the save, and silent about the
    // row's second claim, "**with the new incident loaded as default**" (docs/issues/0048).
    await expect
      .poll(() => page.url(), { timeout: 90_000, message: 'navigated away from the incidents list after save' })
      .not.toBe(startUrl)

    // ⚠️ `toMatch(/incident/i)` was here too, and it was **still** vacuous after the rewrite above:
    // the wrong destination (`…/pages/incidents/incident.html`, a wireframe bound to nothing) matches
    // it just as well as the right one. That is how docs/issues/0103 hid behind a green P1-S6 —
    // the step asserted that navigation *happened*, never *where to* (docs/issues/0048 class).
    //
    // Assert the destination is the real Incident Overview, by the one thing only it has: the
    // overview widget's iframe. `incident.html` contains **zero** iframes, so this cannot pass on it.
    // Same locator P2-S1 uses, so the two steps agree on what "Overview" means.
    await expect(
      page.locator('iframe[src*="widgetdevoverview"]'),
      'landed on the Incident Overview — the destination embeds the overview widget (docs/issues/0103)',
    ).toHaveCount(1, { timeout: 60_000 })

    // The second claim: the incident just created is now the default.
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    await expect
      .poll(
        async () => {
          const res = await api.get(`${FLOW_BASE}/viz-data/overview-default-incident`, { timeout: 60_000 })
          if (!res.ok()) return `HTTP ${res.status()}`
          return JSON.stringify(await res.json())
        },
        { timeout: 90_000, message: `the newly created incident "${probe}" is loaded as the default` },
      )
      .toContain(probe)
    await api.dispose()
  })

  step('P1-S7', async ({ page }) => {
    await openIncidents(page)
    // The row actions are **icon buttons with no text**, so getByRole(name: /open/) never matched
    // them — it only appeared to work while there were no rows to match at all. The label lives on
    // the nested icon's `title` (and in the button's data-model `label`), so target that:
    //   <button class="btn btn-sm"><i title="Open" class="pi pi-sign-in"></i></button>
    const open = page.locator('tbody tr td button:has([title="Open"])').first()
    await expect(open).toBeVisible({ timeout: 30_000 })

    // ⚠️ `toHaveURL(/incident/i)` was the old assertion — and the starting page is
    // `…/pages/incidents.html`, which matches on the first poll. It was true *before* the click,
    // proved nothing about same-window navigation, and never checked the step's actual point:
    // that `current_incident` switches (docs/issues/0048).
    const startUrl = page.url()
    const rowId = (await page.locator('tbody tr').first().innerText())
      .match(/incident--[0-9a-f-]+/i)?.[0]
    expect(rowId, 'read the incident id from the first row').toBeTruthy()

    await open.click()

    // 1. it navigated, in the same window
    await expect
      .poll(() => page.url(), { timeout: 60_000, message: 'navigated away from the incidents list' })
      .not.toBe(startUrl)
    expect(page.context().pages().length, 'same-window navigation — no new tab opened').toBe(1)

    // As in P1-S6: `toMatch(/incident/i)` passed on the unbound wireframe too, so it could not tell
    // a working Open from a broken one (docs/issues/0103). Assert the destination is the Overview.
    await expect(
      page.locator('iframe[src*="widgetdevoverview"]'),
      'landed on the Incident Overview — the destination embeds the overview widget (docs/issues/0103)',
    ).toHaveCount(1, { timeout: 60_000 })

    // 2. and — the real claim — the clicked row became the current incident
    const api = await request.newContext({ ignoreHTTPSErrors: true })
    await expect
      .poll(
        async () => {
          const res = await api.get(`${FLOW_BASE}/viz-data/overview-default-incident`, { timeout: 60_000 })
          if (!res.ok()) return `HTTP ${res.status()}`
          const j = await res.json()
          return (j.nodes || []).some((n: any) => String(n.id || '').startsWith('incident--'))
            ? (j.nodes || []).find((n: any) => String(n.id || '').startsWith('incident--')).id
            : 'no incident node'
        },
        { timeout: 60_000, message: `current_incident switched to the clicked row (${rowId})` },
      )
      .toBe(rowId)
    await api.dispose()
  })

  step('P1-S8', async ({ page }) => {
    // Simulate the create failing and assert the UI says so rather than going quiet.
    //
    // ⚠️ Fail the request the **browser** actually makes. An earlier version intercepted
    // `**/stix-orm/**`, but the create chain runs server-side (browser → the form's flow route →
    // stix-orm), so that interception never touched it — the browser only calls `/stix-orm/*` for
    // vocab lookups. The test reported "no error surfaced" without having caused a failure at all.
    await openIncidents(page)
    let submitIntercepted = false
    await page.route('**/*', (route) => {
      const req = route.request()
      if (req.method() === 'POST' && /\/form\b|\/form\//.test(req.url())) {
        submitIntercepted = true
        return route.fulfill({ status: 500, body: 'forced failure' })
      }
      return route.continue()
    })
    await page.getByRole('button', { name: /\+?\s*create/i }).first().click()
    await dropdownItem(page, /^\s*Incident\s*$/i).click()
    const frame = createIncidentFrame(page)
    // The Create Incident form's title field is **`incidenttitle`**, not `name` — the flow's
    // mapform node reads `form.incidenttitle` and falls back to "Untitled Incident" without it
    // (docs/flows/createincident-form-flow-f210ot001bt51d.json). Kept tolerant of the trailing
    // space seen on other authored field names (docs/issues/0013).
    const name = frame
      .locator('input[name="incidenttitle"], input[name="incidenttitle "], input[name="name"], input[name="name "]')
      .first()
    await expect(name).toBeVisible({ timeout: 60_000 })
    await name.click()
    await name.pressSequentially('Runsheet failure probe', { delay: 20 })
    // "Save Changes" belongs to the **modal chrome on the host page**, not to the form iframe —
    // the same arrangement as the composer's modals. Try the page first, fall back to the frame.
    await submitModal(page, frame)

    // Guard the test itself: if the submit was never intercepted, a missing error message proves
    // nothing. This is the check the previous version lacked.
    await expect
      .poll(() => submitIntercepted, { timeout: 20_000, message: 'the submit request was actually failed' })
      .toBeTruthy()

    // Match only what a user can actually see. Once the table renders rows it brings ~33 hidden
    // `<span class="visually-hidden">Error</span>` nodes (bootstrap-table's a11y markup), and
    // `.first()` picked one of those and failed on "hidden" — an assertion that only worked while
    // the page was empty. Filtering to visible keeps the step honest about what is *surfaced*.
    //
    // ⚠️ Still too wide on its own: a page-wide match also hits incident *descriptions* containing
    // "failed", so the assertion could be satisfied by table data rather than by an error message
    // (docs/issues/0048, Tier 2). Scope it to the modal.
    const modal = page.locator('.modal:visible, [role="dialog"]:visible').first()
    await expect(
      modal.locator('text=/error|failed|could not|unable/i').filter({ visible: true }).first(),
      'an error is surfaced inside the modal',
    ).toBeVisible({ timeout: 30_000 })

    // The row's other half: "the **modal stays open** with a message" — a modal that reported the
    // error and then vanished would lose it.
    await expect(modal, 'the modal stays open so the message is readable').toBeVisible()
  })
})
