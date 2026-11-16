# Inactive explicit sealed bootstrap adapter

This reference completes the missing absent-head SQL adapter, not admission issuance
or production activation. It is not imported by a Worker, workflow or migration.
It does not prepare content, create admission/seals, change controls or install schema.

`bootstrapFenced` accepts only an exact bootstrap action with `expectedHead:'absent'`,
generation zero and a separately supplied exact operation/owner/epoch. It requires
matching retained/current admitted unstopped decision, immutable evidence binding
and seal. It shares the existing promotion adapter's canonical bundle, full record
and provenance validator rather than creating a parallel content validator.

Raw channel head and event queries must return null; a failed query, undefined
observation, malformed head or orphan event is not absence. Other engine channels
are untouched. One stamped publication-event INSERT uses generation one and
from/to equal to the target, with the existing SQL bootstrap representation's
`publish` event intent. The fence, retained-history and seal triggers atomically
repeat ownership/stop/absence checks, install the first head, consume admission
and retain history. The generic `promoteFenced` still does not accept bootstrap.

Any failed or lost write response stays uncertain. No automatic replay occurs.
`reconcileRetainedBootstrap` is separately invoked, read-only, and requires the
retained consumed sealed decision, exact stamped event and full canonical target.
It separates historical applied revision/generation from the currently observed
head, including after a later sealed successor. It cannot resurrect old authority.
Every outcome keeps productionActionAllowed and deliveryVerified false.

## Qualification and remaining authority boundary

`node --test tests/publication-core.test.cjs tests/admission-seal.test.cjs` exercises
actual reference triggers with canonical synthetic bundles in SQLite. It covers
77 unrelated legacy heads, exact absent-head contract, record corruption,
owner mismatch, stop race, transactional history failure, lost response/read-only
reconciliation, invalid head observations and a sealed successor. Synthetic
admission/binding/seal construction is test setup, not authenticated authorization.

The minimal trusted admission construction still belongs at a protected authority
boundary. Reuse `createBinding` schemaVersion 2, `compareLive`, original artifact
signature/export inspection and exact service receipts. Derive owner from fresh
verified issuer claims, not request JSON; allocate epoch against retained history;
bind the immutable decision/evidence/runtime/rollback hashes before calling the
seal primitive. Missing signature, semantic review, current runtime/head, policy,
stop authority or rollback qualification must hold before admission creation.
Do not add a second planner or accept an `admitted:true` flag. Storing hashes in D1
does not authenticate the inputs or make external runtime freshness atomic.

Hosted D1 trigger/transaction/rollback qualification and separate production
schema/runtime authorization remain required. A namespaced harness on an approved
private test Site can test the same D1 semantics without touching its original
tables, but is namespace isolation within one binding, not a separate database or
write-capability boundary. Exact source/rename-map hashes must accompany such a
result. Existing v299 runtime rollback is not automatically compatible with a
future fenced schema; rollback may never reopen an unfenced legacy writer path.
