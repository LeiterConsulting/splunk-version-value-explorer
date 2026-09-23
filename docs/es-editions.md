# ES editions preview

Review URL: https://versioncompass.com/?preview=es-editions

This unlisted preview adapts the supplied `splunk-enterprise-security-editions-comparison.html` into Version Compass's independent design. The original file and colleague email are not shipped. No Splunk/Cisco corporate logo or employer endorsement is used. The ordinary site has no preview navigation, and the preview requests `noindex, nofollow`. The URL is not authentication; anyone with the URL or repository source can discover it. Do not put confidential information here.

## Integration and data ownership

`dist/site-router.js` loads either the existing release application or the editions data/view, never both. Exactly one `preview=es-editions` parameter is required. Existing product and journey routes keep their original logic. The preview does not register WebMCP tools or contaminate the established agent catalog; promote it only after explicit user approval.

- `dist/editions-data.js`: structured, dated source inventory; 20 capability records; six Cloud release-history milestones (8.2–8.7); deployment and licensing notes.
- `dist/editions.js`: one summary and expandable detail experience, search, filters, history selector, copy URL, and print-state handling.
- `dist/editions.css`: scoped styling using the existing design tokens. Mobile rows show explicit edition labels.
- `tests/editions.test.cjs`: opt-in isolation, citations, known conflicts, controls, URL restoration, escaping, and print-state restoration.

The current capability snapshot and the historical matrix are separate. The history selector changes only the history panel. Preserve the source matrix's grouping, identify conflicting agent-specific guidance, and never imply a historical row is the complete entitlement set. Print includes all capability rows and citations regardless of search filters, expands details, and restores disclosure states afterward; history prints the selected release.

The source-reviewed date belongs to this evidence set and is not automatically advanced with site release notes. Keep each record/source review date accurate. The global header still uses `scripts/sync-release-metadata.cjs` and the latest dated site release note.

## Evidence findings and corrections (2026-09-22)

1. **Connector Builder conflict:** the [8.7 agent table](https://help.splunk.com/en/splunk-enterprise-security-8/administer/8.7/ai-assistant-in-security-and-agentic-capabilities/agentic-ai-offerings-in-splunk-enterprise-security) lists Essentials and Premier, while the [8.7 release notes](https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.7/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security) list Premier and representative enablement. Keep Essentials marked for confirmation.
2. **Guided Response discrepancy:** the [8.7 Cloud matrix](https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.7/splunk-enterprise-security-release-notes/splunk-enterprise-security-editions-cloud-capability-matrix) puts enhancements in Premier, while the [8.6 task guide](https://help.splunk.com/en/splunk-enterprise-security-8/administer/8.6/ai-assistant-in-security-and-agentic-capabilities/run-soar-response-actions-using-the-guided-response-agent-in-splunk-enterprise-security) supports both editions on Cloud with platform 10.2+, ES 8.6+ and paired SOAR. The linked 8.6 guide must not be mislabeled as 8.7 evidence. Do not infer base entitlement from an enhancement label.
3. **SOAR pairing:** licensing is not configuration. The [pairing guide](https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.7/splunk-enterprise-security-release-notes/compatibility-and-regional-availability) has version and deployment constraints, including unsupported Enterprise 9.4.0–9.4.2. Premier inclusion does not automatically satisfy the pairing prerequisite.
4. **Platform AI Assistant:** the attached page incorrectly generalized an old 1.1.0 on-premises restriction. The [2.2.0 history](https://help.splunk.com/en/splunk-enterprise/search/splunk-ai-assistant/2.2.0/release-notes/whats-new-in-splunk-ai-assistant) documents Cloud Connected Enterprise Agent Mode in 2.1.0 and region restrictions. Keep the platform app distinct from the ES assistant.
5. **Commercial precision:** the original review recorded workload/ingest and standalone SOAR user-seat models. The September 23 review below supersedes that pricing-page snapshot. Do not claim universal commercial eligibility, automatic agent eligibility, or that standalone Attack Analyzer cannot be purchased. The UEBA FAQ specifically limits the native UEBA feature to Premier; that statement does not apply to every related product.
6. **Announcement scope:** retain public September announcement context without treating marketing statements as universal delivery, entitlement, or release-specific prerequisites.

## Evidence audit — 23 September 2026

The full source inventory, capability/history records, highlights, workflows and existing source questions were checked. This is an evidence correction, not a new ES release or an assertion that the underlying task guides changed today.

- The old security-pricing URL redirects to [Splunk pricing](https://www.splunk.com/en_us/products/pricing.html). Its ES section now lists activity-based, workload and ingest pricing, while the [model FAQ](https://www.splunk.com/en_us/products/pricing/pricing-models.html) names Cloud Platform for activity-based eligibility. Preserve that deployment-scope question. The current SOAR section does not specify user-seat pricing; removing that assertion does not mean existing contracts changed.
- Individual Automation Builder and Connector Builder task guides add platform 10.1+, SOAR Cloud pairing and account/permission requirements. Automation Builder excludes FedRAMP SOAR stacks. Cite the task guides directly, not just the aggregate agent table.
- The 8.7 AI SOC Analyst workflow guide requires ES 8.7+, while the aggregate table lists 8.6+. The 8.7 Malware Reversing/Phishing task guide requires ES 8.6+ and platform 10.2+, while the table lists ES 8.5+. Keep both sides visible; do not silently select the lower baseline. These are version discrepancies, not evidence of different edition entitlements.
- Exposure Analytics' product page labels continuous posture metrics and Entity Profiling as coming soon. Do not conflate those enhancements with already-described entity discovery, change history or general business context.
- Connector Builder's edition conflict and Guided Response's version/enhancement ambiguity remain unresolved. All five source questions appear on screen and in both print appearances, with separate citations. Source dates are distinct from the global publication date; lifecycle-policy dates are not advanced by this audit.

The public route, legacy alias, theme handling, historical release records and existing WebMCP boundary remain unchanged. No new agent tools or generic activation controls are introduced.

## Scheduled maintenance ownership

A dedicated ES Editions Watch owns this evidence set. The existing twice-weekly Version Guidance Audit also reviews it. The main release watch checks cross-dataset consistency without duplicating the dedicated edition review. All tasks must use the freshest GitHub and Sites source before editing; do not overwrite one with an older checkout. If another run changed source, reconcile and rerun validation before publishing.

Review every cited record against public official sources: editions overview, release notes, Cloud matrix, agent compatibility and individual task pages, Cloud Connect, regional and SOAR pairing matrices, pricing, licensing/trial documentation, UEBA, Exposure Analytics and announcements. Cite each claim directly. Do not import internal collateral or reproduce employee contact details. Keep source scope, version, region, edition, entitlement, prerequisites, and release stage distinct.

Automatic changes require clear authoritative evidence. For conflicting, incomplete, ambiguous or inferred findings, preserve the qualification and report for human review; do not choose a convenient source or quietly broaden availability. Do not add generic activation-verification UI. Do not remove the preview switch, publish navigation to the feature, or expose new agent tools without explicit approval.

For material changes, append the Eastern-date release note and index, run `node scripts/sync-release-metadata.cjs`, then `node scripts/sync-release-metadata.cjs --check` and `node --test tests/*.test.cjs`. Publish identical validated files to GitHub and the existing public Sites project. Verify both outcomes and report exact commit, deployment, note URL, changed claims, sources and unresolved issues. No change means no date bump, note, commit or deployment. Existing publication drift is a defect, not a no-change result. If publication is blocked, state which destination remains incomplete.

## Review status

Automated checks pass. Rendered browser/mobile and PDF pagination review was unavailable in this static-site environment. The preview remains unlisted for colleague review of layout, scanability and substantive qualifications before any normal-navigation launch.

## Expanded review presentation (22 September)

Capability descriptions and deployment/licensing summaries are visible without expanding controls. The page adds linked workflow explanations and an 8.7 spotlight, with section navigation and wider description columns. Secondary qualifications remain expandable. Source questions show the two statements side by side, source versions, the practical interpretation and the exact unanswered question. Connector Builder is a direct conflict; Guided Response is a version/enhancement-scope ambiguity, not proof of a changed base entitlement.

The daily watch and twice-weekly audit must cover `highlights`, `workflows` and `conflicts` alongside capabilities, notes and history. Each statement has source keys; source questions preserve separate citations for both sides. Keep these summaries synchronized with the underlying records and do not remove useful explanations merely because a source link is present. Workflow groupings are explicitly editorial. Detection Builder's 8.7 enhancements now participate in the changed-capabilities filter. Triage's visible description uses the 8.6 setup guide without assigning unsupported 8.7 prerequisites.

## Print report

The editions view includes a print-only report generated from the same evidence records. Screen grids, controls, duplicate branding and repeated long source URLs are excluded. A native table repeats column headers and keeps capability rows together. Numbered citations link to a single source directory; the selected history is synchronized with the on-screen selector. Print CSS uses the chosen paper size, explicit margins and page-number margin boxes where supported. All capabilities print even when the screen is filtered.

Pagination is checked with a local HTML-to-PDF renderer on A4 and US Letter. This validates the rendered report independently of the unavailable managed static-site browser preview; browser print engines and user print settings may paginate differently. The report has no external font or renderer dependency at runtime.

## Public launch supersedes preview restrictions (22 September 2026)

The user approved integration into the overall site. The canonical route is now `https://versioncompass.com/?view=es-editions`, linked from main navigation. The original preview switch remains a compatibility alias; new copied links canonicalize to `view`. Earlier statements requiring an unlisted, noindex presentation are historical and superseded. The feature retains separate view/data loading; no new WebMCP tools are introduced by this launch.

The hidden `theme=cisco` query modifier enables a navy/blue/magenta/orange presentation inspired by the supplied HTML, with white print surfaces and colored report accents. There is no visible theme switch, cookie or local-storage setting. Only one exact `theme=cisco` value activates it. Internal navigation and copied URLs preserve the theme; external source URLs do not change. Identity and independent-publication disclosures remain visible on screen and in print. Public documentation citations do not imply vendor endorsement or resolve contradictory claims.

All scheduled tasks must maintain the integrated route, original alias, release-note metadata and dated evidence. Review both appearances and print reports without changing evidence by theme. Today's already-published release note includes the public launch. Continue using the metadata synchronization script for every material publication; source-review dates remain separate.

Theme refinement: `theme=cisco` now uses the original reference's full dark screen treatment, not the earlier light card variant. All dark overrides are scoped to screen media; print retains the validated white-page report treatment. Audit contrast on nested cards, controls, comparison cells, source links and warnings in both the release and editions views.

Print-theme correction (supersedes the screen-only refinement above): the active `theme=cisco` presentation now carries into print/PDF in full, using a named dark page, navy surfaces, gradient heading and edition accents. The unmodified default theme remains white. Preserve `print-color-adjust: exact`; browser print settings can still override background printing. The selected theme must not change factual content or omit source qualifications.
