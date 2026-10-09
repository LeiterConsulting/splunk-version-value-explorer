# SOAR coverage and maintenance

Owner-authorized October 1, 2026. SOAR is a peer Release Guide product at `?product=soar`. Customer-managed SOAR is not a Splunk Enterprise app; Cloud is a separate managed service. Preserve the compact product selection, optional environment refinement, source context, themes and top-bar actions.

## Evidence model

`content/datasets/soar.json` is the canonical public-source inventory and finite review backlog; `dist/soar-data.js` is its generated adapter. Each stable record has deployment/release scope, source identifiers, exact supporting source sections and an actual bounded verification date. `dist/soar.js` performs deterministic assessments; the screen and full export use the same model. Unknown combinations remain unknown. Initial targets are 8.6.0 and 8.7.0; source versions span selected 6.x–8.x releases. Expand historical coverage only with versioned evidence. Never discard published identifiers. Privileged/Phantom conversion paths are deliberately unresolved rather than assigned an unprivileged path.

Authoritative source order:

1. Versioned On-premises release notes, build corrections, upgrade-path tables and installation/system requirements.
2. Cloud release history and service description, distinguishing GA, Controlled Availability and actual tenant rollout.
3. Known/fixed issue pages and advisory.splunk.com, retaining exact CVE follow-up requirements.
4. Automation Broker release notes, App for SOAR prerequisites, Export's separate release and compatibility pages; official Splunkbase connector listings when an individual connector is assessed.
5. SOAR restricted-environment guidance and exact offering evidence. Commercial hosting, FR-M, FR-H, feature entitlement, FIPS and customer authorization are independent.

The inventory contains exact public URLs and section names. Do not replace it with generic search queries. Discover newer releases from the product documentation hub and current release streams before checking maintained versioned claims. A fetch is not a claim verification. No restricted or internal source is needed.

## Critical invariants

- 8.7 requires Python 3.13-compatible automations. Automation Broker has its own version/runtime lifecycle.
- Retain on-premises 8.7 build 232 versus corrected build 243 (September 22) scope; do not apply the build correction to Cloud.
- The 8.7 table specifies the 8.5 bridge for selected pre-7.0 versions; PostgreSQL and legacy OS transitions remain conditional steps. Do not confuse the table's supported hops with capability milestones.
- Do not route external credential-manager users through on-premises 8.6 as a default bridge. Preserve its explicit warning and the CyberArk certificate-verification action from SVD-2026-0804.
- App for SOAR and SOAR Export have different compatibility matrices. Their exact listed platform rows do not override newer security/forwarding patch warnings elsewhere in Version Compass.
- The exact Moderate Marketplace CSO names SOAR as a Certified Service, while restricted-environment documentation establishes scoped GovCloud/FIPS/playbook restrictions. Neither record establishes every feature, entitlement, tenant rollout or an individual customer's authorization. The current High Certified Services list does not name SOAR, but absence is not an exclusion claim; FR-H therefore remains unestablished without affirmative SOAR-specific evidence. Current commercial region lists do not establish historical availability.
- Current issue-page retrieval omitted rows: never turn that into a claim of zero issues. Cloud release notes say September 2 for 8.7 GA while the known-issues heading says September 3; the service table has a stale April date label. Preserve the discrepancies and use the explicit GA release statement for GA.

## Existing schedules and ownership

No extra watch is created. Release Watch (daily 05:00 Eastern) owns SOAR release/build, route, requirement, issue, advisory, Broker and app inventory. ES Editions Watch (daily 06:00) owns ES entitlement and pairings. CSP FedRAMP Watch (daily 07:00) owns SOAR regions and restricted environments. Guidance Audit (Monday/Thursday 08:00) independently checks consequential claims and full report behavior. Their privacy, public-source, publication parity and further-interface approval rules remain intact.

Every run checks changes in its source inventory and verifies affected claims plus a bounded high-priority selection. Maintain `backlog` with priorities, status and next evidence question; do not imply every historical claim was reverified. The shared source-register generator resolves SOAR record source IDs and keeps exact sections. Preserve retired sources, append-only change history and independent publication/source/claim dates.

## Validation and reports

Run sync-release-metadata, sync-content, sync-source-register and sync-content-revision in order, their four `--check` gates, the complete Node suite and the build before publication. SOAR regression coverage must include pre-7.0 bridges, OS conditions, privileged unknown paths, Cloud milestones, commercial/FR-M/FR-H boundaries, malformed/repeated links, exact builds, target prerequisites even when not new, and all report citations. The existing WebMCP names accept SOAR using `platform=enterprise|cloud`, no host release, exact catalog versions, and optional SOAR environment identifiers. No tool mutates the page or a customer system.

Screen disclosures are collapsed by default. Print and dated HTML use the full same report with expanded requirements, environment qualification, source sections, revision and verification appendix. Verify post-print screen restoration. Both green and Cisco themes require readable controls and reports. Browser interaction, native PDF pagination and independently reopened downloads are separate from structural checks.

The owner-requested browser follow-up supersedes the initial no-browser observation. Rendered Chrome checks covered customer-managed and Cloud selection, invalid-link blocking, exact links, conditional legacy bridges, provider-specific regions, restricted-environment scope, navigation, keyboard controls, both themes and a 390px browser iframe without document overflow. Version-specific 8.6 target requirements and issue links are now curated alongside 8.7. Future runs must maintain both target baselines, rather than reusing latest-version requirements.

Print content was prepared through the real browser action, then the captured DOM and actual print CSS were rendered with WeasyPrint and visually reviewed. This is a paginated rendering check, not native Chrome PDF validation. Report content produced by the exact snapshot function was independently reopened in Chrome and inspected, but no successful native download event was available; this is not a reopened downloaded file. Native WebMCP failed because modelContext is unavailable. Keep these remaining native checks explicit.

The daily watches retain their existing schedules and public-source boundaries. The October 6 policy supersedes the earlier mandatory three-day baseline: evidence and impact determine advancement, while a 72-hour observation window may run alongside delivery. Use the existing progress task without restarting timers. The October 7 owner-reported PDF, downloaded-HTML reopen and narrow-screen verification applies to its existing report baseline; the historical assistant limitations above remain historical evidence, not unresolved baseline blockers. New affected factual/runtime batches still require their own applicable checks.

## October 8 independent audit

The [bounded audit](audits/2026-10-08-version-guidance-audit.json) independently confirmed the existing 8.7 build, Python, conditional bridge and privileged-boundary qualifications. It also found a consequential source-build gap: the [8.6 unprivileged upgrade table](https://help.splunk.com/en/splunk-soar/soar-on-premises/install-and-upgrade-soar-on-premises/8.6.0/upgrade-splunk-soar-on-premises/upgrade-path-for-splunk-soar-on-premises-unprivileged-installations) specifies **6.4.1.361 and higher**. The October 9 repair keeps the generic `6.4.1` selection, but marks the direct 8.6 route as exact-build conditional and states that an unspecified or earlier 6.4.1 build is not established as eligible. Route, report and WebMCP tests retain this qualification.

Fresh retrieval recovered the separate [Enterprise Export 8.7 prerequisites](https://help.splunk.com/en/splunk-soar/splunk-app-for-soar-export/8.7.0/install-or-upgrade-the-splunk-app-for-soar-export-on-splunk-enterprise/check-prerequisites-for-splunk-app-for-soar-export-on-splunk-enterprise) and [Cloud Export 8.7 prerequisites](https://help.splunk.com/en/splunk-soar/splunk-app-for-soar-export/8.7.0/install-or-upgrade-the-splunk-app-for-soar-export-on-splunk-cloud-platform/check-prerequisites-for-splunk-app-for-soar-export-on-splunk-cloud-platform). Their exact rows align: Export 8.7.0 with CIM 8.5.0-1681; Enterprise 10.4.2/10.2.2; Cloud 10.6.0/10.5.2605/10.4.2604/10.3.2512/10.2.2510; ES 8.7.0/8.6.1; SOAR 8.7.0/8.6.0; Python 3.13 and CIM required. These are functionality-tested combinations, not an override of security patch floors, an App for SOAR matrix, or evidence of tenant rollout. The previous cached disagreement is retained in the audit as retrieval history, rather than asserted as a current conflict.

Actual browser checks covered Cisco on-premises and default-theme legacy Cloud comparisons, collapsed technical requirements, keyboard focus, invalid repeated selections, read-only WebMCP parity/rejection and a successful complete HTML download. Independent reopening of that downloaded file was blocked by the browser's URL policy. No new native PDF page inspection or narrow-screen certification is claimed; these audit limitations are separate from the accepted owner baseline.
