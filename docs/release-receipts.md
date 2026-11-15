# Local receipt inspection and operation journal (not activated)

This increment supplies a real local byte inspector and local append-only evidence
journal. It sends no network requests and does not install an executor, trigger,
credential, production writer or distributed lock. Existing service approvals,
publication holds, ownership and rollback requirements remain unchanged.

## Byte inspection

`node scripts/inspect-release-receipts.cjs PRIVATE-CONFIG.json` accepts optional
`candidate` and `deployment` argument objects matching the exported functions in
`scripts/lib/release-receipts.cjs`. Keep raw service responses, configurations and
journals private, outside source and deployment archives. Strip secret environment
entries before retaining a configuration. Do not publish native conversation data.

`inspectCandidate` checks a complete clean checkout at exact commit/tree, retained
GitHub main push validation result, original ZIP digest/size and matching artifact
run/head. Only an observed run attempt 1 is accepted. Current export receipts lack a
separately verified upload-attempt identifier; a retained run response may be
stale. Outputs therefore distinguish `observedRunAttempt` from
`artifactAttempt:unverified`. Later observed attempts remain unsupported; even
attempt 1 is not inferred to be the artifact upload attempt. It safely extracts that original ZIP into a bounded temporary
directory, rejecting traversal, path aliases/duplicates and symlinks, then runs the
existing full export verifier against the checkout with sanitized Git environment.
It compares original export commit/tree/run identity. Temporary extraction is
removed; original archive is retained. Python 3 and Git are required; missing tools
are failures, not skipped validation.

`inspectDeployment` hashes an actual local tar (including an independently
reconstructed canonical tar) against retained saved-version metadata, matches
source, deployment ID/status and environment revision, and verifies each explicit
reader/publisher/OIDC control. This does not establish D1 integrity, public rendered
behavior, source freshness, current global state or authorization. Source receipt
and rendered-export evidence remain distinct from a successful deployment.

The module does not authenticate caller-supplied service JSON. Every output says
`authenticatedByThisModule:false`; original authenticated connector responses and
capture provenance must be retained and independently reviewed. A digest verifies
byte identity, not truth, freshness, authority or secret possession. No general
`verified:true` flag is accepted as a substitute for original ZIP/tar bytes.

## Local operation journal

`appendJournal(path,event,expectedTail)` records `intent`, `result`, and `readback`
events with increasing sequence and SHA-256 chaining. Expected prior tail and an
exclusive checkout-local lock prevent cooperating local append races. Stale locks
are not automatically deleted; truncated lines, invalid chain, limits and tail
drift hold. This is NOT a GitHub CAS, cross-platform lock or actor-authenticated
history. It does not integrate or weaken PR123's planner; those pending/uncertain
claims remain unchanged.

Intent binds release/operation IDs, exact project/version/source/archive,
environment revision and controls, plus previous deployment ID. Results bind the
returned deployment ID or explicitly unknown identity. A denied operation remains
terminal and cannot be cleared by a readback. A matching target with no returned
operation identity remains `uncertain-unattributed`, blocking another intent.
A known deployment ID plus exact inspected readback yields only
`matched-readback-review-required`. It never grants production authority or
establishes user delivery. All states retain `productionActionAllowed:false`.

The file is append-only through this API and fsynced after append; a crash may
leave a partial line which must be reconciled, not truncated automatically. Parent
directory durability and hostile local writers are not established by this slice.
Do not present this as a production durable store or automatically resume writes.

## Adoption and tests

Reuse PR123/124 planner/observation and PR162 bounded staging in later reviewed
integration. This patch does not merge them, provision a shared journal or turn
these modules into a scheduler. A future service adapter must authenticate the
actual receipts, establish freshness/ownership, reconcile uncertain service calls
and retain qualified rollback before any production execution.

Run `node --test tests/release-receipts.test.cjs tests/release-journal.test.cjs` and
normal maintenance verification. Fixtures are synthetic. A separately retained
local read-only qualification inspected real original CI export and saved-runtime
archive receipts; that does not count as a hosted controller execution.
