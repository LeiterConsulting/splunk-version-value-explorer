# Legacy-link migration contract

Owner-authorized October 6, 2026. Link compatibility is a release invariant; maintaining the old internal implementation is not. This is the contract for the next architecture increment, not a claim that a new URL codec or redirect service is deployed.

## One comparison model, multiple URL readers

Keep a small compatibility reader at the routing boundary. Decode both existing URLs and any future versioned format into the same validated comparison model used by the page, exports and existing read-only WebMCP tools. The new renderer must not need the legacy backend.

Inventory actual published URL forms from repository code, tests and release history before changing the codec. Include Platform links without `product`, explicit product/host comparisons, Enterprise-to-Cloud routes, ES Editions `view` and legacy `preview` forms, UF/HF topology and receivers, SOAR Cloud/on-premises, environment filters, review/history selection, Cisco theme, perspective and section fragments. Do not invent undocumented aliases or infer additional factual compatibility.

Use the current documented identifiers and `guidance.urlAliases` for reviewed equivalent names. An architecture-field rename may translate syntax; a version translation needs documented equivalence. Keep both the original URL and the canonical result in the resolver result for explanations and testing, not in a visitor database.

## Outcomes

- **Exact or equivalent conversion:** preserve the same selected versions and meaning, then render through the new model. Offer the canonical share link; a non-disruptive explanation is appropriate where syntax changed.
- **Historical guidance:** retain the selected historical release pair and explain that the live report uses current guidance. A `reviewed` date is not an immutable dataset pin. Saved HTML remains its own preserved report.
- **Partial or ambiguous conversion:** retain known fields and the original input, explain exactly what could not be converted, and offer explicit correction or selection. Do not present an unconfirmed replacement report, enable its exports or silently choose latest.

Never reinterpret FR-M as FR-H, a host as product entitlement, a Cloud milestone as an installation path, or a line selector as arbitrary patch equivalence. Existing incompatibility and uncertainty warnings survive conversion.

## Validation required before the new architecture ships

Maintain a fixture corpus of actual legacy links and expected normalized intent. Test old-to-new conversion, canonical round trips, idempotence, repeated/conflicting parameters, unknown versions, unsupported route combinations, missing values, encoding, meaningful anchors and browser back/forward. Exercise affected routes in both themes and a narrow layout. Confirm page, saved HTML, PDF and existing read-only reports agree after conversion. Guard against open redirects and script/query injection; no visitor tracking or persistent customer-context storage.

A broken link or a silently changed comparison is not a tolerated cosmetic defect. Keep the previous routing entry point or complete published revision available for rollback until the adapter is verified.

## Repository release-note links

Published flat release files remain at their original paths so GitHub URLs, section anchors and relative citations continue to work. The generated archive provides year → month → release navigation. New dates use `docs/releases/YYYY/MM/YYYY-MM-DD.md`; `legacy-dates.json` bounds the existing flat set. The generator reads both forms, rejects duplicate dates and points the latest-note badge at the real file. There is one authoritative note per date and no growing collection of redirects or duplicate contents.
