# Authenticated admission boundary: proposed, not activated

The only viable admission boundary in the current Worker architecture is a
server-owned publisher route. Receipt JSON, owner stamps, a signed token, and a
successful workflow run individually do not grant release authority.

## Required evidence flow

1. Verify a fresh GitHub OIDC token on every mutating request against the existing
   fixed issuer, audience, repository IDs, workflow and main restrictions. Bind
   canonical run ID, run attempt and workflow SHA; do not accept request overrides.
2. The server acquires fixed-source run/attempt state, candidate source/tree,
   validation jobs and original export artifact bytes/digest. Artifact ownership
   by upload attempt needs independently established linkage, not a guessed
   attempt from an artifact's containing run.
3. Independently verify semantic/coverage receipts and exact runtime/source/env,
   engine, expected head/generation and policy revision. Unknown evidence holds.
4. Construct immutable admission decision/history server-side. Derive actor from
   verified repository/workflow/run/attempt and allocate a monotonic epoch using
   database CAS. The client cannot choose owner, epoch, state, target overrides or
   an already-admitted boolean. Persist intent/results without erasing prior
   denied, stopped or uncertain decisions when a new request arrives.
5. Permit bounded stamped preparation only under that preparing decision. Full
   canonical payload and exact row/provenance readback precedes the admitted
   transition. Owner, epoch, stop, head and immutable decision comparison must
   share that transition's transaction.
6. The stamped promotion adapter inserts one admitted event. Database triggers
   bind event, head and consumption atomically. Public-route/export verification
   is a later independent outcome, not implied by the SQL commit.

The inactive promotion adapter in this slice handles the real SQL primitive,
full stored candidate/record validation, expected state and same-operation
reconciliation. It does not authenticate or create admission and is not imported
by a runtime route. Preparation and promotion are NOT combined into automatic
bootstrap. Unknown writes are reconciled; never blindly replayed.

## Threat model and actual host boundary

Current D1-binding code has unrestricted SQL capability. Triggers protect against
stale/legacy supported writers and races, not malicious or compromised code with
that binding or privileged database administrators. Readable stamps are not
secrets. A second authority host sharing the same writable DB does not fix this.

Stronger isolation would require platform-enforced write-capability separation:
only an authority service owns the write binding and other publishers use narrow
authenticated endpoints. Removing old direct write access and establishing a
reader-only service boundary are architecture/permission decisions, not changes
made by this draft. No read-only D1 binding capability is assumed available.

## Commissioning blockers, not implementation shortcuts

- Legitimate execution through the existing approved GitHub workflow, including a
  real issuer token for read-only qualification. A prior rejected enable action
  is not retried through a new workflow, token or proxy.
- Original export artifact upload-attempt linkage and independent semantic
  authority. Neither the run observer nor a journal grants these facts.
- Authenticated stop/recovery administration, durable historical decisions and
  transaction linkage between journal, admission and head.
- Exact deployed D1/runtime baseline, isolated hosted trigger/migration/rollback
  qualification and separately approved production route/schema activation.

No live control, binding, credential, permission, workflow or deployment changes
are made here. The bundled public site remains untouched.

Reference reconciliation is deliberately limited to a retained matching admission
row. Replacing the channel admission makes an old-operation lookup fail closed,
even when its event survives. Production must archive immutable per-operation
admission separately from the current channel owner pointer; accepting an old
event alone would not recover the missing authority decision. A regression keeps
this limitation visible rather than silently reporting a reconciled operation.

This adapter supports initialized-head publish and explicitly admitted rollback
only. It rejects bootstrap: absent-head commissioning remains a separate guarded
operation. Return values separate the event's applied revision from a current-head
read, and set deliveryVerified and productionActionAllowed false. A later head
cannot be inferred from an earlier event or taken as public delivery evidence.
