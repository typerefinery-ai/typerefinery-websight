# CLAUDE.md

Guidance for AI agents working in the `typerefinery-websight` project.

## Codebase Lookup with graphify

This repository is indexed as a graphify knowledge graph in `graphify-out/`. Prefer querying it for codebase lookups before grepping the source:

```sh
graphify query "<your question>"
```

Rebuild after significant changes with `graphify . --update`.
