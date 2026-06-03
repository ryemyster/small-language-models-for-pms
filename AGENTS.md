## Local Context Engine

A local read-only context scout and junior developer service is available at `http://localhost:8088`.

Use it for non-trivial repository work when it is reachable. It retrieves relevant code,
performs semantic search with local embeddings, summarizes changes, and can draft mechanical
edits. It never writes to a repository. You own architecture decisions, review every draft,
and apply every file change yourself.

**Availability:** check `GET /healthcheck`. If non-200 or unreachable, continue without it.

**Full integration protocol:** `GET http://localhost:8088/setup`

**Path convention:** REPO_ROOT is `/Users/rmcdonald/Repos`. Every path/file value must include the
`<owner>/<repo>/` prefix — e.g. `ryemyster/small-language-models-for-pms/training`. Never pass bare `.`.

**Standard workflow:**
1. `POST /context` before any non-trivial task — read `context-bundle.md`
2. Inspect actual source files before deciding
3. `POST /draft` or `/scaffold` only for clearly specified mechanical work — review before applying
4. After edits: `git diff HEAD | ...` → `POST /diff-summary` — read risks
