# Issue 72 Plan: Overview Force Graph Interactions

This document defines the implementation plan for:

- GitHub issue: `os-threat/os-threat-alpha-1-program#72`
- Title: `Overview Force Graph Needs Left-select, Drag to Positionm, Zoom and Pan enabled`

Issue URL:

- `https://github.com/os-threat/os-threat-alpha-1-program/issues/72`

Issue state:

- `closed` on `2026-02-06`

## 1. Delivery Rule

For issue work in this project:

- create a new page for the issue
- do not update existing showcase or app pages unless fixing a bug on that page
- be explicit when the requested behavior actually lives outside this repo

## 2. Problem Summary

The issue asks for:

- left-select objects
- drag objects to a position and keep them there
- double-click to return to dynamic positioning
- zoom
- pan

## 3. Current Repo Findings

### 3.1 The overview graph is externally hosted

The overview pages in this repo embed external graph widgets rather than implementing the graph directly.

Local dev embed:

- `https://widgetdevoverview.typerefinery.localhost:8101/`

Public embed:

- `https://typerefinery-ai.github.io/widget-graph-viz-overview/`

Relevant packaged pages:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/overview-local/.content.xml`
- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/overview-public/.content.xml`

### 3.2 What this repo appears to own

Based on the current files, this repo owns:

- the embed page shell
- the data request wiring
- event proxy wiring between the widget and the side form

It does not appear to own:

- the force-graph interaction implementation itself

## 4. Planning Conclusion

This issue is only partially actionable in this repo.

Likely ownership split:

- graph interaction behavior belongs in the overview widget project
- integration validation belongs in this repo

Because the issue is already closed, the first step is not code, but confirmation of whether any follow-up is still required here.

## 5. Proposed Delivery Shape

If follow-up is still needed in this repo, create a new integration page under:

- parent:
  - `/content/typerefinery-showcase/pages/os-triage/forms/overview-local`
- new page:
  - `/content/typerefinery-showcase/pages/os-triage/forms/overview-local/force-graph-interactions`

Use this only for:

- validating a new widget URL
- validating a new event contract
- documenting the interaction-ready integration path

Do not treat this repo as the implementation home for drag/zoom/pan behavior unless the widget source is also brought into scope.

## 6. Planned Implementation Steps

## Step 1: Confirm whether the issue needs any remaining work

Because the issue is closed, first confirm:

- is there still a gap in the current integrated experience
- or is this only historical documentation now

## Step 2: If needed, identify the true implementation repo

If interaction work is still missing, identify the widget project that owns:

- node selection
- drag persistence
- double-click restore
- zoom
- pan

## Step 3: Limit this repo to integration work

If follow-up here is needed, keep it to:

- updated embed URL
- updated data contract
- updated event routing
- new integration showcase page

## Step 4: Add a new issue-specific integration page

New file to add, only if needed:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/overview-local/force-graph-interactions/.content.xml`

## 7. Files Likely To Change

Only if a follow-up is required:

- new issue-specific overview integration page
- possibly no shared CMS code at all

## 8. Risks And Notes

- The largest risk is solving the wrong problem in the wrong repo.
- The current repo does not appear to contain the graph widget source.
- Any plan that promises drag/zoom/pan implementation here would likely be misleading.

## 9. Validation Checklist

- ownership of the interaction work is confirmed
- if a new integration page is added, existing overview pages remain untouched
- embed and event integration still work with the widget version under test
