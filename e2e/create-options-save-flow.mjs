/**
 * alpha-launch decision 0025 / issue 0136 — create the flow that serves
 * `POST /viz-data/overview-options-save`: the write half of the Overview options API.
 *
 * The read half (`GET /viz-data/overview-options`, flow f21c7p001rn51d "Overview - Get Options")
 * serves the merge of `./generated/os-triage/context_mem/settings/options.json` — verified
 * byte-equal against the live response on 2026-08-11. No save flow of any kind existed
 * (decision 0025 verification), so this creates one that writes to the SAME file the GET reads.
 *
 * Chain (mirrors the proven GET chain: route -> code -> algorithm -> httpresponse):
 *
 *   POST /viz-data/overview-options-save        body: a JSON merge-patch, e.g.
 *     -> readbody (code: extract+parse body)          {"common":{"iconSize":70}}
 *     -> saveopts (python algorithm on FastAPI /algorithm: deep-merge into options.json,
 *                  staged write + os.replace, refuse to produce a file missing the sections
 *                  the GET requires)
 *     -> resp (httpresponse: answers the route with the FULL WRITTEN FILE as JSON)
 *
 * The algorithm is a generic JSON merge — it knows nothing about what the keys mean
 * (data-agnostic: the options are opaque platform config; only the os-triage widgets
 * interpret them).
 *
 * Recipes this follows, each proven earlier in alpha-launch:
 *  - create: POST /fapi/streams_import/ with {"data": "<flow record as a JSON STRING>"}
 *    cloning the donor's components (create-promote-flow.mjs; a design without its component
 *    sources imports as an empty shell — 0054).
 *  - author: POST :8000/flow/{id}/design/save with the RAW design (author-promote-subgraph-flow.mjs).
 *  - algorithm sources must be pure ASCII; every output needs a sink; the route uses
 *    response:'custom' + an httpresponse node, which is exactly how the GET answers.
 *
 *     node e2e/create-options-save-flow.mjs            # report
 *     node e2e/create-options-save-flow.mjs --apply    # create + author + round-trip test
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const RUNTIME_DB = path.resolve(HERE, '../../typerefinery/services/totaljs-flow/database/database.json')

const FLOW = 'http://localhost:8111'
const FASTAPI = 'http://localhost:8000'
const ROUTE = '/viz-data/overview-options-save'
const NAME = 'Overview - Save Options'
const DONOR_ID = 'f21c7p001rn51d' // "Overview - Get Options" — carries every component we need
const APPLY = process.argv.includes('--apply')

// ---------------------------------------------------------------------------------------------
// The save algorithm. Pure ASCII. Scaffolded like every other flow algorithm (own __main__
// runner, so the /algorithm template footer is skipped — docs/issues/0019). Input arrives as
// {"api": <patch>} because the code node feeds the component's single 'api' input.
// ---------------------------------------------------------------------------------------------
const SAVE_ALGORITHM = `################################################################################
## header start                                                               ##
################################################################################
# allow importing og service local packages
import os.path

where_am_i = os.path.dirname(os.path.abspath(__file__))
# sys.path.insert(0, os.environ["APP_SERVICE_PACKAGES_PATH"])
# sys.path.append(where_am_i)
# end of local package imports
################################################################################
## header end                                                                 ##
################################################################################


################################################################################
## body start                                                                 ##
################################################################################

##############################################################################
# Title: Save Overview Options JSON
# Author: alpha-launch (decision 0025 / issue 0136)
# Date: 11/08/2026
#
# Description: The write half of the Overview options API. Deep-merges a JSON
#       patch into the SAME settings file the "Get Overview Options" algorithm
#       reads, and returns the full written file. The merge is generic: this
#       script does not know or care what any key means (the platform treats
#       options as opaque config; only the widgets interpret them).
#
# One Input:
# 1. api : dict - a JSON merge patch, e.g. {"common": {"iconSize": 70}}
# One Output:
# 1. The complete options JSON as written to disk.
#
# Safety, mirroring the read algorithm's 0041 guards:
# - refuses an empty or non-object patch (nothing silently becomes a no-op)
# - refuses to WRITE a file missing the sections the GET requires, so a bad
#   patch cannot brick the read path
# - staged write + os.replace, so a crash mid-write cannot corrupt the file
##############################################################################

import json
import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
import os

TR_Settings_Dir = "./generated/os-triage/context_mem/settings"
TR_Settings_File = "/options.json"
# The sections the read algorithm requires (see "Get Overview Options"). A save that removes
# them would break every subsequent GET, so it is refused.
TR_Settings_Required = ["common", "colours"]


def deep_merge(base, patch):
    # Objects merge recursively; anything else replaces. No delete semantics -
    # restoring a value is another save with the original value.
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            deep_merge(base[key], value)
        else:
            base[key] = value
    return base


def save_options(patch):
    if not isinstance(patch, dict) or not patch:
        raise ValueError("options patch must be a non-empty JSON object, got: " + repr(patch)[:200])

    settings_path = TR_Settings_Dir + TR_Settings_File
    current = {}
    if os.path.exists(settings_path):
        # An unreadable existing file is an error, NOT a license to clobber it with the patch.
        with open(settings_path, "r") as existing:
            current = json.load(existing)
        logger.info("save_options: loaded existing settings from " + settings_path)
    else:
        logger.warning("save_options: no settings file at " + settings_path + ", merging into empty")

    merged = deep_merge(current, patch)

    absent = [key for key in TR_Settings_Required if key not in merged]
    if absent:
        raise ValueError("refusing to write settings missing required sections: " + str(absent))

    if not os.path.exists(TR_Settings_Dir):
        os.makedirs(TR_Settings_Dir)
    staged = settings_path + ".saving"
    with open(staged, "w") as outfile:
        json.dump(merged, outfile, indent=1)
    os.replace(staged, settings_path)
    logger.info(
        "save_options: wrote " + settings_path
        + " (patched top-level keys: " + ", ".join(sorted(patch.keys())) + ")"
    )
    return merged


def main(inputfile, outputfile):
    with open(inputfile, "r") as script_input:
        input = json.load(script_input)

    patch = input.get("api")
    if isinstance(patch, str):
        patch = json.loads(patch)

    merged = save_options(patch)

    with open(outputfile, "w") as outfile:
        json.dump(merged, outfile)

################################################################################
## body end                                                                   ##
################################################################################


################################################################################
## footer start                                                               ##
################################################################################
import argparse
import os


def getArgs():

  parser = argparse.ArgumentParser(description="Script params",
                                formatter_class=argparse.ArgumentDefaultsHelpFormatter)
  parser.add_argument("inputfile", nargs='?', default=f"{os.path.basename(__file__)}.input", help="input file (default: %(default)s)")
  parser.add_argument("outputfile", nargs='?', default=f"{os.path.basename(__file__)}.output", help="output file (default: %(default)s)")
  return parser.parse_args()

if __name__ == '__main__':
  args = getArgs()
  main(args.inputfile, args.outputfile)


################################################################################
## footer end                                                                 ##
################################################################################`

// The code node between route and algorithm: pull the posted JSON out of the request envelope.
// text/plain bodies arrive as strings (the authored control posts text/plain to stay a CORS
// "simple request"), so parse both shapes.
const READBODY_CODE = `// options-save: extract the JSON merge patch from the request.
var body = null;
if (data && typeof data === 'object') {
  if (data.body && typeof data.body === 'object') body = data.body;
  else if (typeof data.body === 'string') { try { body = JSON.parse(data.body); } catch (e) { body = null; } }
}
if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.keys(body).length) {
  console.log('[options-save] body is not a non-empty JSON object, passing through for the algorithm to refuse: ' + JSON.stringify(data && data.body).slice(0, 200));
  body = {};
}
console.log('[options-save] patch top-level keys: ' + Object.keys(body).join(', '));
$.send('output', body);
`

const at = (x, y) => ({ x, y })
const PRINT_CFG = { title: 'Print JSON', version: '2', repo: false, data: true }

const DESIGN = {
  httproute: {
    component: 'cfbhsf66dd',
    config: { url: ROUTE, method: 'POST', timeout: 15000, limit: 5120, upload: false, response: 'custom' },
    ...at(100, 100),
    connections: { output: [{ id: 'readbody', index: 'input' }] },
  },
  readbody: {
    component: 'typerefinery_code',
    config: { title: 'Read options patch', version: '2', outputs: 1, code: READBODY_CODE },
    ...at(340, 100),
    connections: { output: [{ id: 'saveopts', index: 'api' }, { id: 'prntbody', index: 'input' }] },
  },
  saveopts: {
    component: 'Save_Overview_Options',
    config: {
      title: 'Save Overview Options',
      version: '1',
      algorithm: SAVE_ALGORITHM,
      algorithmrequirements: 'argparse',
      endpoint: 'http://127.0.0.1:8000/algorithm',
      jyputerid: '',
    },
    ...at(580, 100),
    connections: {
      output: [{ id: 'resp', index: 'input' }, { id: 'prntout', index: 'input' }],
      payload: [{ id: 'prntpayload', index: 'input' }],
    },
  },
  resp: { component: 'httpresponse', config: {}, ...at(820, 100), connections: {} },
  prntbody: { component: 'typerefinery_printjson', config: { ...PRINT_CFG }, ...at(340, 300), connections: {} },
  prntout: { component: 'typerefinery_printjson', config: { ...PRINT_CFG }, ...at(820, 300), connections: {} },
  prntpayload: { component: 'typerefinery_printjson', config: { ...PRINT_CFG }, ...at(580, 300), connections: {} },
}

// ---------------------------------------------------------------------------------------------

const existing = await (await fetch(`${FLOW}/fapi/streams/`)).json()
const already = existing.filter((f) => (f.name || '') === NAME)
console.log(`flows already named "${NAME}": ${already.length}${already.length ? ' — ' + already.map((f) => f.id).join(', ') : ''}`)

const db = JSON.parse(fs.readFileSync(RUNTIME_DB, 'utf8'))
const donor = db[DONOR_ID]
if (!donor) throw new Error(`donor flow ${DONOR_ID} not found in the runtime database`)

const donorComponents = typeof donor.components === 'string' ? JSON.parse(donor.components) : donor.components

// Only the components the design references — importing 40 unused STIX component sources into a
// generic options flow would be pointless bulk (and vocabulary this flow does not need).
const NEEDED = ['cfbhsf66dd', 'httpresponse', 'typerefinery_code', 'typerefinery_printjson']
const components = {}
for (const id of NEEDED) {
  if (!donorComponents[id]) throw new Error(`donor is missing component ${id}`)
  components[id] = donorComponents[id]
}
// The algorithm-executor shell, renamed so the designer shows what the node IS. The mechanism
// (POST config.algorithm to FastAPI /algorithm, forward the parsed response) is unchanged —
// only id/name/description/default-requirements differ from the donor's Get_Overview_Options.
components['Save_Overview_Options'] = donorComponents['Get_Overview_Options']
  .replaceAll("exports.id = 'Get_Overview_Options'", "exports.id = 'Save_Overview_Options'")
  .replaceAll("exports.name = 'Get Overview Options'", "exports.name = 'Save Overview Options'")
  .replaceAll("algorithmrequirements: 'argparse stixorm'", "algorithmrequirements: 'argparse'")
  .replaceAll('[{Overview Options}}]', '[{Written Options}]')

const flow = JSON.parse(JSON.stringify(donor))
delete flow.id
flow.name = NAME
flow.group = donor.group || 'OS-Triage-VizData'
flow.readme =
  'alpha-launch decision 0025 / issue 0136 - POST /viz-data/overview-options-save. ' +
  'Write half of the Overview options API: deep-merges the posted JSON patch into ' +
  'generated/os-triage/context_mem/settings/options.json (the same file the GET reads) and ' +
  'answers with the full written file. The merge is opaque - no key has meaning here.'
flow.paused = false
flow.components = components
flow.design = DESIGN

console.log(`route to create: POST ${ROUTE}`)
console.log(`components carried: ${Object.keys(components).join(', ')}`)
console.log(`design nodes: ${Object.keys(DESIGN).join(', ')}`)

if (!APPLY) {
  console.log('\n(report only — pass --apply to create the flow)')
  process.exit(0)
}

const res = await fetch(`${FLOW}/fapi/streams_import/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: JSON.stringify(flow) }),
})
const resBody = await res.text()
console.log(`streams_import -> ${res.status} ${resBody.slice(0, 300)}`)
const parsed = JSON.parse(resBody)
if (!parsed.success || !parsed.value) throw new Error('streams_import did not return a flow id')
const flowId = parsed.value
console.log(`flow id: ${flowId}`)

// Author the design through the proven save path (streams_import alone has produced empty-shell
// designs before — 0054); design/save also makes the runtime (re)register the route.
const save = await fetch(`${FASTAPI}/flow/${flowId}/design/save`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(DESIGN),
})
console.log(`design/save -> ${save.status} ${await save.text()}`)

// ---------------------------------------------------------------------------------------------
// Round-trip proof, restoring the original value afterwards.
// ---------------------------------------------------------------------------------------------
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
await wait(2000)

const getOptions = async () => (await fetch(`${FLOW}/viz-data/overview-options`)).json()
const before = await getOptions()
console.log(`\nround-trip: iconSize before = ${before.iconSize}`)

const flipped = before.iconSize === 35 ? 70 : 35
const post = await fetch(`${FLOW}${ROUTE}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ common: { iconSize: flipped } }),
})
const postBody = await post.text()
let postJson = null
try { postJson = JSON.parse(postBody) } catch { /* report below */ }
console.log(`POST ${ROUTE} {"common":{"iconSize":${flipped}}} -> ${post.status}`)
console.log(`  response error field: ${postJson && postJson.error}; response common.iconSize: ${postJson && postJson.common && postJson.common.iconSize}`)

const after = await getOptions()
console.log(`GET after save: iconSize = ${after.iconSize} (expected ${flipped})`)

const restore = await fetch(`${FLOW}${ROUTE}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ common: { iconSize: before.iconSize } }),
})
await restore.text()
const restored = await getOptions()
console.log(`restore -> ${restore.status}; GET after restore: iconSize = ${restored.iconSize} (expected ${before.iconSize})`)

const ok = after.iconSize === flipped && restored.iconSize === before.iconSize && post.status === 200
console.log(ok ? '\nROUND-TRIP PROVEN — write path is real, restore verified' : '\nROUND-TRIP FAILED — see above')
process.exit(ok ? 0 : 1)
