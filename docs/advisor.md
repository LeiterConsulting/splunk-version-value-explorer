# Advisor decision briefs

Advisor turns a specific Splunk decision and self-reported context into a bounded
decision brief: established facts, reported-version comparisons, missing user
facts, missing assessed evidence, current conflicts, historical corrections and
concrete next verification. It remains visibly **Work in progress**. It is not a
chatbot, environment inspection, readiness certificate or general upgrade adviser.

## Current coverage

The three cards show coverage and exclusions before data entry. No assessment is
displayed initially. A visitor explicitly builds a brief; editing context, loading
a profile, changing decisions or using browser history requires a new brief.
Print and dated HTML remain disabled until that brief exists.

| Decision | Relevant reports | Bounded outcome |
| --- | --- | --- |
| Plan for SAIA Agent Mode | Deployment, service environment, Platform version, Cloud Connected SAIA version, AI service location, reported access | Feature-specific minima/AWS locations with the current Cloud Connected compatibility block; explicit unknown pairing, activation, runtime policy, entitlement and regulated scope |
| Check ITSI assistant dependencies | ITSI, SAIA and MCP Server versions | Three minimum comparisons; no gap can mean no version uplift indicated **by those minimums alone**. Complete pairing and subagent regional rollout remain separate. |
| Untangle ES AI SOC requirements | Deployment/environment/edition/access, applicable Platform and ES versions, CMP Cloud Connect version | Separate Cloud/CMP chains, the current Cloud ES 8.6+/8.7+ discrepancy, and corrected historical Triage wording. Exact SOAR pairing and agent-specific rollout remain unestablished. |

A minimum is never selected as a recommended target. Reported access never proves
entitlement or customer authorization. A missing fact about a visitor is not
conflated with missing product evidence. Historical Essentials/Triage wording is
not presented as a continuing current contradiction. The separately unresolved
Cloud aggregate-versus-task minimum remains visible with both current sources.

The November 3 candidate uses the exact Agent Mode and Model Runtime pages rather
than inheriting base-SAIA regions. Azure/Dubai base-service listings do not support
Agent Mode; Dublin's feature-specific AWS listing remains usable for native Cloud.
Current Cloud Connected compatibility excludes SAIA 2.2.0–2.3.6; its 2.1.1 fallback
lacks Agent Mode. The general feature page still describes a 2.1+ path, and SAIA-9918
records the current access issue. Enterprise briefs retain this conflict instead
of treating a met minimum or planned 2.4.0 support as a usable path. Runtime must be
enabled, while actual activation and routing still need confirmation. Model
Runtime's external processing and Data zone/Global routing remain visibly separate
from Cloud Connected's broader no-third-party assurance. See the
[scoped assessment and pending rollout](automation-coverage-followups.md).

Unsupported ingest-pressure and generic keep-current choices are removed from
actionable coverage. Their published URLs show the original intent and an explicit
not-covered explanation, without inventing a new assessment. The old broad ITSI
assistance link offers a deliberate transition to dependency-check coverage; it
does not silently reinterpret an availability request as a compatibility result.

## Evidence and dates

Canonical facts remain in the seven existing datasets. No UI change updates source,
claim or lifecycle dates. `content/advisor-admission.json` pins exact assessed
claim/source payloads within a named scope. `content/advisor-goals.json` describes
decision coverage, evidence dependencies, owners, review policy and release gates;
it is configuration, not another factual dataset.

Keep three clocks separate:

1. **Source checked:** the recorded retrieval/check date for that source scope.
2. **Claim/section assessed:** the original capability or supporting-section review
   date. A later Triage-note review does not reverify every older prerequisite.
3. **Brief created:** the time this browser built a result from reported context.
   It does not perform a live source check.

A matching local hash proves content identity, not that an upstream page is still
current. Advisor's configurable review windows are 14 days for recorded source
checks and 30 days for claim/section assessments, inclusive through the due date.
These are product review gates, not vendor support periods. Undated, future-dated,
changed or overdue dependencies pause factual paths. The resulting review-needed
brief contains no changed capability text or confident recommendation.

## Change-driven maintenance

Existing Version Release Watch owns SAIA/ITSI dependencies. ES Editions Watch owns
the ES workflow/edition/deployment chain. CSP FedRAMP Watch owns service location
and regulated evidence. Guidance Audit independently checks coverage, contradictions
and exports. No new timer or schedule change is introduced.

Run `node scripts/advisor-maintenance.cjs` during an existing review when a goal's
dependency changes or its review is due. It reports affected goals, dependencies,
dates and owners without fetching sources or advancing dates. Its `--check` mode
also proves that changed and overdue evidence cannot yield a factual path.
Existing native issue-feed obligations still apply to actual source-watch reviews;
UI normalization is not a new product finding or claim reassessment.

For a changed dependency, inspect the actual claim and supporting section. Record
any current conflict and decision impact; preserve corrected wording as history.
Update only the justified admission pin after scoped reassessment. A real source
check may change its check date without pretending the underlying claim was newly
assessed. Do not refresh all pins automatically. Regenerate the two adapters with
`node scripts/sync-advisor.cjs`, then run its check and the maintenance gate.

## Prioritized expansion backlog

The registry is the single configuration source for the on-screen backlog:

1. Exact app/Platform pairing decisions, with patch-specific qualifications and
   supported negative outcomes.
2. Capability-specific ITSI/ES agent regional rollout, without inheriting base
   assistant or hosting coverage.
3. Additional released capability decisions with useful bounded outcomes.
4. Licensing, sizing and operational decisions only after sufficient assessed
   published documentation supports their exact recommendation and limitations.

These are emerging opportunities, not admitted facts or promised availability.
Add a card only with an implemented decision, exact assessed evidence dependencies,
an existing maintenance owner, known/unknown/negative/conflict and drift/freshness
tests, and screen/PDF/offline-HTML routes. The registry generator refuses a new
card until its decision handler is explicitly implemented. Do not expand coverage
just to increase the number of cards.

## Privacy and Release Guide handoff

Inputs remain local. Save/load/clear uses the existing namespaced localStorage key;
older profiles require review under the revised coverage. No profile field is read
from or appended to an Advisor URL. Copy shares the decision and theme only. PDF
and dated HTML deliberately retain relevant self-reported inputs and all caveats.

A commercial Enterprise Agent Mode version-gap brief can carry a ten-minute,
single-use sessionStorage note to the existing Enterprise Release Guide. The
navigation URL contains no reported version or target. The note retains the
reported version and the distinction between a documented minimum and a target;
it never changes comparison selections. The guide's normal defaults are not an
Advisor recommendation. Visitors choose their comparison themselves, after which
the Release Guide's established sharing behavior applies. The private note is
consumed once, excluded from copied links/reports and ignored when malformed or
expired. No inventory or visitor identity is stored on a server.

## Release gates

Run the four existing sync commands in required order and their check gates,
Advisor adapter/maintenance gates, feed/native-feed checks, the complete unit suite
and build. The dedicated browser matrix covers explicit build/dirty/empty states,
keyboard, labels, themes, phone/tablet/laptop, history, older links/profiles,
private handoff, snapshots and changed-evidence rejection. Exact-candidate CI adds
known/unknown/CMP/regulated/changed-evidence decision briefs to native PDF rendering
and independent offline HTML reopening. Landing and unsupported views deliberately
block exports, without being labelled failed assessments. Retain actual artifacts,
inspect novel layouts and verify the deployed custom-domain UI, assets and D1.
