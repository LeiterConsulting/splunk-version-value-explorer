# Supported publisher integration

October 6, 2026 continuation of PR #10. The existing Site identity, public audience, domain, D1 binding, canonical datasets, privacy and comparison URL readers are preserved. The original public loader remains in use; the separately validated snapshot navigation guard is retained. Deployment and actual live outcomes are recorded separately in `docs/audits/2026-10-06-publisher-integration.json`.

## Authentication and unattended operation

`worker/publisher.mjs` owns a separate `/api/publisher/` boundary. Every route rejects missing or invalid credentials before touching D1. Public `/api/content/` writes remain rejected. No visitor identity, comparison, IP, token or request body is stored or logged.

- Administrative credential: a random 32-byte hex value stored as the Sites runtime secret `VC_PUBLISHER_TOKEN`. Provision through the native Sites environment tool, never source, hosting metadata, browser code or task prompts. The CLI reads this credential from hidden stdin and sends it only to `https://versioncompass.com`; redirects fail. Rotate through Sites when needed, then redeploy a saved version to apply the environment revision.
- Unattended credential: `VC_PUBLISHER_OIDC=1` accepts GitHub's short-lived signed identity for this repository's `.github/workflows/publish-content.yml` on main. RSA signature, fixed issuer/JWKS, audience, subject, immutable repository/owner IDs, public visibility, branch, workflow, GitHub-hosted runner, event, exact commit and bounded lifetime are checked. Tokens and GitHub's token-request credential remain in memory. This avoids a long-lived GitHub secret and does not rely on visitor sign-in or the Sites audience bypass.
- The existing validation workflow remains the provenance gate. A separate workflow runs only after validation completes successfully or an explicit dispatch. It checks out the exact main SHA, obtains OIDC and uses `scripts/publish-content.mjs`. The service independently requires successful main push CI with all four gates, the complete suite and Worker build; it compares exact committed manifest and bundle bytes before any staging write. A concurrent main advance with incomplete CI fails safely.

GitHub identity references: https://docs.github.com/en/actions/reference/security/oidc and https://token.actions.githubusercontent.com/.well-known/openid-configuration. Native Sites runtime secrets and managed migrations follow the Sites plugin's supported deployment path. OIDC authenticates the maintenance workflow; it does not claim to verify Splunk facts.

## Managed migration and initial history

`db/schema.ts` declares provenance and generation/event tables. `drizzle/0001_thin_lifeguard.sql` and its generated snapshot/journal are additive, schema-only migrations. The existing initial migration is unchanged; no records are deleted or seeded through SQL. Sites applies packaged pending migrations before the Worker upload.

`POST /api/publisher/stage` accepts the PR #10 candidate (`repository`, `commit`, `bundle`), verifies it and imports it without changing the active pointer. `POST /api/publisher/bootstrap` accepts only `{candidate, operationId}` for the exact deployment seed. It revalidates stored record bytes and provenance, preserves any different current head, then initializes an auditable generation-one self event transactionally. Identical retries add no records/events. Seed imports use `ON CONFLICT DO NOTHING` for the channel pointer and cannot overwrite a publisher-managed head.

`GET /api/publisher/head` returns the revision, generation, deployed engine and delivery-enabled state to authenticated maintenance. `POST /api/publisher/activate` retains the core's expected revision/generation, operation-ID, explicit rollback and transactional compare-and-swap guards. CI activation additionally rechecks its exact commit against the target bundle; CI cannot perform rollback. Rollback requires administrative authorization and a previously active, complete revision. All requests use bounded JSON, reject query parameters and foreign browser origins, and omit internal payloads/SQL from errors.

## Isolated active delivery

`VC_ACTIVE_DELIVERY` defaults off. While off, activation returns 423 and every visitor continues using the exact existing `dist/content-client.js` and deployment-pinned bundle. Staging/bootstrap remain available for real D1 and credential verification. This is a deployment of publisher infrastructure, not a claim that independent visitor content advancement is enabled.

The prepared `client/content-client-active.js` is selected at the existing loader URL only when `VC_ACTIVE_DELIVERY=1`. The static manifest supplies the deployed engine. A response header opts the client into fetching that engine's active manifest; the complete bundle is validated and all globals switch together. Failure resets report metadata to the complete bundled revision. Active public reads require initial publisher history and stored provenance. Explicit revision requests remain exact and reject another engine. Existing URL syntax, engines and read-only WebMCP tool names are unchanged.

Before setting the flag, record actual affected browser journeys, both themes/narrow/keyboard checks, PDF pages, independently reopened HTML and screen/export/WebMCP parity; then verify real D1 stage, activation, retry/conflict and rollback plus independent manifest/bundle/records readback. Review WebMCP metadata for the active content identity at that increment. Missing browser tooling is a blocked check, never a pass. The current accelerated policy imposes no 72-hour delay. Reuse the existing watches and progress task without changing their schedules or creating timers.

## Commands

Read-only preflight: `node scripts/verify-publication.mjs --commit <main-SHA> --engine <actual-deployed-engine>`.

Administrative initial history: `node scripts/publish-content.mjs --bootstrap <main-SHA>`, then supply the secret through hidden stdin. Routine CI publication: `node scripts/publish-content.mjs --commit <main-SHA>` using GitHub OIDC. When delivery is held, the result explicitly reports staging rather than activation. A same-revision publication is idempotent and initializes history if still at generation zero.

Use `node scripts/diagnose-content.cjs https://versioncompass.com/` for real public database checks. Keep old payloads and the previous saved Site version for rollback. Record exact GitHub/Sites commits/tree, saved version, deployment, environment revision and actual check timestamps; do not infer live success from a local build or CI.

## Verified runtime checkpoint

Version 114 deployed GitHub commit `4c530565595696283c2f33e04f4d9f0ebdb93604` and Sites commit `8847f7d7e3d567ee1c6f8416f7c8a31f8f2dcc72`, with matching tree `27558ffe775f37646f3dac77a2932961532bae5a`. This includes the publisher repair and PR #16's validated snapshot guard. All 154 tests, four synchronization checks, build and GitHub main validation passed. Actual GitHub OIDC publication job `112432328596` succeeded with the short-lived read-only evidence credential. Independent native D1 readback confirmed the exact commit, validation run, complete 668-record revision `content-df5d750a2de9eee19933ab27`, and one generation-one event for engine `engine-dcc80cb83dc77c4e03af`. Native Worker request logs show public loader, manifest and exact-revision bundle GETs returning 200 after deployment; this is request/status evidence, not a fresh response-body or browser/export inspection. Earlier version-113 full public diagnostics and repeated OIDC evidence remain separately recorded. `VC_ACTIVE_DELIVERY=0` retains the deployment-pinned reader; active-reader browser/export and real D1 activation/rollback evidence remain outstanding. A subsequent documentation-only reconciliation does not change these runtime artifacts or extend this checkpoint's verification claims.

Worker evidence fetches retain the `globalThis.fetch` receiver and use `redirect: 'manual'`, rejecting non-2xx responses without following redirects. These repairs retain the fixed issuer/repository origins, signature and immutable workflow checks. Node fixtures now cover receiver behavior and redirected key/provenance rejection. Later concurrent repository changes are separate from this exact deployed checkpoint.

## Concurrent draft reconciliation

The unpublished Site commits 9b1b774f8f90f8c23ed9f0165b32b848c9e93f8c and b8d0d57f65f70d90fe942d28b1e00c80cf098fbd were reconciled after the stale source push was rejected. Their canonical-hash repair, stronger bundled staging, preparation CLI/tests, original checkpoint record and archive summaries are retained. `prepare-publication.yml` prepares read-only requests; the unsafe-to-enable one-sided static-token submission step is superseded by the supported OIDC workflow. The active-reader draft remains isolated from visitors. Canonical hashes are captured before in-memory composition and included in immutable identity; delivery code is included in the engine identity. Old D1 payloads are retained, and explicit revision queries without an engine filter remain available across engines.

PR #13 is retained on main with its snapshot availability regression. Live invalid-link, environment-mismatch, valid download and read-only WebMCP checks confirmed the snapshot control follows the same export guard as Print/PDF. The validated navigation is served independently of `VC_ACTIVE_DELIVERY`; that flag continues to isolate only the database-backed browser reader until reopened-HTML, native PDF and activation/rollback evidence is complete.

For unattended evidence checks, CI supplies its short-lived job token with `actions: read` and `contents: read` in the bounded authenticated body. The Worker first verifies exact workflow OIDC, forwards this credential only to the fixed repository GitHub API paths, leaves raw artifact reads credential-free, and never retains the token in candidates, D1, responses or logs. This repairs shared anonymous API rate-limit failures without weakening repository provenance or publisher identity.
