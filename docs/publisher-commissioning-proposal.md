# Existing publisher commissioning proposal

Status: REVIEW PROPOSAL ONLY. No implementation, live permission, workflow enable,
route deployment, schema migration, reader change or activation is performed by
this document. Existing holds remain authoritative. An earlier denied operation
must not be retried or routed through a substitute tool, workflow, token or Site.

## Goal and deliberately narrow first release

Make an already initialized, healthy D1-backed engine accept subsequent reviewed,
same-engine content revisions without a human dispatching every batch. Engine
updates, initial bootstrap, absent heads, runtime deployments, rollback and reader
configuration remain separate commissioning/maintenance operations. This proposal
cannot itself repair an uninitialized engine or claim bundled delivery is D1.

## Existing executable boundaries (main2d5633ab)

- `.github/workflows/publish-content.yml`: existing main validation `workflow_run`
  and `workflow_dispatch` triggers; read-only actions/contents plus id-token:write;
  serialized `versioncompass-content-publisher` group, cancel-in-progress:false.
  First step holds automatic/default publish before checkout or credentials.
- `scripts/publisher-workflow-mode.cjs`: independently maps workflow_run/default
  publish to held. `scripts/publish-content.mjs` is unconditionally held too.
  Removing only one of these three holds is not commissioning.
- `worker/publisher.mjs::verifyPublisherOIDC`: fixed issuer/audience, repository
  IDs and designated workflow on main; stage-batch/resume-seed additionally
  require workflow_dispatch. Existing default verifier omits run/attempt output.
- `worker/publisher.mjs::publisherRequest`: activate requires BOTH
  VC_ACTIVE_DELIVERY=1 and VC_PUBLISHER_ACTIVATION=1; GitHub identity can publish,
  not rollback. Candidate commit must equal signed executing commit.
- `worker/publication-core.mjs::activatePublication`: exact operation ID, target,
  expected revision/generation, full staged record integrity and one D1 batch
  combines history append with pointer CAS. Idempotent operation readback exists.
- PR180 local SQLite is not remote authority. PR181 D1 reference is inactive;
  private hosted tests establish bounded storage behavior, not public admission.
  PR182 signed run claims and PR183 fixed service observation remain inactive.

## Trigger and candidate contract to approve

Keep the existing workflow identity and permission set; do not add schedule,
repository_dispatch, pull_request_target, alternate workflow or long-lived secret.
An automatic run is eligible only for completed successful **push-to-main** of
`Validate release metadata and reports`, same numeric repository identity and
current main exactly equal to the triggering validation head. Explicitly reject
PR/fork/manual validation, older delayed runs, retries not independently qualified,
missing source/tree or missing independent semantic/coverage receipts.

Use the event only as a wake-up. Fetch actual validation run+attempt, exact jobs,
original export ZIP digest and internally bound source/tree. An artifact's run ID
alone does not establish upload attempt. Initial bounded policy accepts attempt1
only and still requires original upload attribution; an unavailable proof holds.
Current main, workflow source and executing OIDC SHA must all remain the admitted
candidate. This preserves existing Worker commit binding rather than pretending
workflow_run SHA necessarily equals the triggering SHA. Queue newer candidates;
never overwrite the selected immutable one. If main drifts before admission,
hold and allow the newest genuine validation to select a fresh candidate.

## Preparation path (code changes still needed)

Replace holds only in a separately approved implementation that invokes one
coordinator, not arbitrary inputs. Integrate verified run identity and bounded
service acquisition into the active verifier. Deploy a **same-workflow-only**
authenticated journal endpoint/migration before runner use. Private test service
access is not production authorization. Public journal endpoint accepts fixed
operation types and bounded schema, never caller SQL, arbitrary URLs or target.

Journal operation binds repository/source/tree, candidate content+engine+digest,
validation run/attempt/artifact digest, executing run/attempt/workflow SHA,
runtime saved-version/source/env and expected revision/generation. Persist intent
before each remote action; append result only from retained transport/readback.
Claims supplied in request JSON do not establish authority.

The public Worker must permit reviewed automatic stage-batch only for the exact
existing workflow_run identity and admitted candidate. This explicitly expands
which event may write and therefore is an authorization change, not cosmetic
refactoring. Resume/bootstrap remain manual-only. Do not fall back to unbounded
stage just because stage-batch currently rejects automatic events.

First operational budget proposal: one candidate/run, attempt1, at most20 bounded
stage calls of at most50 records, at most1000 total candidate records, one full
integrity readback and one promotion, total17minutes. These are PROPOSED ceilings,
not saved settings. Candidates above caps hold rather than truncate. A readback
must match every canonical payload/hash and provenance, not just row count.

## Shared journal and real fencing

Use D1 journal CAS to serialize cooperating attempts and retain sticky denied/
unknown states. GitHub concurrency alone is not an all-writer lock. The remote
promotion transaction must validate admission ownership/epoch and expected head
atomically alongside event/pointer update; a preflight journal check alone is
not fencing. This atomic integration is NOT implemented by PR181. Until it is
implemented and adversarially tested, do not claim cross-run fencing or activate
automatic promotion. Unsupported/privileged writers remain an explicit threat
boundary. Denial cannot be cleared by a new operation ID or clock expiry.

## Promotion and live verification

Require healthy existing head for same deployed engine; absent head routes to
separate controlled initial commissioning, never null-as-old-head. Capture prior
full bundle, actual head/generation and provenance as rollback evidence. Confirm
runtime/source/env and main again before write. Automatic promotion only when
reader and publisher controls are explicitly approved on and admission is valid.
Use existing full-integrity CAS, extended with journal ownership as above.

After response, independently read actual history event/head/full bundle and
manifest; verify representative affected UI and exports against immutable content
identity. A successful HTTP/CI/scheduler status does not establish delivery. Claim
operational only after a second genuine same-engine update follows the same path
without per-batch intervention and produces verified evidence.

## Stop, rollback and recovery

Any denied/unknown operation stops writes. Unknown response is reconciled using
original operation identity, event, head and immutable records; no blind retry or
automatic rerun. Stale CAS does not justify rollback of a later legitimate writer.
If current head is demonstrably this operation's failed target and verified old
bundle is intact, an authorized maintenance rollback uses expected current
revision/generation and separate rollback operation, not pointer overwrite.
GitHub OIDC rollback is currently forbidden and remains so in this proposal.

Disabling automatic admission prevents new work but does not cancel in-flight
transactions. Emergency stop must be a server-side gate checked inside promotion
transaction; queued runs record held. Preserve old rows/history and available
bundled runtime. No automatic reader flag changes, content-date invention, task
schedule changes, or destructive cleanup.

## Integration and deployment order

1. Owner integrates reviewed independent PR180/181 and PR182 as appropriate;
   retarget PR183 only after182 integration and fresh exact-head qualification.
   No denied merge retry. These alone do not commission publication.
2. Review implementable active verifier/journal/fencing changes and malicious
   input/race/crash tests. Keep server route disabled while deploying schema/code.
3. Commissioning phase A requires legitimate owner/platform resolution enabling
   a reviewed READ-ONLY shadow mode in the existing workflow, with all production
   writes still denied. Current holds stop before credentials, so a real
   same-identity shadow run is unavailable before this step; this is an actual
   access/authority blocker, not an already available test. No alternate workflow
   or token, and no retry of the denied enable action. Once supported, qualify
   the real issuer token, run/attempt and original artifact. Token authenticity
   is distinct from artifact upload-attempt provenance. No fixture substitution.
4. Establish current runtime/D1 head and rollback through separately approved
   bounded initialization if needed. Confirm healthy reads/exports.
5. Commissioning phase B: after phase A proof and step4, owner/platform approves
   narrowly scoped automatic stage+promotion policy/control activation for that
   same existing executor. This is separate from read-only enablement. Tool refusal
   remains a stop; no alternate enable mechanism is proposed.
6. Commission one exact candidate, independently verify; then verify second
   genuine update. Retain receipts and stop criteria. Broader engine automation
   is a later review, not part of this first scope.

## Acceptance tests before step5

- Wrong issuer/repository/workflow/event/run/attempt/source and tampered artifact
  all fail before writes; expired tokens are rechecked at every action boundary.
- Delayed old CI, rerun artifact ambiguity and concurrent main changes hold.
- Two attempts at one journal tail or publication generation have one winner;
  stale owner cannot promote after takeover; unknown/denied cannot auto-unlock.
- Crash before write, after commit before response, and before journal result
  reconcile from original remote evidence without duplicate effects.
- Batch cap, global deadline, bytes and full payload integrity enforced; oversized
  candidate holds; legacy content and Ripple privacy remain unchanged.
- Stop during prepare/promotion, rollback conflict and partially applied migration
  fail safely without claiming old runtime means old database.
- End-to-end real hosted update verifies UI/API/export and independent receipt;
  a second update proves repeatability. Synthetic fixtures prove only their tests.

## Explicit authorization implications and unresolved blockers

Maintainer code review is not execution approval. Automatic stage event expansion,
public authenticated journal/fencing route, server activation controls and workflow
enablement need a concrete approval consistent with platform policy. Existing
Actions permissions could suffice; no extra secret/admin scope is proposed, but
actual supported execution must be established. Prior enable denial is unresolved
by this document and by general encouragement. Private Site token does not help.
The current public D1 initialization/runtime state must be freshly verified before
estimating commissioning actions. No date or completion promise is supported yet.

### Remaining proof sources and writer inventory

Artifact upload-attempt attribution is an unresolved named gate. Before estimating
commissioning, implement a supported immutable upload receipt/attestation from the
exact validation job and verify its workflow-run attempt, artifact ID/digest and
source against GitHub evidence. Selecting attempt1 or parsing timestamps is not
that proof. This document does not assert the required receipt currently exists.

Before phase B, inventory every writer to these records/heads: `/stage`,
`/stage-batch`, `/resume-seed`, `/bootstrap`, `/activate` (both publication and
maintenance rollback), privileged database operations, and runtime deployments
that change the engine or seed. Legacy authorized HTTP paths must either enforce
the same admission ownership/epoch/stop in the relevant atomic mutation or be
explicitly disabled/excluded under separately approved policy. Gating only the new
coordinator route is insufficient. Uncontrolled privileged SQL/runtime changes
cannot be called fenced; absence of appropriate audit/control evidence holds
commissioning. Enumerate permitted emergency maintenance exceptions and their
stop/ownership protocol rather than silently bypassing the journal.
