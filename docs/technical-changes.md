# Technical-change guidance model

Version Compass uses a collapsed technical layer to explain what changes underneath a selected upgrade or migration route without turning the main experience into a component matrix.

The published experience remains concise by default. When the user opens **Technical changes**, records are grouped by release milestone and show only transitions encountered across the selected route. **Print / save PDF** expands the section automatically so a customer read-ahead includes the full technical context and citations.

## Record structure

Platform technical records live in each release's `technicalChanges` array in `dist/data.js`. Enterprise-to-Cloud operating-model records live in `migration.technicalChanges`. Enterprise Security, ITSI, and Observability records live in `dist/product-data.js`.

| Field | Purpose |
| --- | --- |
| `component` | The runtime, data store, protocol, security control, API, permission, host baseline, or operating boundary that changes |
| `domain` | A stable technical grouping such as Runtime & apps, Data & storage, Security & cryptography, Connectivity & trust, or Host & operations |
| `changeType` | A concise factual classification such as Removed, Default changed, Engine migration, Compatibility floor, or Architecture changed |
| `actionLevel` | `Required`, `Review`, or `Awareness` |
| `from` | The documented state before the change |
| `to` | The documented state after the change |
| `implication` | Why the transition matters to an implementation or workload |
| `action` | A concise action supported by the cited guidance |
| `source` | The official Splunk page supporting the record |

## Classification rules

- A technical change is not automatically a potential breaking change. Use `requirements` with its breaking flag only when Splunk identifies removal, incompatibility, a changed default, a prerequisite, or another condition that can materially disrupt the route.
- Use **Required** only when the source establishes a prerequisite or an action necessary to preserve compatibility or service.
- Use **Review** when applicability depends on the customer's apps, topology, configuration, or integrations.
- Use **Awareness** for an implementation change that is useful context but does not normally require customer action.
- Preserve scope precisely. “Bundled runtime removed” is different from “technology unsupported”; “Python 3.13 in Splunk Web” is different from “Python 3.13 is the platform default.”
- Preserve lifecycle precision: introduced, available, optional, default, restricted, deprecated, and removed are distinct states.
- A deprecated alias that remains functional is planning debt, not a mandatory migration or breaking change. Record the preferred replacement and keep the future-removal risk separate unless the source publishes an actual removal release.
- For Splunk Cloud Platform, include only customer-visible contracts and customer-actionable changes. Do not present Splunk-managed backend component versions as customer responsibilities.
- For Enterprise Security and ITSI on customer-managed Enterprise, keep the product change distinct from the compatible platform maintenance pairing. A platform prerequisite belongs in the compatibility gate and readiness list as well as any relevant technical record.
- For premium apps on Splunk Cloud Platform, describe availability as Splunk-managed and stack-, region-, entitlement-, or schedule-dependent where applicable. Do not infer Cloud compatibility from the Enterprise matrix.
- For Observability Cloud, distinguish rolling-service availability from the customer-managed Collector, Kubernetes chart, instrumentation, RUM agent, exporter, and semantic-convention versions.
- Keep customer-managed Synthetics private-runner versions and their browser or authentication behavior distinct from rolling SaaS changes.
- A Cloud Platform version mentioned by an Observability integration announcement is a scoped prerequisite, not a new Platform route. Add the Platform identifier only when the applicable Cloud release notes and service details publish it; continue to preserve stack, role, region, entitlement, pairing, and schedule boundaries.
- Keep standalone Collector and Kubernetes chart versions explicit when their release cadence diverges. Do not imply that a chart user receives a newer Collector default until the chart packages it or the customer deliberately overrides the image.

## Release review checklist

For every newly published or revised release:

1. Review the release's **What's New**, **READ THIS FIRST**, upgrade-path, system-requirement, app-compatibility, security, and deprecation/removal guidance.
2. Check runtimes, bundled libraries, KV Store, protocols, cryptographic modules, certificate rules, operating-system and processor support, service identities, configuration formats, APIs, permissions, and changed defaults.
3. Add only route-relevant changes that can be expressed with an evidence-supported before-and-after state.
4. Reconcile overlap with `requirements`: technical detail explains the mechanism, while the breaking-change and readiness sections explain risk and execution priority.
5. Verify every citation directly and update the reviewed date.
6. Test Platform, Enterprise-to-Cloud, Enterprise Security, ITSI, and Observability routes—including an incompatible platform pairing, print expansion, and restoration of the user's prior collapsed state.

## Current source hierarchy

Prefer release-specific official Splunk documentation in this order:

1. **READ THIS FIRST** upgrade guidance and supported upgrade paths
2. Product release notes and **What's New** pages
3. System requirements, compatibility matrices, app-development compatibility guidance, and configuration references
4. Splunk Lantern migration guidance and the supported Splunk Cloud Migration Assessment App listing

The technical inventory is curated and is not intended to be a complete software bill of materials, vulnerability inventory, or substitute for an environment-specific compatibility assessment.
