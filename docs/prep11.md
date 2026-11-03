# Preparing for Splunk 11.x and later releases

Owner-authorized October 15, 2026. The normal navigation now includes **Prep for 11.x**, at `?view=splunk-11`. It is a public-source preparation and announcement page, separate from released Enterprise comparisons. It does not add a selectable 11.x upgrade target or infer an upgrade edge.

Canonical content is the `preparation11` set and its prefixed source catalog in `content/datasets/guidance.json`. The existing generated guidance adapter and atomic complete-bundle delivery carry it, preserving the seven-dataset publication schema. `dist/prep11.js` supplies the shared selection, render and report model; `dist/prep11-ui.js` supplies the page. No new WebMCP tools, visitor storage, forms or tracking are introduced.

## Evidence scope

Initial public discovery on October 15 found no retrieved version-specific 11.x release announcement, date, migration path, deployment mandate or compatibility matrix. This is a bounded search outcome, not proof that no announcement exists. Keep the page's explicit uncertainty until a directly retrieved public source supports a change. Only directly retrieved public published evidence may support a future requirement; private discussion is never a source.

The current preparation baseline covers Operator version tuples, storage/recovery architecture, app delivery, resource controls and Cloud operating-model assessment. Current-release guidance and adjacent-product announcements retain their exact product/version and release-stage scope. The September 15 Cisco AI POD statement does not establish every Enterprise component's future deployment model. The September 30 10.6 announcement supplies a present custom-version-detection preparation action.

The SOK 3.2 help matrix and its linked change log disagree on Kubernetes maximum and release date. Preserve both: help says 1.32–1.37 and September 24, while the linked change log says 1.32–1.36 and September 8. Do not resolve this with adjacent support rows or choose a universal maximum.

Each future announcement needs a stable ID, exact public source/section, source date, actual check and claim-verification dates, product/version/environment, release stage, qualifications, impact and next preparation action. Unknown effective dates remain null. Keep historical statements with their original dates and explicit supersession; an announcement does not become delivery evidence automatically. An 11.x plan cannot establish Cloud rollout, entitlement, FR-M/FR-H authorization, premium-app pairing or Forwarder receiver support.

## Maintenance and validation

Version Release Watch owns discovery and current source/claim updates. Guidance Audit checks coverage and cross-route consistency. ES Editions Watch supplies edition-specific qualifications; CSP FedRAMP Watch supplies product/region/authorization evidence. Existing schedules and timing modes remain unchanged; no new task is needed.

The page's filters affect the screen. PDF and saved HTML contain all maintained updates, preparation areas, open questions and numbered citations, with the current screen selection described. Saved HTML freezes its report, not its external sources. URLs preserve area, update type, search, Cisco theme and meaningful anchors. Ambiguous or comparison-shaped prep URLs retain original input, block exports and offer explicit recovery.

Comparison perspective hooks must leave Prep11 destination URLs intact, including
shared filters, anchors and invalid original input. The shared navigation carries
the selected theme, not comparison perspective or release selections, into a fresh
preparation view. Browser regression checks require visible preparation content,
enabled exports and preserved back/forward comparison state; the page heading alone
also appears on invalid-link recovery and is insufficient verification.

The export route inventory includes both themes for default, selected/shared and invalid prep inputs. Dedicated application CI must pass native PDF page checks, independent offline HTML reopenings, phone layouts and real Tab access to print/save actions. Preserve surrounding Platform, legacy and ES routes. Inspect retained novel page images separately from automated geometry checks.

### Print pagination candidate, November 3

The retained default-theme Safari PDF from Site 275 preserves the report's content,
but splits an App Framework category label from its heading and a citation title
from its URL/review scope. The candidate groups short preparation/update cards,
questions and source entries with `break-inside: avoid` and the legacy
`page-break-inside` alias. Inner lead blocks keep labels/headings with their opening
text when an oversized card must fragment. No fixed height or clipping is used.
This addresses a known WebKit limitation: it recognizes `break-after: avoid` but
does not enforce that value in paged output; see [WebKit 294559](https://bugs.webkit.org/show_bug.cgi?id=294559).

The [print investigation](audits/2026-11-03-prep11-print-pagination.json) retains
the original PDF identity, page-text fixture and validation limits. Every canonical
card paragraph and citation URL/review scope gets an occurrence-specific page
assertion in both-theme CI. A separate synthetic oversized card must print all
48 added paragraphs and its final marker across multiple pages. These are native
Chromium checks. A new candidate Safari capture, Cisco-theme native Safari capture
and interactive reopening of the actual live downloaded HTML remain unverified.
Do not interrupt an active Safari session or substitute a local server/alternate
browser path for a denied file opening. This candidate requires separate approval
before merge or deployment.

## November 2 scoped pilot review

The current help matrix was independently assessed: SOK 3.2.0 lists Enterprise
10.0.12–10.6.0, Kubernetes 1.32–1.37 and September 24. The linked changelog still
lists Enterprise 10.6.0, Kubernetes 1.32–1.36 and September 8. Both scopes remain
visible; neither establishes 11.x support. Architecture/app-delivery and the two
dated announcement-context claims were assessed separately. Targeted official
discovery found no qualifying 11.x announcement, which does not prove absence.

The page header now labels the discovery date. It does not imply all preparation
claims were refreshed. The exact 10.6 workload source remained inaccessible, so
its October 15 source/claim dates are preserved with a visible review blocker.
The migration landing page was retrieved, but the complete staffing/transition
scope was not assessed; its claim date is also preserved with an explicit gap.
These qualifications appear in screen, PDF and offline HTML.

See the [coverage review](audits/2026-11-02-prep11-advisor-coverage.json),
[constitution](automation-constitution.md) and [task reconciliation](automation-task-amendments.md).
The earlier November 2 audit's eight URL retrievals do not establish semantic
assessment. The pilot is pending saved-task readback and verified real first
executions; no cadence or permissions were changed by this implementation.
