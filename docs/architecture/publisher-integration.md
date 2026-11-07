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

A fresh engine with no publisher head returns the explicit `initial-publication-required` category. After successful authenticated staging, CI handles only that exact 409 by calling the seed-bound bootstrap and rereading the head. Public traffic is not needed to initialize the engine. Authentication failures, other verification errors and existing-head conflicts still stop publication; the bootstrap cannot overwrite a different head.

Use `node scripts/diagnose-content.cjs https://versioncompass.com/` for real public database checks. Keep old payloads and the previous saved Site version for rollback. Record exact GitHub/Sites commits/tree, saved version, deployment, environment revision and actual check timestamps; do not infer live success from a local build or CI.

## Verified runtime checkpoint

Version 114 deployed GitHub commit `4c530565595696283c2f33e04f4d9f0ebdb93604` and Sites commit `8847f7d7e3d567ee1c6f8416f7c8a31f8f2dcc72`, with matching tree `27558ffe775f37646f3dac77a2932961532bae5a`. This includes the publisher repair and PR #16's validated snapshot guard. All 154 tests, four synchronization checks, build and GitHub main validation passed. Actual GitHub OIDC publication job `112432328596` succeeded with the short-lived read-only evidence credential. Independent native D1 readback confirmed the exact commit, validation run, complete 668-record revision `content-df5d750a2de9eee19933ab27`, and one generation-one event for engine `engine-dcc80cb83dc77c4e03af`. Native Worker request logs show public loader, manifest and exact-revision bundle GETs returning 200 after deployment; this is request/status evidence, not a fresh response-body or browser/export inspection. Earlier version-113 full public diagnostics and repeated OIDC evidence remain separately recorded. `VC_ACTIVE_DELIVERY=0` retains the deployment-pinned reader; active-reader browser/export and real D1 activation/rollback evidence remain outstanding. A subsequent documentation-only reconciliation does not change these runtime artifacts or extend this checkpoint's verification claims.

Worker evidence fetches retain the `globalThis.fetch` receiver and use `redirect: 'manual'`, rejecting non-2xx responses without following redirects. These repairs retain the fixed issuer/repository origins, signature and immutable workflow checks. Node fixtures now cover receiver behavior and redirected key/provenance rejection. Later concurrent repository changes are separate from this exact deployed checkpoint.

## Concurrent draft reconciliation

The unpublished Site commits 9b1b774f8f90f8c23ed9f0165b32b848c9e93f8c and b8d0d57f65f70d90fe942d28b1e00c80cf098fbd were reconciled after the stale source push was rejected. Their canonical-hash repair, stronger bundled staging, preparation CLI/tests, original checkpoint record and archive summaries are retained. `prepare-publication.yml` prepares read-only requests; the unsafe-to-enable one-sided static-token submission step is superseded by the supported OIDC workflow. The active-reader draft remains isolated from visitors. Canonical hashes are captured before in-memory composition and included in immutable identity; delivery code is included in the engine identity. Old D1 payloads are retained, and explicit revision queries without an engine filter remain available across engines.

PR #13 is retained on main with its snapshot availability regression. Live invalid-link, environment-mismatch, valid download and read-only WebMCP checks confirmed the snapshot control follows the same export guard as Print/PDF. The validated navigation is served independently of `VC_ACTIVE_DELIVERY`; that flag continues to isolate only the database-backed browser reader until reopened-HTML, native PDF and activation/rollback evidence is complete.

For unattended evidence checks, CI supplies its short-lived job token with `actions: read` and `contents: read` in the bounded authenticated body. The Worker first verifies exact workflow OIDC, forwards this credential only to the fixed repository GitHub API paths, leaves raw artifact reads credential-free, and never retains the token in candidates, D1, responses or logs. This repairs shared anonymous API rate-limit failures without weakening repository provenance or publisher identity.

Version 116 verified the fresh-engine repair at GitHub `3b9b42810cbd31678f27a92b4ae83f92ee122721` and Sites `a69415d63df845c1230a29193d0a12b56446663f`, matching tree `0b898aecce6ef35364be86d366b5b9a877a2724e`. All 157 tests, four synchronization checks, build and main validation passed. Actual OIDC job `112441235103` explicitly initialized `content-235e479c99e33115176f6aa1` for `engine-510c4f5b1aceeeddb186`; native D1 readback confirmed the commit, validation run and one generation-one event. Concurrent owner-authorized Ripple assessment source was preserved through reconciliation. The reader flag stays off; this subsequent evidence-only publication does not change the runtime artifacts or broaden browser/export/activation claims.

A second actual OIDC job (`112441641825`) retained the same head and one generation-one event. Fresh public diagnostics passed database health, exact manifest, complete bundle digest and 668-record count, bounded SOAR query, rejected writes and all seven fallback assets. These checks certify publisher/storage and public delivery, separately from the held active-reader browser/export/activation gates.

## October 7 owner verification continuation

The owner reported all three outstanding report/layout checks completed without issues at 12:57:31 UTC: independent browser reopening of the newly downloaded HTML, native PDF capture and page-by-page visual inspection, and supported narrow-screen viewport emulation of affected routes. The [owner record](../audits/2026-10-07-owner-verification.json) separates this evidence from earlier assistant-performed tests and tool limitations. Exact artifact hashes, page counts, browser/viewport details and actual completion timestamps were not supplied. The reassessed deployed factual/report checkpoint is eligible to advance without a fixed delay.

Current native D1 readback confirms generation one for `content-6dcf491dfeb864140adc2937` / `engine-c5ff569aec1b2f034270`; fresh public diagnostics confirm complete 668-record health, manifest/bundle integrity, bounded queries, rejected public writes and seven fallback adapters. This readback is bootstrap evidence, not an activation/rollback round trip. `VC_ACTIVE_DELIVERY=0` still isolates the prepared reader. Continue with authenticated real-D1 activation, operation-ID retries/stale-generation rejection, rollback and public readback, followed by actual active-reader atomic adoption and whole-bundle fallback agreement. Do not recast the owner's prior report checks as proof of that future runtime transition. The existing delivery checkpoint handoff is updated; all schedules and its disabled/completed state are preserved.

## Private bundled-seed observation (November 7, 2026; not deployed)

`GET /api/publisher/observe-seed` adds a narrow operational observation behind
exactly the existing publisher authentication, origin and parameter guards. Only
GET is accepted, with no query parameters or caller-selected identifiers. It uses
the deployed bundled manifest's revision, engine, schema, digest and expected
count; it does not accept SQL, filters, credentials or a publication body. Missing,
wrong and platform-only credentials receive the existing authorization rejection
before database access. Existing OIDC scope and all other routes are unchanged.

This helps distinguish an unavailable binding, a failed SELECT, unavailable
projection columns, an absent/incomplete/inconsistent seed, and a metadata/count
consistent seed without triggering the legacy import. It uses fixed SELECTs only:
reachability, projection availability, then one statement observing bundled seed
metadata, bounded seed count and the current engine's head metadata together.
The preliminary checks are separate observations, not an atomic multi-query
snapshot or proof of complete migration/index/constraint availability.

The count stops at the trusted expected count plus one (the existing bundle
contract allows at most 10,000 records). `recordCountOverflow` means the reported
count is a lower bound, not the actual total. Alternate heads are identified only
by strict content revision IDs and engine/completion metadata; their records are
not counted. Stored JSON, payloads, arbitrary text, raw errors, SQL, credentials,
request headers and user identity are never returned. Responses are `no-store`.

HTTP 200 means **an observation was returned**, including missing or inconsistent
seed states. `status: observation-returned` and `validation: metadata-and-count-only`
are not readiness signals. HTTP 503 means the observation was unavailable, with
an allowlisted phase/reason. Matching metadata and counts do not validate stored
record bytes, bundle integrity, provenance, factual currency, activation eligibility,
retry safety or stable hosted state. No timing, rate-limit or timeout-remediation
claim is made. Existing credential-abuse/JWKS exposure is not solved by this route.

This path never calls `ensureRevision`, `readBundle`, the active reader or a
publisher mutation. It does not seed, stage, activate, repair, retry, lock or
cancel anything, regardless of `VC_ACTIVE_DELIVERY`. Public health/content routes
retain their existing behavior and can still seed on reads; they are not substitutes
for this no-write observation. The new route is not a public health endpoint.

Local synthetic SQLite tests establish the specified control flow only. The
November 7 production timeout remains unexplained; production deployment and
publisher holds, active-reader gates and all schedules remain unchanged. This
runtime change advances the normal engine fingerprint and requires separate
exact-candidate CI/export review and an authorized runtime release/rollback plan.
It cannot observe the currently deployed runtime before that release. No hosted
request, source upload, deployment or database write is included in this change.

The descriptor always observes only the newly deployed build's own seed and engine,
not historical v287 or a caller-selected historical revision. It cannot recover the
missing incident evidence. Other visitor requests can still write through legacy
seeding after deployment; a no-write observation does not certify a globally
write-free interval. The observation helper makes no external fetch, while existing
OIDC authentication may fetch the fixed issuer JWKS before the observation.
The response explicitly reports `readiness: not-assessed` and
`integrity: not-validated`, even when seed metadata/counts match.

## Bounded observation caller and delivery verifier (November 7)

The [bounded rollout procedure](../bounded-rollout-verification.md) adds an explicit
manual observe-only caller in the already trusted publisher workflow, with exact
expected main commit/ref and local bundled identities. It uses the same OIDC
issuer, audience, workflow path and permissions, then exactly one fixed-origin
GET to the private observation route. Candidate selection, publication, staging,
bootstrap and activation are excluded. A separate sanitized receipt and summary
preserve unavailable/incomplete results and `readiness: not-assessed` /
`integrity: not-validated`; neither a green job nor matching counts establishes
readiness. The observation route must first exist on the deployed runtime.

The public delivery diagnostic separately stops at its first unsuccessful check,
with full manifest/bundle identity, complete paginated record parity and exact
fallback-byte checks. Those public requests may initialize storage, and client
abort cannot cancel server work. No hosted request or runtime deployment is
performed by this tooling change. Existing holds, active-reader gates, canonical
facts and engine/content identities are unchanged.
