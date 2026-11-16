# Inactive evidence/runtime-bound admission seal

This reference supplements `database-fence-reference.sql` and
`admission-history-reference.sql`, in that order. It is outside `drizzle/`, not
imported by Worker routes, and has not been applied to hosted D1. It adds no
issuer verifier, authorization endpoint, planner, deployment or production action.

## Closed gap

The older references allowed a direct `preparing` to `admitted` update with no
retained evidence/runtime binding. The supplement introduces an immutable
`release_admission_bindings` row tied to the exact current and archived operation,
owner, epoch, target revision/digest/commit, expected head/generation and mode.
Four lowercase textual SHA256s bind the evidence set, policy, runtime snapshot
and rollback snapshot. Canonical identities and safe integer ranges reject
malformed legacy preparing rows. Hash validity is a format check, not authority.

The trusted server first retains this binding while the operation is preparing
and unstopped. It then inserts one `release_admission_seals` row carrying the
same operation/owner/epoch and four hashes. The insert guard rechecks the
retained/current/binding identity, stop status, actual head/generation and
completed target/provenance. Its AFTER INSERT trigger transitions precisely one
matching admission to admitted. Existing state-history triggers record that
transition in the same statement transaction. History failure rolls back both
seal and state; the earlier binding remains only a retained preparing decision.

A BEFORE UPDATE guard rejects direct admission without the exact seal and repeats
the database checks. UPDATE, DELETE, same-operation replay, REPLACE and hidden
rowid collisions cannot change bindings/seals. Publication-event and direct-head
INSERT/UPDATE guards also require the seal. These last guards deliberately hold
legacy admitted observations, including an inconsistent restored baseline with
an old stamped event but no head transition. No old admitted row is retroactively
authorized by installing this reference.

For bootstrap, admission requires an actually absent head and no event history,
expected revision NULL and expected generation zero. An unreadable or malformed
head is not absence. Initialized publish/rollback requires the exact expected
head plus maximum recorded generation. The current engine's observed no-head
condition therefore remains an explicit bootstrap/recovery case, not ordinary
publish. Tests exercise existing SQL event transactions for bootstrap; the
separate `promoteFenced` adapter still rejects bootstrap and is not extended here.

## Trusted external decision and integration boundary

Reuse coordinator `createBinding` schemaVersion 2 and `compareLive`, including
`absent-head-recovery-review`. Do not add another planner. The evidence-set digest
must cover the exact signed artifact certificate/run/attempt, original archive
and export-semantic receipts, coordinator release binding, source/tree, policy
and retained original evidence. The runtime/rollback digests must bind separately
captured original service readbacks, not caller assertions. Keep original bytes
and canonical hash definitions with the decision for independent review.

SQLite compares hashes; it cannot authenticate an issuer, verify those evidence
bytes, observe remote runtime/env drift, establish semantic approval, or supply
freshness. Trusted server decision construction, fresh `compareLive`, stop/recovery
administration and qualified platform authority remain mandatory. A compromised
holder of unrestricted D1 SQL capability can forge authority rows or remove
triggers. This does not replace platform-enforced write-capability separation.

The existing deployment journal remains for deployment intent/result/readback,
with denied actions terminal. It is not an admission-event journal. Admission
state history owns this transition. Live v300/environment revision 12 and the
retained v299 archive are separate observed baseline evidence, not actions taken
by this supplement. In particular, v299 is NOT automatically compatible with a
future fenced DB schema: an older runtime may lack writer stamps. Any rollback
must preserve fences and must not reopen a legacy writer path. Runtime/schema
rollback qualification remains a separate prerequisite.

## Local qualification only

`node --test tests/admission-seal.test.cjs tests/publication-core.test.cjs`
uses actual reference SQL triggers in local SQLite. New tests cover atomic
initialized and absent-head transitions, stop races, stale/missing heads and
generation, target/provenance mismatch, hash/owner/epoch mismatch, BLOB and
noncanonical types, replay/REPLACE/rowid collisions, history rollback and
preexisting unsealed admitted/stamped-event baselines. Synthetic fixtures are
not real evidence or hosted D1 qualification. No live database, controls,
workflow, credentials or publishing behavior changed.

### Inactive D1 expression-depth compatibility correction

The initial reference's long left-associated identity conjunctions exceed the
workerd/D1 expression-tree depth limit of 100 when trigger programs are prepared.
Six pure conjunctions now use balanced grouping. Every comparison, operator,
constant and leaf order is unchanged; only grouping parentheses were added.
SQL three-valued `AND` remains associative for these side-effect-free comparisons.
This is a source correction beyond main `b181790e64eca42123daa568a4c3a7a156e74035`,
not evidence that the original source ran successfully on D1.

`node --test tests/admission-seal-depth.test.cjs` runs a Python SQLite regression
with `SQLITE_LIMIT_EXPR_DEPTH=100`: the original unbalanced negative control must
fail with expression-depth overflow, while the corrected reference rejects an
unsealed transition and completes sealed absent-head bootstrap and consumption.
Existing adversarial seal/core tests remain required. Real workerd qualification
is separately recorded by the isolated harness; this local correction installs
no migration or runtime route and authorizes no production write.
