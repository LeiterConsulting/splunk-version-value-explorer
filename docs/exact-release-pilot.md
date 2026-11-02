# Bounded exact-release graph pilot

Draft, November 2, 2026. Owner authorized building and validating this pilot;
merge and deployment still require publication approval. No scheduled operational
coverage is claimed. Existing release-line URLs and tool semantics are unchanged.

The additive `/?view=exact-releases` view compares selected Enterprise 9.4 and
10.4 releases. Its separate Universal Forwarder component selector covers only
the named 10.4 useAck regression. Exact identity is product + component + full
three/four-component version. An unlisted patch is rejected, never rounded.
The catalog is intentionally incomplete, not a replacement release catalog,
supported upgrade planner, vulnerability scanner or historical inventory.

## Canonical model and evaluation

`guidance.exactReleases` in `content/datasets/guidance.json` owns the structured
graph; `guidance.sources` owns its assessed public source directory. The existing
atomic content bundle, adapters, source register and publication identity carry
these facts. `dist/exact-releases.js` is a deterministic DOM-free evaluator shared
by screen, PDF, offline HTML and the additive read-only WebMCP tool. The content
generator validates graph identities, scope, evidence and cycles before delivery.
No graph database, customer storage, new endpoint, tracking or schedule was added.

The graph has branches, component-specific exact release nodes, stable capability
and issue identities, scoped claims with append-only assessment histories, and
change events. Typed relationships separate `precedes`, `inherits`, `supersedes`,
`backport-of` and `supported-upgrade`. Introduction, change, removal, regression,
fix, older-branch remediation, assessment and documentation correction are distinct
events. No global release-date order is inferred from numeric version ordering.

Snapshots select only claims whose explicit product, component, branch and version
scope matches. Scope uses an exact list or inclusive bounded range; a range is
authored only when the assessed source supports it. A 10.4 initial-release claim
is not automatically inherited by maintenance releases. This deliberately leaves
several endpoint facts unknown. Claims cannot migrate between Enterprise and UF.

`inherits` requires explicit sourced scope and equal states, rejects multiple
parents/cycles, and carries the oldest upstream verification date. Supersession
requires a supported replacement applicable to that endpoint; prior claims and
assessment history remain accessible. As-of assessment dates select the knowledge
available in this catalog, not reconstructed historical publication certainty.
This new pilot has no assessments before November 2, so earlier as-of snapshots
are unknown. Staleness after 30 days is a review-window signal, not vendor support
policy or a renewed verification. No evaluator run changes canonical dates.

Net comparisons derive both endpoint snapshots. Catalog events within the selected
version interval are shown separately. They are not installation hops or a claim
that a cross-line upgrade encounters every entry. Route events require an explicit
list of individually evidenced supported edges. The real seed has no assessed
exact upgrade edges, and consistently reports the route unknown. Synthetic unit
fixtures demonstrate regression-then-fix along an evidenced route without adding
those edges to customer data. No pairwise comparison facts are independently stored.

## Assessed evidence and limits

- Enterprise 9.4 release notes: the app-level implicit `filterType` default changes
  in 9.4.3; updated configuration descriptions appear in 9.4.8. A separate
  documentation event preserves that distinction. Source section explicitly says
  the functional change continues onwards; propagation is bounded at 9.4.16.
- 9.4 deprecated and 10.4 removed-feature tables: HTML dashboard support is
  deprecated at the assessed 9.4.0 endpoint and removed at 10.4.0. Other patch
  endpoints remain unassessed for this capability.
- 10.4 release notes: TLS 1.3 introduction at 10.4.0. Legacy TLS statements in those
  notes and the 10.4 upgrade guide contradict each other. Both claims are retained
  as conflicting at 10.4.0. This pilot does not silently amend existing release-line
  guidance, and does not assume either source wins. Follow up through Guidance Audit.
- SVD-2026-1007: only **CVE-2026-76288** was assessed. The affected 9.4.0–9.4.15 and
  10.4.0–10.4.3 ranges, and fixed 9.4.16/10.4.4 endpoints are represented. Splunk Web
  being enabled is a retained qualification. Parallel remediation on the older
  branch is modeled as a backport relationship with an explicit caveat: vendor
  evidence establishes fix applicability, not code ancestry or chronology. No
  assertion covers the advisory's other CVEs, all security, Cloud rollout, or UF.
- 10.4.3 fixed issues independently corroborates the 10.4 release-note UF warning:
  UF 10.4.2 can stall when acknowledgements are enabled on a receiving HF or indexer;
  the named issue is fixed in UF 10.4.3. Higher-version guidance does not add catalog nodes. Receiver compatibility and Enterprise-package fixes
  are separate unknowns.

All named sections were retrieved and semantically assessed November 2, 2026.
Source access/section assessment dates are separate from vendor release dates and
site publication metadata. Older release dates were not copied into claim dates.
Official page metadata can lag body updates. The public source directory carries
the exact assessed sections; original claims outside this pilot are unchanged.

The source/claim audit is this bounded manual implementation assessment. It is not
an independent scheduled-watch execution. Independent validation includes direct
assessment of official fixed-issue and advisory detail rather than relying on the
existing dataset's summaries. Further independent Guidance Audit review is a
rollout prerequisite; no second human or agent review is implied.

## Maintenance and rollout proposal

The [draft constitution amendment](exact-release-coverage-amendment.md) and
[proposed registry](../content/exact-release-coverage-proposal.json) assign bounded
ownership. They intentionally do not edit active coverage obligations or saved
tasks while the separate saved-watch amendment work is pending reconciliation.

Initial implementation effort was substantial because exact identity, scope,
conflicts, history, exports and URL behavior all needed explicit tests. No reliable
token/cost/time instrumentation exists for this session; measured totals are null.
For planning, reserve **2–4 engineer days** to complete independent review, candidate
CI/export evidence and publication approval, with **1–2 hours per bounded source
review cycle** plus **2–4 hours** for a conflicting or changed branch. These are
estimates, not observed throughput or promised watch capacity. Review them after
four real cycles, including source reads, claim families assessed, repeated
conflicts, regressions found, deferrals, missed changes and actual resource use.

Before rollout: reconcile current main and the open watch-maintenance draft;
independently review each bounded claim; consume the exact candidate's successful
export artifact and visually inspect novel pages; obtain merge/deployment approval;
publish the matching repo/Sites source and verify live UI/assets/content delivery;
then reconcile saved watch prompts, preserve existing cadence/permissions, and
verify a real execution for each affected owner before activating coverage.
Keep exact release selection optional. Expand one branch or claim family only
after demonstrating useful decisions and affordable maintenance. Defer broader
CVE/SBOM coverage, arbitrary versions and automatic upgrade-path construction.
