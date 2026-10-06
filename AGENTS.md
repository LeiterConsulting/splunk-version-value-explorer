# VersionCompass working contract

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
