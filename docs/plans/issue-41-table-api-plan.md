# Issue 41 Outcome: API-Backed All Incidents Table

- GitHub issue: `os-threat/os-threat-alpha-1-program#41`
- Title: `Example of Table using API endpoint`
- URL: `https://github.com/os-threat/os-threat-alpha-1-program/issues/41`

## Request

The issue requested an `All Incidents` table using:

- `http://localhost:8111/viz-data/table-all-incidents`

Project delivery rule for issue work:

- create a new page
- do not modify existing pages unless fixing a bug

Required target area for the new page:

- `/content/typerefinery-showcase/pages/components/content/table`

## Analysis Done

The following was reviewed:

- the live endpoint response from `http://localhost:8111/viz-data/table-all-incidents`
- the table component datasource contract
- the current table widget implementation
- the packaged showcase content structure

Relevant repo areas checked:

- `application/backend/src/main/resources/apps/typerefinery/components/widgets/table/clientlibs/functions.js`
- `application/backend/src/main/resources/apps/typerefinery/components/widgets/table/dialog/.content.json`
- `tests/content/src/main/content/jcr_root/content/typerefinery-showcase/pages/components/content/table`

## Findings

1. The current table widget supports table-ready JSON shaped like:

```json
{
  "columns": [...],
  "data": [...]
}
```

2. The live endpoint currently returns a plain array of incident objects, not the table widget contract.

3. Because of that mismatch, the endpoint is not directly compatible with the current table component as-is.

4. Existing pages should remain untouched for this issue.

## Outcome

The preferred outcome is:

- keep the table widget contract unchanged
- ask the upstream endpoint to transform its response into the existing table format
- create a new issue-specific page under:
  - `/content/typerefinery-showcase/pages/components/content/table/all-incidents`

Preferred endpoint contract:

```json
{
  "columns": [
    { "field": "name", "title": "Name" },
    { "field": "type", "title": "Type" },
    { "field": "heading", "title": "Heading" },
    { "field": "description", "title": "Description" }
  ],
  "data": [
    {
      "id": "incident--146694e8-4666-497c-96d5-d3f6982605a7",
      "type": "incident",
      "name": "potential phishing",
      "heading": "Extended-Incident",
      "description": "Name -> potential phishing<br>Description ->{}"
    }
  ],
  "search": false,
  "pagination": false,
  "resizable": true
}
```

Fallback only if the endpoint cannot change:

- update the shared table widget to also accept array responses

## Issue Action Taken

A comment was posted on the issue requesting the endpoint be transformed into table-ready JSON and providing an example based on the live data shape:

- `https://github.com/os-threat/os-threat-alpha-1-program/issues/41#issuecomment-4221715617`

## Final Decision

For issue `#41`, the clean delivery path is:

- new additive page
- no edits to existing pages
- prefer upstream endpoint transformation
- only change the shared widget if the endpoint contract cannot be updated
