/* Public environment evidence. See docs/cloud-environments.md. */
window.VersionCompassEnvironmentData = {
  "schemaVersion": 1,
  "checked": "2026-09-24",
  "providers": {
    "aws": "AWS",
    "azure": "Microsoft Azure",
    "gcp": "Google Cloud"
  },
  "regimes": {
    "commercial": "Commercial",
    "fr-m": "FR-M · FedRAMP Moderate",
    "fr-h": "FR-H · FedRAMP High"
  },
  "experiences": {
    "victoria": "Victoria",
    "classic": "Classic"
  },
  "regions": [
    {
      "id": "us-east-1",
      "label": "Virginia",
      "provider": "aws"
    },
    {
      "id": "us-west-2",
      "label": "Oregon",
      "provider": "aws"
    },
    {
      "id": "us-gov-east-1",
      "label": "GovCloud East",
      "provider": "aws"
    },
    {
      "id": "us-gov-west-1",
      "label": "GovCloud West",
      "provider": "aws"
    },
    {
      "id": "eu-west-1",
      "label": "Dublin",
      "provider": "aws"
    },
    {
      "id": "eu-west-2",
      "label": "London",
      "provider": "aws"
    },
    {
      "id": "eu-west-3",
      "label": "Paris",
      "provider": "aws"
    },
    {
      "id": "eu-central-1",
      "label": "Frankfurt",
      "provider": "aws"
    },
    {
      "id": "eu-south-1",
      "label": "Milan",
      "provider": "aws"
    },
    {
      "id": "eu-north-1",
      "label": "Stockholm",
      "provider": "aws"
    },
    {
      "id": "ap-southeast-1",
      "label": "Singapore",
      "provider": "aws"
    },
    {
      "id": "ap-southeast-2",
      "label": "Sydney",
      "provider": "aws"
    },
    {
      "id": "ap-southeast-3",
      "label": "Jakarta",
      "provider": "aws"
    },
    {
      "id": "ap-northeast-1",
      "label": "Tokyo",
      "provider": "aws"
    },
    {
      "id": "ap-northeast-2",
      "label": "Seoul",
      "provider": "aws"
    },
    {
      "id": "ap-south-1",
      "label": "Mumbai",
      "provider": "aws"
    },
    {
      "id": "ca-central-1",
      "label": "Canada Central",
      "provider": "aws"
    },
    {
      "id": "ca-west-1",
      "label": "Calgary",
      "provider": "aws"
    },
    {
      "id": "sa-east-1",
      "label": "São Paulo",
      "provider": "aws"
    },
    {
      "id": "me-central-1",
      "label": "UAE",
      "provider": "aws"
    },
    {
      "id": "gcp-iowa",
      "label": "Iowa",
      "provider": "gcp"
    },
    {
      "id": "gcp-oregon",
      "label": "Oregon",
      "provider": "gcp"
    },
    {
      "id": "gcp-frankfurt",
      "label": "Frankfurt",
      "provider": "gcp"
    },
    {
      "id": "gcp-dammam",
      "label": "Dammam",
      "provider": "gcp"
    },
    {
      "id": "gcp-london",
      "label": "London",
      "provider": "gcp"
    },
    {
      "id": "gcp-belgium",
      "label": "Belgium",
      "provider": "gcp"
    },
    {
      "id": "gcp-singapore",
      "label": "Singapore",
      "provider": "gcp"
    },
    {
      "id": "gcp-sydney",
      "label": "Sydney",
      "provider": "gcp"
    },
    {
      "id": "gcp-montreal",
      "label": "Montreal",
      "provider": "gcp"
    },
    {
      "id": "azure-phoenix",
      "label": "Phoenix",
      "provider": "azure"
    },
    {
      "id": "azure-virginia",
      "label": "Virginia",
      "provider": "azure"
    },
    {
      "id": "azure-london",
      "label": "London",
      "provider": "azure"
    },
    {
      "id": "azure-tokyo",
      "label": "Tokyo",
      "provider": "azure"
    }
  ],
  "realms": {
    "us0": "us-east-1",
    "us1": "us-west-2",
    "us2": "gcp-oregon",
    "eu0": "eu-west-1",
    "eu1": "eu-central-1",
    "eu2": "eu-west-2",
    "au0": "ap-southeast-2",
    "jp0": "ap-northeast-1",
    "sg0": "ap-southeast-1"
  },
  "sources": {
    "service": {
      "title": "Cloud Platform 10.5 service details",
      "url": "https://help.splunk.com/en/splunk-cloud-platform/get-started/service-terms-and-policies/10.5.2605/information-about-the-service/splunk-cloud-platform-service-details",
      "published": "2026-06-26",
      "scope": "10.5.2605; page modification date",
      "checked": "2026-09-24"
    },
    "changes": {
      "title": "Cloud service description change log",
      "url": "https://help.splunk.com/en/splunk-cloud-platform/get-started/service-terms-and-policies/10.5.2605/information-about-the-service/splunk-cloud-service-description-change-log",
      "published": "2026-08-25",
      "scope": "Latest dated entry in body; individual entries have their own effective dates",
      "checked": "2026-09-24"
    },
    "es": {
      "title": "ES 8.7 regional availability",
      "url": "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.7/splunk-enterprise-security-release-notes/compatibility-and-regional-availability",
      "published": "2026-09-01",
      "scope": "ES 8.7; page modification date",
      "checked": "2026-09-24"
    },
    "compliance": {
      "title": "Splunk compliance scope matrix",
      "url": "https://www.splunk.com/en_us/about-splunk/splunk-data-security-and-privacy/compliance-at-splunk.html",
      "published": "2026-02",
      "scope": "Matrix explicitly dated February 2026; individual marks require direct visual verification",
      "checked": "2026-09-24"
    },
    "high": {
      "title": "FedRAMP Marketplace: Cloud Platform High",
      "url": "https://www.fedramp.gov/marketplace/products/FR2314156865/",
      "published": "2024-09-13",
      "scope": "Named offering status date, not feature-review date",
      "checked": "2026-09-24"
    },
    "moderate": {
      "title": "FedRAMP Marketplace: Cloud Platform Moderate",
      "url": "https://www.fedramp.gov/marketplace/products/F1607197917/",
      "published": null,
      "scope": "Named offering record; feature scope requires separate evidence",
      "checked": "2026-09-24"
    },
    "victoria": {
      "title": "Victoria Experience High announcement",
      "url": "https://www.splunk.com/en_us/blog/industries/splunk-victoria-experience-is-now-authorized-at-fedramp-high.html",
      "published": "2026-07-10",
      "scope": "Platform experience authorization announcement",
      "checked": "2026-09-24"
    },
    "esmoderate": {
      "title": "ES Premier Moderate announcement",
      "url": "https://www.splunk.com/en_us/blog/industries/splunk-enterprise-security-premier-achieves-fedramp-moderate-authorization.html",
      "published": "2026-06-25",
      "scope": "Premier Moderate announcement; not universal component authorization",
      "checked": "2026-09-24"
    },
    "o11y": {
      "title": "Observability service description and realms",
      "url": "https://help.splunk.com/en/splunk-observability-cloud/get-started/service-description/splunk-observability-cloud-service-description",
      "published": "2026-03-25",
      "scope": "Rolling service; page modification date",
      "checked": "2026-09-24"
    }
  },
  "records": [
    {
      "id": "victoria-aws",
      "product": "platform",
      "feature": "Victoria Experience",
      "provider": "aws",
      "regions": [
        "us-east-1",
        "us-west-2",
        "eu-west-1",
        "eu-west-2",
        "eu-west-3",
        "eu-central-1",
        "eu-south-1",
        "ap-southeast-1",
        "ap-southeast-2",
        "ap-southeast-3",
        "ap-northeast-1",
        "ap-northeast-2",
        "ap-south-1",
        "ca-central-1",
        "sa-east-1"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "available",
      "authorization": "not_established",
      "detail": "New-stack regions; existing-stack migration is separately scheduled.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "experience": "victoria"
    },
    {
      "id": "victoria-gcp",
      "product": "platform",
      "feature": "Victoria Experience",
      "provider": "gcp",
      "regions": [
        "gcp-iowa",
        "gcp-frankfurt",
        "gcp-dammam"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "available",
      "authorization": "not_established",
      "detail": "New-stack regions; existing-stack migration is separately scheduled.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "experience": "victoria"
    },
    {
      "id": "victoria-azure",
      "product": "platform",
      "feature": "Victoria Experience",
      "provider": "azure",
      "regions": [
        "azure-phoenix",
        "azure-virginia",
        "azure-london",
        "azure-tokyo"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "available",
      "authorization": "not_established",
      "detail": "New-stack regions; existing-stack migration is separately scheduled.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "experience": "victoria"
    },
    {
      "id": "classic-gcp",
      "product": "platform",
      "feature": "Classic Experience",
      "provider": "gcp",
      "regions": [
        "gcp-london",
        "gcp-belgium",
        "gcp-singapore",
        "gcp-sydney",
        "gcp-montreal"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "available",
      "authorization": "not_established",
      "detail": "New-stack region listing.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "experience": "classic"
    },
    {
      "id": "classic-aws",
      "product": "platform",
      "feature": "Classic Experience",
      "provider": "aws",
      "regions": [
        "eu-north-1"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "available",
      "authorization": "not_established",
      "detail": "New-stack region listing.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "experience": "classic"
    },
    {
      "id": "victoria-gov",
      "product": "platform",
      "feature": "Victoria Experience",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-m",
        "fr-h"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "GovCloud offering; stack conversion depends on readiness.",
      "sources": [
        "service",
        "victoria"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "experience": "victoria"
    },
    {
      "id": "platform-fr-m",
      "product": "platform",
      "feature": "Cloud Platform offering",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-m"
      ],
      "availability": "conditional",
      "authorization": "documented",
      "detail": "Named offering scope; feature authorization is separate.",
      "sources": [
        "service",
        "moderate"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "platform-fr-h",
      "product": "platform",
      "feature": "Cloud Platform offering",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-h"
      ],
      "availability": "conditional",
      "authorization": "documented",
      "detail": "Named offering scope; feature authorization is separate.",
      "sources": [
        "service",
        "high"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "edge-aws",
      "product": "platform",
      "feature": "Edge Processor",
      "provider": "aws",
      "regions": [
        "us-east-1",
        "us-west-2",
        "eu-west-1",
        "eu-west-2",
        "eu-west-3",
        "eu-central-1",
        "eu-south-1",
        "ap-southeast-1",
        "ap-southeast-2",
        "ap-southeast-3",
        "ap-northeast-1",
        "ap-northeast-2",
        "ap-south-1",
        "ca-central-1",
        "sa-east-1",
        "ca-west-1"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Listed regions; service prerequisites apply.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "edge-moderate",
      "product": "platform",
      "feature": "Edge Processor",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-m"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Moderate availability recorded May 22, 2026.",
      "sources": [
        "service",
        "changes"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "effective": "2026-05-22"
    },
    {
      "id": "edge-gcp",
      "product": "platform",
      "feature": "Edge Processor",
      "provider": "gcp",
      "regions": [
        "gcp-iowa",
        "gcp-oregon",
        "gcp-frankfurt",
        "gcp-dammam",
        "gcp-london",
        "gcp-belgium",
        "gcp-singapore",
        "gcp-sydney",
        "gcp-montreal"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "Not currently available.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "edge-azure",
      "product": "platform",
      "feature": "Edge Processor",
      "provider": "azure",
      "regions": [
        "azure-phoenix",
        "azure-virginia",
        "azure-london",
        "azure-tokyo"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "Not currently available.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "ingest-aws",
      "product": "platform",
      "feature": "Ingest Processor",
      "provider": "aws",
      "regions": [
        "us-east-1",
        "us-west-2",
        "eu-west-1",
        "eu-west-2",
        "eu-west-3",
        "eu-central-1",
        "eu-south-1",
        "ap-southeast-1",
        "ap-southeast-2",
        "ap-southeast-3",
        "ap-northeast-1",
        "ap-northeast-2",
        "ap-south-1",
        "ca-central-1",
        "sa-east-1",
        "ca-west-1"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Listed regions; service prerequisites apply.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "ingest-moderate",
      "product": "platform",
      "feature": "Ingest Processor",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-m"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Moderate availability recorded May 22, 2026.",
      "sources": [
        "service",
        "changes"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "effective": "2026-05-22"
    },
    {
      "id": "ingest-gcp",
      "product": "platform",
      "feature": "Ingest Processor",
      "provider": "gcp",
      "regions": [
        "gcp-iowa",
        "gcp-oregon",
        "gcp-frankfurt",
        "gcp-dammam",
        "gcp-london",
        "gcp-belgium",
        "gcp-singapore",
        "gcp-sydney",
        "gcp-montreal"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "Not currently available.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "ingest-azure",
      "product": "platform",
      "feature": "Ingest Processor",
      "provider": "azure",
      "regions": [
        "azure-phoenix",
        "azure-virginia",
        "azure-london",
        "azure-tokyo"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "Not currently available.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "s3-commercial",
      "product": "platform",
      "feature": "Federated Search for Amazon S3",
      "provider": "aws",
      "regions": [
        "us-east-1",
        "us-west-2",
        "eu-west-1",
        "eu-west-2",
        "eu-west-3",
        "eu-central-1",
        "eu-south-1",
        "ap-southeast-1",
        "ap-southeast-2",
        "ap-southeast-3",
        "ap-northeast-1",
        "ap-northeast-2",
        "ap-south-1",
        "ca-central-1",
        "sa-east-1"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Optional subscription.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "s3-moderate",
      "product": "platform",
      "feature": "Federated Search for Amazon S3",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-m"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Moderate is listed.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "s3-high",
      "product": "platform",
      "feature": "Federated Search for Amazon S3",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-h"
      ],
      "availability": "conflicting",
      "authorization": "not_established",
      "detail": "High is excluded in the service table; the April 8 change log adds High availability. Confirm before planning.",
      "sources": [
        "service",
        "changes"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "effective": "2026-04-08",
      "claims": [
        {
          "text": "10.5.2605 service table excludes High.",
          "source": "service"
        },
        {
          "text": "April 8 change log adds High in both GovCloud regions for relevant 10.3 versions.",
          "source": "changes"
        }
      ]
    },
    {
      "id": "s3-gcp",
      "product": "platform",
      "feature": "Federated Search for Amazon S3",
      "provider": "gcp",
      "regions": [
        "gcp-iowa",
        "gcp-oregon",
        "gcp-frankfurt",
        "gcp-dammam",
        "gcp-london",
        "gcp-belgium",
        "gcp-singapore",
        "gcp-sydney",
        "gcp-montreal"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "Not currently available.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "s3-azure",
      "product": "platform",
      "feature": "Federated Search for Amazon S3",
      "provider": "azure",
      "regions": [
        "azure-phoenix",
        "azure-virginia",
        "azure-london",
        "azure-tokyo"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "Not currently available.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "security-lake-gov",
      "product": "platform",
      "feature": "Federated Analytics for Amazon Security Lake",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-m",
        "fr-h"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "GovCloud excluded.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "federation-azure",
      "product": "platform",
      "feature": "Federated Search for Splunk",
      "provider": "azure",
      "regions": [
        "azure-phoenix",
        "azure-virginia",
        "azure-london",
        "azure-tokyo"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Standard mode only.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "maintenance-gov",
      "product": "platform",
      "feature": "Maintenance-window visibility in ACS / CMC",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-m",
        "fr-h"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "GovCloud excluded.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "ingest-actions-gcp",
      "product": "platform",
      "feature": "Ingest Actions",
      "provider": "gcp",
      "regions": [
        "gcp-iowa",
        "gcp-oregon",
        "gcp-frankfurt",
        "gcp-dammam",
        "gcp-london",
        "gcp-belgium",
        "gcp-singapore",
        "gcp-sydney",
        "gcp-montreal"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Filtering and masking; routing is not listed.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "ingest-actions-azure",
      "product": "platform",
      "feature": "Ingest Actions",
      "provider": "azure",
      "regions": [
        "azure-phoenix",
        "azure-virginia",
        "azure-london",
        "azure-tokyo"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Filtering and masking; routing is not listed.",
      "sources": [
        "service"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee"
    },
    {
      "id": "es-assistant-gov",
      "product": "es",
      "feature": "Security Assistant",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-m",
        "fr-h"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "ES 8.7 regional exception; edition scope also applies.",
      "sources": [
        "es"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "release": "8.7"
    },
    {
      "id": "es-assistant-commercial",
      "product": "es",
      "feature": "Security Assistant",
      "provider": "aws",
      "regions": [
        "ca-west-1",
        "eu-north-1",
        "eu-south-1",
        "sa-east-1"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "ES 8.7 regional exception. Stockholm is listed for Essentials only; other listed exceptions cover both editions.",
      "sources": [
        "es"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "release": "8.7"
    },
    {
      "id": "es-agents-gov",
      "product": "es",
      "feature": "Agentic SOC",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-m",
        "fr-h"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "ES 8.7 regional exception; edition scope also applies.",
      "sources": [
        "es"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "release": "8.7"
    },
    {
      "id": "es-agents-commercial",
      "product": "es",
      "feature": "Agentic SOC",
      "provider": "aws",
      "regions": [
        "ca-west-1",
        "eu-north-1"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "ES 8.7 regional exception. Stockholm is listed for Essentials only; other listed exceptions cover both editions.",
      "sources": [
        "es"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "release": "8.7"
    },
    {
      "id": "es-attack-gov",
      "product": "es",
      "feature": "Attack Analyzer",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-m",
        "fr-h"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "ES 8.7 regional exception; edition scope also applies.",
      "sources": [
        "es"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "release": "8.7"
    },
    {
      "id": "es-attack-commercial",
      "product": "es",
      "feature": "Attack Analyzer",
      "provider": "aws",
      "regions": [
        "ap-northeast-1",
        "ap-northeast-2",
        "ap-southeast-1",
        "ap-southeast-3",
        "eu-south-1",
        "eu-west-1",
        "eu-west-3"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "ES 8.7 regional exception; edition scope also applies.",
      "sources": [
        "es"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "release": "8.7"
    },
    {
      "id": "es-components-gcp",
      "product": "es",
      "feature": "ES components beyond SIEM and SOAR",
      "provider": "gcp",
      "regions": [
        "gcp-iowa",
        "gcp-oregon",
        "gcp-frankfurt",
        "gcp-dammam",
        "gcp-london",
        "gcp-belgium",
        "gcp-singapore",
        "gcp-sydney",
        "gcp-montreal"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "The ES 8.7 regional guide limits these providers to ES and SOAR.",
      "sources": [
        "es"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "release": "8.7"
    },
    {
      "id": "es-base-gcp",
      "product": "es",
      "feature": "ES and SOAR",
      "provider": "gcp",
      "regions": [
        "gcp-iowa",
        "gcp-frankfurt",
        "gcp-dammam",
        "gcp-london",
        "gcp-belgium",
        "gcp-singapore",
        "gcp-sydney",
        "gcp-montreal"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Listed regions; supported version pairing is required.",
      "sources": [
        "es"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "release": "8.7"
    },
    {
      "id": "es-components-azure",
      "product": "es",
      "feature": "ES components beyond SIEM and SOAR",
      "provider": "azure",
      "regions": [
        "azure-phoenix",
        "azure-virginia",
        "azure-london",
        "azure-tokyo"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "The ES 8.7 regional guide limits these providers to ES and SOAR.",
      "sources": [
        "es"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "release": "8.7"
    },
    {
      "id": "es-base-azure",
      "product": "es",
      "feature": "ES and SOAR",
      "provider": "azure",
      "regions": [
        "azure-phoenix",
        "azure-virginia",
        "azure-london",
        "azure-tokyo"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Listed regions; supported version pairing is required.",
      "sources": [
        "es"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "release": "8.7"
    },
    {
      "id": "soar-oregon",
      "product": "es",
      "feature": "SOAR",
      "provider": "gcp",
      "regions": [
        "gcp-oregon"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "SOAR exception in the ES regional table.",
      "sources": [
        "es"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "release": "8.7"
    },
    {
      "id": "es-hybrid-gov",
      "product": "es",
      "feature": "Hybrid SOAR pairing",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-m",
        "fr-h"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "Cloud ES to on-premises SOAR pairing is excluded.",
      "sources": [
        "es"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "release": "8.7"
    },
    {
      "id": "es-premier-moderate",
      "product": "es",
      "feature": "ES Premier offering",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-m"
      ],
      "availability": "conditional",
      "authorization": "documented",
      "detail": "Premier Moderate authorization announced June 25; individual components retain regional and pairing restrictions.",
      "sources": [
        "esmoderate",
        "es"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "effective": "2026-06-25"
    },
    {
      "id": "o11y-us0",
      "product": "observability",
      "feature": "APM / Infrastructure Monitoring",
      "provider": "aws",
      "regions": [
        "us-east-1"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Realm us0; hosting is independent of monitored workloads.",
      "sources": [
        "o11y"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "realm": "us0"
    },
    {
      "id": "o11y-us1",
      "product": "observability",
      "feature": "APM / Infrastructure Monitoring",
      "provider": "aws",
      "regions": [
        "us-west-2"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Realm us1; hosting is independent of monitored workloads.",
      "sources": [
        "o11y"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "realm": "us1"
    },
    {
      "id": "o11y-us2",
      "product": "observability",
      "feature": "APM / Infrastructure Monitoring",
      "provider": "gcp",
      "regions": [
        "gcp-oregon"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Realm us2; hosting is independent of monitored workloads.",
      "sources": [
        "o11y"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "realm": "us2"
    },
    {
      "id": "o11y-eu0",
      "product": "observability",
      "feature": "APM / Infrastructure Monitoring",
      "provider": "aws",
      "regions": [
        "eu-west-1"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Realm eu0; hosting is independent of monitored workloads.",
      "sources": [
        "o11y"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "realm": "eu0"
    },
    {
      "id": "o11y-eu1",
      "product": "observability",
      "feature": "APM / Infrastructure Monitoring",
      "provider": "aws",
      "regions": [
        "eu-central-1"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Realm eu1; hosting is independent of monitored workloads.",
      "sources": [
        "o11y"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "realm": "eu1"
    },
    {
      "id": "o11y-eu2",
      "product": "observability",
      "feature": "APM / Infrastructure Monitoring",
      "provider": "aws",
      "regions": [
        "eu-west-2"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Realm eu2; hosting is independent of monitored workloads.",
      "sources": [
        "o11y"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "realm": "eu2"
    },
    {
      "id": "o11y-au0",
      "product": "observability",
      "feature": "APM / Infrastructure Monitoring",
      "provider": "aws",
      "regions": [
        "ap-southeast-2"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Realm au0; hosting is independent of monitored workloads.",
      "sources": [
        "o11y"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "realm": "au0"
    },
    {
      "id": "o11y-jp0",
      "product": "observability",
      "feature": "APM / Infrastructure Monitoring",
      "provider": "aws",
      "regions": [
        "ap-northeast-1"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Realm jp0; hosting is independent of monitored workloads.",
      "sources": [
        "o11y"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "realm": "jp0"
    },
    {
      "id": "o11y-sg0",
      "product": "observability",
      "feature": "APM / Infrastructure Monitoring",
      "provider": "aws",
      "regions": [
        "ap-southeast-1"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "conditional",
      "authorization": "not_established",
      "detail": "Realm sg0; hosting is independent of monitored workloads.",
      "sources": [
        "o11y"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "realm": "sg0"
    },
    {
      "id": "o11y-db-us2",
      "product": "observability",
      "feature": "Database Monitoring",
      "provider": "gcp",
      "regions": [
        "gcp-oregon"
      ],
      "regimes": [
        "commercial"
      ],
      "availability": "unavailable",
      "authorization": "not_established",
      "detail": "The service table lists no Google Cloud region for Database Monitoring.",
      "sources": [
        "o11y"
      ],
      "checked": "2026-09-24",
      "scope": "Current service guidance; not a historical availability guarantee",
      "realm": "us2"
    },
    {
      "id": "edge-high-unknown",
      "product": "platform",
      "feature": "Edge Processor",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-h"
      ],
      "availability": "not_established",
      "authorization": "not_established",
      "detail": "The reviewed region table does not establish this feature for the selected regulated scope. Absence is not an exclusion.",
      "sources": [
        "service",
        "compliance"
      ],
      "checked": "2026-09-24",
      "scope": "Current evidence gap; not a denial of availability"
    },
    {
      "id": "ingest-high-unknown",
      "product": "platform",
      "feature": "Ingest Processor",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-h"
      ],
      "availability": "not_established",
      "authorization": "not_established",
      "detail": "The reviewed region table does not establish this feature for the selected regulated scope. Absence is not an exclusion.",
      "sources": [
        "service",
        "compliance"
      ],
      "checked": "2026-09-24",
      "scope": "Current evidence gap; not a denial of availability"
    },
    {
      "id": "platform-ai-high-unknown",
      "product": "platform",
      "feature": "AI Assistant for SPL",
      "provider": "aws",
      "regions": [
        "us-gov-east-1",
        "us-gov-west-1"
      ],
      "regimes": [
        "fr-m",
        "fr-h"
      ],
      "availability": "not_established",
      "authorization": "not_established",
      "detail": "The reviewed region table does not establish this feature for the selected regulated scope. Absence is not an exclusion.",
      "sources": [
        "service",
        "compliance"
      ],
      "checked": "2026-09-24",
      "scope": "Current evidence gap; not a denial of availability"
    }
  ]
};
