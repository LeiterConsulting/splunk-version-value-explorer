# Agent access through WebMCP

[Version Compass](https://versioncompass.com) exposes three read-only tools through the browser's imperative `document.modelContext.registerTool` API. Open the site in a WebMCP-capable browser/agent environment to discover them. The normal interface remains usable in browsers without this API.

This is **browser-scoped WebMCP**, not a standalone MCP server. There is no `/mcp` HTTP endpoint, API key, server process, or background agent connection to configure. A conventional MCP client needs a browser integration that supports WebMCP; entering the website URL as a remote MCP server is not sufficient. See the [WebMCP specification](https://webmachinelearning.github.io/webmcp/) for the browser API and its evolving support.

## Tools

| Tool | Purpose | Inputs |
| --- | --- | --- |
| `versioncompass_get_catalog` | Discover products, contexts, exact release identifiers, latest curated entries, host versions, and release-note sources | `{}` for all products, or `products` containing selected product IDs |
| `versioncompass_compare_routes` | Compare one to five routes with paths, compatibility, capabilities, technical changes, breaking risks, readiness, sources, and shareable URLs | `routes`; optional `include` |
| `versioncompass_get_current_report` | Read the current page selection as a structured report, including every capability category | `{}` or optional `include` |

Product IDs are `platform`, `es`, `itsi`, and `observability`. Deployment contexts are `enterprise` and `cloud`; `migration` is available only for `platform`. ES, ITSI, and Observability require `host`, the selected Enterprise or Cloud platform release. Platform routes must omit `host`.

All tools are read-only. They do not navigate, change form selections, expand panels, print, copy to the clipboard, deploy software, call external services, or collect customer data. Reports include all capability categories even when the page currently filters one category.

## Example workflow

First call `versioncompass_get_catalog` with `{}`. Use its exact identifiers in `versioncompass_compare_routes`, for example:

```json
{
  "routes": [
    { "product": "platform", "platform": "enterprise", "from": "9.4", "to": "10.4" },
    { "product": "es", "platform": "enterprise", "host": "9.4", "from": "7.3", "to": "8.7" }
  ],
  "include": ["technicalChanges", "breakingChanges", "readiness"]
}
```

The second route returns the platform-first compatibility warning and an absolute link to the recommended Splunk Platform comparison. The first returns its documented intermediate upgrade releases. Open each `reportUrl` to review the same route in the interface.

Omit `include` for all sections. Use `include: []` for a compact result containing route, path, compatibility, counts, and core sources. Available sections are `features`, `technicalChanges`, `breakingChanges`, `readiness`, and `migrationApproaches`. Counts always describe the full route; `includedSections` identifies the details returned.

Successful responses have `ok: true`, shared `metadata`, and either `products`, `reports`, or `report`. Metadata includes `schemaVersion`, the site's review date, its dated release-note link, and scope caveats. Individual facts carry their official `source`; reports also include a deduplicated source list.

Invalid input returns `ok: false` with an explanatory error. Missing hosts, unknown fields or releases, unsupported contexts, repeated or unknown sections, equal-version comparisons, and downgrades are rejected. The entire batch is validated before producing results. Versions are not silently rounded, substituted, or upgraded to a default.

## Interpretation boundaries

- Enterprise `path.nodes` represents the curated supported-transition graph. If no path is recorded, `path.status` is `unknown`; the tool never invents a direct upgrade.
- Cloud, ES, ITSI, and Observability path nodes are **planning milestones**, not proof that each installation hop is supported.
- Compatibility assesses the selected target against its host context. Review source-app support and intermediate pairings before a platform-first move. A listed major/minor line does not certify every patch, topology, app, or operating system.
- Cloud-managed availability is not derived from Enterprise compatibility. Confirm stack, region, entitlement, edition, and maintenance timing in the cited guidance.
- Observability milestones are dated service summaries. Collector, chart, instrumentation, and other customer-managed components retain their own versions and ownership.
- Migration guidance remains an environment-dependent program. Destination capabilities do not mean that migrating every app, data source, or historical dataset is automatic.
- These are curated planning results. An empty list does not establish that no other risks or changes exist. The review date records the site's review; individual records do not claim separate verification timestamps.

## Implementation and maintenance

- `dist/data.js` and `dist/product-data.js` remain the factual sources. There is no separate agent dataset to refresh.
- `dist/comparison.js` contains the shared, DOM-free selection and compatibility logic used by both `dist/app.js` and `dist/webmcp.js`.
- `dist/webmcp.js` validates inputs and registers tools once. Registrations use an `AbortSignal` for cleanup on `pagehide` and are restored on `pageshow`, including back/forward cache restoration. Unsupported browsers and failed registration leave the page functional.
- The agent metadata reads the current reviewed badge's dated release-note link. Advance the badge date, destination, and print date together during content maintenance.
- Preserve stable tool names and the `schemaVersion` contract. Document incompatible schema or semantic changes before publishing them.
- Both scheduled maintenance workflows must check UI/tool parity, citations, exact identifiers, compatibility boundaries, and privacy behavior after relevant changes. Add new routes to this contract when expanding product coverage.

Run the dependency-free contract and interaction harness from the repository root:

```bash
node --test tests/webmcp.test.cjs
```

It exercises every catalog interval, representative page interactions and URL state, Enterprise platform-first gates, Cloud-managed context, migration readiness, source URLs, unsupported input, result isolation, unsupported browsers, registration failure, and lifecycle cleanup. The harness emulates the DOM and WebMCP registry; it does not claim to certify a particular browser vendor's implementation or PDF rendering. Browser-specific discovery and invocation should also be checked when a compatible browser runtime is available.
