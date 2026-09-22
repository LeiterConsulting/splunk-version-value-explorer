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
5. **Commercial precision:** retain public workload/ingest and standalone SOAR user-seat models. Do not claim unsupported universal activity pricing, automatic agent eligibility, or that standalone Attack Analyzer cannot be purchased. The UEBA FAQ specifically limits the native UEBA feature to Premier; that statement does not apply to every related product.
6. **Announcement scope:** retain public September announcement context without treating marketing statements as universal delivery, entitlement, or release-specific prerequisites.

## Scheduled maintenance

A dedicated ES Editions Watch owns this evidence set. The existing twice-weekly Version Guidance Audit also reviews it. The main release watch checks cross-dataset consistency without duplicating the dedicated edition review. All tasks must use the freshest GitHub and Sites source before editing; do not overwrite one with an older checkout. If another run changed source, reconcile and rerun validation before publishing.

Review every cited record against public official sources: editions overview, release notes, Cloud matrix, agent compatibility and individual task pages, Cloud Connect, regional and SOAR pairing matrices, pricing, licensing/trial documentation, UEBA, Exposure Analytics and announcements. Cite each claim directly. Do not import internal collateral or reproduce employee contact details. Keep source scope, version, region, edition, entitlement, prerequisites, and release stage distinct.

Automatic changes require clear authoritative evidence. For conflicting, incomplete, ambiguous or inferred findings, preserve the qualification and report for human review; do not choose a convenient source or quietly broaden availability. Do not add generic activation-verification UI. Do not remove the preview switch, publish navigation to the feature, or expose new agent tools without explicit approval.

For material changes, append the Eastern-date release note and index, run `node scripts/sync-release-metadata.cjs`, then `node scripts/sync-release-metadata.cjs --check` and `node --test tests/*.test.cjs`. Publish identical validated files to GitHub and the existing public Sites project. Verify both outcomes and report exact commit, deployment, note URL, changed claims, sources and unresolved issues. No change means no date bump, note, commit or deployment. Existing publication drift is a defect, not a no-change result. If publication is blocked, state which destination remains incomplete.

## Review status

Automated checks pass. Rendered browser/mobile and PDF pagination review was unavailable in this static-site environment. The preview remains unlisted for colleague review of layout, scanability and substantive qualifications before any normal-navigation launch.
