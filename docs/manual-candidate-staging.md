# Inactive manual candidate staging qualification

This prepares an explicitly dispatched, bounded path. It does not enable scheduled
publishing, deploy a runtime, change either activation switch, or authorize a
production dispatch. Default `publish` and all `workflow_run` events remain held
before checkout or credentials.

`stage-only` binds current main, workflow SHA, branch, the reviewed deployment
source/tree/seed, and a separately explicit `expected_candidate_revision`. The
candidate must have the deployed engine and exact committed bytes. The caller
uses one GitHub OIDC acquisition and one fixed authenticated stage-batch POST,
without redirects or retries. The service independently validates repository,
commit and successful exact-candidate CI on every call. Each call inserts at most
50 missing rows, validates immutable existing rows, and binds provenance only
when every row matches. It never changes the publication head or history.

A partial response is not publication. A completed stage is not activation.
Timeout, malformed reply, transport loss or any failed request is uncertain:
stop and independently reconcile before requesting another unit. Do not repeat
an ambiguous POST. A known partial response needs independent readback and a
separately bounded continuation budget; there is no automatic client loop.
Provenance from a different commit for the same revision is a conflict, not
permission to overwrite attribution.

`current-head-only` is a separate read-only mode. It requires an explicit
`expected_head_revision`, the exact engine and deployed record, and uses only
OIDC GET plus fixed authenticated head GET. The response may truthfully report
reader delivery off or on. It does not change it. Legacy `head-only` retains its
strict bundled-seed and reader-off expectation. Head metadata is not full history,
provenance, integrity, freshness or activation eligibility evidence.

Before any hosted qualification: review and merge the exact candidate, verify
main CI and exports, separately authorize and deploy matching runtime code with
publisher activation off, record actual deployment identity, and confirm the
live source and controls. Agree an exact non-seed same-engine candidate and a
finite unit budget. Observe current head before and after staging; retain every
run/attempt, artifact digest, candidate identity, progress and provenance receipt.
Test interruption/reconciliation, full integrity and unchanged publication head.
Any subsequent activation, automatic pipeline wiring or schedule/configuration
change requires its own reviewed scope and approval. Local fixture tests do not
establish hosted D1, GitHub OIDC or end-to-end scheduler success.
