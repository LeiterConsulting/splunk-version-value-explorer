# Product-track and dependency model

Version Compass places a product selector above the journey controls. It keeps one interaction pattern while preserving the different release and dependency models used by Splunk Platform, Enterprise Security, IT Service Intelligence, and Observability Cloud.

## Route behavior

| Product | Version axis | Platform context | Dependency result |
| --- | --- | --- | --- |
| Splunk Platform | Enterprise or Cloud release | Enterprise upgrade, Cloud milestone, or Enterprise → Cloud | Supported Enterprise step path or migration readiness route |
| Enterprise Security | ES product line | Splunk Enterprise or Splunk Cloud Platform release in place | Enterprise compatibility gate, or Cloud-managed pairing and availability notice |
| IT Service Intelligence | ITSI product line | Splunk Enterprise or Splunk Cloud Platform release in place | Enterprise compatibility gate, or Cloud-managed pairing and availability notice |
| Observability Cloud | Dated capability milestone | Connected Enterprise or Cloud Platform context | No universal platform floor; integration and OpenTelemetry dependencies are called out separately |

For customer-managed Splunk Enterprise, the explorer checks the selected Enterprise Security or ITSI target against Splunk's official product compatibility matrix. The visible labels intentionally summarize major/minor lines; the result always tells the reader to verify the exact maintenance pairing. When the platform line is too old, the callout links directly to a Version Compass platform route for the first compatible line represented in the dataset.

For Splunk Cloud Platform, Splunk coordinates compatible platform and premium-app service updates. The explorer therefore shows the currently documented service pairing or an availability check. It does not reuse Enterprise compatibility floors as Cloud rules or claim that a newly published premium-app version is already available on every stack, region, or maintenance schedule.

Observability Cloud is a rolling SaaS service. Its route uses dated release milestones, while customer-managed OpenTelemetry Collectors, Kubernetes charts, language instrumentation, RUM agents, semantic conventions, realms, and entitlements are treated as separate versioned or availability-sensitive dependencies.

Cross-product announcements keep the boundary published by their source. For example, the September 23 Observability milestone describes a free-edition flow from a Splunk Cloud Platform 10.6 environment, with a Discover app and privileged Cloud role. Version Compass records that as stack-specific Observability readiness, not as evidence that a generally available 10.6 Cloud release identifier or premium-app pairing should replace the current Platform route.

## Current source map

- [Splunk products version compatibility matrix](https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/compatibility-matrix/splunk-products-version-compatibility/splunk-products-version-compatibility-matrix)
- [Splunk Cloud Platform service details](https://help.splunk.com/en/splunk-cloud-platform/get-started/service-terms-and-policies/10.5.2605/information-about-the-service/splunk-cloud-platform-service-details)
- Enterprise Security release notes and upgrade guidance linked from each ES release record
- ITSI [5.0.2 Splunkbase listing](https://splunkbase.splunk.com/app/1841), [5.0 release-line notes](https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/5.0/release-notes/new-features-in-splunk-it-service-intelligence), [fixed issues](https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/5.0/release-notes/fixed-issues-in-splunk-it-service-intelligence), and [related app compatibility](https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/install-and-upgrade/5.0/planning/itsi-compatibility-with-related-apps-and-add-ons)
- [Splunk Observability Cloud release notes overview](https://help.splunk.com/en/splunk-observability-cloud/release-notes/release-notes-overview)
- [September 2026 Splunk Observability Cloud timeline](https://help.splunk.com/en/splunk-observability-cloud/release-notes/september-2026), including the September 23 APM, RUM, Synthetics, Observability Logs, and Cloud-connected onboarding records
- [Splunk OpenTelemetry Collector 0.161.0](https://github.com/signalfx/splunk-otel-collector/releases/tag/v0.161.0), [0.160.1](https://github.com/signalfx/splunk-otel-collector/releases/tag/v0.160.1), and the [0.160.0 breaking-change record](https://github.com/signalfx/splunk-otel-collector/releases/tag/v0.160.0)
- [Splunk OpenTelemetry Collector for Kubernetes chart 0.161.0](https://github.com/signalfx/splunk-otel-collector-chart/releases/tag/splunk-otel-collector-0.161.0)
- [Splunk OpenTelemetry .NET 1.16.0](https://github.com/signalfx/splunk-otel-dotnet/releases/tag/v1.16.0), [Node.js 4.11.0](https://github.com/signalfx/splunk-otel-js/releases/tag/v4.11.0), and [Browser RUM 3.1](https://github.com/signalfx/splunk-otel-js-web/releases/tag/v3.1.0)
- [Splunk Distribution of the OpenTelemetry Collector guidance](https://help.splunk.com/en/splunk-observability-cloud/manage-data/splunk-distribution-of-the-opentelemetry-collector/get-started-with-the-splunk-distribution-of-the-opentelemetry-collector)
- [Splunk Enterprise Security 8.6 security-fix floor](https://advisory.splunk.com/advisories/SVD-2026-0807)

## Security portfolio scope

The Enterprise Security route can include documented SIEM, SOAR, UEBA, threat-intelligence, exposure, and AI capabilities when they are part of, integrated with, or surfaced through the ES experience. Every record must preserve edition, deployment model, entitlement, region, release stage, and external-service boundaries. Do not imply that a capability is included for all ES customers.

For example, the Enterprise Security 8.7 route distinguishes Premier features that require Splunk enablement from Essentials capabilities (which Splunk also includes in Premier) and from features available in both editions.

Add a separate top-level security product only when Splunk publishes a stable, independently versioned customer journey that cannot be represented accurately inside the ES route.

## Scheduled review checklist

The daily release watch should check:

1. New Splunk Enterprise and Cloud Platform lines and maintenance guidance.
2. New Enterprise Security and ITSI releases on official release-note pages and Splunkbase.
3. Changes to the product compatibility matrix, including patch-specific footnotes.
4. The current Cloud service-description pairing for premium apps.
5. New dated Observability Cloud release-note pages and material Collector, chart, instrumentation, RUM, exporter, or semantic-convention prerequisites. Record a standalone Collector release separately when the current Kubernetes chart still packages an earlier Collector.

The twice-weekly guidance audit should also check:

1. Upgrade guides, READ THIS FIRST notices, removed or changed defaults, one-way transitions, and backup requirements.
2. Edition, entitlement, region, preview, controlled-availability, and external-AI boundaries.
3. Related apps and add-ons, supported Java and Python runtimes, CIM versions, APIs, permissions, and content-pack dependencies.
4. Observability semantic conventions, default dimensions, exporters, navigation replacements, and minimum Collector or instrumentation versions.
5. Every compatibility callout, technical transition, breaking-change flag, recommended action, and citation affected by revised guidance.

Any update must refresh the reviewed date, validate representative routes for all four products, preserve shareable URL restoration, confirm print expansion, update documentation when the model changes, and publish only after the source-backed review passes.
