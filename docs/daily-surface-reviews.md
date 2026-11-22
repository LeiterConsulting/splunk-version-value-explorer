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
