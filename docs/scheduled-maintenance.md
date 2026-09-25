# Scheduled maintenance

Version Compass uses scheduled tasks running in Codex to keep its public comparisons aligned with published Splunk documentation. The tasks review evidence, identify affected content, validate supported changes, and maintain the repository and published site. They are intended to reduce stale guidance while preserving traceability and human review where evidence is uncertain.

This document describes the maintenance model and its boundaries. It is a conceptual guide for readers evaluating the repository or considering a similar site, rather than a task configuration or operational recipe.

## Review coverage and cadence

The configured schedules below use America/New_York time, including daylight-saving changes. They describe intended cadence, not a guarantee of execution or publication at an exact minute.

| Review | Scheduled cadence | Responsibility |
| --- | --- | --- |
| Version Release Watch | Daily, 5:00 AM Eastern | New or revised releases, security and removal notices, platform compatibility, migration prerequisites, and customer-managed Observability components across the Release Guide. |
| ES Editions Watch | Daily, 6:00 AM Eastern | Essentials/Premier capabilities, deployment and licensing qualifications, agent prerequisites, release history, workflow explanations, and unresolved source questions in the ES editions comparison. |
| CSP FedRAMP Watch | Daily, around 7:00 AM Eastern | Hosting providers, regional differences, Classic/Victoria scope, and separate FR-M/FR-H availability and authorization evidence across products. |
| Version Guidance Audit | Mondays and Thursdays, 8:00 AM Eastern | Broader revalidation of existing guidance across both views, including upgrade paths, dependencies, technical changes, lifecycle evidence, citations, historical URLs, report behavior, and presentation consistency. |

The dedicated environment watch owns routine CSP and FedRAMP evidence updates; the other watches check related product changes and the broader audit checks cross-view consistency. The daily watches focus on changes; the wider audit also challenges information already published. The dedicated editions watch owns routine edition updates, while the release watch checks related product records and the guidance audit checks the complete experience. This division reduces duplicated editing without leaving the editions feature outside the broader review.

## Evidence and interpretation

Public official sources underpin factual claims: release notes, upgrade guidance, compatibility matrices, system requirements, service details, support policies, Splunkbase listings, security advisories, and official component release streams. Splunk Lantern provides migration guidance with its applicable scope. A working link alone does not validate a statement; the source must support the specific release, capability, requirement, or qualification presented.

The reviews preserve distinctions that can materially change a reader's decision:

- Customer-managed Enterprise compatibility versus Splunk-managed Cloud availability and pairings.
- Exact maintenance-release constraints versus the simplified release lines shown in selectors.
- Rolling Observability service milestones versus versioned Collector, chart, instrumentation, and RUM components.
- Announcements versus documented delivery, and general availability versus limited release stages.
- Edition, entitlement, region, deployment, and paired-service requirements.
- Hosting provider versus monitored workloads; region versus compliance environment; FR-M versus FR-H without inheritance between levels.
- Offering authorization versus individual feature availability; current service evidence versus historical release availability.
- Bundled versus app-owned components, defaults versus options, and deprecation versus removal.
- A technical change versus a potential breaking change, required action, or validation item.
- Support eligibility versus compatibility; one does not establish the other.

Summaries must retain meaningful explanations on the page as well as links for deeper review. Source citations do not imply Cisco or Splunk endorsement. Version Compass remains an independent planning aid, not an official vendor publication or an environment-specific upgrade plan.

## Automatic changes and human review

Clear, authoritative evidence can support automatic factual corrections and publication within the existing site scope. The same maintenance model allows repairs to stale release metadata or mismatches between repository and deployed content. A run that finds no material change does not create an empty release note, advance dates, commit, or deploy.

Ambiguous, conflicting, incomplete, or unsupported findings are held for human review instead of being converted into a confident recommendation. Where the comparison already presents a source question, both cited statements and their applicable versions remain visible until authoritative evidence resolves it. The tasks must not infer an entitlement from a license, invent a release identifier, or silently broaden availability.

Configured automation does not bypass repository protections, access permissions, or publication approvals. A blocked destination or failed validation is an incomplete update, not a successful publication. New product scope or agent interfaces are not automatically authorized by a routine maintenance schedule.

## Shared content and validation

The site separates maintained evidence from its presentation. Platform and migration data, premium-product and Observability data, lifecycle guidance, and editions evidence have distinct structured datasets. The Release Guide's interface and browser-based WebMCP tools share comparison logic; the print reports draw from the corresponding report content or evidence records. This limits discrepancies between what a person reads, prints, shares, or retrieves through an agent.

Validation is intended to cover more than syntax. Representative journeys exercise platform-first compatibility gates, Cloud scope, citations, exact release identifiers, historical and malformed links, and restoration of shared selections. Editions checks cover filtering, source qualifications, navigation, and report content. Print checks cover expanded details, complete capability coverage, numbered references, and restoration of the screen state. Optional themes must retain the same evidence and independent-publication disclosure.

The repository's test suites and release-metadata check provide repeatable gates. They do not prove that every upstream claim is correct or that every browser paginates identically. Rendered browser, mobile, PDF, or native WebMCP verification is reported only when actually performed; unavailable checks remain explicit limitations.

## Publication and transparency

Material changes are recorded in the [daily release notes](releases/README.md), grouped by America/New_York calendar date. Multiple changes on the same day share a note. The record explains the affected content, practical impact, compatibility or readiness implications, sources, validation, and publication target or status. Git history preserves the underlying changes for inspection.

The newest dated release note controls publication metadata through the repository's [synchronization script](../scripts/sync-release-metadata.cjs). The header's full and compact dates, direct release-note link, print dates, shared-report metadata, release index, and agent metadata must remain consistent. This publication date is separate from evidence-review dates: a new site update does not establish that every support policy or editions source was rechecked that day.

For site changes, completion requires the same validated content in the remote repository and the existing public deployment. A successful commit alone does not establish that the live site is current, and a deployment alone does not establish that the repository is synchronized. Runs are expected to report actual outcomes and any unresolved drift.

Each writer works from the freshest source. If another task changes it, reconciliation and renewed validation are necessary before publication; schedule spacing alone is not protection against concurrent edits. Unresolvable conflicts are surfaced rather than overwritten.

Release notes document material changes, not every scheduled execution. The absence of a new note may reflect a no-change review and is not, by itself, proof that a task ran successfully. The schedules are maintained in Codex outside this repository; repository tests and CI checks are separate validation mechanisms.

## Applying the approach to a similar site

The transferable design is a bounded editorial maintenance process around a shared evidence model. A similar site benefits from defining its audience and decision scope, identifying authoritative sources, and representing claims with enough context to preserve important qualifications. Schedules should reflect how quickly those sources change, with focused watches complemented by a broader review of existing guidance.

Clear ownership matters when several tasks can edit overlapping content. So do explicit uncertainty boundaries, stable historical identifiers, reproducible validation, and an observable publication record. Separating publication dates from source-review dates helps avoid suggesting a level of freshness that has not been established. Keeping presentation and agent access tied to the same evidence reduces the number of independent facts to maintain.

Copying or forking this repository does not copy its Codex tasks, credentials, publishing access, or deployment. A separate installation needs its own maintenance ownership, source scope, schedules, permissions, and publication destination. The repository demonstrates the content and validation structure; the surrounding automation remains a separately managed operational responsibility.

## Related documentation

- [Contribution and review principles](../CONTRIBUTING.md)
- [Product tracks and dependencies](product-tracks.md)
- [Technical changes](technical-changes.md)
- [Enterprise-to-Cloud guidance](enterprise-to-cloud.md)
- [Route guidance, lifecycle context, and historical links](report-guidance.md)
- [ES editions evidence and maintenance](es-editions.md)
- [Cloud environments and regional evidence](cloud-environments.md)
- [Browser-based agent access](webmcp.md)
- [Release history](releases/README.md)


## Perspective presentation

The four maintenance tasks also cover the integrated [Cloud guidance perspectives](perspective-preview.md). Product watches preserve relevant presentation, the CSP/FedRAMP watch reviews evidence relevance, and the twice-weekly audit reviews taxonomy, completeness, shared links, responsive header, both themes and print behavior. Editorial relevance never changes factual availability or removes conflicting evidence. All views use the same maintained data.

## Content-change markers

All four tasks maintain the [content-change marker policy](content-updates.md). Scoped metadata makes changed content discoverable while distinguishing website edits from product lifecycle changes. Badges expire after two published factual-content cycles; ordinary checks and presentation-only changes do not consume a cycle. The tasks preserve cited deprecation/removal warnings after marker expiry.

## Report navigation and density

Preserve the compact working layout in `dist/navigation.css` and contextual section navigation in `dist/navigation.js`. Navigation reflects the rendered route, omits hidden sections, retains filters and theme, highlights reading position and opens technical details when requested. Review narrow-screen overflow, keyboard access, reduced-motion behavior and offsets below the fixed header; screen-only navigation must stay out of printed reports. Styling-only work does not advance badge cycles.

Preserve the top-bar share-sheet (Copy Link) and floppy-disk (Print / save PDF) actions on both routes. Keep original validation and handlers, accessible names, hover/focus labels, copy feedback, 44px targets and both theme treatments; omit controls from print.

All four tasks maintain the [source compendium](source-register.md). Synchronize its persistent ledger after citation changes, retain retired sources, and preserve source-level review dates. Record verified inaccuracy findings with dates and scope; unknown first-use history stays unknown. Keep About's schedule accurate and run the source-register check before publication.
