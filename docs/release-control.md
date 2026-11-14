# Release control: current behavior and inactive binding increment

## Current repository behavior

Public content GET/HEAD is read-only in current `worker/index.mjs`: it never
initializes the deployment seed. Missing/incomplete or incompatible D1 returns
unavailable; bundled fallback remains distinct from database readiness. Historical
GET-triggered import descriptions are not instructions for this runtime. See
[controlled seed preparation](controlled-seed-preparation.md) for bounded,
authenticated seed writes and separate bootstrap/head evidence.

The default/automatic publisher remains held. Manual observation, seed preparation,
staging and bootstrap are different modes with separate authority. Neither a
successful workflow nor this document enables automatic publication. Saved task
settings, actual active controls and live deployment must be read independently;
repository documentation is not evidence of their current state.

## Target release boundary

Parallel source assessment and candidate PR work feed one serialized runtime/data
release owner. The release is pinned, not an alias for moving main. Evidence and
integration may arrive out of order; later compatible work queues for the next
release instead of replacing an in-flight candidate. Changes to saved-task
responsibilities require separately retained authorization and readback. Nothing
here installs that ownership boundary or a distributed lock.

Stages: assess → prepare → validate → integrate → select immutable release →
retain executable artifact and rollback pair → prepare exact data → promote
coherent runtime/head → independently verify visitors → reconcile actual schedule.
A stage may be blocked or uncertain; time elapsed does not settle a lost response.
Activation and rollback preserve the existing publication-core provenance/CAS
checks. Do not bootstrap an existing channel to bypass ordinary advancement.

Runtime changes need a compatible runtime/data transition. Prefer an independently
qualified inactive preparation path. Where hosting cannot support that, explicitly
use the authorized bounded bundled-maintenance path, then enable the reader only
when the matching head/integrity checks pass. This is transitional fallback, not
an operational database-backed release. Archive the source/build and rollback
pair **before** changing the runtime, not after a failed promotion.

A GitHub concurrency group does not fence separate Sites deployers. All writers
must adopt the sole-owner boundary and prior owners must be quiescent before
claiming exclusion. Lease expiry, matching ref reads or local Git CAS tests alone
are not proof that a delayed Sites writer cannot act.

## New offline input binding (not activated)

`scripts/lib/release-binding.cjs` supplies two pure functions:

- `createBinding(input)` strictly validates a v1 supplied review snapshot, binds
  validation commit/tree/report fingerprint to the candidate, and returns a deeply
  frozen copy with deterministic `releaseId` and `bindingId`.
- `compareLive(binding, observedLive)` validates the binding again and compares
  all expected live identity, generation and control fields. Drift produces a
  hold; a matching snapshot still needs independent review and is not a lease.

Inputs are candidate and rollback artifact identities, candidate validation
references and expected live state. Complete source commit/tree, archive SHA-256
and size, report-input fingerprint, engine/content identity and record count are
required. Digests and CI IDs are **supplied assertions**, not authenticated service
receipts. Callers must independently establish complete source/archive bytes,
actual CI outcome, exports, authority, rollback availability and live observations.
No callback, network, filesystem, CLI, workflow or publisher adapter is included.

`releaseId` binds the candidate artifact tuple. `bindingId` additionally binds the
validation and expected-live/rollback snapshot. A different expected generation
therefore creates a different binding, not permission to guess a new CAS input.
A later main commit cannot modify a previously returned snapshot. Report/source
SHA and workflow-authorization SHA must not be conflated by a future adapter.

Current classification is deliberately conservative: identical whole runtime
archive **and** content identity can avoid a runtime change review; any archive
change requires runtime-transition review. Same engine alone is insufficient:
some hosted static assets are outside the current engine hash. A useful data-only
impact classifier needs a separately reviewed complete artifact inventory and
parity proof; this module does not invent that proof or remove engine inputs.

The binding makes no delivery, authorization, ownership, provenance or CI-pass
claim. Outputs explicitly retain these limits. It is not a production state
machine and cannot settle uncertain actions or transfer publishing authority.

## Existing work to reconcile, not duplicate

- Draft PR123 provides offline coordination transition/receipt validation.
- Draft PR124 adds bounded read-only observation and local Git race tests.
- Draft PR162 bounds the inactive advancement adapter to one stage batch.

Their exact heads and integration status must be freshly checked. None is installed
by this document or by the new input binding. Reconcile those pieces with current
main and existing publication core before building a trusted write adapter.

## Required next qualification

1. Retain approved ownership adoption/readback and drain previous deployers.
2. Verify full source and built artifacts, exact CI/export input binding and
   complete rollback pair before a release is selected for action.
3. Add a trusted observation/outcome adapter; test wrong owner, drift, stale head,
   interrupted and duplicate operations, lost acknowledgments and late main changes.
4. Qualify hosted compatible-content and runtime-change paths, with real auth,
   bounded writes, independent readbacks and rollback. No synthetic pass substitutes.
5. Only after separate activation authorization, observe an actual scheduled cycle
   end to end. Distinguish source freshness, attempt health, delivery and coverage.

Run `node --test tests/release-binding.test.cjs`. Fixtures are synthetic and these
checks are structural only. Existing maintenance, publication, coverage, feed,
export and integration gates remain unchanged.
