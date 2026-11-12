# Explicit manual seed bootstrap
This caller is a D1 write operation, not a read-only diagnostic.
It uses the existing trusted publisher workflow only with explicit `bootstrap-only` dispatch.
The default publish mode and automatic workflow_run remain held before checkout/credentials.
No activation, active-reader flag change, separate stage call, implicit bootstrap or retry is performed.

Before any dispatch, independently reconcile exact current main, its completed main-push CI and exports,
the actual deployed runtime/source tree, and the reviewed deployed-seed observation record.
The current candidate must contain exactly the full deployed seed bundle. A differing engine/revision
fails closed. Merging caller code alone does not approve enabling or dispatching the workflow.

Inputs reuse expected_commit, expected_ref, expected_engine, expected_revision and expected_seed_commit.
The caller checks a clean checkout and exact HEAD, reads immutable Git objects, validates full bundle
integrity/equivalence, and obtains the existing short-lived GitHub OIDC identity. The runtime separately
verifies signed identity, exact-token commit, successful main CI, committed artifact bytes and seed identity.

The operation uses a stable commit/action ID, one credential GET and one bootstrap POST to the fixed origin.
It rejects redirects, bounds bodies and deadlines and makes no retries. Rejected, malformed or timed-out
POST outcomes require independent head/provenance/event readback before any retry, because runtime
verification or response failure can occur after staging. A successful initialized response with generation
at least one does not claim a new event or fresh history. Retained receipts contain no tokens, payloads or
raw errors and never claim delivery.

Subsequent activation/retry/conflict/rollback and active-reader atomic/fallback checks remain separate.
This caller must not be used to bypass them or silently enable automatic future publication.
