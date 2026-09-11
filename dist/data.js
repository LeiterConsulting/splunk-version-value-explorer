/* Content model: add a release here and the interface updates automatically. */
window.SPLUNK_DATA = {
  categories: {
    "Search & AI": { icon: "✦", description: "Faster answers and new ways to build" },
    "Platform operations": { icon: "⌁", description: "Resilience, scale, and simpler administration" },
    "Data management": { icon: "⇄", description: "More control from ingest through archive" },
    "Security & compliance": { icon: "◇", description: "Stronger controls and modern cryptography" },
    "Dashboards & experience": { icon: "▦", description: "Clearer workflows and richer presentation" }
  },
  enterprise: {
    label: "Splunk Enterprise",
    kind: "customer-managed upgrade",
    latest: "10.4",
    releases: ["8.1", "8.2", "9.0", "9.1", "9.2", "9.3", "9.4", "10.0", "10.2", "10.4"],
    edges: {
      "8.1": ["8.2", "9.0"], "8.2": ["9.0", "9.1"], "9.0": ["9.1", "9.2"],
      "9.1": ["9.2", "9.3", "9.4"], "9.2": ["9.3", "9.4", "10.0"],
      "9.3": ["9.4", "10.0"], "9.4": ["10.0", "10.2"], "10.0": ["10.2", "10.4"], "10.2": ["10.4"]
    },
    upgradeSource: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/how-to-upgrade-splunk-enterprise",
    releasesData: {
      "8.1": {
        date: "October 2020", source: "https://docs.splunk.com/Documentation/Splunk/8.1.14/ReleaseNotes/MeetSplunk",
        features: [
          ["Python 3 becomes the default", "Platform operations", "Modernize app foundations", "Python 3 becomes the default runtime while Python 2.7 remains available for transition."],
          ["SmartStore on Google Cloud Storage", "Data management", "Expand storage choice", "SmartStore adds support for GCS-backed remote object storage."],
          ["Ingest-time lookups", "Data management", "Enrich earlier", "Apply lookup fields during ingestion so context is present before search time."]
        ], requirements: []
      },
      "8.2": {
        date: "May 2021", source: "https://docs.splunk.com/Documentation/Splunk/8.2.12/ReleaseNotes/MeetSplunk",
        features: [
          ["Dashboard Studio reaches GA", "Dashboards & experience", "Tell a richer data story", "Create responsive, pixel-aware experiences with a modern dashboard framework."],
          ["Python Upgrade Readiness", "Platform operations", "Reduce migration guesswork", "Find app and script dependencies that need attention before Python modernization."],
          ["SmartStore adds IMDSv2", "Security & compliance", "Harden cloud metadata access", "Use AWS Instance Metadata Service v2 with SmartStore deployments."]
        ], requirements: []
      },
      "9.0": {
        date: "June 2022", source: "https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/9.0/whats-new/welcome-to-splunk-enterprise-9.0",
        features: [
          ["Ingest Actions", "Data management", "Control cost before indexing", "Route, filter, mask, and transform data on heavy forwarders before it reaches indexes."],
          ["Federated Search experience", "Search & AI", "Search beyond one deployment", "Build federated searches with guided UI support across compatible Splunk environments."],
          ["Configuration Change Tracker", "Platform operations", "Make change history visible", "Audit configuration changes and troubleshoot drift with clearer context."],
          ["Splunk Assist", "Search & AI", "Bring cloud-powered guidance on premises", "Receive configuration insights and recommendations from a connected cloud service."],
          ["SmartStore for Azure", "Data management", "Extend storage architecture", "Use Azure Blob Storage as a SmartStore remote object store."]
        ], requirements: [
          ["Migrate the KV Store engine", "Splunk Enterprise 9.0 moves KV Store from MongoDB 3.6 to 4.2. Complete the documented migration and validate apps that depend on KV Store.", "Plan", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.0/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.0-read-this-first"]
        ]
      },
      "9.1": {
        date: "June 2023", source: "https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/9.1/whats-new/welcome-to-splunk-enterprise-9.1",
        features: [
          ["Search-head rolling upgrades", "Platform operations", "Protect search availability", "Automate rolling upgrades across a search head cluster with less manual orchestration."],
          ["Parallel reduce", "Search & AI", "Accelerate high-cardinality work", "Distribute qualifying reduce-phase processing to improve demanding searches."],
          ["Live preview for Ingest Actions", "Data management", "Validate before routing", "See the impact of rules on sample data before applying them."],
          ["Cluster-wide search history", "Search & AI", "Keep work visible across nodes", "Access search history across search head cluster members."],
          ["Redesigned home experience", "Dashboards & experience", "Reach work faster", "Navigate apps, recent objects, and learning resources from a cleaner starting point."]
        ], requirements: [
          ["Test apps against jQuery 3.5", "jQuery 3.5 is the default. Review custom apps and dashboards for compatibility before production rollout.", "Test", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.1/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.1-read-this-first"]
        ]
      },
      "9.2": {
        date: "January 2024", source: "https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/9.2/whats-new/welcome-to-splunk-enterprise-9.2",
        features: [
          ["Deployment server clustering", "Platform operations", "Remove a management bottleneck", "Add high availability and scale to deployment-server operations."],
          ["HTTP Event Collector output", "Data management", "Route data more flexibly", "Send data from a heavy forwarder through HTTP Event Collector output."],
          ["Operating-system trust store", "Security & compliance", "Simplify certificate governance", "Use trusted CA certificates supplied by the host operating system."],
          ["Dashboard conversion report", "Dashboards & experience", "Plan modernization", "Identify Simple XML elements that need attention when moving to Dashboard Studio."],
          ["Broader Ingest Actions scale", "Data management", "Apply policy at higher volume", "Scale Ingest Actions across large heavy-forwarder estates."]
        ], requirements: []
      },
      "9.3": {
        date: "July 2024", source: "https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/9.3/whats-new/welcome-to-splunk-enterprise-9.3",
        features: [
          ["Indexer-cluster rolling upgrades", "Platform operations", "Keep data flowing through change", "Automate rolling upgrades for indexer clusters while preserving service continuity."],
          ["Field filters", "Security & compliance", "Limit sensitive field exposure", "Apply search-time field restrictions for eligible roles and workflows."],
          ["Usage-aware rebalancing", "Platform operations", "Balance storage more intelligently", "Rebalance indexer data using storage usage for more even utilization."],
          ["Scheduled PDF and PNG export", "Dashboards & experience", "Deliver insight in familiar formats", "Schedule Dashboard Studio exports for offline distribution."],
          ["Python 3.9 becomes default", "Platform operations", "Refresh the runtime baseline", "Move the embedded Python default to 3.9 for apps and integrations."]
        ], requirements: [
          ["Validate field-filter roles", "Earlier role-based field filter syntax is not valid in 9.3. Review rules and confirm that restricted fields behave as expected.", "Validate", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.3/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.3-read-this-first"]
        ]
      },
      "9.4": {
        date: "December 2024", source: "https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/9.4/whats-new/welcome-to-splunk-enterprise-9.4",
        features: [
          ["Agent Management", "Platform operations", "Operate forwarders from one view", "Use a dedicated interface to manage supported agent estates and deployment activity."],
          ["KV Store 7", "Platform operations", "Strengthen app-state services", "Adopt the newer KV Store engine with an automated migration path."],
          ["SPL2-based applications", "Search & AI", "Build for the next search language", "Run applications designed around SPL2 pipelines and modules."],
          ["Persistent queues for S2S", "Data management", "Increase delivery resilience", "Buffer Splunk-to-Splunk traffic through interruptions."],
          ["Oversized lookup quarantine", "Platform operations", "Protect cluster stability", "Prevent oversized lookups from disrupting search head cluster replication."]
        ], requirements: [
          ["Confirm CPU instruction support", "Hosts require AVX, SSE4.2, and AES-NI processor support. Verify every target host—not only a representative node.", "Blocker", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.4-read-this-first"],
          ["Account for sidecar configuration", "New sidecar processes can write web.conf and restmap.conf under system/local. Update configuration-management ownership and drift rules.", "Plan", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.4-read-this-first"]
        ]
      },
      "10.0": {
        date: "July 2025", source: "https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/10.0/whats-new/welcome-to-splunk-enterprise-10.0",
        features: [
          ["Edge Processor", "Data management", "Shape data closer to its source", "Centrally author pipelines that filter, mask, transform, and route data at the edge."],
          ["FIPS 140-3 and mutual TLS", "Security & compliance", "Raise the cryptographic baseline", "Use stronger validated cryptography and mutual authentication patterns."],
          ["OpenTelemetry collectors", "Data management", "Bring in open-standard telemetry", "Manage supported OTel collection paths alongside Splunk data flows."],
          ["Fine-grained knowledge permissions", "Security & compliance", "Delegate access more precisely", "Apply more granular control to shared knowledge objects."],
          ["Audit Trail dashboards", "Dashboards & experience", "See administrative activity", "Explore security and platform audit events through purpose-built dashboards."]
        ], requirements: [
          ["Remove Python 2 dependencies", "Splunk Enterprise 10.0 supports Python 3.9 only. Inventory custom scripts, modular inputs, and private apps before the jump.", "Blocker", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.0/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.0-read-this-first"],
          ["Test OpenSSL 3 compatibility", "Review custom apps, certificates, and integrations for the OpenSSL 3 baseline and updated cryptographic defaults.", "Test", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.0/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.0-read-this-first"]
        ]
      },
      "10.2": {
        date: "January 2026", source: "https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/10.2/whats-new/welcome-to-splunk-enterprise-10.2",
        features: [
          ["SPL2 in Search", "Search & AI", "Create reusable search logic", "Use SPL2 pipelines, functions, and modules in supported Search experiences."],
          ["AI Assistant for SPL", "Search & AI", "Shorten the path from question to search", "Translate natural-language intent into SPL and receive guided explanations."],
          ["Parquet from Edge Processor", "Data management", "Open new downstream analytics paths", "Route supported data from edge pipelines into Parquet-based destinations."],
          ["OAuth 2.0 expansion", "Security & compliance", "Use modern delegated access", "Apply OAuth-based authentication across more supported interfaces."],
          ["Field filters become the default", "Security & compliance", "Operationalize least privilege", "Enable field filters by default and extend their behavior to accelerated searches."]
        ], requirements: [
          ["Replace embedded Node.js dependencies", "The embedded Node.js runtime is removed. Package or redesign custom app components that depended on it.", "Blocker", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.2-read-this-first"],
          ["Review service identity and edge hosts", "Splunk no longer runs as root by default, and Edge Processor drops several older operating systems. Validate service accounts, file access, and edge nodes.", "Validate", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.2-read-this-first"],
          ["Check federated provider names", "Federated provider names become case-insensitive. Resolve names that differ only by capitalization.", "Test", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.2-read-this-first"]
        ]
      },
      "10.4": {
        date: "May 2026", source: "https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/10.4/whats-new/welcome-to-splunk-enterprise-10.4",
        features: [
          ["Post-quantum cryptography", "Security & compliance", "Prepare protected traffic for the future", "Use supported algorithms aligned to FIPS 203, 204, and 205 alongside TLS 1.3."],
          ["Configuration validation API", "Platform operations", "Catch defects before rollout", "Programmatically validate configuration changes earlier in the delivery lifecycle."],
          ["Indexing and replication split", "Platform operations", "Scale cluster work independently", "Separate indexing and replication responsibilities to improve architectural flexibility."],
          ["Modern navigation reaches GA", "Dashboards & experience", "Reduce friction across workflows", "Use a refreshed navigation model designed around faster access to work."],
          ["Topology API", "Platform operations", "Automate infrastructure awareness", "Query deployment topology to power operations, inventory, and orchestration."],
          ["Dashboard Studio framework", "Dashboards & experience", "Build more expressive experiences", "Add custom visualizations, improved token management, network graphs, and accelerated lines."],
          ["Bulk data movement", "Data management", "Move indexed data with less manual work", "Orchestrate supported bulk data movement between locations."],
          ["HTTP/2 and targeted federation", "Search & AI", "Connect and search more efficiently", "Use newer transport and more selective targeting for federated workflows."]
        ], requirements: [
          ["Reach KV Store 7 before upgrading", "All deployments must use KV Store 7. Complete the migration and verify app collections before moving to 10.4.", "Blocker", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first"],
          ["Modernize TLS and certificates", "TLS 1.0/1.1 and SHA-1-signed certificates are removed. Inventory every internal and external connection and replace incompatible endpoints.", "Blocker", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first"],
          ["Move away from privileged services", "Root and administrator service identities are no longer supported. Confirm file ownership, ports, boot configuration, and service accounts.", "Blocker", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first"],
          ["Validate apps and classic dashboards", "Run AppInspect, remove jQuery 2 dependencies, and plan migration for classic Simple XML dashboards affected by current lifecycle guidance.", "Test", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first"],
          ["Review dashboard refresh permissions", "The auto_refresh_dashboards capability governs automatic dashboard refresh. Confirm roles retain intended behavior.", "Validate", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first"]
        ]
      }
    }
  },
  cloud: {
    label: "Splunk Cloud Platform",
    kind: "Splunk-managed release",
    latest: "10.5.2605",
    releases: ["9.2.2406", "9.3.2408", "10.0.2503", "10.1.2507", "10.2.2510", "10.4.2604", "10.5.2605"],
    releasesData: {
      "9.2.2406": {
        date: "2024", source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/9.2.2406/splunk-cloud-platform-release-notes/whats-new",
        features: [
          ["Federated metric indexes", "Search & AI", "Analyze metrics across boundaries", "Search supported metric indexes through federated connections."],
          ["Dashboard Studio tabs", "Dashboards & experience", "Organize dense experiences", "Group related dashboard content into navigable tabs."],
          ["IPv6 administration", "Platform operations", "Support modern network estates", "Use expanded IPv6 controls for supported administrative access."]
        ], requirements: []
      },
      "9.3.2408": {
        date: "2024", source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/9.3.2408/splunk-cloud-platform-release-notes/whats-new",
        features: [
          ["Amazon Security Lake federation", "Search & AI", "Investigate without copying first", "Use Federated Analytics to reach supported Amazon Security Lake data."],
          ["SPL2 app development", "Search & AI", "Start building modular search experiences", "Develop compatible apps using early SPL2 capabilities."],
          ["CloudTrail catalog automation", "Data management", "Reduce federation setup work", "Use AWS Glue automation for supported CloudTrail datasets."],
          ["Search-head resilience", "Platform operations", "Improve continuity", "Benefit from platform enhancements for search head cluster resilience."]
        ], requirements: []
      },
      "10.0.2503": {
        date: "2025", source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.0.2503/splunk-cloud-platform-release-notes/whats-new",
        features: [
          ["Email domain controls", "Security & compliance", "Govern outbound sharing", "Constrain scheduled email delivery to approved domains."],
          ["Field-filter processing improvements", "Security & compliance", "Enforce data visibility more consistently", "Refine how field filters interact with the search pipeline."],
          ["API modernization", "Platform operations", "Move integrations to a current contract", "Adopt Search API v2 as v1 becomes disabled by default."]
        ], requirements: [
          ["Move Search API clients to v2", "Search API v1 is disabled by default. Inventory integrations and validate them against API v2.", "Test", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.0.2503/splunk-cloud-platform-release-notes/whats-new"],
          ["Check federated saved-search names", "Local saved searches beginning with “federated:” can conflict with updated naming behavior.", "Validate", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.0.2503/splunk-cloud-platform-release-notes/whats-new"]
        ]
      },
      "10.1.2507": {
        date: "2025", source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.1.2507/splunk-cloud-platform-release-notes/whats-new",
        features: [
          ["Field filters by default", "Security & compliance", "Advance least-privilege search", "Use field filters by default, including expanded accelerated-search support."],
          ["Audit Trail v2", "Platform operations", "Normalize audit visibility", "Work with JSON-formatted, CIM-aligned administrative audit events."],
          ["AI Assistant maturation", "Search & AI", "Build and understand SPL faster", "Use updated natural-language search guidance through the supported app."],
          ["Password network allow list", "Security & compliance", "Constrain credential use", "Limit password authentication to approved networks."]
        ], requirements: [
          ["Align the AI Assistant app", "AI Assistant in Search requires a supported app version; release 1.3.2 or later is cited for this platform line.", "Validate", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.1.2507/splunk-cloud-platform-release-notes/whats-new"]
        ]
      },
      "10.2.2510": {
        date: "2025", source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.2.2510/splunk-cloud-platform-release-notes/whats-new",
        features: [
          ["SPL2 search experiences", "Search & AI", "Compose reusable data pipelines", "Use supported SPL2 functionality in Search and Dashboard Studio."],
          ["Azure data access expansion", "Data management", "Reach more cloud data in place", "Extend Dynamic Data Active Archive capabilities to supported Azure data."],
          ["Targeted app installation", "Platform operations", "Reduce app rollout scope", "Install compatible apps onto selected Victoria Experience search heads."],
          ["TLS sidecar verification", "Security & compliance", "Strengthen service-to-service trust", "Apply additional verification to platform sidecar connections."]
        ], requirements: [
          ["Check federated provider names", "Provider names become case-insensitive. Resolve any names that differ only by capitalization.", "Validate", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.2.2510/splunk-cloud-platform-release-notes/whats-new"]
        ]
      },
      "10.4.2604": {
        date: "2026", source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.4.2604/splunk-cloud-platform-release-notes/whats-new",
        features: [
          ["Dashboard Studio framework", "Dashboards & experience", "Create richer operational views", "Use custom visualizations, token management, network graphs, and accelerated line charts."],
          ["AI Canvas beta", "Search & AI", "Explore investigations visually", "Compose AI-assisted analytical workflows on a connected canvas."],
          ["Modern navigation reaches GA", "Dashboards & experience", "Move through the platform faster", "Use a production-ready navigation experience centered on common work."],
          ["Azure data self-service", "Data management", "Activate remote data sooner", "Extend Dynamic Data Self-Storage workflows to supported Azure storage."],
          ["Unified federation", "Search & AI", "Simplify cross-environment access", "Use a more consistent foundation for supported federated data sources."]
        ], requirements: [
          ["Replace SHA-1 certificates", "SHA-1-signed certificates are removed from supported trust paths. Confirm private integrations use modern signatures.", "Blocker", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.4.2604/splunk-cloud-platform-release-notes/whats-new"],
          ["Review automatic refresh roles", "Confirm that roles needing automatic dashboard refresh have the auto_refresh_dashboards capability.", "Validate", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.4.2604/splunk-cloud-platform-release-notes/whats-new"]
        ]
      },
      "10.5.2605": {
        date: "2026", source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.5.2605/splunk-cloud-platform-release-notes/whats-new",
        features: [
          ["Machine Data Lake", "Data management", "Expand the economics of data retention", "Use an integrated lake-oriented tier for supported machine-data workflows."],
          ["Federation expands", "Search & AI", "Query more data where it lives", "Extend supported federated access across Snowflake, Azure, Databricks, and self-storage sources."],
          ["Catalog experience", "Data management", "Discover distributed data faster", "Browse and understand eligible datasets through a centralized catalog."],
          ["OAuth 2.1 with PKCE", "Security & compliance", "Modernize user authorization", "Use current authorization patterns with Proof Key for Code Exchange."],
          ["OpenAPI configuration management", "Platform operations", "Automate changes against a defined contract", "Build supported configuration workflows from an OpenAPI-described interface."],
          ["Targeted app installation reaches GA", "Platform operations", "Control where apps land", "Deploy supported apps to selected search heads with production availability."],
          ["Fine-grained field extraction access", "Security & compliance", "Delegate knowledge creation safely", "Separate field-extraction privileges with more precise access controls."],
          ["Cisco Cloud Control integration", "Search & AI", "Connect a broader AI operations experience", "Integrate supported Splunk workflows with Cisco Cloud Control and AI Canvas."]
        ], requirements: [
          ["Review scheduled-search limits", "Updated limits can affect high-volume scheduling patterns. Inventory concurrent workloads and validate critical schedules.", "Plan", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.5.2605/splunk-cloud-platform-release-notes/whats-new"],
          ["Reconfirm password allow lists", "Password-authentication network controls become more restrictive. Confirm operational and break-glass access paths.", "Validate", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.5.2605/splunk-cloud-platform-release-notes/whats-new"]
        ]
      }
    }
  }
};
