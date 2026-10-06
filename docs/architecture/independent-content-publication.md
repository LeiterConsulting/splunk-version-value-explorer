# Next increment: independent content publication

Status: prepared implementation contract, not an enabled service. The current [publication architecture](content-publication.md) and [evidence-based delivery policy](../soak-policy.md) still apply. The owner's October 6 instruction removes the fixed 72-hour waiting gate; it does not waive applicable material validation, authentication or exact publication checks.

The first bounded increment separates publishing an approved factual bundle from deploying website code. The public repository remains the authority; D1 continues to serve immutable projections. No visitor editor, user accounts, tracking or customer-context storage is added.

## Publication boundary

An authenticated maintenance publisher submits the exact generated manifest/bundle from a public GitHub commit that passed all four synchronization gates, the complete suite and build. The service verifies repository/commit provenance, schema, seven dataset identities, stable record IDs, record count, engine revision and a recomputed SHA-256 digest before staging anything. A publisher credential belongs in runtime secrets and authorized CI, never public JavaScript, committed files or logs. Missing credentials reject publication; public GET endpoints and existing browser WebMCP remain read-only.

Stage content under its immutable revision. Reuse the existing idempotent import and completion boundary. Activate only a complete, verified revision, with a compare-and-swap against the expected current revision for the same engine. Retries with identical bytes are safe; revision collisions, stale publication attempts and engine mismatches fail without changing the active revision. Retain the previous complete revision for explicit rollback. Rollback is another authenticated activation with its own recorded evidence, not a data deletion.

## Reader and fallback boundary

The browser obtains the active manifest for its deployed engine, validates the complete bundle, then switches every dataset together. It must never combine current database records with old adapters. On timeout or invalid/unavailable content, use the entire bundled revision and label that older fallback accurately in the report and exports. A successful fallback does not certify D1 health or the latest publication. Default shared URLs still describe evolving guidance; historical report pinning belongs to a later increment.

Preserve original comparison intent through the [legacy-link migration contract](legacy-link-migration.md). The new architecture may translate old URL syntax, but must not silently replace versions, scope or warnings. An unresolved conversion needs assisted recovery, not an unrelated default report.

## Required implementation evidence

- Authenticated publication accepts only an exact public-repo generated bundle; absent/wrong credentials, unknown fields, forged provenance, duplicate IDs, bad hashes and engine mismatches are rejected.
- Interrupted staging, retries and concurrent activation preserve a complete active revision. A stale expected revision cannot supersede a newer publication; rollback retains both immutable payloads.
- Manifest, bundle, records and real D1 health agree after publication without a website deployment. Public writes stay rejected and existing tool names remain stable.
- The browser loads the newly active bundle atomically; forced failure selects the complete labeled fallback. Existing/legacy/invalid/shared links, citations, both themes, keyboard and narrow layouts remain valid.
- Actual PDF pages, downloaded HTML independently reopened, and screen/export/read-only WebMCP content agree for affected representative routes. Structural tests are recorded separately.
- Publish exact GitHub/Sites source, verify live behavior, retain rollback evidence and record post-release observation in the existing progress task. Start the next eligible bounded improvement without a mandatory three-day pause. Track nonblocking minor issues under the current delivery policy.

Credentials and the supported CI-to-Sites secret path must be established before exposing an authenticated publisher. Do not ship a disabled-looking endpoint backed by permissive authentication or use a model confidence score to close any gate.
