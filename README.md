# Version Compass

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

An interactive, customer-friendly read-ahead for understanding what becomes available—and what preparation is required—when upgrading Splunk or moving from Splunk Enterprise to Splunk Cloud Platform.

## [Open Version Compass →](https://versioncompass.com)

Choose an upgrade or migration journey, the release currently in place, and the destination under consideration. The explorer builds a tailored view of:

- Supported Splunk Enterprise step-upgrade paths
- Splunk Cloud Platform capability milestones
- Enterprise-to-Cloud readiness gates and migration approaches
- Version-aware Splunk Cloud Migration Assessment App (SCMA) guidance
- New features grouped by customer outcome
- A collapsed, route-specific technical delta covering runtimes, data stores, protocols, cryptography, host requirements, APIs, permissions, and operating-model changes
- A dedicated, route-aware view of potential breaking changes, migration blockers, and delay risks
- Release-specific validation work and planning considerations
- Direct links to the relevant official Splunk documentation
- Shareable report URLs that preserve the selected journey and releases
- A print-optimized report that can be saved as PDF from the browser

No registration, lead form, subscription, or customer information is collected.

## Screenshots

### Select the upgrade or migration journey

![Splunk Version Value Explorer journey and release selectors](docs/images/version-selector.jpg)

### Explore the value delivered

![Splunk capabilities organized by customer outcome](docs/images/capability-explorer.jpg)

## Coverage

| Platform | Included releases |
| --- | --- |
| Splunk Enterprise | 8.1 through 10.4 |
| Splunk Cloud Platform | 9.2.2406 through 10.5.2605 |
| Enterprise → Cloud | Enterprise 8.1–10.4 to Cloud 9.2.2406–10.5.2605 |

The content is organized around five value themes: Search & AI, Platform Operations, Data Management, Security & Compliance, and Dashboards & Experience. A separate technical layer explains the documented before-and-after state, why it matters, and the recommended action without treating every component change as a breaking change. Enterprise-to-Cloud recommendations cover mobilization, assessment, migration-motion selection, app and data preparation, connectivity, access, acceptance testing, cutover, and retirement.

See [`docs/technical-changes.md`](docs/technical-changes.md) for the technical-delta content model and [`docs/enterprise-to-cloud.md`](docs/enterprise-to-cloud.md) for the migration guidance model, source map, and maintenance notes.

## Updating for a new release

Release content is centralized in [`dist/data.js`](dist/data.js). To extend the explorer:

1. Add the release identifier to the platform's `releases` array.
2. Add its date, official release-note URL, notable capabilities, technical changes, and readiness requirements under `releasesData`. Set the optional fifth requirement value to `true` when the official source identifies a potential breaking or material behavior change.
3. For Splunk Enterprise, add supported transitions to the `edges` upgrade-path map.
4. Update the platform's `latest` value and the reviewed date in [`dist/index.html`](dist/index.html).

Each `technicalChanges` record identifies the component or contract, technical area, change type, action level, documented before-and-after state, implication, recommended action, and official source. Preserve important scope distinctions such as bundled versus app-owned, default versus optional, deprecated versus removed, and platform-managed versus customer-managed.

Enterprise-to-Cloud content is kept in the top-level `migration` object. It contains the SCMA compatibility floor, official source links, operating-model benefits, migration approaches, technical operating-model changes, potential breaking changes, and recommended actions. When the latest Cloud destination changes, review both the Cloud release record and migration defaults.

The selectors, path visualization, metrics, filters, capability cards, collapsed technical delta, breaking-change report, readiness guidance, citations, and shareable URL are generated automatically from that data. The **Print / save PDF** action temporarily includes every value category, expands the technical detail, and uses the browser's native print dialog to create a portable report without sending data to a server.

## Collaboration is welcome

Updates, corrections, and improvements are encouraged—especially:

- New Splunk Enterprise and Splunk Cloud Platform releases
- Corrected upgrade paths or readiness requirements
- Improved Enterprise-to-Cloud assessment, preparation, validation, or cutover guidance
- Additional source-backed technical transitions and clearer implementation actions
- Additional customer-value context backed by official documentation
- Accessibility, responsive-design, and usability improvements
- Clearer language for customer-facing read-aheads

Open an issue to discuss an idea or submit a pull request with the proposed change. Please keep factual additions traceable to official Splunk documentation. Preserve the distinction between customer-managed Enterprise upgrades, Splunk-managed Cloud releases, and an Enterprise-to-Cloud migration program whose final sequence depends on the customer's environment.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the content model, workflow, and review checklist.

## Run locally

This is a dependency-free static site. Serve the repository root with any local HTTP server and open `/dist/`:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000/dist/`.

## Source and scope

The explorer summarizes official Splunk documentation, Splunk Lantern migration guidance, and the supplied product-innovation timeline. It is a planning aid—not a substitute for release notes, compatibility guidance, a Statement of Work, or an environment-specific upgrade or migration plan.

Version Compass is independently developed. It is not affiliated with, sponsored by, endorsed by, or an official product of Cisco or Splunk. Splunk is a Cisco company, and Splunk and related marks are the property of Cisco and/or its affiliates.

## License

Released under the [MIT License](LICENSE). This license covers the project source and original project content; third-party names, trademarks, and linked documentation remain the property of their respective owners.
