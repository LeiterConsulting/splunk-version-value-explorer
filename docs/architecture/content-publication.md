# Content publication and database delivery

## Current behavior and historical scope

Current public GET/HEAD is read-only and does not initialize D1. Use
[release control](../release-control.md) and
[controlled seed preparation](../controlled-seed-preparation.md) for current
procedures. The first-use import and initialization sections below describe the
October 5 implementation and retained legacy-module tests, not the current Worker.
Do not infer current deployed behavior or settings from this historical increment.

## Authority and historical October 5 increment

The October 15 future-release page uses the bounded `preparation11` content set and prefixed source catalog inside the existing canonical `guidance.json` dataset. It therefore shares the complete atomic bundle and generated guidance adapter without expanding the publication schema or public agent tools. See [preparation scope](../prep11.md).

The October 5, 2026 migration introduces canonical JSON content, stable record identities, a read-only D1 projection and a browser loader. The seven factual datasets were converted without changing their values. Generated adapters allow the existing comparison, print, snapshot and WebMCP engines to consume either delivery path.

Edit `content/datasets/*.json`, not generated `dist/*-data.js` or `dist/data.js`. Platform/migration content lives in `platform.json`; ES/ITSI/Observability in `products.json`; policy metadata in `guidance.json`; environment, editions, Forwarders and SOAR have separate files. `scripts/sync-content.cjs` generates the catalog, publication manifest, public bundles and adapters. Preserve `content/identities.json`; when renaming a record, move its mapping to the new logical key rather than generating a new ID.

Historical payload shapes are preserved in this first increment. The catalog adds a common envelope with identity, kind, dataset, scope, evidence and verification. Source review dates and sections are not promoted into claim verification. Inherited release citations remain inherited citations. Array positions are not permanent claim identities.

GitHub records approved content and executable rules; D1 is a serving projection. In the historical October 5 runtime, each Worker carried one immutable, validated repo seed revision and imported it idempotently on first use of the API. Content rows are not schema migrations. After all import batches, the stored records are checked against the expected count and bytes before the revision is marked complete. Initialization then inserts an empty engine channel head with `ON CONFLICT DO NOTHING`; it never replaces an existing head. Failed imports leave the previous complete revision intact.

The publication identity includes the dataset digest and engine revision. A rules-only change therefore gets a new immutable publication without changing factual dataset hashes. The generated Worker is built from tracked sources and is excluded from Git; the packaged build remains tied to its exact source commit.

This increment still publishes content through the existing deployment pipeline. Independent content publication, authenticated editorial drafts, hosted historical-report routes and contextual enhancements are subsequent increments, not claims made by this release. Old complete D1 revisions remain available through revision queries; the interface is pinned to its matching content and rules. Do not expose public content writes to bypass publication checks.

## Public contract

- `GET /api/content/manifest`: schema, content revision, digest, engine revision and record count.
- `GET /api/content/bundle?revision=...`: complete globals and catalog for an available published revision.
- `GET /api/content/records?revision=...&kind=...&dataset=...&offset=...&limit=...`: bounded record queries; maximum limit 200.
- `GET /api/content/health`: actual D1 readiness. Unavailable storage returns 503, never static success.

Client write methods, repeated/unknown parameters, invalid identifiers and unavailable revisions are rejected. The browser validates schema, expected revision, engine, record count and SHA-256 digest before assigning any API data. Datasets switch together. A failure or 2.5-second timeout selects the complete bundled adapters. DOM metadata and exported reports distinguish delivery paths. D1 stores no visitor context, profiles, telemetry or comparison histories.

## Historical initialization side effects and isolated regression tests

The historical public API restricted **client methods**, not internal database writes. In that runtime both valid
`GET` and `HEAD` requests to `/api/content/manifest`, `/api/content/bundle`,
`/api/content/records` and `/api/content/health` call `ensureRevision` before reading
content. `HEAD` omits the response body only after initialization. Even an explicit
revision lookup can initialize the deployment seed before reporting that the selected
revision is unavailable. `VC_ACTIVE_DELIVERY=0` does not disable seed initialization.
Do not use these routes as no-write readiness probes or assume that diagnostics cannot
mutate storage. This clarification introduces no endpoint or runtime behavior change.

`worker/content-store.mjs` imports records in batches of 50. Failed imports can leave
committed partial rows, but incomplete bundles are not served and do not initialize
a head. Retry replays all batches with conflict-do-nothing, verifies exact records,
then marks completion and initializes only an empty channel. The module-local WeakMap
coalesces requests sharing the same database object and revision; it is not a
cross-isolate lock. Interrupted or lost responses alone do not establish whether a
write committed. Same-count record corruption in incomplete imports and immutable
identity collisions fail closed. The completed-revision fast path checks stored bundle
identity but does not rescan individual content records.

Run `node --test tests/content-seeding.test.cjs` (also included by `npm test`). Its
17 scenarios generate synthetic records without reading the checked-in content bundle
or production data. They cover GET/HEAD initialization, early and nineteenth-batch
failure, transaction rollback, response loss after commit, retry after completion/head
errors, same-object and distinct-wrapper/module concurrency, existing-head preservation,
corruption, collisions and an aborted Request signal. Native `node:test` owns result
accounting; its parent test is reported in addition to the 17 scenarios.

The test imports local Worker source only, stubs fetch before import, counts even
swallowed network attempts and uses in-memory SQLite. Each batch is a serialized
SQLite transaction; a post-commit response-loss injection throws **after** commit.
Concurrency barriers force both initial reads to observe missing state. These
assumptions demonstrate SQL/control-flow behavior for those schedules, not hosted D1
transaction scheduling, distributed races, limits, latency or replica consistency.
Aborting a Request signal while a batch is paused demonstrates that direct local
invocation continues; it does not model client disconnects or Cloudflare Worker
termination. Passing local tests supplies no deployed-schema/binding, live-readiness,
activation/rollback or browser/export evidence and does not authorize deployment or
enabling active delivery. See [publisher integration](publisher-integration.md) for
those separate gates.

## Publication checks

Run `sync-release-metadata.cjs`, `sync-content.cjs`, `sync-source-register.cjs`, then `sync-content-revision.cjs`, all under `scripts/`. Run the four corresponding `--check` gates, the complete Node suite and `npm run build`. Use `npm run db:generate` for schema changes and inspect generated Drizzle SQL/metadata for D1 compatibility. Applied migrations are immutable; do not put content/backfill datasets in migrations.

Preserve exact GitHub/Sites source-tree, saved-version, successful-deployment and live checks. Also compare the live manifest/bundle with `content/publication.json`, exercise database/fallback delivery and record actual export outcomes. SQLite simulation alone cannot certify live D1 readiness.

Run `npm run content:diagnose -- https://versioncompass.com/` from the matching source checkout. It checks actual database health, manifest parity, bundle integrity, bounded queries, rejected writes and fallback assets. Failures include specific repair recommendations; its success does not substitute for browser/export evidence.

Unavailable responses or interrupted body reads are recorded as `blocked` with the request method, path, phase and error name. A returned bad status, malformed JSON or integrity mismatch is `failed`. Both prevent certification and exit nonzero. Progress goes to stderr; the final JSON remains on stdout. A timeout alone does not establish a defective database, missing adapter or accepted write. Retry the exact check after evidence of recovery and correlate Worker request logs before proposing an application repair. Browser-service availability, browser capabilities and actual report verification are separate observations; see [browser recovery](../browser-verification-recovery.md).

## Further increments

Use the [evidence-based delivery policy](../soak-policy.md): advance as soon as applicable material checks pass, with no mandatory 72-hour delay. The observation window may run alongside delivery. The [supported publisher integration](publisher-integration.md) separates verified staging from activation and isolates the prepared active reader while its browser/export checks are unavailable. Reuse the Site and established tasks and preserve their schedules. Privacy/audience expansion, destructive schema changes, commercial commitments and uncertain facts remain held for review.
