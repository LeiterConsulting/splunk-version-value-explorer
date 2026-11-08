# Automation operations and recovery

This is the operating procedure for the four existing watches and the existing
progress task. The [constitution](automation-constitution.md) owns accuracy,
authority and coverage. Repository changes, saved-task configuration, content
staging, Sites deployment and visitor delivery are separate states. No new timer,
permission, credential or deployment is created by this procedure.

## What failed and what is repaired

The [November 3 incident record](audits/2026-11-03-pipeline-reliability.json)
retains 400 run identities and the first failed step, skipped steps and bounded log
evidence for every failed run, covering October 22–November 3, 12:30 UTC.

| Population (latest attempt per run) | Passed | Failed | Other |
| --- | ---: | ---: | --- |
| Validation, all events | 223 | 35 | 3 cancelled |
| Publisher | 83 | 36 | 20 skipped |
| PR-triggered validation subset | 45 | 7 | 0 |

There were 14 stale generated-content failures, 8 stale revision failures, 1 stale
release metadata failure, 6 malformed ledger/parent failures and 6 browser failures.
Publisher failures were 18 engine mismatches, 17 CI-not-ready and 1 missing-step
contract. These are workflow-run counts, including duplicate push/PR validation;
they are not a failure rate for all individual tests or all automation tasks.
Final passing PR heads can hide earlier failed commits. Six earlier failed attempts
on five subsequently successful publisher runs are recorded separately, including
one `fetch failed` whose mutation outcome was not established by that log.

* Preparation validates raw UTF-8 JSON and recognized source/generated text,
  executes ordered generators/checks in
  an isolated clone, verifies inputs did not change concurrently, then applies
  prepared output. Failure before application leaves original files unchanged;
  file replacement errors restore the saved preimages. An interrupted process is
  still an incomplete operation: inspect Git and rerun checks before committing.
  The input manifest records tracked deletions explicitly, whether staged or
  unstaged. The isolated index matches that candidate before gates run; the
  writer's original staged/unstaged state stays intact. Validated generated
  deletions follow the same apply/restore boundary as generated file writes.
  Coverage history and immutable registries remain protected by their own gates.
* The publisher checks out the triggering validation SHA. It only publishes when
  that SHA also matches the workflow's existing OIDC SHA. If newer main has
  superseded the trigger, it records `superseded-trigger-not-published` and makes
  no publisher request. The newer commit must pass its own validation. This fixes
  the newer-main race while preserving commit-scoped authorization.
* Engine-changing candidates stop before requesting credentials or writing D1,
  with `held-runtime-deployment-required` and a failing exit code. They require
  the separate authorized Sites runtime process. Engine rejection remains a gate.
* Mandatory publisher evidence includes Advisor, native feed, coverage, export
  readiness and retained candidate artifacts. Skipping any required step fails
  verification. The runtime must be deployed to enforce this amended contract.
* Artifact uploads run only when export verification actually started. Failed
  exports still retain partial evidence and remain failed; early syntax/generation
  failure no longer adds two misleading missing-artifact errors. Successful
  exports still require artifacts. A newer run on the same event/ref may cancel
  obsolete validation; cancellation supplies no accepted export evidence.
* Coverage rejects future/stale successful assessments and stale supporting
  retrievals, pins Advisor identities to their actual records, requires discovery,
  and binds participating ES/CSP reviews. Registry snapshots are immutable by
  version; old runs resolve their original contract. Activation requires complete
  delivery checks plus matching task/scheduler identities. No historical run was
  relabeled complete. Pre-repair ES/CSP review inputs at commit
  `52375081184ae679779fbce57969e20fc588af88` are explicitly grandfathered for
  binding only; a new semantic review requires its declared coverage.

Activation also binds the first execution to the amendment's exact registry
version. An older complete run cannot supply newly required gates for a later
amendment. Historical runs and prior amendments retain their original versions;
an active registry requires its own matching active amendment.
The operational `activation` flag can advance after those existing gates pass
without changing the contract version. Snapshot bytes remain immutable; all
contract fields, required gates and capability scope still match that version.

November 3 ES recovery-selector and exact-release registration failures were
already repaired in main before this branch: invalid links use the recovery
controls, and the exact-release harness waits for tool registration. The previous
October 24 theme and October 28 navigation failures also have later successful
candidate runs. Those old failures are retained; they are not claimed as new fixes
here. Exact-candidate CI must rerun the current complete matrix.

## Daily writer procedure

1. Read AGENTS, the constitution, active registry/amendment ledger and relevant
   product/source docs. Read actual task/run identity when available; retain
   unknown controls/times as unknown. Preserve the saved cadence, timezone,
   timing mode, enabled state, notifications and permissions. Never infer task
   activation from repository implementation.
2. Fetch current GitHub main and read current Sites version/provenance. Use one
   dedicated branch and a draft PR; isolate concurrent writers. Reconcile before
   pushing and again before release. Never overwrite another writer's checkout,
   force-push, directly repair main or merge a red/pending candidate. Repository
   protection settings were not established by this investigation; lack of access
   is not proof they are absent. Changes to those settings require authorization.
3. Retrieve exact official source sections for the owned scope. Validate semantic
   content, product/version, publication stage, component, environment and region.
   HTTP 200, a digest, a search snippet or an unchanged page is retrieval evidence,
   not claim assessment. A `Site Unavailable` body is blocked even with HTTP 200.
   Retain exact URL, section, retrieval method/time/hash and actual assessment
   scope/date. A search result is qualified as indexed evidence. Preserve conflicts
   and unknowns rather than borrowing adjacent releases or related services.
4. Record every mandatory participating capability, including explicit blocked,
   deferred, failed or out-of-scope entries with owner, finite action and review
   date. Freshness is evaluated at the retained run and later observed continuation
   times, not today's date when replaying history. Stale evidence may be retained
   in an incomplete outcome; it cannot establish complete assessed coverage.
   Do not refresh a claim, section date or Advisor pin merely to satisfy a gate.
5. Reuse source reads only within their real assessed scope. Reuse finding IDs and
   immutable checkpoints. Same review digest/checkpoint means no new assessment;
   a different claim/section still needs review. A daily run need not invent a
   product change or new finding. Record an operational attempt/completion or an
   honest partial result using the existing maintenance outcome contract.
6. Edit canonical JSON and review inputs. Bind the native feed outcome and coverage
   to final semantic inputs. If public provenance does not yet exist, use the
   existing two-phase audit-then-feed process with finite follow-up. Delivery-only
   receipts cannot manufacture an assessment. Do not claim full delivery while
   feed provenance remains pending.
7. Run the single preparation and validation path from the repository root:

   ```bash
   npm run maintenance:sync
   npm run maintenance:verify
   git diff --check
   ```

   Generation order is Advisor adapters, release metadata, canonical content,
   source register, content revision, then issue feed. All individual check gates
   run after generation. `maintenance:verify` also runs the full Node suite and
   Worker build. Neither command publishes or reviews upstream evidence. Scripts
   never update admission pins or claim dates automatically.
8. Transfer files as raw bytes, Git blobs or archives. Never copy a rendered tool
   result, its warning header, truncated preview or JSON string representation
   into a repository file. Capture the original byte manifest before transfer:

   ```bash
   node scripts/maintenance.cjs --manifest > /tmp/vc-original-inputs.json
   node scripts/verify-transfer.cjs content/issue-feed.json ORIGINAL_SHA256 ORIGINAL_BYTES
   node scripts/verify-transfer.cjs dist/maintenance-status.js ORIGINAL_SHA256 ORIGINAL_BYTES --text
   node scripts/verify-transfer.cjs /tmp/candidate.zip ORIGINAL_SHA256 ORIGINAL_BYTES --bytes
   ```

   The SHA-256 and byte length must come from that original raw file, independently
   of the destination. A destination-computed hash alone proves nothing about
   transfer. Verify every transferred file, not only JSON. The default keeps strict
   UTF-8 JSON parsing; `--text` additionally requires valid UTF-8 for generated
   JavaScript and other text, while `--bytes` verifies exact binary/archive bytes
   without interpreting them. These modes do not establish semantic correctness,
   syntax validity or safe archive contents. Preparation rejects malformed UTF-8
   in recognized text inputs before a generator can overwrite the evidence.
   Existing content, revision, feed, coverage and export gates still apply.
   Stage all generated changes together. Review file paths, hashes,
   qualifications, tests and diff before the commit.
9. Push the dedicated branch and update the draft PR. Wait for the exact final
   push-head validation and PR integration validation. Any subsequent input edit
   invalidates that candidate's check status. Record run/attempt/head identities,
   first failed step and actual skipped steps. Do not call skipped checks passed.
10. Download the exact successful export artifact and compare GitHub's ZIP digest.
    Extract it and run `node scripts/export-evidence.cjs EXTRACTED_DIRECTORY` in
    the candidate checkout. Inspect novel layouts separately. The fingerprint may
    justify reusing unchanged report evidence for a documentation receipt; it
    does not override a current applicable failure or replace final-head CI.

## Delivery state and release boundary

| State | Required evidence | Does not establish |
| --- | --- | --- |
| Assessed | Exact source sections, scope, dates, qualifications | Publication |
| Candidate validated | Exact-head gates/tests/build/native exports | Merge or live delivery |
| Repository integrated | Approved merge/main commit and exact-main CI | Sites deployment |
| D1 staged / already current | Publisher outcome plus revision/engine | Visitor advancement when `activeDelivery:false` |
| D1 activated | Guarded activation receipt and expected generation | New runtime deployed or live UI verified |
| Sites deployed | Saved version, source commit/tree, matching archive and succeeded deployment | Correct production behavior |
| Live verified | Exact asset/manifest/bundle/D1/API/UI/export checks with limits | Complete semantic or security coverage |

The publisher retains `publisher-outcome-RUN-ATTEMPT`. Its receipt always leaves
`claimedDelivered:false`, since the CLI cannot perform the entire live check.
A successful stage or `already-current` can be green with active delivery off.
Inspect the returned status, engine, revision and active-delivery flag. A
preflight runtime hold records both the deployed and required engine revisions
in its receipt and Actions job summary. If the candidate is still current main,
use the separate authorized Sites runtime deployment process before retrying
the publisher. Preserve `VC_ACTIVE_DELIVERY` until its original real-D1
activation/rollback and independent-reader gates are satisfied.

The approved PR #66 implementation is merged and deployed as Sites version 277;
see the [current rollout and execution status](automation-rollout-status.md).
Its earlier draft-only publication gate is satisfied. Saved prompts were separately
reconciled and independently read back for all four declared tasks under the
November 4 owner request; see the configuration receipt in rollout status. This
does not verify a new scheduled run or activate the pilot. The retained November 3
Release Watch coverage remains 7/11 under 1.0.0. November 4 scheduler completion
contains an ES report with no accepted Release coverage; complete real first
executions under the newly saved 1.2.0 additions remain pending for all four tasks.

For future changes, keep merge, Sites deployment and saved-task activation authority
separate. Review the exact candidate, validate the final main SHA, deploy a matching
runtime only when authorized, verify source/tree and live checks, then observe the
actual scheduled executions. Read back saved settings only through authorized
supported access if prompts are amended. Do not add a timer, widen permissions or
mark the pilot active merely to complete rollout.

Match a coverage receipt to the recorded attempt start as well as the task,
registry and scheduler-run identifiers. A repeated identifier can appear with a
different start. Missing or contradictory starts leave coverage unverified for
the observed attempt. Keep previous receipts as history and reconcile the
distinct result, coverage and delivery evidence through the existing watches.

## Monitoring through the existing progress task

Run `node scripts/pipeline-status.mjs` using existing read access (optionally the
in-memory `VC_GITHUB_EVIDENCE_TOKEN`). It reads the current main SHA and up to 100
recent Actions runs, rejects stale/PR success as main evidence, and reports retained
coverage gaps and overdue follow-ups. GitHub read failure stops the diagnostic;
do not expand access or infer no failures. Saved-task execution health, exact
publisher receipts and live checks still require their own readback. No schedule
is installed by this script; use the existing progress task.

For controller diagnosis, pass `--publisher-outcome /absolute/path/receipt.json`
with `{runId,runAttempt,receipt}`. The wrapper identities must come from the actual
publisher run and attempt; `receipt` is the original `publication-outcome.json`
from its retained `publisher-outcome-RUN-ATTEMPT` artifact. Verify the artifact's
GitHub digest when downloading it. This local matching check does not authenticate
an arbitrary JSON file or fetch artifacts on its own. Keep the retained source
outside the public repository.

The diagnostic binds the receipt to current main and the latest publisher
run/attempt. A failed job without that receipt remains unexplained. A matching
`runtime-inspection` engine mismatch with no completed action or write is reported
as `held-runtime-deployment-required`; it remains a failed publisher job, never
delivery. A post-stage rejection remains a failure with its mutation uncertainty.
Older receipts without engine revisions preserve those values as unknown. A
stale, malformed or contradictory receipt cannot authorize a retry or deployment.
The controller must separately reconcile actual scheduler results, the approved
runtime release and live evidence before declaring recovery.

The one-time progress task is intentionally disabled and expired; it is not a
recurring health monitor. The four existing watch prompts now carry read-only
diagnostic follow-through. Preserve that checkpoint's state and all existing
watch schedules. At each actual watch execution, begin the report with its own
title/watchId and actual scheduler identity when exposed. Other watches' results
remain reference evidence, never this task's completed review.

`pipeline-status.mjs --tasks /absolute/path/native-snapshot.json` joins an actual
supported native read to validated retained coverage. The input is
`{observedAt,tasks:[...]}`. Entries may be actual saved native objects, native get
responses (`{automation,contextVersion}`), or peek responses (`{automations:[...]}`),
including their nested `structuredContent` transport wrappers. Wrappers are
normalized separately; their context versions are not saved-configuration hashes.
Use the complete saved object with its actual `run_details`, not a hand-picked
projection or tool-display text. Keep full private snapshots outside this public
repository. The diagnostic emits hashes and allowlisted status/identity fields,
not prompts, report text, conversation references or environment details.

### Configuration identity

`savedConfigurationDigest(rawNative)` implements the existing receipt algorithm:
exclude only `run_details`, `last_run_time`, `next_run_time` and `updated_at`; sort
only the top-level keys; SHA-256 the UTF-8 JSON and prefix it with `sha256:`. Compute
this before adding any derived fields. It rejects transport wrappers and objects
that already contain `configurationDigest`. The input adapter also supports the
older flat snapshot format: it separates that supplied derived field, recomputes
from the remaining native object, and rejects a mismatch. A caller's claimed digest
cannot hide a changed prompt, schedule, timezone, timing mode or enabled state.

Missing versus null saved fields, unknown saved fields, nested object ordering and
changing environment details can change this legacy digest. That is intentional
compatibility with the retained receipts, not proof of a prompt change. Inspect a
mismatch before deciding its cause. No recursive sorting, compact projection or
replacement fingerprint is silently substituted. The observation is not its own
baseline: expected digests and readback times must come from a separately reviewed
saved-configuration receipt. This local comparison does not authenticate arbitrary
JSON or establish unexposed permissions.

### Watches and operational roles

The existing four-watch `readiness` and coverage registry 1.2.0 are unchanged.
Shared evidence checks bind native task/run identities, configuration, amendment
readback time and the current attempt/result. Watches still require their own
matching validated scheduler/registry receipt and complete coverage/delivery.
A completed operational controller can never supply Prep11/Advisor content
coverage or activate the pilot.

The separate versioned detection contract in `scripts/lib/operational-roles.cjs`
registers the GitHub steward, operational auditor and Ripple refresh task. It
records only task identities, conservative report aliases and separately reviewed
configuration baselines when available. Initial baselines are null, so their
configuration remains explicitly unverified; no completed run is invented. Future
reviewed baselines use `{afterDigest,readbackAt}` in the role's `configuration` field.
That repository change requires its own review and must not be derived from the
same observation being checked. No saved automation is edited by this contract.

The output's `operations` section reports configuration, attempt, result and
notification delivery separately. Notification delivery stays `unknown` because
these native snapshots provide no independent delivery receipt, even if a report
says it was sent. `evidence-matched` means the supplied configuration/attempt/result
evidence matched, not scheduler repair or verified notification delivery. Missing
roles, every checked task, duplicate/missing input identities, optional tasks and
unregistered extra tasks are explicit in the inventory. The expired disabled
checkpoint and November 20 one-time review are nonrecurring optional entries; they
cannot become watch/role participants or poison the four-watch gate.

Report identity is an anchored claim on the first nonempty line, not a mention of
a title anywhere in the report. For example, a Release heading may reference ES
without claiming to be ES. Ripple also accepts the bounded form “Ripple’s November
7 refresh…” (month/day varies), rather than requiring the saved task title.
Duplicate report bytes across declared recurring participants are rejected.

A same-run retry can preserve its run ID. Therefore matching IDs alone do not
suffice: attempt start/completion and result creation/completion timestamps must
be present, valid and no later than `observedAt`. Completion cannot precede the
attempt start. The result cannot predate that start, and its completion cannot
predate the latest recorded attempt completion, even if the original start time
persists across retries. Creation may legitimately precede run finalization.
Both scheduled timestamps must be valid and identify the same nominal slot;
flexible execution may start or finish before that slot, including before a future
scheduled time at observation. Scheduled time is not an execution timestamp.
Future observation times are invalid. Failed/incomplete attempts, missing/truncated/
failure output and `no_update` suppressed output are not accepted success evidence.
Null `next_run_time` remains unknown, not proof dispatch is disabled.

Missing or incomplete evidence returns nonzero/unverified even when CI is green.
Without a native snapshot, both watch and operational evidence are unavailable.
The diagnostic neither fixes upstream scheduling nor runs/retries a task. It has
no retained fingerprint, deduplication scheduler or checkpoint engine: an unchanged
snapshot cannot suppress the next evaluation of a newly due coverage follow-up.
Publisher outcome, content activation, schedules and delivery gates remain
separate and unchanged.

Report same-run validation failure, missing/pending main checks, publisher rejection,
engine mismatch, blocked source, overdue coverage, pending feed provenance or
source/deployment drift at the next existing progress check. High-consequence
unsupported guidance requires immediate hold/escalation under existing authority.
Measure daily completeness, first-attempt failures, repeated findings, overdue
follow-ups, recovery and useful delivered decisions separately. Preserve unknown
elapsed time, calls, tokens and cost as null. No delivery SLA is inferred.

## Recovery table

| Symptom | Diagnose and recover |
| --- | --- |
| Stale catalog/adapter/revision | Reconcile latest inputs; run isolated preparation, inspect generated bytes, verify and commit the whole set. Do not hand-edit generated authorities or update expected test values blindly. |
| Malformed current ledger | Reject before generation. Recover exact intended raw bytes and verify original digest/length. Never parse a display transcript as data. |
| Malformed immutable parent | Require `content/issue-feed-repairs.json`: exact damaged commit/blob SHA-256, its immediate valid parent/blob SHA-256, reason and retained incident audit. Full Git history is required. The repair validates append-only history against that baseline and preserves every immutable public record/snapshot from the damaged commit. No generic ignore flag exists; valid historical JSON never uses this exception. |
| Browser assertion/timeout | Read the first failing route, console and retained partial images. Reproduce exact route/theme, fix application or harness readiness as warranted, and run the full candidate matrix. Missing selector/tool is not automatically an environment problem. |
| `validation-ci-not-ready` / missing step | Verify selected SHA, latest main push run, attempt and named steps. Wait for applicable CI; reconcile an obsolete trigger. Never change success criteria or publish a different SHA. |
| Engine mismatch | Hold content publication; compare candidate/deployed engines. Use the separate approved matching-runtime release, then fresh exact-main evidence and readback. Do not disable the check. |
| Network/5xx/rate limit | Bound source GET retries to one retry (two attempts total), respect Retry-After and record unavailable coverage. No unbounded retry loop or fallback-source inference. Publisher POST timeouts have uncertain outcome: inspect head/provenance/operation status before any retry. Reuse the same operation identity; never create duplicate findings/publications to retry. |
| Permission denied | Stop the denied action. Record exact action/target/reason/completed work and denied/pending/uncertain status. Continue independent work. Do not change credentials/access or route around denial. |
| Duplicate/concurrent writer | Compare exact head, input hashes, review digests and checkpoint IDs. Reconcile new changes and rerun gates. Same-operation publication remains idempotent; stale compare-and-swap must not be retried with guessed expectations. |
| Successful job, incomplete delivery | Read the outcome receipt. Keep repository, D1, runtime and live verification distinct; retain the last verified public revision and finish finite follow-ups. |
| Unsafe published guidance | Record the applicable failure and known complete restore target; follow the existing authorized rollback procedure. Missing local tooling alone does not justify rollback. Preserve all incident/history evidence. |

Recovery never authorizes deleting immutable findings, relaxing tests, advancing
source dates, setting activation flags or modifying repository protections.

### Private seed observation proposal

The authenticated, GET-only `/api/publisher/observe-seed` route is documented in
[publisher integration](architecture/publisher-integration.md#private-bundled-seed-observation-november-7-2026-not-deployed).
It provides bounded metadata/count observations without importing content. A 200
is an observation, not readiness, integrity or delivery proof. This repository
implementation is not deployed and does not change the production/publisher hold,
existing workflows, timers, credentials, active-delivery flag or release gates.
Do not use legacy public content GET/HEAD routes as no-write diagnostics.

## Bounded rollout observation and verification (November 7)

The existing trusted publisher workflow has a separate manual `observe-only` mode
with explicit expected main SHA/ref and bundled engine/revision. It skips candidate
selection and all publication paths, retains a separate sanitized observation
receipt on failure, and cannot establish readiness or delivery. The default
`publish` mode and automatic publisher are now held before checkout, credentials
or production requests; see the November 8 repository hold in that procedure.
The deployed seed is bound separately from the current workflow authorization SHA. Read the
[bounded rollout procedure](bounded-rollout-verification.md) before dispatching;
implementation does not authorize a run or lift the production hold.

The delivery diagnostic now fails fast and verifies the full bundle and every
paginated record sequentially with fixed request/time/body limits. It is **not**
observe-only: valid public content GET/HEAD may initialize/write D1. After a
critical failure, no later requests are sent and no retry is implied. Client
abort cannot establish that server initialization stopped. Preserve exact mode,
run/attempt and receipt identities; a green observe-only workflow is not a
publisher stage or a successful rollout.

The November 8 pre-write hold supersedes the staging behavior described above
for current repository callers. `held-publication-disabled` means no candidate,
credential, runtime or D1 request was attempted, not that production is globally
write-free. The workflow remains disabled. Removing the hold and any eventual
observation dispatch, staging/bootstrap or activation require separate agreement.
