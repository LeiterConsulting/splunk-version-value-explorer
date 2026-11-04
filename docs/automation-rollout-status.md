# Automation implementation and execution status

This record reconciles the completed November 3 rollout with the still-pending
saved-task contract. It does not record a new source assessment or scheduled run.
The latest repository/live reconciliation at November 4, 00:30 UTC found main and
Sites unchanged from the completed rollout.

## Published implementation

[PR #66](https://github.com/LeiterConsulting/splunk-version-value-explorer/pull/66)
was approved, merged and deployed. Earlier draft/unpublished statements describe
its preparation stage; they are not the current repository/runtime state.

| Evidence | Verified result |
| --- | --- |
| Approved PR head | `aa78077dd20c44192991b3308bfe51fc62e824f6` |
| Merged main | `9de8db91496d6754339e2ccc653ed0d130d33560` |
| GitHub/Sites source tree | `4a7c50bb037f09e3a156b26605662f67dcfa30f1` |
| Sites source commit | `7362831ff0a1fd543f6057578e1ec7dd6e4e837d` |
| Saved/deployed version | 277, `appgver_75aa00ffd6048191b6da85a16cddd79c` |
| Deployment | `appgdep_6aea4e5e1b0481919ba603f36ea268b2`, succeeded November 3, 21:13:11 UTC |
| Live address | https://versioncompass.com |
| Audience/environment | Public, access revision 2, environment revision 5; preserved |

[Exact-main validation](https://github.com/LeiterConsulting/splunk-version-value-explorer/actions/runs/41718264477)
passed 335 tests, the 74-asset build and 198 export cases. The independently
downloaded candidate artifact `13270305511` matched ZIP SHA-256
`7ba28222afbc5ab1752b34bc7adc7f3f1aa53738d867bc67db0b9e38a5d541f0`
and was reverified against identical merged inputs: 3,903 hashes, 148 report PDFs /
2,059 pages and 148 offline HTML reopenings. The main artifact was retained, not
independently downloaded again. The exact-head candidate fingerprint is
`86d081cf6252745388292c7c1bb48e49e90ef65e32e149a2aa781f6af5fb366e`.

Actual production evidence in the PR's rollout record includes six delivery
diagnostics, 30 Advisor/Prep11 cases, four navigation journeys and eight fresh
PDF/HTML export pairs. The PDFs passed 42-page / 430-placement checks; four PDFs /
22 pages were visually inspected. Fresh HTML received static inspection, not an
interactive file reopening. These are Chromium results, not native Safari.

Seventy public assets were raw-byte exact. Four HTML responses differed only by an
append matching [Cloudflare JavaScript Detection](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/); their authored HTML
payloads matched source exactly. Failed raw comparisons and follow-up equivalence
evidence were retained separately. No source gate, served response or security
setting was changed. Two ad-hoc navigation probe assumptions were corrected to
the existing CI state/permalink contract; failed attempts remain retained.

[Publisher run 41719319885](https://github.com/LeiterConsulting/splunk-version-value-explorer/actions/runs/41719319885)
initially held for the preceding runtime's engine mismatch with no publisher write
attempted. After matching-runtime deployment and integrity checks, one failed-job
retry passed with `already-current`, `activeDelivery:false` and
`claimedDelivered:false`. Green CI/publishing does not establish independent daily
delivery. `VC_ACTIVE_DELIVERY` and its separate rollout gates remain unchanged.

The public feed at merged main verified 99 records, 17 publications and zero
quarantine. Recovery from the preceding main checkpoint replayed both new
publications. No external consumer workflow state was written.

## Current contract and retained execution history

The repository contract is **1.2.0**. The amendment ledger now records its actual
implementation publication and retains its original pre-rollout statement.
Historical 1.0.0/1.1.0 amendments, immutable registry snapshots, all saved-task
objects and every execution receipt remain unchanged. Clarifying a publication
label does not supply a saved-task readback or advance an activation flag.

| Layer | Current evidence and limitation |
| --- | --- |
| Repository/runtime implementation | Published in PR #66 / Sites 277 |
| Four bounded manual follow-up assessments | Published; implementation reviews, not scheduled executions |
| Latest retained real Release Watch receipt | November 3, **7/11**, registry **1.0.0**; original bytes retained |
| Saved-task reconciliation to 1.2.0 | Pending for Release Watch, Guidance Audit, ES Editions and CSP/FedRAMP |
| Complete real first executions for 1.2.0 | Pending; require actual matching task/scheduler identities and checks/delivery |
| Pilot activation | Pending |

The historical open draft [PR #61](https://github.com/LeiterConsulting/splunk-version-value-explorer/pull/61)
describes 1.0.0 saved-prompt and incomplete inline-execution evidence. It is not
current 1.2.0 reconciliation or activation evidence. Reconcile its retained intent
against current main before any future integration; do not overwrite the later
ledger or the November 3 scheduled receipt with an older state.

The original watch conversation's generic November 3 scheduled-task problem does
not establish a cause. Do not infer that it was a CI failure, a source failure or
the same event as a later repository coverage receipt. No denied task read was
retried to diagnose it.

The retained nominal Release Watch window is **November 4, 05:00 Eastern / 10:00
UTC**; Guidance Audit is **November 5, 08:00 Eastern / 13:00 UTC**, both flexible.
These are derived from retained Eastern DTSTART, not a fresh scheduler lookup.
At the November 4 00:30 UTC reconciliation the Release window was still ahead.
No new scheduled run, actual dispatch time or task outcome is claimed.

## Next authorized reconciliation

Use the [prepared 1.2.0 amendment text](automation-task-amendments.md#prepared-120-append-text-not-saved)
only from a context with independently authorized supported task access. Preserve
the complete existing prompt/settings, append only the authorized addition, retain
before/after digests and read back the actual update. The earlier Release Watch
read remains denied in this context; repository evidence is not an alternate route
to obtain that saved object.

For the real execution, declare exactly the capabilities in this watch's
`participatingWatches` mapping: Release/Guidance each have eleven; ES/CSP each have
one SOC capability. Retain real task ID, scheduler run ID, registry version and
all five clocks. Missing identity leaves first-execution verification incomplete even when structural
coverage is complete; missing scope remains an explicit coverage gap. Do
not substitute GitHub Actions IDs, manual reviews or prior-version runs. Source
retrieval is not claim assessment, and a published implementation is not a task
execution. Activation requires every saved task required by the current amendment
to meet the existing readback, exact-version execution and delivery gates.

No new timer, cadence, model, permission, notification setting, factual scope or
automatic expansion is authorized. Future repository changes still need their own
review/merge/deployment authority. The current documentation follow-up is a draft;
it does not authorize another deployment or task update.

## Original downloaded HTML

The original retained Prep11 HTML files are older snapshots, not Sites 277 exports.
Their interactive reopening remains unverified. The in-app browser's file URL
attempt was denied because that surface accepts HTTP/HTTPS; no alternate browser,
local server, raw CDP or indirect execution workaround was used.

The surfaced `open_in_codex` file target opens a Codex UI panel; its contract does
not establish that the original HTML will render interactively or grant permission
to retry the denied operation. [Official file-preview documentation](https://learn.chatgpt.com/docs/artifacts-viewer)
also makes HTML previews conditional on their availability. No independently
authorized, confirmed interactive file renderer has been established here.

The smallest remaining route is an independent owner opening of the unchanged
named files, with actual observations retained as owner-reported evidence, or an
explicitly permitted supported file-opening capability after the denial is
resolved. Assistant desktop interaction also requires confirmed availability.
Static byte inspection and candidate CI offline reopening remain separate proof.
