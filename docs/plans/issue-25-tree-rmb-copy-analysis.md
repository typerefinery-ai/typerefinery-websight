# Issue 25 Analysis

Issue: `#25` Tree - RMB Copy

## Summary

Add a showcase path where a right-click action in the tree can copy the selected object into the scratch or unattached force-graph area.

## Scope Correction

This issue is not a `typerefinery-websight` implementation issue.

Primary ownership appears to be:

- `widget-graph-viz-composer`

## Request

The issue asks for a right-click tree menu option that copies an object from the tree view into the scratch force graph.

## Analysis Done

I reviewed the `os-triage` composer-style pages in this repo and checked whether the CMS shell already publishes an event for this action.

Relevant authored wiring already exists in:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/composer-local/.content.xml:222`
- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/composer-public/.content.xml:222`
- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/vizandform-local/.content.xml:222`

Those pages already publish:

- POST to `https://flow.typerefinery.localhost:8101/os-triage/rmb-tree/copy-to-unattached`
- topic/name `embed-tree-copy`

## Showcase Page Event Analysis

For a showcase page in this repo, the event should be authored on the embedded composer or viz component under its `_events_` node.

Exact event contract:

- `action="DATA_REQUEST"`
- `type="emit"`
- `topic="embed-tree-copy"`
- `nameCustom="embed-tree-copy"`
- `config={"method":"POST","url":"https://flow.typerefinery.localhost:8101/os-triage/rmb-tree/copy-to-unattached"}`

Reference implementation:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/composer-local/.content.xml:219`

Showcase outcome:

- if we create a new showcase page for this issue, it should reproduce this exact event contract
- no extra page event appears necessary beyond the existing `DATA_REQUEST` emit event

## Findings

- This repo may contain integration wiring for the embedded experience, but the actual feature ownership is in `widget-graph-viz-composer`.
- The right-click menu behavior and graph update should not be treated as a `typerefinery-websight` showcase-page task.
- No new page or page-event work should be planned in this repo for this issue.

## Outcome

Repo outcome: out of scope for this repo.

Working position:

- track this issue in `widget-graph-viz-composer`
- do not plan `typerefinery-websight` showcase-page work for it
