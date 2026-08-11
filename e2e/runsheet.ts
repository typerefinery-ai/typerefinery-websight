import { test as base, TestInfo } from '@playwright/test'

/**
 * The runsheet step catalogue — one entry per row of
 * `alpha-launch/docs/mini-app-runsheet.md`.
 *
 * `baseline` is the status that runsheet currently records, and it decides how a
 * step is judged:
 *
 *   pass    → strict. The body must succeed; a throw is a **regression** and fails the run.
 *   partial → the body runs, but a throw is recorded and the test is marked *skipped*,
 *             not failed (we already know it is imperfect).
 *   fail    → known broken. A throw is expected and recorded; a success is a promotion.
 *   unknown → never exercised. Same handling as `fail`; the point is to observe.
 *   manual  → cannot be driven headlessly (cross-origin gesture). Always skipped with a note.
 *
 * That split is what makes the suite useful as a regression gate *and* as an
 * observation log: only steps the runsheet claims work can break the build.
 */
export type Baseline = 'pass' | 'partial' | 'fail' | 'unknown' | 'manual'

export interface StepDef {
  title: string
  baseline: Baseline
  /** Issue file(s) in alpha-launch/docs/issues that track this step. */
  issue?: string
  /** Why a `manual` step cannot be automated. */
  note?: string
}

export const STEPS: Record<string, StepDef> = {
  // ---- Act 0 — preflight -------------------------------------------------
  'P0-S1': { title: 'Stack services STARTED (traefik, cms, flow, tms, fastapi, mongo, typedb)', baseline: 'pass' },
  'P0-S2': { title: 'Widget dev servers up (:4001, :4005, :4008)', baseline: 'pass' },
  'P0-S3': { title: '/viz-data/table-all-incidents returns one row per incident', baseline: 'pass', issue: '0023' },
  'P0-S4': { title: '/viz-data/overview-default-incident returns nodes+edges, no duplicate ids', baseline: 'pass', issue: '0024' },
  'P0-S5': { title: 'CMS login by typed credentials', baseline: 'pass' },
  'P0-S6': { title: 'A rich incident is current', baseline: 'partial' },
  // Both halves of GitHub #82. The composer half was 404 until 2026-08-05 because its route sits
  // in a flow whose SUBMODULE revision and RUNTIME revision serve different URLs under the same
  // id; importing the submodule copy with the id stripped registers /viz-data/composer-options
  // without touching the live /viz-data/tree-user (docs/issues/0041).
  'P0-S7': { title: 'Both #82 options APIs return usable payloads (composer + overview)', baseline: 'pass', issue: '0041' },

  // 0072: services/totaljs-flow/database/database.json is git-IGNORED runtime state, so every fix
  // applied with /flow/{id}/design/save is unversioned and reverted by the next re-provision. That
  // is not theoretical — 0050's relationship merge sat runtime-only for days with nothing to show
  // it. This step makes the drift fail loudly in preflight instead of surfacing after a re-provision.
  // Promoted 'fail' -> 'pass' 2026-08-11. The 8 runtime-ahead flows were synced into the
  // strxi2-demo-api submodule (181dbad), leaving exactly ONE runtime-ahead node — the
  // Composer-Tree-User name-crossing, which the spec now exempts *conditionally* on the source
  // still carrying its counterpart. A 'fail' baseline is NON-STRICT, so this guard could never go
  // red: the one thing it exists to catch — a NEW fix living only in the git-ignored runtime DB —
  // would have been reported as "skipped". That is precisely how 0072 hid for days (docs/issues/0072).
  'P0-S8': { title: 'No flow fix exists only in the git-ignored runtime database', baseline: 'pass', issue: '0072' },

  // ---- Act 1 — All Incidents table --------------------------------------
  // 0029: the table is empty on a clean profile against a restarted stack — the columns and
  // rows only arrive when flow f210iy001bt51d publishes over TMS. The ✅ recorded on 2026-07-25
  // was measured in a browser that had already cached a TMS payload, so 'pass' was never the
  // baseline for a first-time visitor. Blocked pending decision 0003 (push vs pull).
  // Promoted to 'pass' 2026-08-04: the cold-start fallback (decision 0003 option B) plus the
  // shaped flow route plus the authored coldStartDataSource make the table paint 22 rows on a
  // first visit. Strict from here — a regression must fail the run, not be skipped (0029).
  'P1-S1': { title: 'Incidents table renders above the fold, one row per incident', baseline: 'pass', issue: '0005,0021,0025,0029' },
  // Promoted 'partial' -> 'pass' 2026-08-04. The live-fetch chain in flow f210iy001bt51d was parked
  // since July: fetchinc/maprows existed but nothing triggered them, so TMS published a STATIC 6-row
  // snapshot while the live endpoint held 34. Wiring senddata -> fetchinc unparked it; a trigger now
  // re-renders the full current row set without a reload (docs/issues/0005).
  'P1-S2': { title: 'Table live-updates over TMS when the flow is triggered', baseline: 'pass', issue: '0005' },
  'P1-S3': { title: '"+ Create" opens the dropdown (Incident/Note/Artifact/Task)', baseline: 'pass', issue: '0005' },
  'P1-S4': { title: 'Choosing Incident opens the centred Create Incident modal', baseline: 'pass', issue: '0005' },
  'P1-S5': { title: 'Save Changes creates the incident and resets the default', baseline: 'pass', issue: '0005' },
  // Promoted 'partial' -> 'pass' 2026-08-04 (docs/issues/0048): the runsheet records this ✅ and it
  // passes every run, but a non-'pass' baseline is NON-STRICT — a regression was being reported as
  // 'skipped' rather than red. 0014's busy-window caveat is a flake risk, not a reason to stay silent.
  'P1-S6': { title: 'After save the browser lands on Incident Overview', baseline: 'pass', issue: '0014' },
  // Downstream of 0029: with no rows there is no "Open" button to click. The step's own
  // mechanism is sound (decision 0002) — it cannot be exercised until P1-S1 renders rows.
  // Unblocked 2026-08-04 — the table now renders rows, so there is something to drill into.
  'P1-S7': { title: 'Row "Open" sets current incident and navigates same-window', baseline: 'pass', issue: '0005,0029' },
  // Promoted to 'pass' 2026-08-04: the runsheet records this as fixed and passing (0034), and an
  // 'unknown' baseline is non-strict — a real failure was being reported as "skipped".
  'P1-S8': { title: 'A failing create API surfaces an error in the UI', baseline: 'pass', issue: '0026,0034' },

  // ---- Act 2 — Incident Overview ----------------------------------------
  'P2-S1': { title: 'Overview force graph renders the incident and its objects', baseline: 'pass', issue: '0006' },
  'P2-S2': { title: 'All nodes are within the visible panel bounds', baseline: 'pass', issue: '0006' },
  'P2-S3': { title: 'Dragging a node moves it without re-heating the simulation', baseline: 'pass', issue: '0006' },
  'P2-S4': { title: 'Scroll zooms and background-drag pans', baseline: 'manual', issue: '0006', note: 'CDP scroll gestures time out against the cross-origin embed' },
  // Demoted 'pass' -> 'fail' 2026-08-04. The old assertion counted iframes on a three-frame page,
  // so it could never fail; the real assertion shows the form pane opens a **404** for os-threat
  // typed nodes because os-threat-forms/attack-forms/oca-forms are empty (docs/issues/0049).
  // Restore to 'pass' once those families are authored.
  // Promoted fail -> pass 2026-08-04: 0049 fixed. The step now walks 8 nodes and requires every
  // form to resolve, so an os-threat type regressing to a 0-input 404 goes red again.
  'P2-S5': { title: 'Left-select a node opens its populated Update form', baseline: 'pass', issue: '0006,0048,0049' },
  // Promoted 'unknown' -> 'pass' 2026-08-05. The step now asserts that the rendering matches the
  // **configured** theme, which is the actual claim; it previously demanded dark unconditionally
  // while the deployed options say `current_theme: "light"`, so it could only ever fail and its
  // failure said nothing about whether theming works. Checkable only now that #82's options are
  // consumed (P2-S7). docs/issues/0006.
  'P2-S6': { title: 'Theme config applies to the viz', baseline: 'pass', issue: '0006' },
  // Promoted 'unknown' -> 'pass' 2026-08-05: the widget now fetches #82's options in init() and
  // merges them over its defaults. Two faults had to be cleared first — the step was asserting on
  // the PARENT page's resource timings (the widget fetches from its own frame), and the widget's
  // own API base was the direct port, which answers with no Access-Control-Allow-Origin when the
  // widget is served over https. docs/issues/0006, decision 0006.
  'P2-S7': { title: 'Widget init()/refresh() apply the Overview options', baseline: 'pass', issue: '0006' },

  // ---- Act 3 — Incident Composer ----------------------------------------
  'P3-S1': { title: 'Composer renders Tree, Promo and Scratch with data', baseline: 'pass', issue: '0003,0004,0016' },
  // Promoted 'partial' -> 'pass' 2026-08-04 (docs/issues/0048) — runsheet says ✅ automated; it was
  // non-strict, so a regression would have been silently skipped.
  // 0073: this step used to assert only that the tree's innerHTML CHANGED, which it does — so it was
  // green while /viz-data/tree-company ran the *Unattached* algorithm and answered with a nodes/edges
  // graph instead of a tree. It now asserts every treeview source answers with a TREE. Baseline went
  // 'pass' -> 'fail' while the defect stood and is back to 'pass' now that it is fixed: the
  // check failed before the fix and passes after it.
  'P3-S2': { title: 'Treeview radio switches the data set', baseline: 'pass', issue: '0073' },
  'P3-S3': { title: 'Tree right-click shows Copy and Edit DAG', baseline: 'pass', issue: '0007' },
  // Promoted 2026-08-04: the step was never broken. Its assertion demanded the unattached count
  // GROW, but add_node replaces by id and every tree node is already in unattached context, so it
  // could not pass — a working feature reported red in every run (docs/issues/0040).
  'P3-S4': { title: 'Tree Copy copies to unattached context and refreshes', baseline: 'pass', issue: '0026,0040' },
  'P3-S5': { title: 'Left-select in Promo opens a populated Update form', baseline: 'pass', issue: '0011,0013' },
  'P3-S6': { title: 'Create SRO works across Promo and Scratch', baseline: 'pass', issue: '0015' },
  'P3-S7': { title: 'Create Connection opens pre-filled', baseline: 'pass', issue: '0018' },
  // Promoted 'unknown' -> 'pass' 2026-08-04 (docs/issues/0048). The runsheet records this as PASSES
  // after five stacked fixes (0032/0036/0037); leaving it 'unknown' meant a Remove regression — the
  // exact thing 0037 was about — would report as skipped.
  'P3-S8': { title: 'RMB Remove deletes the object after refresh', baseline: 'pass', issue: '0007,0037' },
  // Promoted 'unknown' -> 'pass' 2026-08-05, once both halves of decision 0010 Option 1 existed:
  // the composed API (`POST /os-triage/promote-subgraph`, moves a sub-graph out of unattached and
  // onto the incident) and the Promotable pane's menu item. Both halves of the row are now
  // meaningful — the negative one was vacuous while Promote existed nowhere.
  'P3-S9': { title: 'Promote is offered only for Promotables', baseline: 'pass', issue: '0007,0010' },
  // Promoted unknown -> pass 2026-08-04: the button was authored for #42 (docs/issues/0044), so
  // this step now describes built behaviour and a regression must go red rather than skip.
  'P3-S10': { title: 'New Object opens a modal offering the form types', baseline: 'pass', issue: '0007' },
  // Promoted 'fail' -> 'pass' 2026-08-05 after **five consecutive full runs** green. The assertion
  // is not a weak one: it checks every frame (the toast renders inside the widget frames, so a
  // page-level check would pass vacuously) and requires a pane to have loaded data first, so
  // "no data -> no toast -> nothing to prove" cannot sneak through. docs/issues/0017.
  'P3-S11': { title: '"Loading graph data…" toast clears', baseline: 'pass', issue: '0017' },
  // docs/issues/0086 — P3-S9 asserts the Promote MENU ITEM and never clicks it, while its Expected
  // result claims promoting moves the subgraph into the incident. This step carries that claim.
  // Baseline starts at unknown: it has never run, and marking a step pass before its first run is
  // how a step ends up recorded as green on evidence that does not exist.
  'P3-S12': { title: 'Promote moves a seeded promotable out of unattached context', baseline: 'unknown', issue: '0086,0087' },

  // ---- Act 4 — Attack Navigator ------------------------------------------
  'P4-S1': { title: 'Attack Navigator renders in its iframe', baseline: 'unknown', issue: '0008' },
  'P4-S2': { title: 'Technique right-click offers "Send Technique to Incident"', baseline: 'unknown', issue: '0008' },
  'P4-S3': { title: 'Sending a technique adds it to the default incident', baseline: 'unknown', issue: '0008' },
  'P4-S4': { title: 'Tactic right-click offers "Send Tactic to Incident"', baseline: 'unknown', issue: '0008' },
  'P4-S5': { title: 'With no default incident the action reports clearly', baseline: 'unknown', issue: '0008' },

  // ---- Act 5 — Form behaviour --------------------------------------------
  'P5-S1': { title: 'Create form groups fields Base Required/Optional/Object/Extensions', baseline: 'pass', issue: '0009' },
  'P5-S2': { title: 'Cancel opens the Default form', baseline: 'pass', issue: '0009' },
  'P5-S3': { title: 'Save writes the object into unattached context (Scratch)', baseline: 'partial', issue: '0009' },
  'P5-S4': { title: 'Update form is pre-filled with current values', baseline: 'pass', issue: '0009' },
  'P5-S5': { title: 'Vocab select offers an empty row then the vocabulary', baseline: 'pass', issue: '0009' },
  // Promoted 'unknown' -> 'pass' 2026-08-05 (decision 0011 Option 1, GitHub #62). The data half
  // (#83) always worked; the rendering half was dead because `created_by_ref` was authored as a
  // text input, not a select. It is now a data-source Select and the rows carry icon + heading +
  // description.
  'P5-S6': { title: '_ref select lists candidates with icon/heading/description/tooltip', baseline: 'pass', issue: '0009' },
  // Promoted 'unknown' -> 'pass' 2026-08-05. It was never "unbuilt": the old step waited for a
  // template row that is hidden by design, so it could not pass and never exercised the feature.
  // Driving the authored *Object Marking* button showed add worked and remove did not exist at all
  // — `handleEventAction` knew only ADD_ITEM/ADDONCE_ITEM. REMOVE_ITEM plus an auto-attached remove
  // control were added to the container component; both halves now pass. docs/issues/0057.
  'P5-S7': { title: '_refs list field supports add and remove', baseline: 'pass', issue: '0009,0057' },
  'P5-S8': { title: 'A blank required field is rejected and no junk data is written', baseline: 'pass', issue: '0009' },
}

/** Record an observation on the test so the run-log generator can read it back. */
export function observe(info: TestInfo, status: string, detail: string) {
  info.annotations.push({ type: 'observed', description: `${status}: ${detail}` })
}

export const test = base

/**
 * Declare one runsheet step as a test.
 *
 * Steps whose baseline is `pass` are strict; everything else records what happened
 * and marks itself skipped rather than red, so a run's failures always mean
 * "something that used to work no longer does".
 */
export function step(id: string, body: (args: any) => Promise<void>) {
  const def = STEPS[id]
  if (!def) throw new Error(`Unknown runsheet step: ${id}`)

  // The fixtures must be destructured **here**: Playwright decides which fixtures to
  // build by parsing this callback's signature, so a bare `(args)` wrapper would hand
  // the step an object with no `page` on it.
  base(`${id} — ${def.title}`, async ({ page, context, request, browser, browserName }) => {
    const args = { page, context, request, browser, browserName }
    const testInfo = base.info()
    testInfo.annotations.push({ type: 'baseline', description: def.baseline })
    if (def.issue) testInfo.annotations.push({ type: 'issue', description: def.issue })

    if (def.baseline === 'manual') {
      observe(testInfo, 'manual', def.note || 'not automatable')
      base.skip(true, `manual-only: ${def.note || ''}`)
      return
    }

    if (def.baseline === 'pass') {
      // Strict: a throw here is a regression against what the runsheet claims.
      await body(args)
      observe(testInfo, 'pass', 'matches runsheet baseline')
      return
    }

    try {
      await body(args)
      observe(testInfo, 'pass', `baseline was "${def.baseline}" — step now passes, promote it`)
    } catch (err: any) {
      const msg = (err?.message || String(err)).split('\n').slice(0, 4).join(' | ')

      // ⚠️ A FIXTURE failure is never a legitimate baseline observation, so it must NOT be
      // absorbed into a skip. docs/issues/0093: P3-S12 could not seed its promotable (the task
      // create form is not wired to a flow), the first assertion failed, and this catch turned it
      // into `- P3-S12 … skipped` — indistinguishable from the deliberately-skipped Act 4 steps.
      // The step that exists to verify os-threat#84 therefore never ran, in any run, and the run
      // still reported 0 failures. Re-throw so a broken fixture is loud.
      if (/^FIXTURE:/.test(err?.message || '')) {
        observe(testInfo, 'fail', `fixture could not be prepared — not a baseline observation: ${msg}`)
        throw err
      }

      observe(testInfo, def.baseline === 'fail' ? 'fail (expected)' : 'partial/fail', msg)
      base.skip(true, `baseline "${def.baseline}" — observed: ${msg}`)
    }
  })
}
