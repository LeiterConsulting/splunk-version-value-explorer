# VersionCompass working contract

## October 9 PDF/HTML process repair

Read docs/export-verification.md before report/content publication. Required validation CI now generates native Chromium PDFs, renders/checks every page, independently reopens downloaded HTML offline, and checks both themes at phone width. Wait for the exact candidate's successful export step, download its retained artifact, and validate it with scripts/export-evidence.cjs. Use check-soak.cjs --exports for identical report inputs; verification may precede deployment. Preserve accepted owner evidence in its original scope. Missing interactive browser capabilities alone must not trigger rollback of a healthy verified deployment. Hold unverified new candidates; roll back for recorded applicable failures or unsafe published guidance. Automated geometry checks are not human visual review. This supersedes wording implying every assistant session must repeat native export checks.

Read CONTRIBUTING.md, the relevant product documentation, and the freshest GitHub and existing Sites source before editing. Reconcile concurrent changes; never force-push or replace an unrelated source tree.

## October 6, 2026 owner-authorized changes

These instructions supersede older flat-release-path and mandatory-72-hour wording elsewhere in operational documents; historical release notes remain historical evidence, not current policy.

- Use docs/soak-policy.md and content/soak-policy.json for evidence-based advancement. There is no mandatory waiting period. Apply material checks to the actual affected scope, keep unsafe/unknown changes blocked, and track minor reversible defects with the required repair record.
- Preserve original link intent through an explicit legacy compatibility reader when the architecture changes. Follow docs/architecture/legacy-link-migration.md. Do not silently substitute versions or broaden product/environment meaning. Existing link behavior remains authoritative until a replacement is implemented and verified.
- Browse release notes through docs/releases/README.md, then the year and month indexes. Use scripts/release-archive.cjs to find an existing date before writing. Append same-day changes to that file. New dates use docs/releases/YYYY/MM/YYYY-MM-DD.md. Do not move or duplicate the bounded historical flat files or add new flat dates.
- Run sync-release-metadata, sync-content, sync-source-register and sync-content-revision in order, their four --check gates, the complete tests and the build for relevant publications. Record source/claim, test, browser/export and live outcomes separately. Missing browser access is not a pass.
- Keep the existing public Site, repository and privacy policy. Canonical facts remain in content/datasets/*.json; generated adapters are not editable authorities. Preserve stable evidence identities, public sources, scoped qualifications and actual verification dates.
- Preserve the four watches' existing Eastern schedules and use the existing progress task rather than creating duplicate timers. A 72-hour observation window may continue alongside delivery; do not reinstate it as a rollout delay.
- Report repository integration and Sites deployment separately. Exact commits/tree, version/deployment and actual live verification are required before saying a runtime change is live. No unavailable credential or publication boundary may be bypassed to accelerate delivery.

## Independent publication implementation checkpoint

Read docs/architecture/publication-core.md before continuing independent publication. worker/publication-core.mjs and scripts/verify-publication.mjs now implement candidate provenance checks, separate immutable staging, guarded activation and explicit rollback. They are not wired into the public Worker or client, and the additive schema is not yet a deployed migration. Establish the supported authenticated publisher and managed migration path, then integrate active-per-engine reads and whole-bundle fallback without letting legacy ensureRevision overwrite the publisher head. Preserve the existing link contract; do not recreate this core or mistake its local/CI tests for a live publication.

The runtime continuation is in docs/architecture/publisher-integration.md. Publisher authentication, managed migration, CI OIDC, bootstrap history and active-reader code are integrated. Preserve the original public loader while `VC_ACTIVE_DELIVERY` is off; do not enable independent visitor advancement until the applicable actual browser/export/WebMCP and real D1 activation/rollback evidence passes. Consult docs/audits/2026-10-06-publisher-integration.json for actual deployed state rather than inferring it from implementation.

## October 7 owner verification checkpoint

The owner explicitly reports that independent reopening of the newly downloaded HTML, native PDF capture with page-by-page inspection, and affected narrow-screen routes completed without issues. Read docs/audits/2026-10-07-owner-verification.json and the associated reassessed soak record/result. Accept these as owner-reported verification for the existing deployed factual/report baseline; preserve historical assistant tooling limitations without treating them as still-open blockers. No artifact hash, page count, viewport detail or actual completion timestamp was supplied. Do not invent them or describe these as assistant-performed checks. The next bounded active-reader work is actual authenticated real-D1 activation/retry/conflict/rollback and reader atomic/fallback parity verification. VC_ACTIVE_DELIVERY remains off until that runtime evidence passes. No mandatory waiting period or new three-day timer applies.
