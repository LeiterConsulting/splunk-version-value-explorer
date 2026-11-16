# Inactive retained admission history

This supplement remains outside active migrations and runtime imports. It applies
only after the inactive fence reference schema. It snapshots existing decisions
as historical observations, not newly authenticated authorizations. No public or
private hosted database is changed by adding these files.

Immutable decision rows bind operation, channel, owner/epoch, target identity,
expected head/generation and intent. Append-only state observations are recorded
by SQL triggers in the same transaction as current admission mutation. Therefore
failed history persistence rolls back publication event, pointer and consumption.
The channel's current admission can move to a fresh strictly newer epoch only from
an unstopped consumed operation. It cannot reuse a prior operation ID, edit the
old decision, reset stop, or move admitted/consumed state backward. No recovery
exception is implemented. Initial existing states are retained, not reclassified.

The explicit read-only reconcileRetainedPromotion function requires exact stored
consumed decision and stamped publication event agreement. It reports historical
applied revision separately from current head; it cannot authorize a write or
restore an old owner. It does not modify the current promotion function or silently
fall back from failed writes. Normal current-channel admission remains mandatory
for each actual mutation.

This does not authenticate an issuer. Arbitrary SQL/DDL holders can forge new
history or remove guards and remain outside this reference threat model. Missing
policy/semantic/original-artifact evidence cannot be fabricated into the schema.
Authenticated issuance remains held pending server-owned fresh OIDC plus actual
independent release evidence and durable reviewed decision binding described in
release-authenticated-admission-boundary.md. No caller JSON, boolean, fixture or
fresh operation ID can substitute for those proofs. This slice creates no issuer
endpoint, credential, workflow enable, admission mint or automatic transition.

Qualification currently uses actual reference triggers and SQLite transaction
injection, not hosted D1. Before any real migration: test actual D1 semantics,
existing-row integrity, interruption/rollback, size limits and explicit schema
versioning; preserve old state and write-disable on incompatibility. A runtime
rollback must not drop the history/fence or restore unfenced legacy writes.

Consumption additionally requires the exact stamped publication event and current
head/generation inside its transaction; a direct admitted→consumed update without
that proof fails. Historical reconciliation revalidates canonical stored target
bytes/digest/manifest/engine and provenance commit. The state sequence is ordinary
append-only SQL history, not a cryptographic hash chain or proof of issuer identity.
