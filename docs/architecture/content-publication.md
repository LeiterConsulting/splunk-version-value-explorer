# Content publication and database delivery

## Authority and current increment

The October 5, 2026 migration introduces canonical JSON content, stable record identities, a read-only D1 projection and a browser loader. The seven factual datasets were converted without changing their values. Generated adapters allow the existing comparison, print, snapshot and WebMCP engines to consume either delivery path.

Edit `content/datasets/*.json`, not generated `dist/*-data.js` or `dist/data.js`. Platform/migration content lives in `platform.json`; ES/ITSI/Observability in `products.json`; policy metadata in `guidance.json`; environment, editions, Forwarders and SOAR have separate files. `scripts/sync-content.cjs` generates the catalog, publication manifest, public bundles and adapters. Preserve `content/identities.json`; when renaming a record, move its mapping to the new logical key rather than generating a new ID.

Historical payload shapes are preserved in this first increment. The catalog adds a common envelope with identity, kind, dataset, scope, evidence and verification. Source review dates and sections are not promoted into claim verification. Inherited release citations remain inherited citations. Array positions are not permanent claim identities.

GitHub records approved content and executable rules; D1 is a serving projection. Each Worker carries one immutable, validated repo seed revision and imports it idempotently on first use of the API. Content rows are not schema migrations. The final import batch activates a revision only after its record count is verified. Failed imports leave the previous complete revision intact.

The publication identity includes the dataset digest and engine revision. A rules-only change therefore gets a new immutable publication without changing factual dataset hashes. The generated Worker is built from tracked sources and is excluded from Git; the packaged build remains tied to its exact source commit.

This increment still publishes content through the existing deployment pipeline. Independent content publication, authenticated editorial drafts, hosted historical-report routes and contextual enhancements are subsequent increments, not claims made by this release. Old complete D1 revisions remain available through revision queries; the interface is pinned to its matching content and rules. Do not expose public content writes to bypass publication checks.

## Public contract

- `GET /api/content/manifest`: schema, content revision, digest, engine revision and record count.
- `GET /api/content/bundle?revision=...`: complete globals and catalog for an available published revision.
- `GET /api/content/records?revision=...&kind=...&dataset=...&offset=...&limit=...`: bounded record queries; maximum limit 200.
- `GET /api/content/health`: actual D1 readiness. Unavailable storage returns 503, never static success.

Writes, repeated/unknown parameters, invalid identifiers and unavailable revisions are rejected. The browser validates schema, expected revision, engine, record count and SHA-256 digest before assigning any API data. Datasets switch together. A failure or 2.5-second timeout selects the complete bundled adapters. DOM metadata and exported reports distinguish delivery paths. D1 stores no visitor context, profiles, telemetry or comparison histories.

## Publication checks

Run `sync-release-metadata.cjs`, `sync-content.cjs`, `sync-source-register.cjs`, then `sync-content-revision.cjs`, all under `scripts/`. Run the four corresponding `--check` gates, the complete Node suite and `npm run build`. Use `npm run db:generate` for schema changes and inspect generated Drizzle SQL/metadata for D1 compatibility. Applied migrations are immutable; do not put content/backfill datasets in migrations.

Preserve exact GitHub/Sites source-tree, saved-version, successful-deployment and live checks. Also compare the live manifest/bundle with `content/publication.json`, exercise database/fallback delivery and record actual export outcomes. SQLite simulation alone cannot certify live D1 readiness.

Run `npm run content:diagnose -- https://versioncompass.com/` from the matching source checkout. It checks actual database health, manifest parity, bundle integrity, bounded queries, rejected writes and fallback assets. Failures include specific repair recommendations; its success does not substitute for browser/export evidence.

## Further increments

After verified deployment and a 72-hour soak, the existing task may implement the next bounded increment when all material gates pass: authenticated independent content publication, then editorial management and richer dynamic/pinned routing. Reuse the Site and established tasks. Each material implementation receives its own verified baseline and 72-hour window. See [soak policy](../soak-policy.md). Privacy/audience expansion, destructive schema changes, commercial commitments and uncertain facts remain held for review.
