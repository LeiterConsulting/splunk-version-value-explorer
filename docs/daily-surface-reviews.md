# Daily public surface reviews

The coverage registry adds **17 individually reported scopes** for the Release
Guide, ES Editions and Cloud Environment. It retains the eight 11.x Prep checks
and all earlier obligations. The public record for each run is the existing
dated `docs/audits/*-coverage.json` receipt, linked to its review inputs. Search
the [audit directory](audits/) for the date and assigned watch. A completed
source review can conclude that the published guidance needs no change.

| Eastern schedule | Existing task | Primary daily scopes |
| --- | --- | --- |
| 03:00 | Version Release Watch | Eight 11.x Prep checks first, then nine Release Guide paths: Enterprise, Cloud, Enterprise-to-Cloud, ES, ITSI, Observability, SOAR, Universal Forwarder and Heavy Forwarder. |
| 04:00 | ES Editions Watch | Edition and licensing, release history and entitlement changes, deployment and regional prerequisites, and feature and workflow dependencies. |
| 05:00 | CSP FedRAMP Watch | Provider and region, Classic/Victoria and service controls, FedRAMP Moderate/High, and premium services and Observability realms. |
| 06:15 Monday/Thursday | Version Guidance Audit | Independent review of scope, evidence, contradictions, and report and citation parity for changed claims. |
| 09:45 | Audit VersionCompass and Ripple | Read-only reconciliation of the due primary-owner rows, linked receipts, and publication evidence. |

The 9:00 a.m. Eastern Sites-linked steward remains the sole public Site
publisher. Watches record and integrate evidence through the existing GitHub
process. Candidate qualification and public readback follow
[release control](release-control.md). Issue-feed changes use the existing
contract and provenance gates.

## 11.x Prep first pass

Start with the eight `prep11.*` rows and the exact sections in the
[coverage registry](../content/automation-coverage.json). Finish those reviews,
including applicable indexed evidence, then assess the nine `release-guide.*`
paths individually before the broad source sweep. Use
[the page's evidence rules](prep11.md) to compare each Prep11 source section
with the current claim. Give each path its own budget and finish other paths if
a source is blocked.

1. **Announcement discovery.** Check the mapped official release and announcement
   channels for explicit Enterprise 11.x statements. Record the channels and
   search boundary. Require a directly retrieved public source for a new
   future requirement.
2. **Operator compatibility.** Compare the official Help matrix and linked change
   log. Retain both tuples, their dates, and any contradiction.
3. **Architecture and recovery.** Review the storage, resilience, and recovery
   guidance in the applicable architecture.
4. **App delivery.** Assess the App Framework and Premium Apps sections
   independently, even when the same document supplies the architecture check.
5. **Workload controls.** Check the exact 10.6 Basic and Advanced modes, including
   prerequisites, fallback behavior, and supported operations for each mode.
6. **Cloud alternative.** Assess the staffing, communication, and transition
   sections of the Cloud readiness guide.
7. **Version detection.** Check the version-format changes and the exact action
   documented for apps and integrations.
8. **AI infrastructure context.** Check the product, deployment, and
   release-stage scope in the Cisco AI POD announcement.

Use exact official indexed sections when the available evidence supports that
specific review. Retain the retrieval method and any direct-access failure.
Search snippets, status codes and digests alone do not substantiate assessments.
Preserve current-release context separately from any future announcement.
Explicitly defer a missing source or assessment and finish the other rows.

## Checking the ES summary against release notes

For the current ES release, the ES Editions Watch compares material changes in the official release table with the visible edition spotlight, the capability filter, and the edition report. Release Watch checks the same changes against the matching upgrade interval and its report. Record the vendor section, the visitor route, and the supported change or reason for excluding it from the summary. An existing catalog row alone cannot establish that a visitor sees the update. For ES 8.8, exercise Exposure Analytics in the edition spotlight, recent-updates filter, and the 8.7-to-8.8 Release Guide. Preserve edition inheritance and deployment qualifications in the PDF and saved HTML.

## What a receipt proves

- Record every due row with its exact scope, official URL and section, supported
  claim assessment, and actual check times. Compare the mapped baseline with the
  current official release notices, lifecycle, advisories and compatibility
  discovery where applicable. Assess changed and due scope within each named
  path. Cite changed sections and exact applicability, including branch, package,
  entitlement, experience, provider, or region where relevant.
- Use the existing `changed`, `assessed-no-change`, `deferred`, `blocked`,
  or `failed` dispositions as supported. List the precise unchecked scope,
  accountable owner, next action and review date for each gap. Retain prior
  evidence dates and any public qualifications when the evidence is incomplete.
- Use `scripts/record-automation-coverage.cjs` and the existing
  [writer procedure](automation-operations.md#daily-writer-procedure). Link the
  watch's own scheduler attempt, bind its review inputs, and include a public
  receipt even if no site fact changes. A changed review still follows the
  normal issue-feed and candidate-validation gates.
- The 9:45 a.m. Eastern audit joins the due tasks for the Eastern run date to their own
  receipts. List each row as completed, incomplete, or missing. Link each
  receipt and call out late or mismatched outcomes. Report independent Guidance,
  GitHub integration, steward selection and live verification with their own
  evidence. Reconcile late receipts using their original clocks. A failed retry
  can coexist with a useful earlier assessment. Show both with their respective
  identities and preserve separate public records for distinct attempts.

Prompt readback happened November 19. First matching scheduled executions
under the new registry and their delivery evidence are pending in the
[amendment ledger](../content/automation-amendments.json).

The existing 9:45 a.m. Eastern diagnostic emits `coverage.daily` for the Eastern calendar date, covering the mandatory sections owned by the three daily watches. Each section lists its primary owner, receipt history, dispositions and recorded follow-ups. `reviewedToday` requires a dated assessment for every claim family in the successful row. A retry that reuses older assessments retains their dates. `nativeReviewMatched` also requires the corresponding native attempt and result. With no scheduler snapshot, the native count is unknown. A missing same-day receipt remains visible even when yesterday’s review was complete. Independent Guidance and Ripple are reconciled separately.

### Recovering a misrouted result

Read the saved task ID, its native attempt ID and its full-precision start before associating a result with a public review. On November 22 the Release and ES task views showed the same ES result, and the CSP service reported distinct starts under a reused run ID. Preserve each observation. The coverage writer and CI check a supplied task identity against the versioned owner mapping and reject conflicting task, run or start fields between a linked source audit and its coverage receipt. Each receipt file needs its own public run ID. A manual review can record actual work and leave any unavailable scheduler identity unknown. Only the subsequent matching native result establishes execution credit.

The [November 22 official-source readback](audits/2026-11-22-release-recovery-source-readback.json) supplies attributed source evidence for the six earlier Release gaps. It records fresh source retrieval times alongside the comparison to the previously retained articles. Owners retain responsibility for comparing their claims and reporting their own outcome.

## Daily GitHub handoff and reader checks

Starting November 25, 2026 (Eastern), use registry 1.5.0 for the primary morning
reviews. Release (03:00), ES (04:00) and CSP (05:00) assess their registered
sections. The 06:15 Guidance task owns their daily integration into GitHub.
Guidance continues its own substantive research on Mondays and Thursdays.
Ripple retains its separate 07:00 refresh. The 09:00 Sites steward alone publishes.
The 09:45 audit reads back each stage, including both public hosts.

**Source owners.** Answer a concrete question a visitor would ask. Compare the
official publication's actual section, the canonical fact, the prominent summary
or decision, and the export. If the answer changed, edit every affected
presentation. Retain edition, deployment, version, access and availability
qualifications. A completed primary row includes a `readerReview`. Choose a
positive route in `tools/export-verification/routes.json` for the section's first
interface. Give the reader-visible region a simple CSS id or class selector.
Quote a distinctive answer from that region. Cite a source from a successfully
assessed claim in the same row. Use the actual review time.

For example, the ES 8.8 Editions history row can use route `editions`, region
`.edition-highlights`, source `rn88` and the release-notes section about Exposure
Analytics. The question is “What can an ES 8.8 operator automate with entity
actions?” The currently displayed excerpt is “Entity actions automate configured
follow-up”. The receipt fields are `question`, `routeId`, `region`, `answer`,
`claimIds` (here `["es-editions.history"]`), `sourceId`, `sourceSection` and `checkedAt` (timestamp with zone). If the
report uses different wording, include the exact corresponding `reportAnswer`.
Add `additionalReaderReviews` for other affected answers or reports. Every changed claim family needs an assertion backed by one of its own assessed sources. Verify the answer and link before recording it. If a row has insufficient
evidence, record the actual disposition, owner, next action and review date.
Keep the last genuine assessment date. No receipt is a distinct outcome.

**06:15 integration.** Read today's source PRs (including drafts, retries and
late arrivals) and unresolved prior handoffs from the public repository. Fetch
the exact head of each into local refs. Record each PR URL and full SHA. From a
trusted checkout run `node scripts/daily-handoff.mjs YYYY-MM-DD MAIN_SHA OWNER_SHA ...`.
Exit 2 means the report has open section reviews. Exit 1 means an input failed
validation. The output distinguishes records already on main from records only
on owner branches, and accounts for each unique attempt once. Read all changed
guidance, feed and release-note diffs even when receipts are identical.
Never repair a collision by dropping either attempt or advancing an assessment date.

Create one combined branch from fresh main. Merge the pinned owner commits with
normal Git ancestry. Preserve distinct append-only audits and feed checkpoints,
resolve substantive overlaps against their cited sources, and regenerate derived
outputs with `npm run maintenance:sync`. Run the handoff check again with the
candidate as base, then `npm run maintenance:verify`. Compare the change set and
every included receipt against the pinned inputs. Qualify the exact pull request
and push runs and the actual downloaded export package. Refetch main and the PR
heads before the merge. If they moved, reassess the delta and requalify the
resulting candidate. Report the merged main SHA, its successful validation and
package identity to the steward. If the cutoff arrives first, name the prior
qualified release and the outstanding PRs. Preserve ownership and dates for any
open content gaps that can safely ship with their existing qualifications.

**09:45 public verification.** Compare the source PRs with the actual merge,
selected main SHA and package, the steward deployment and both public manifests.
Use the existing pipeline diagnostic with the native task, publisher and Sites
readbacks. From a clean checkout of the selected SHA with the export harness
installed, run `node tools/export-verification/live-reader.mjs SELECTED_MAIN_SHA YYYY-MM-DD`.
The command checks the public About summary and source-linked answers, reopens
visitor downloads offline and inspects the printed PDF. It emits per-host,
per-route results and signals partial coverage. Supply its JSON as
`--reader-evidence FILE` to `scripts/pipeline-status.mjs` alongside the Sites
and native task evidence to verify the same source receipt on both hosts. Use the real clock on public Advisor
briefs. Inspect Ripple's own daily result separately. Record the first failed
stage, affected answer, owner, next action and last verified date. Verify the
correction at the failed stage and close it only after a subsequent live check.

The November 24 scheduler editor readbacks are recorded in
`content/automation-amendments.json`. Use a supported native task configuration
read to retain two matching full configuration reads and bind future scheduled
attempts. An editor prompt digest covers only the visible text. Native execution
and current public delivery each require their own evidence.

## Same-day material corrections

After a correction merges, qualify the exact main commit and its export artifact. Check for an in-flight release, then use **Run now** on the existing Site-linked steward. Its normal 09:00 Eastern schedule continues. Capture the saved version and deployment, check both public hosts, reopen downloaded HTML offline and inspect printed PDFs for the changed answer and vendor citation. Record the actual observation times. A same-day field check can close a delivery defect; only a dated primary-owner receipt can close that owner's daily review.
