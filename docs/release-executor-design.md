# Release executor: staged implementation contract

Status: inactive design plus a local SQLite storage reference. This change adds no
workflow, endpoint, production migration, credential, schedule or permission.
PR179's receipt inspector and transition replay remain the authority for local
structural checks. Neither supplied service JSON nor this store authenticates an
actor. All outputs remain `productionActionAllowed:false`.

## Supported executor choice and activation boundary

Prefer the existing designated GitHub Actions publisher identity. Current
`publish-content.yml` accepts main-validation `workflow_run` and manual
`workflow_dispatch`, but deliberately holds automatic/default publication before
checkout or credentials. Manual stage/resume also require the designated dispatch
OIDC identity at the Worker. Enabling a disabled workflow alone does not remove
that hold. This design does not resolve an unavailable or denied execution path.
Do not substitute another workflow, trigger, API, token or user interface for a
denied operation. Changes to execution authority and automatic writes require
separate explicit review, approval and supported service access.

The source watches research and integrate candidates independently. One release
owner selects an immutable candidate; later candidates queue without overwriting
it. Guidance Audit retains independent semantic review. Integration is not live
delivery. Keep the bundled site available while executor qualification proceeds.

## Proposed execution sequence

1. Select exact source commit/tree, content/engine, artifact digest, export
   evidence and qualified rollback. Fetch actual authenticated service receipts,
   preserving transport provenance separately from structural inspection.
2. Record durable operation intent before each external write. Recheck source,
   runtime, controls, publication head, and owner before crossing each boundary.
3. Prepare inactive immutable data in bounded batches. Retain every response and
   independently read back full rows/digests; count alone is not readiness.
4. Promote only under a separately qualified exact expected-head comparison.
   Runtime transitions also need saved-source/archive proof and Sites readback.
5. Verify API/head/manifest/bundle and relevant rendered/export behavior. Restore
   reader service only when coherent. Automatic publication remains a distinct
   activation decision, not a consequence of green CI.

Any denied operation is terminal. Unknown write outcomes require actual operation
identity/readback before another write. No elapsed-time unlock, blind retry,
source-date refresh, automatic factual admission, or speculative rollback.
A historical rollback receipt is not fresh full-byte verification.

## Concrete storage reference in this change

`release-sqlite-journal.cjs` reuses `release-journal.cjs` transition replay and the
existing canonical hash. Its Python standard-library helper stores the chain in
SQLite, with one `BEGIN IMMEDIATE` transaction checking the exact expected tail,
appending one record and committing. Sequence and event hash are unique. The
SQL projection must equal the record fields; replay checks every digest and
transition. Two cooperating processes cannot both append at one expected tail.
A lost acknowledgment is recovered by readback, not implicit retry. Denial and
unattributed uncertainty remain pending/held exactly as in the original replay.

The adapter uses SQLite `synchronous=FULL`, closes each connection, creates local
files mode0600, and rejects nonregular stores. This establishes tested local
transaction and restart semantics, not protection against a hostile local writer,
hardware/filesystem guarantees, authenticated remote storage or general locking.
The record digest proves local consistency, not who produced it. Call errors
explicitly require readback; timeout does not establish non-commit.

No CLI or workflow calls this adapter. The Python helper is an internal trusted
process interface, not a validated public API. Tests use synthetic data and real
SQLite in temporary files, including two processes and abrupt process death.

## Real hosted-store qualification still required

The existing Worker uses D1 `prepare/bind/batch`. Python SQLite transactions do
not establish D1 batch/transaction/consistency behavior. Before adopting this
contract there, demonstrate supported atomic CAS and event append, read-after-write
consistency, limits, restart/reconciliation behavior and authenticated actor scope
in an isolated nonproduction service. Keep the schema out of active migrations
until then. GitHub artifacts retain evidence but are not themselves a mutable CAS
journal; the runner's filesystem is ephemeral.

An operation revision fences cooperating journal clients only. It does not fence
Sites deployment or D1 publication unless the remote mutation validates it. No
Sites fencing primitive is established here. Preserve a single verified executor
and drift holds; do not describe cooperative ownership as an enforced global lock.

## Acceptance tests and remaining slices

Local tests cover restart retention, two-process stale-tail races, process death
before commit, lost acknowledgment after commit, denied/unknown holds, chain and
projection tampering, duplicate intent and invalid file/event inputs. Run:

    node --test tests/release-sqlite-journal.test.cjs tests/release-journal.test.cjs tests/release-receipts.test.cjs

Next slices must implement authenticated receipt acquisition and a demonstrated
hosted-store adapter, then read-only shadow execution, bounded preparation and
separately reviewed promotion. Finally prove a second genuine compatible content
update end to end before calling the system routinely operational. This reference
alone does not meet those acceptance criteria or imply D1 delivery.
