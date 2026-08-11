/**
 * alpha-launch decision 0025 / issue 0136 — the on-stage proof that "this is configuration".
 *
 * Authors a small display-options control onto the Overview (local) page. One click:
 *
 *   GET  /viz-data/overview-options            read the stored value (iconSize)
 *   POST /viz-data/overview-options-save       write the flipped value through the real save
 *                                              flow (created by create-options-save-flow.mjs —
 *                                              it deep-merges into the same options.json the
 *                                              GET serves)
 *   reload the widget iframe                   the widget re-reads options at load, so the
 *                                              icons visibly change size
 *
 * Honesty rules honoured:
 *  - nothing is faked client-side: the button's only power is the POST; the visible change is
 *    the widget re-reading what was stored (decision 0025's hard constraint);
 *  - the outcome is shown on the control itself (saved value / failure), so it does not
 *    reproduce the 0104 silent-write defect;
 *  - the key flipped is `iconSize` (35 <-> 70). It was chosen over the initially-suggested
 *    `tooltipContent` because the Overview widget hardcodes its tooltip to raw JSON and never
 *    reads `tooltipContent` (widget-graph-viz-overview src/js/widget.js:892) — flipping it
 *    would change nothing on screen, which is exactly the kind of dud beat 0025 forbids.
 *    `iconSize` is read for every node icon (widget.js:812) and is one of the three candidate
 *    keys 0136 names ("tooltip content style, theme, or icon size").
 *
 * Authoring goes through the project's ComponentNodeServlet (Sling POST answers 405 on /content
 * — docs/issues/0044 pattern, same as author-newobject-button.mjs). The control is an embed
 * component with variant="source", whose `source` HTML the page renders inline.
 *
 *     node e2e/author-options-control.mjs            # report
 *     node e2e/author-options-control.mjs --apply
 */
import fs from 'fs'
import https from 'https'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const CMS = 'https://cms.typerefinery.localhost:8101'
const PARENT =
  '/content/typerefinery-showcase/pages/os-triage/forms/overview-local/jcr:content/rootcontainer/main/container/container'
const NODE = 'optionscontrol'
const APPLY = process.argv.includes('--apply')

const agent = new https.Agent({ rejectUnauthorized: false })
const state = JSON.parse(fs.readFileSync('.auth/cms.json', 'utf8'))
const cookie = (state.cookies || []).map((c) => `${c.name}=${c.value}`).join('; ')

// The control. Pure ASCII. Fixed-position so it never disturbs the page's flex layout; the
// Traefik flow host is used because it answers CORS from both page origins (:8113 and :8101),
// which the direct :8111 port does not (same conclusion as the widget's own apiBase()).
const SOURCE = `<div id="tr-options-control" style="position:fixed;top:70px;right:18px;z-index:2000;background:#ffffff;border:1px solid #b8b8b8;border-radius:6px;padding:8px 10px;font-family:Arial,sans-serif;font-size:13px;color:#222;box-shadow:0 2px 6px rgba(0,0,0,0.25);max-width:260px;">
  <div style="font-weight:bold;margin-bottom:4px;">Display options (stored config)</div>
  <button id="tr-options-control-btn" type="button" style="cursor:pointer;padding:4px 10px;border:1px solid #888;border-radius:4px;background:#f5f5f5;font-size:13px;">Icon size: loading...</button>
  <div id="tr-options-control-state" style="margin-top:4px;min-height:16px;color:#555;"></div>
</div>
<script>
(function () {
  var FLOW = 'https://flow.typerefinery.localhost:8101';
  var GET_URL = FLOW + '/viz-data/overview-options';
  var SAVE_URL = FLOW + '/viz-data/overview-options-save';
  var SIZES = [35, 70];
  var btn = document.getElementById('tr-options-control-btn');
  var out = document.getElementById('tr-options-control-state');
  var current = null;

  function label() {
    if (current === null) { btn.textContent = 'Icon size: unavailable'; return; }
    var next = current === SIZES[0] ? SIZES[1] : SIZES[0];
    btn.textContent = 'Icon size ' + current + ' -> set ' + next;
    btn.setAttribute('data-iconsize', String(current));
  }

  function refresh() {
    return fetch(GET_URL)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (o) {
        if (!o || o.error) throw new Error('options endpoint returned an error body');
        current = o.iconSize;
        label();
      })
      .catch(function (e) {
        current = null;
        label();
        out.textContent = 'could not read stored options: ' + e.message;
      });
  }

  function reloadWidget() {
    var frames = document.querySelectorAll('iframe');
    var hit = 0;
    for (var i = 0; i < frames.length; i++) {
      var src = frames[i].getAttribute('src') || '';
      if (src.indexOf('widgetdevoverview') >= 0 || src.indexOf(':4008') >= 0) {
        frames[i].setAttribute('src', src);
        hit++;
      }
    }
    return hit;
  }

  btn.addEventListener('click', function () {
    if (current === null) { refresh(); return; }
    var target = current === SIZES[0] ? SIZES[1] : SIZES[0];
    btn.disabled = true;
    out.textContent = 'saving iconSize=' + target + ' ...';
    fetch(SAVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ common: { iconSize: target } })
    })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (saved) {
        if (!saved || saved.error) throw new Error('save flow reported an error');
        var written = saved.common && saved.common.iconSize;
        if (written !== target) throw new Error('written value is ' + written + ', expected ' + target);
        var reloaded = reloadWidget();
        out.textContent = 'saved iconSize=' + written + '; widget reloading (' + reloaded + ' frame)';
        return refresh();
      })
      .catch(function (e) {
        out.textContent = 'SAVE FAILED: ' + e.message;
      })
      .then(function () { btn.disabled = false; });
  });

  refresh();
})();
</script>`

const description = {
  'sling:resourceType': 'typerefinery/components/content/embed',
  variant: 'source',
  source: SOURCE,
  id: 'optionscontrol_0136',
}

console.log(`parent: ${PARENT}`)
console.log(`node: ${NODE}`)
console.log(`source length: ${SOURCE.length} chars (ASCII only: ${!/[^\x20-\x7E\r\n\t]/.test(SOURCE)})`)

if (!APPLY) {
  console.log('\n(report only — pass --apply to author)')
  process.exit(0)
}

const body = new URLSearchParams()
body.append('parent', PARENT)
body.append('name', NODE)
body.append('json', JSON.stringify(description))

const res = await fetch(`${CMS}/bin/typerefinery/component-node`, {
  method: 'POST',
  headers: { cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
  agent,
})
console.log(`\nPOST component-node -> ${res.status}`)
console.log((await res.text()).slice(0, 500))
