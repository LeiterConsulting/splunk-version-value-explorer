# Report guidance and durable links

The report adds a short route takeaway, an expandable lifecycle panel, and expandable activation notes on capability cards. UI and WebMCP share `dist/guidance.js`; explicit support dates and activation qualifications live in `dist/guidance-data.js`.

## Route takeaway

“What you gain” selects up to three distinct capability categories, preferring later milestones. “Before moving” prioritizes a target/host warning or preparation action; Enterprise routes describe the recorded upgrade path. “Watch for” prioritizes blockers, required changes, validation, testing, and planning. Each point cites its source. This summarizes curated records and does not certify an environment.

## Support lifecycle

Explicit deadlines come from [Splunk's software support policy](https://www.splunk.com/en_us/legal/splunk-software-support-policy.html), including extensions. Never derive dates by adding a fixed duration to release dates. Maintenance releases inherit their documented release-line window; ITSI 5.0.1 and 5.0.2 follow 5.0.

Dates are evaluated using the current America/New_York calendar date. A deadline on or before that date shows “End of support”; within 180 days it shows “Support ending soon.” The 180-day flag is a Version Compass planning reminder. Active support, compatible product combinations, and supported operating systems remain separate conditions.

Cloud selections remain Splunk-managed without inferred Enterprise deadlines. Observability dates remain service milestones. Unknown dates show “Verify support date.” Rows include evaluation date, verified date, source, and applicable policy line.

## Availability and activation

The optional fifth standard capability-tuple field holds `{label, detail, source, reviewed}`. Migration operating-benefit tuples retain their existing fifth-field milestone label.

Twelve initial qualifications cover SPL2 networking; Cloud AI Canvas beta, Azure storage, and federation setup; ES AI entitlement and MCP access; ITSI episode priorities and MCP; and Observability incident access and Collector setup. Other capabilities show “Verify activation.” Missing qualification never implies readiness. Qualifications describe the cited introduction or component release; verify current setup and access before use.

Maintain direct official setup citations and edition, entitlement, release-stage, regional, and customer-managed component boundaries.

## Durable report links

- Preserve `product`, `platform`, `host`, `from`, and `to`. Historical Platform URLs without a product parameter remain valid.
- Preserve valid historical selections; offer an explicit newer-target link instead of changing the comparison.
- New links include `reviewed=YYYY-MM-DD`. Older reviews produce an explanation that current guidance is shown. Links are not frozen reports. Undated historical links cannot reveal their original review date.
- Explain applicable support deadlines, newer targets, and compatibility warnings at the top. Printing retains this context.
- Unknown identifiers, incomplete routes, repeated relevant parameters, invalid dates, equal releases, and downgrades require review. Preserve the original URL and hide results until the visitor changes or confirms proposed controls. Disable copy/print and reject the current-report tool while unresolved.
- Retain published release identifiers and records when adding versions. Never delete them merely because support ended.
- Use `guidance.urlAliases` only for reviewed equivalent identifiers, with `to`, `reason`, and `source`. The registry starts empty. Never map an old release to latest or round arbitrary patch versions.
- Escape query values before rendering. Unrelated tracking parameters do not select a route.

Changing controls dismisses the original-link context and creates a current reviewed URL. Browser history navigation re-evaluates links. Agent comparison inputs remain exact; aliases apply only to page navigation.

## Maintenance and verification

Advance `guidance.reviewed`, reviewed badge, dated release note, print date, and agent metadata together. Advance policy review dates only after verifying deadlines. The release watch and guidance audit maintain these records and guarantees.

Run `node --test tests/webmcp.test.cjs`. Coverage includes every catalog interval and report-URL round trip, historical/invalid links, explicit aliases, policy boundaries, activation parity, and print-state restoration. The DOM/registry harness does not certify native browser layout, PDF pagination, or vendor WebMCP implementation.
