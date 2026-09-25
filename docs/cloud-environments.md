# Cloud environments and regional evidence

Version Compass includes optional hosting context alongside release and edition comparisons. The purpose is to expose documented regional differences without making a selected release, hosting provider, or authorization level imply universal feature availability.

## Independent dimensions

| Dimension | Meaning |
| --- | --- |
| Hosting provider | AWS, Microsoft Azure, or Google Cloud hosting for the Splunk service, separate from the clouds a customer monitors. |
| Hosting region | An explicitly identified location within a provider. Regions can be selected without first selecting a provider. |
| Compliance environment | Commercial, FedRAMP Moderate (FR-M), or FedRAMP High (FR-H). Neither FedRAMP level inherits another level's feature coverage. |
| Platform experience | Classic or Victoria where the platform source distinguishes them. This field does not apply to Observability realms. |

Filters intersect. Unspecified dimensions leave evidence unconstrained; they do not establish broad availability. A provider/region mismatch is invalid, while a valid combination lacking evidence remains selectable and produces an explicit “not established” result. Changing provider clears an incompatible region visibly. Clearing filters restores the ordinary comparison.

AWS region identifiers use published region codes. Google Cloud and Azure geographic selection identifiers are stable Version Compass labels, not representations of the providers' deployment codes. Observability realms remain separate evidence attributes.

The controls appear in Cloud and migration Release Guide journeys, Observability journeys, and ES Editions. Selected context is retained in share links, navigation between views, print reports, and the existing Release Guide WebMCP reports. Individual capabilities receive regional notes where the evidence can be matched to that capability. The full evidence list remains available for review.

## Evidence and its limits

Availability is recorded as documented available, available with conditions, documented unavailable, not established, or conflicting guidance. Offering authorization is a separate field. A FedRAMP listing does not establish that every component, AI capability, app, edition, or deployment pairing is in scope. Installability and FIPS-related app tags are also not authorization evidence. Missing cells, absent records, and unparsed compliance icons never become negative claims.

Records retain product, provider, explicit regions, compliance environment, experience or realm where applicable, source scope, review date, and source publication date when known. Current service evidence is displayed separately from the selected historical release interval; it does not assert when a feature first became available in a location. Release compatibility and lifecycle guidance continue to have their own evidence and meaning.

Initial coverage includes Cloud Platform hosting and selected processor/federation differences; ES 8.7 regional restrictions and named Premier Moderate offering evidence; and Observability realm hosting with selected service restrictions. ITSI currently receives host context only. Product-specific ITSI and Observability FedRAMP feature coverage is not established by this evidence set. The filter catalog is not an exhaustive inventory of Splunk offerings or regions.

The consolidated compliance matrix is dated February 2026. Its marks were not used to infer feature authorization in this update. More recent, specifically scoped sources can support individual records without implying that the entire matrix has been refreshed.

A known conflict is preserved for Amazon S3 federated search in High: the 10.5 service-details table excludes High/IL5 while a service-description change-log entry describes support for specified 10.3 releases. Both statements and version scopes remain visible. Resolving a disagreement requires authoritative scope clarification, not choosing the newer-looking page automatically.

Ingest Processor's [product guide](https://help.splunk.com/en/splunk-cloud-platform/process-data-at-ingest-time/use-ingest-processors/introduction/about-ingest-processor) requires Victoria Experience and a provisioned tenant. The maintained Commercial and Moderate regional records therefore distinguish conditional Victoria availability from the explicit Classic restriction. Selecting Classic keeps the restriction visible instead of hiding the capability. With experience unspecified, both scoped records are shown; this is not a source conflict. High coverage remains independently unestablished. The guide's June 16 modification date and September 25 check date are not a new feature launch date.

## Source discovery

The [10.5.2605 service-details page](https://help.splunk.com/en/splunk-cloud-platform/get-started/service-terms-and-policies/10.5.2605/information-about-the-service/splunk-cloud-platform-service-details) is a useful starting point, not an exclusive source. The evidence model also draws on:

- [Service-description changes](https://help.splunk.com/en/splunk-cloud-platform/get-started/service-terms-and-policies/10.5.2605/information-about-the-service/splunk-cloud-service-description-change-log), including effective entries whose dates differ from page metadata.
- [ES compatibility and regional availability](https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.7/splunk-enterprise-security-release-notes/compatibility-and-regional-availability).
- [Observability service description](https://help.splunk.com/en/splunk-observability-cloud/get-started/service-description/splunk-observability-cloud-service-description).
- [Splunk compliance information](https://www.splunk.com/en_us/about-splunk/splunk-data-security-and-privacy/compliance-at-splunk.html), scoped product announcements, and the [FedRAMP Marketplace](https://www.fedramp.gov/marketplace/).

New versions, product documentation, authorization records, and newer sources should be discovered as part of review. Announcements, service delivery, authorization boundaries, licensing, release stage, and regional availability remain separate questions even when discussed on the same page.

## Maintenance and reuse

The dedicated CSP FedRAMP Watch runs in Codex daily, around 7 AM Eastern. It monitors source changes and owns routine environment evidence updates. The release and editions watches retain responsibility for their product content; the twice-weekly guidance audit checks the complete experience. All follow the same evidence, uncertainty, validation, concurrency, and publication principles described in [Scheduled maintenance](scheduled-maintenance.md).

`dist/environment-data.js` holds the evidence. `dist/environment.js` provides shared validation, filtering, explanation, and report content; `dist/environment.css` supplies its presentation. The existing WebMCP tools expose the same assessment without introducing a separate agent dataset or changing the page. URL and input validation prevent malformed selections from silently becoming verified defaults.

For a similar site, the transferable principle is to model independent dimensions and retain the qualifications behind each claim. A small set of explicit, sourced records is more useful than a complete-looking matrix assembled through inference. Separate source dates from review dates, retain conflicts, and ensure screen, print, links, and agent access share one interpretation. A repository fork does not copy the external Codex schedules or publishing permissions.

Automated tests exercise filter intersections, source references, uncertainty, malformed links, shared report behavior, and input contracts. They do not certify upstream accuracy, browser layout, or PDF pagination. Rendered and native-browser checks should be identified separately when performed.
