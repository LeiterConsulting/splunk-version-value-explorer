# Inactive database-fence prototype: not a deployable fix

Reference SQL lives outside active migrations. It extends actual content tables
with per-write operation/owner/epoch stamps and an authoritative admission row.
The current runtime does not emit stamps; this schema intentionally rejects its
legacy writes rather than silently allowing an unfenced fallback. Reads retain
old rows. No hosted schema or permissions changed.

The promotion primitive is a single admitted history INSERT. Its trigger advances
the exact head and consumes admission inside the same SQL statement/transaction.
Failure at consumption rolls everything back. This avoids a detached history
INSERT falsely claiming publication. Stop or owner changes before the transaction
reject; a stop after committed promotion does not undo history. Response loss must
be reconciled by operation ID/event/head, not by replaying insert.

All five existing publication tables reject DELETE. Records, provenance and
history reject UPDATE. Revision payload identity is immutable; only completion
0→1 is permitted under preparation admission. Duplicate natural-key or hidden-rowid INSERT is
rejected before conflict handling, preventing INSERT OR REPLACE from deleting old
rows even when recursive_triggers is off. These stricter semantics mean current
ON CONFLICT DO NOTHING callers must be rewritten to read/reconcile first.

Stamps are integrity bindings, not secrets/authentication. Any actor with arbitrary
D1/DDL access can edit admission or remove triggers. Runtime admission provisioning
must remain behind verified actor/operation authority; it is not implemented here.
The prototype does not promise protection from database administrators or malicious
code possessing the entire binding. SQL checks also do not replace canonical bundle
hash validation, full record integrity, semantic review or artifact provenance.

## Remaining implementation before a deployable PR

- Explicit stamped statement construction for every revision/record/provenance
  write in stagePublication, stagePublisherBatch, resumeSeedBatch,
  stageBundledRevision/importBundledRevision/ensureRevision and bootstrap.
- Replace two-statement activation with admitted event primitive, preserving
  complete canonical payload checks and idempotent event readback.
- Authenticate admission creation/state transitions; bind expected source/tree,
  environment, exact candidate, run/attempt and reviewed budget. No caller bool.
- Test bootstrap absent-head, rollback history rules, supported D1 trigger
  behavior, all insert/update/UPSERT variants, stage caps, stop during each phase,
  concurrent actors and crash/readback on the real hosted isolated database.

## Migration/rollback strategy to review separately

Schema is additive but write compatibility changes. Keep publication off; qualify
existing immutable data and backup/rollback evidence; apply stamped schema only
with a compatible runtime ready. Old data remains readable; old unstamped binaries
must fail writes. A runtime-only rollback does not remove the fence or reverse a
migration. Safe rollback preserves rows/history and keeps writes disabled until a
separately reviewed compatible repair. Do not automatically drop triggers/tables
or restore unfenced legacy writes to make a rollback look successful.

This prototype is local SQLite evidence, not hosted D1, CI integration, automatic
publishing or authority approval. Existing enable denial remains in force.

The SQL additionally requires new revisions incomplete, exact event operation stamp and publish/rollback history eligibility. Canonical payload hashes and exact rows still require the trusted active validator; matching digest labels alone do not prove bytes. An existing rowid=-1 causes future inserts to hold because SQLite does not distinguish its implicit NEW.rowid sentinel from explicit -1 in BEFORE INSERT; it is not silently allowed.

## Current inactive adapter scope

`fenced-preparation-reference.mjs` now implements one bounded preparation call:
mandatory explicit operation/owner/epoch, maximum 50 inserted rows per call,
maximum 1,000-row candidate, canonical bundle validation, exact existing payload
and row reconciliation, and atomic stamped provenance/completion. It does not
provision or admit itself, expose an HTTP route, change a head, or authenticate
provenance supplied by its trusted future caller. The production caller must
acquire original independently verified repository/run/attempt/artifact evidence;
well-shaped JSON and the reference admission table are not that proof.

Both permitted UPDATE triggers preserve rowid, closing UPDATE OR REPLACE's
implicit-deletion path as well as the INSERT OR REPLACE regression. Promotion
still uses the single-event SQL primitive. No active core function has been
replaced and no hosted migration has been registered.

## Mandatory writer integration inventory

| Existing entry | Mutations requiring stamped integration or retirement |
| --- | --- |
| content-store stageBundledRevision / private importBundledRevision | revision, record batches, completion |
| content-store ensureRevision | bundled import plus initial pointer |
| content-store resumeSeedBatch | revision, at most 50 rows, completion |
| publication-core stagePublication | revision, batches, provenance/completion |
| publication-core activatePublication | replace old event+pointer batch with single admitted event |
| publisher resumePublisherSeed | delegates seed resume |
| publisher stagePublisherBatch | delegates resume, then separately inserts provenance |
| publisher bootstrapPublication | delegates full staging, then initial pointer/event |

HTTP stage, stage-batch, resume-seed, bootstrap, activate routes reach these
writers. Maintenance-token and OIDC authorities differ; the dispatch-only limits
must remain intact. This inventory is source evidence, not proof that no older
binary or privileged SQL actor exists. No visitor-read initialization exception
may silently bypass the fence.

## Required authenticated admission contract (design, not implemented)

A separately authorized issuer must bind repository/source/tree, original artifact
bytes and run/attempt provenance, target/engine/environment, expected head and
generation, budget, operation ID and monotonic owner epoch. It must retain an
append-only decision history before installing a channel's current pointer.
Preparing to admitted requires full exact candidate/record verification and fresh
control/head checks. The writer cannot grant itself admission. Stop is sticky;
owner transfer, target replacement and recovery require a new explicit decision,
not resetting the old stopped bit. Unknown outcomes reconcile the same operation;
no fresh operation is minted merely to retry. A consumed admission establishes
only the atomic database transition, never public delivery verification.

Deployment requires qualifying all five tables, constraints, indexes and triggers
on actual isolated D1, with interruption at each migration/runtime rollout step.
Admission table protection cannot be achieved against unrestricted D1-binding
code by readable stamps. The chosen execution authority must prevent ordinary
writers from arbitrary SQL/DDL/admission mutation, or explicitly exclude that
privileged actor from the threat model. Such authority and migration decisions
remain separate approvals, not consequences of this inactive reference patch.

Local coverage now includes a 105-record candidate prepared in 50/50/5 calls,
and stop/epoch changes after successful preflight but immediately before the
next actual batch; both reject atomically and preserve the first 50 rows. SQL
readback uses LIMIT recordCount+1. This is deterministic transaction-boundary
injection in SQLite, not simultaneous hosted D1 clients or a production race test.
