# SOAR coverage and maintenance

Owner-authorized October 1, 2026. SOAR is a peer Release Guide product at `?product=soar`. Customer-managed SOAR is not a Splunk Enterprise app; Cloud is a separate managed service. Preserve the compact product selection, optional environment refinement, source context, themes and top-bar actions.

## Evidence model

`dist/soar-data.js` is the public-source inventory and finite review backlog. Each stable record has deployment/release scope, source identifiers, exact supporting source sections and an actual bounded verification date. `dist/soar.js` performs deterministic assessments; the screen and full export use the same model. Unknown combinations remain unknown. Initial targets are 8.6.0 and 8.7.0; source versions span selected 6.x–8.x releases. Expand historical coverage only with versioned evidence. Never discard published identifiers. Privileged/Phantom conversion paths are deliberately unresolved rather than assigned an unprivileged path.

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
- FR-M documentation establishes scoped GovCloud/FIPS/playbook restrictions, not every feature or an individual customer's authorization. FR-H remains unestablished without SOAR-specific evidence. Current commercial region lists do not establish historical availability.
- Current issue-page retrieval omitted rows: never turn that into a claim of zero issues. Cloud release notes say September 2 for 8.7 GA while the known-issues heading says September 3; the service table has a stale April date label. Preserve the discrepancies and use the explicit GA release statement for GA.

## Existing schedules and ownership

No extra watch is created. Release Watch (daily 05:00 Eastern) owns SOAR release/build, route, requirement, issue, advisory, Broker and app inventory. ES Editions Watch (daily 06:00) owns ES entitlement and pairings. CSP FedRAMP Watch (daily 07:00) owns SOAR regions and restricted environments. Guidance Audit (Monday/Thursday 08:00) independently checks consequential claims and full report behavior. Their privacy, public-source, publication parity and further-interface approval rules remain intact.

Every run checks changes in its source inventory and verifies affected claims plus a bounded high-priority selection. Maintain `backlog` with priorities, status and next evidence question; do not imply every historical claim was reverified. The shared source-register generator resolves SOAR record source IDs and keeps exact sections. Preserve retired sources, append-only change history and independent publication/source/claim dates.

## Validation and reports

Run all three metadata checks and the complete Node suite before publication. SOAR regression coverage must include pre-7.0 bridges, OS conditions, privileged unknown paths, Cloud milestones, commercial/FR-M/FR-H boundaries, malformed/repeated links, exact builds, target prerequisites even when not new, and all report citations. The existing WebMCP names accept SOAR using `platform=enterprise|cloud`, no host release, exact catalog versions, and optional SOAR environment identifiers. No tool mutates the page or a customer system.

Screen disclosures are collapsed by default. Print and dated HTML use the full same report with expanded requirements, environment qualification, source sections, revision and verification appendix. Verify post-print screen restoration. Both green and Cisco themes require readable controls and reports. Browser interaction, native PDF pagination and independently reopened downloads are separate from structural checks.

The owner-requested browser follow-up supersedes the initial no-browser observation. Rendered Chrome checks covered customer-managed and Cloud selection, invalid-link blocking, exact links, conditional legacy bridges, provider-specific regions, restricted-environment scope, navigation, keyboard controls, both themes and a 390px browser iframe without document overflow. Version-specific 8.6 target requirements and issue links are now curated alongside 8.7. Future runs must maintain both target baselines, rather than reusing latest-version requirements.

Print content was prepared through the real browser action, then the captured DOM and actual print CSS were rendered with WeasyPrint and visually reviewed. This is a paginated rendering check, not native Chrome PDF validation. Report content produced by the exact snapshot function was independently reopened in Chrome and inspected, but no successful native download event was available; this is not a reopened downloaded file. Native WebMCP failed because modelContext is unavailable. Keep these remaining native checks explicit.

The daily watches retain their existing schedules and public-source boundaries. The October 1, 2026 11:52:28 PM America/New_York soak checkpoint remains until the review completes its native report checks. Further interface proposals remain owner-gated; the present corrections were explicitly requested by the owner.
