# Inactive repository semantic-evidence adapter

`acquireSemanticEvidence` acquires and evaluates real retained repository records.
It is not imported by any active Worker/workflow, makes no network requests,
creates no admission, and never calls the issuer CAS. No credentials, policies,
schedules, source assessments or production controls are changed.

## What it establishes

The adapter reuses schema-2 `createBinding` and `compareLive`, then reads the exact
candidate commit/tree's immutable Git blobs. Artifact identities and observed live
state in that binding remain supplied review assertions; this function does not
independently authenticate their remote service origin. It accepts no admitted,
owner, epoch or caller-selected coverage-file fields.

Fixed candidate paths supply the current coverage registry, native feed and soak
policies, canonical datasets, registry history and original coverage/audit records.
Only regular 100644 blobs are accepted. Symlinks, submodules, path traversal,
non-full commit identities and oversized acquisitions fail closed. Git output is
bounded to 8 MiB per call, 32 MiB total retained bytes, 2000 paths per listing and
60 seconds of acquisition, at most 2048 Git commands, with a maximum 10-second
individual command timeout. Replacement objects are disabled. Registry owners,
capabilities, nested scopes, coverage records and observations have explicit
cardinality limits.
No candidate script or external URL is executed. Existing coverage validators run
against a temporary data-only snapshot, removed afterward.

For every declared participating watch, selection uses the latest recorded time.
A tie, invalid latest record or missing watch cannot fall back to an older success.
The existing validator checks registry, claim/source scope, review digest and
historical accounting. The adapter separately evaluates source and claim freshness
at the current trusted evaluation time: an historically valid audit does not stay
fresh forever. It preserves primary, independent and other participant roles.

Original audit review digests are matched to coverage bindings and the supported
watch identity. Original audit bytes, declared baseline fields and all consumed
Git blobs have separate SHA-256 commitments. Where an audit explicitly declares
`baseline.githubMain.commit/tree`, the adapter verifies that retained tree and
compares exact mapped claim/source JSON payloads with the candidate. Missing,
ambiguous or unavailable baseline evidence remains incomplete. Release Watch's
`initialAssessment` versus `integrationMain` fields are not silently resolved.

Each capability reports `repository-evidence-continuity-verified` or specific
incomplete evidence reasons. A successful comparison is useful scoped evidence:
recorded assessment coverage, current freshness and unchanged declared baseline
payloads. It is **not** independent upstream truth or authenticated assessor
execution. Native `reviewDigest` deliberately excludes baseline; separately hashing
the baseline prevents provenance loss but does not turn it into an assessor's
payload attestation. These limits apply even to a positive result.

## Scope is not a new admission policy

Registry mandatory accounting means every participating run declares a disposition.
It does not mean every capability blocks every unrelated release. Deferred and
out-of-scope assessments remain explicit incomplete evidence for their own scopes,
not global deployment vetoes. Pending activation and unauthenticated scheduler
completion are observations, not newly invented universal release blockers.

The existing release binding does not contain an authenticated candidate semantic
scope decision. Consequently this adapter reports `candidateApplicability:
not-established` for each capability and `admission: not-evaluated`. It does not
choose the release's required semantic scope, claim full semantic authority,
refresh dates, reinterpret deliberate unknowns or reset an incomplete assessment.
Current protected export intake remains unable to create preparing admission.

## Current real evidence and remaining work

The November 16 records include actual assessed Prep11/Advisor observations, with
SOC deferred by the participating watches. Some declared baselines are explicit;
Release Watch's baseline is ambiguous for payload assessment. Scheduler readbacks
are not independently authenticated completed executions. The adapter reports
those facts without manufacturing either all-feature success or an unrelated
release veto. It can rerun against later real assessed records without code changes.

For complete semantic admission, the authorized release policy must establish the
candidate's affected required scope; actual assessor records must bind exact
reviewed claim/source payloads and provenance; and the reviewed runner/server
handoff must authenticate those original bytes. Runtime/head, rollback, stop and
freshness coordination remain independent gates. No new policy or signing predicate
is introduced here to disguise those missing facts.

## Tests

`node --test tests/semantic-evidence.test.cjs` reads actual retained records and
isolated temporary Git fixtures pinned to retained November 16 commit
`2858c6255c5c2b5ac879c35bbe560d31117ba3b9` (full Git history required).
The fixed test clock does not constrain moving-main acquisition. Tests cover positive scoped continuity using an
explicitly synthetic baseline, time-based expiry, changed claims, invalid/latest
records and ties, separately preserved baseline bytes, hostile file types, future
records, binding drift and caller authority flags. Synthetic fixtures are not new
source assessments or production authority. Original production records are never
edited by these tests.
