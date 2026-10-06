# Independent publication core — implementation checkpoint

PR #10 implemented this core on October 6, 2026. The checkpoint below describes that PR's original scope. Its supported runtime continuation is documented in [publisher integration](publisher-integration.md), with deployment evidence recorded separately. Independent visitor content advancement remains gated on the applicable actual browser/export checks; there is no mandatory waiting period.

## Executable components

`worker/publication-core.mjs` contains:

- `validateBundle`: snapshots inputs before asynchronous work; validates exact v1 manifest/global/catalog fields, seven dataset identities, counts, record IDs, source-to-claim references, safe JSON, engine compatibility, SHA-256 digest and immutable revision identity. It preserves existing qualification and verification-date values, including nulls. This is structural/integrity validation, not upstream Splunk fact verification.
- `verifyRepositoryPublication`: accepts only the fixed public repository and an exact commit on main; requires successful main push CI and every metadata/content/test/build step; compares both the supplied manifest and complete bundle to their files at that commit. External requests are fixed-host, redirect-rejecting, bounded in time and bytes, and carry no credentials. Missing/inaccessible evidence rejects the candidate.
- `stagePublication`: performs all provenance checks before writes, imports immutable records in resumable batches, compares the stored records byte-for-byte, and records provenance/completion without changing the active pointer. Interrupted imports can resume; collisions and same-count corruption fail.
- `readPublicationHead` and `activatePublication`: use the existing channel pointer plus an append-only generation/event ledger. Activation checks the exact expected revision and generation inside one database transaction. Rollback requires a previously active complete revision and explicit rollback intent. Retries distinguish the historical applied operation from the current head. Generations prevent an old A→B request becoming valid after a later B→A rollback. Previous payloads are retained.

`node scripts/verify-publication.mjs --commit <main-SHA> --engine <deployed-engine-revision>` provides read-only candidate preflight from the local generated bundle. Its successful output explicitly says `verified-candidate-not-published`; it does not change GitHub, Sites or D1. Supply the actual deployed engine, not a guessed compatible value. CI now runs the production Worker build as a separate mandatory step.

## Remaining activation boundary

These exported functions are internal library functions, NOT an authentication mechanism. Do not expose them through a public route without first establishing the supported authenticated maintenance-publisher/CI-to-Sites secret path. No real publisher secret was created or handled in this checkpoint. The tool surface available for this work did not expose deployment or secret-management controls for the existing VersionCompass Sites project; unrelated hosting providers were not substituted.

`PUBLICATION_SCHEMA` defines two additive tables for provenance and activation events. It is used by isolated tests only at this checkpoint. Before enablement, translate it through the project's managed schema/migration path, verify on real D1, and reverify/stage the existing initial complete revision so rollback has trusted provenance. Never initialize these tables from unauthenticated GET requests.

The current `ensureRevision` import still activates its deployment seed on initial import. The future independent reader must not call that automatic activation path in a way that can overwrite a publisher-managed head. Integrate the separate stage/activate functions, active-per-engine manifest reads, bounded authenticated requests, operation-ID retries and complete atomic browser fallback together. Test actual D1 behavior and legacy/current link plus screen/HTML/PDF/WebMCP parity before enabling that material runtime change. Do not call this checkpoint an independent live publication.

## Evidence and limitations

Twenty focused tests passed in an isolated local Node 22/SQLite run; one additional actual-repository-bundle/build-isolation test was skipped locally because the full repository was not mounted. Repository CI runs that test against the real checked-in bundle together with the complete existing suite and four synchronization checks. The tests simulate the GitHub evidence responses; those simulations are not a live provenance verification or production D1 validation. Consult the actual PR workflow for full-repository results.

Cases include wrong repository/commit, failed/skipped/stale CI, altered bytes, invalid fields/IDs/engine/evidence, bounded response handling, mutation during asynchronous verification, interrupted staging, same-count corruption, activation races after preflight, transaction failure between event and pointer update, retry collisions, explicit rollback and ABA generation protection.

Transaction implementation follows Cloudflare's documented D1 `batch()` semantics: a failing statement rolls back the batch. Local SQLite failure-injection tests verify the intended SQL behavior, not Cloudflare production operation. Source: https://developers.cloudflare.com/d1/worker-api/d1-database/#batch

The October 6 accelerated-delivery policy remains in force. The missing runtime integration is isolated rather than holding this tested core behind a new 72-hour waiting period. No schedule, factual review date, material content cycle or visitor-data policy changes are made here.
