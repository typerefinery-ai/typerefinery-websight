# Issue 26 Analysis

Issue: `#26` Tree - RMB Edit DAG

## Summary

Add a showcase path where a right-click action in the tree can send a DAG into the unattached force-graph editing area.

## Scope Correction

This issue is not a `typerefinery-websight` implementation issue.

Primary ownership appears to be:

- `widget-graph-viz-composer`

## Request

The issue asks for a right-click tree menu option that copies a DAG from the tree into the unattached force graph area.

## Analysis Done

I reviewed the same composer-style `os-triage` pages used for the embedded graph experience and checked whether this event is already authored.

Relevant authored wiring already exists in:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/composer-local/.content.xml:230`
- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/composer-public/.content.xml:230`
- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/vizandform-local/.content.xml:230`

Those pages already publish:

- POST to `https://flow.typerefinery.localhost:8101/os-triage/rmb-tree/edit-DAG--to-unattached`
- topic/name `embed-tree-edit-dag`

## Showcase Page Event Analysis

For a showcase page in this repo, the event should be authored on the embedded composer or viz component under its `_events_` node.

Exact event contract:

- `action="DATA_REQUEST"`
- `type="emit"`
- `topic="embed-tree-edit-dag"`
- `nameCustom="embed-tree-edit-dag"`
- `config={"method":"POST","url":"https://flow.typerefinery.localhost:8101/os-triage/rmb-tree/edit-DAG--to-unattached"}`

Reference implementation:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/os-triage/forms/composer-local/.content.xml:227`

Showcase outcome:

- if we create a new showcase page for this issue, it should reproduce this exact event contract
- no additional authored page event appears necessary beyond this `DATA_REQUEST` emit event

## Findings

- This repo may contain integration wiring for the embedded experience, but the actual feature ownership is in `widget-graph-viz-composer`.
- The right-click menu behavior and force-graph update should not be treated as a `typerefinery-websight` showcase-page task.
- No new page or page-event work should be planned in this repo for this issue.

## Outcome

Repo outcome: out of scope for this repo.

Working position:

- track this issue in `widget-graph-viz-composer`
- do not plan `typerefinery-websight` showcase-page work for it
