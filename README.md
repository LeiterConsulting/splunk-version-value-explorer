# Splunk Version Value Explorer

An interactive, customer-friendly read-ahead for understanding what becomes available—and what preparation is required—when moving between Splunk releases.

## [Open the live site →](https://splunk-version-value-explorer.majorgeneralrabidzagnut.chatgpt.site)

Select a platform, the release currently in place, and the release under consideration. The explorer builds a tailored view of:

- Supported Splunk Enterprise step-upgrade paths
- Splunk Cloud Platform capability milestones
- New features grouped by customer outcome
- Release-specific blockers, validation work, and planning considerations
- Direct links to the relevant official Splunk documentation

No registration, lead form, subscription, or customer information is collected.

## Screenshots

### Select the release journey

![Splunk Version Value Explorer release selectors](docs/images/version-selector.jpg)

### Explore the value delivered

![Splunk capabilities organized by customer outcome](docs/images/capability-explorer.jpg)

## Coverage

| Platform | Included releases |
| --- | --- |
| Splunk Enterprise | 8.1 through 10.4 |
| Splunk Cloud Platform | 9.2.2406 through 10.5.2605 |

The content is organized around five value themes: Search & AI, Platform Operations, Data Management, Security & Compliance, and Dashboards & Experience.

## Updating for a new release

Release content is centralized in [`dist/data.js`](dist/data.js). To extend the explorer:

1. Add the release identifier to the platform's `releases` array.
2. Add its date, official release-note URL, notable capabilities, and readiness requirements under `releasesData`.
3. For Splunk Enterprise, add supported transitions to the `edges` upgrade-path map.
4. Update the platform's `latest` value and the reviewed date in [`dist/index.html`](dist/index.html).

The selectors, path visualization, metrics, filters, capability cards, readiness guidance, citations, and shareable URL are generated automatically from that data.

## Run locally

This is a dependency-free static site. Serve the repository root with any local HTTP server and open `/dist/`:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000/dist/`.

## Source and scope

The explorer summarizes official Splunk documentation and the supplied product-innovation timeline. It is a planning aid—not a substitute for release notes, compatibility guidance, or an environment-specific upgrade plan.

Splunk is a registered trademark of Splunk Inc.
