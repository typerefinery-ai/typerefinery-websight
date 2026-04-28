# Issue 55 Analysis

Issue: `#55` Update form flow screen to flow metadata fields

## Summary

Expose and prove the form-to-Flow metadata fields needed for authored flows, including descriptive fields like icon, color, version, author, reference, and additional information.

## Request

The issue asks for form flow metadata support for:

- group
- reference
- name
- icon
- color
- version
- author
- additional information in markdown

## Analysis Done

I reviewed the flow component model, Flow metadata sync service, and the existing showcase content for flow metadata.

Existing authored example page:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/flow/form-flow-metadata/.content.xml`

That page already contains authored values for:

- `flowapi_group` at line `45`
- `flowapi_reference` at line `57`
- `flowapi_name` at line `50`
- `flowapi_icon` at line `48`
- `flowapi_color` at line `38`
- `flowapi_version` at line `64`
- `flowapi_author` at line `37`

Existing backend model fields:

- `application/backend/src/main/java/ai/typerefinery/websight/models/components/FlowComponent.java:76`
- `application/backend/src/main/java/ai/typerefinery/websight/models/components/FlowComponent.java:82`
- `application/backend/src/main/java/ai/typerefinery/websight/models/components/FlowComponent.java:88`
- `application/backend/src/main/java/ai/typerefinery/websight/models/components/FlowComponent.java:94`
- `application/backend/src/main/java/ai/typerefinery/websight/models/components/FlowComponent.java:100`
- `application/backend/src/main/java/ai/typerefinery/websight/models/components/FlowComponent.java:106`
- `application/backend/src/main/java/ai/typerefinery/websight/models/components/FlowComponent.java:112`

Existing Flow metadata sync points:

- `application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java:419`
- `application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java:425`
- `application/backend/src/main/java/ai/typerefinery/websight/services/flow/FlowService.java:1879`

## Showcase Page Event Analysis

This issue does not need a custom authored `_events_` contract on the showcase page.

For a showcase page in this repo, the demonstration should be done by authoring a flow-enabled form with metadata fields on the form node itself:

- `flowapi_enable="true"`
- `flowapi_group`
- `flowapi_reference`
- `flowapi_name`
- `flowapi_icon`
- `flowapi_color`
- `flowapi_version`
- `flowapi_author`
- `flowapi_readme`

Reference authored page:

- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/flow/form-flow-metadata/.content.xml`

Showcase outcome:

- exact page event creation required: none
- exact showcase requirement: author the flow metadata properties on the form component and let Flow sync handle the rest
- `flowapi_topic` is part of flow state, not a custom showcase event to author manually

## Findings

- Most of the requested metadata fields already exist in the component model.
- The repo already has a showcase page demonstrating authored flow metadata values.
- The Flow service already resolves and pushes metadata to Flow.
- The only part I did not confirm in this pass is whether the "additional information (markdown)" acceptance maps exactly to `flowapi_readme` in the authoring UI, even though the backend metadata resolver already includes a readme field.

## Outcome

Repo outcome: this issue looks largely implemented already.

Working position:

- treat this as a verification issue first, not a new build issue
- confirm the authoring dialog exposes all requested fields cleanly
- only create new work if the missing part is specifically the markdown/additional-information field in the UI
