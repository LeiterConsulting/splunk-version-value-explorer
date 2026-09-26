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
        ],
        technicalChanges: [
          {
            component: "Inter-instance compression", domain: "Protocol & connectivity", changeType: "Default changed", actionLevel: "Review",
            from: "SSL compression enabled for eligible inter-instance traffic", to: "HTTP compression becomes the default, except for SSL forwarding",
            implication: "Mixed-version communications can negotiate different compression behavior, while forwarding remains an exception.",
            action: "Validate inter-instance communications and throughput assumptions, especially where SSL forwarding or older peers remain.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.1/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.1-read-this-first"
          }
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
        ],
        technicalChanges: [
          {
            component: "Python application runtime", domain: "Runtime & apps", changeType: "Removed", actionLevel: "Review",
            from: "Python 2 compatibility remains available", to: "Python 3-compatible code is required",
            implication: "Apps, scripted inputs, custom commands, and templates that still use Python 2 syntax can stop working.",
            action: "Inventory Python-dependent apps and scripts, update them for Python 3, and validate them before the platform upgrade.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.0/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.0-read-this-first"
          },
          {
            component: "KV Store", domain: "Data & storage", changeType: "Engine migration", actionLevel: "Required",
            from: "MongoDB 3.6 with the MMAP storage engine", to: "MongoDB 4.2 with the WiredTiger storage engine",
            implication: "KV Store collections used by apps must move to the supported database and storage-engine baseline.",
            action: "Back up KV Store, complete the documented storage-engine and MongoDB migration, and validate dependent apps.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.0/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.0-read-this-first"
          },
          {
            component: "Indexer file behavior", domain: "Data & storage", changeType: "Default changed", actionLevel: "Review",
            from: "Legacy journal compression and tsidx writing defaults", to: "zstd journal compression and tsidx writing level 3 by default",
            implication: "Newly written index artifacts use updated storage and search-performance optimizations.",
            action: "Benchmark representative indexing and search workloads and account for mixed-version behavior during staged upgrades.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.1/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.1-read-this-first"
          },
          {
            component: "Deployment server client floor", domain: "Protocol & connectivity", changeType: "Compatibility floor", actionLevel: "Review",
            from: "Deployment clients earlier than 7.0 can remain connected", to: "Version 7.0 or later is required with the hardened 9.0 deployment server",
            implication: "Older deployment clients can lose communication after the deployment-server security change.",
            action: "Identify clients earlier than 7.0, upgrade them, and review whether the deployment server must be isolated before upgrading.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.0/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.0-read-this-first"
          }
        ], requirements: [
          ["Migrate the KV Store engine", "Splunk Enterprise 9.0 moves KV Store from MongoDB 3.6 to 4.2. Complete the documented migration and validate apps that depend on KV Store.", "Plan", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.0/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.0-read-this-first", true]
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
        ],
        technicalChanges: [
          {
            component: "Older jQuery libraries", domain: "Runtime & apps", changeType: "Restricted", actionLevel: "Review",
            from: "Older libraries remain broadly available", to: "Libraries older than jQuery 3.5 are restricted by default",
            implication: "Classic dashboards and custom apps that depend on older jQuery behavior can fail unless remediated or temporarily re-enabled.",
            action: "Run the jQuery Upgrade Readiness checks and migrate app JavaScript to supported APIs.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.1/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.1-read-this-first"
          },
          {
            component: "Windows Event Collector input", domain: "Data & storage", changeType: "Configuration added", actionLevel: "Review",
            from: "Event format inferred from the destination log name", to: "The expected subscription format can be set with wec_event_format",
            implication: "Subscriptions using RenderedText outside the conventional ForwardedEvents naming pattern can otherwise be parsed incorrectly.",
            action: "Review Windows Event Collector subscriptions and explicitly set the format where destination naming does not convey it.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.2-read-this-first"
          },
          {
            component: "Linux Universal Forwarder account", domain: "Host & operations", changeType: "Default changed", actionLevel: "Review",
            from: "New installations commonly use the splunk account", to: "The installer creates a least-privileged splunkfwd account",
            implication: "File ownership, protected-log access, service control, and deployment automation can depend on the operating-system identity.",
            action: "Validate permissions and installation automation for new or rebuilt Linux forwarders.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.2-read-this-first"
          }
        ], requirements: [
          ["Set UTF-8 before upgrading non-UTF-8 hosts", "An upgrade to 9.1 can fail—or leave Splunk Web blank—when the operating system does not use UTF-8. Apply Splunk's documented PYTHONUTF8 workaround before the upgrade.", "Blocker", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.1/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.1-read-this-first", true],
          ["Test older deployment clients", "A 9.1 deployment server can have communication problems with deployment clients earlier than 7.0. Review topology and client versions before upgrading the server.", "Test", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.1/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.1-read-this-first", true],
          ["Test apps against jQuery 3.5", "Older jQuery libraries are restricted by default. Review custom apps and dashboards for compatibility before production rollout.", "Test", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.1/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.1-read-this-first", true]
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
        ],
        technicalChanges: [
          {
            component: "Deployment server architecture", domain: "Host & operations", changeType: "Architecture changed", actionLevel: "Review",
            from: "Pre-9.2 deployment-server implementation", to: "Redesigned deployment-server architecture and upgrade conversion",
            implication: "Upgrades that cross 9.2 automatically apply architectural changes intended to improve performance and manageability.",
            action: "Follow the pre-9.2 deployment-server upgrade procedure and validate client deployment after conversion.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.2-read-this-first"
          }
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
        ],
        technicalChanges: [
          {
            component: "Python application runtime", domain: "Runtime & apps", changeType: "Default changed", actionLevel: "Review",
            from: "Python 3.7 is the default interpreter", to: "Python 3.9 is the default interpreter",
            implication: "Private and third-party apps can expose library, syntax, or packaging assumptions tied to the older interpreter.",
            action: "Update apps and add-ons to supported versions and test Python-dependent extensions with Python 3.9.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.3/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.3-read-this-first"
          }
        ], requirements: [
          ["Validate field-filter roles", "Earlier role-based field filters are replaced by field filters in 9.3. Review rules and commands affected by field filtering before using it in production.", "Validate", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.3/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.3-read-this-first", true]
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
        ],
        technicalChanges: [
          {
            component: "KV Store", domain: "Data & storage", changeType: "Engine upgrade", actionLevel: "Required",
            from: "MongoDB 4.2 or later", to: "MongoDB 7.0 becomes the preferred and automatically upgraded engine",
            implication: "The newer engine changes the supported host baseline and the database version used for app collections.",
            action: "Back up KV Store, ensure the existing engine is at least 4.2, verify host processor support, and validate collections after migration.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.4-read-this-first"
          },
          {
            component: "Processor instruction baseline", domain: "Host & operations", changeType: "Compatibility floor", actionLevel: "Required",
            from: "Older x86-64 processors may remain usable", to: "AVX, SSE4.2, and AES-NI support is required for the KV Store 7 baseline",
            implication: "Unsupported processors can prevent Splunk Enterprise from running or cause an upgrade to fail.",
            action: "Verify every physical and virtual host exposes the required CPU instructions before scheduling the upgrade.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.4-read-this-first"
          },
          {
            component: "Older jQuery controls", domain: "Runtime & apps", changeType: "Removed", actionLevel: "Review",
            from: "Admins can temporarily re-enable older jQuery libraries", to: "Older-library controls and the Internal Library Settings page are removed",
            implication: "The self-service compatibility escape hatch for older app and dashboard JavaScript is no longer available.",
            action: "Remediate apps and dashboards that use unsupported or hot-linked libraries before upgrading.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.4-read-this-first"
          },
          {
            component: "Sidecar configuration", domain: "Host & operations", changeType: "Runtime behavior", actionLevel: "Review",
            from: "web.conf and restmap.conf are treated as externally controlled static files", to: "Splunk sidecars can update both files dynamically under system/local",
            implication: "Configuration-management tools that automatically revert these writes can trigger instability or restart loops.",
            action: "Allow Splunk-managed portions of these files to change asynchronously and test configuration-management reconciliation.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.4-read-this-first"
          }
        ], requirements: [
          ["Confirm CPU instruction support", "Hosts require AVX, SSE4.2, and AES-NI processor support. Verify every target host—not only a representative node.", "Blocker", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.4-read-this-first", true],
          ["Account for sidecar configuration", "New sidecar processes can write web.conf and restmap.conf under system/local. Configuration-management tools that revert those changes can cause instability or restart loops.", "Plan", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.4-read-this-first", true]
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
        ],
        technicalChanges: [
          {
            component: "Python application runtime", domain: "Runtime & apps", changeType: "Removed", actionLevel: "Review",
            from: "Python 3.7 remains supported alongside the newer default", to: "Python 3.7 support is removed; Python 3.9 is the default interpreter",
            implication: "Apps and add-ons tied to Python 3.7 can break even when they previously worked on a 9.x release.",
            action: "Confirm every Python-dependent app and integration supports Python 3.9 before upgrading.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.0/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.0-read-this-first"
          },
          {
            component: "FIPS cryptographic module", domain: "Security & cryptography", changeType: "Baseline added", actionLevel: "Review",
            from: "Existing FIPS 140-2 deployment baseline", to: "A FIPS 140-3-compliant module is available through a documented migration path",
            implication: "FIPS-mode deployments have module-specific prerequisites and sequencing rather than a transparent in-place switch.",
            action: "Use Splunk's dedicated FIPS-mode upgrade and migration procedure and validate every participating component.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.0/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.0-read-this-first"
          },
          {
            component: "Legacy TLS protocols", domain: "Security & cryptography", changeType: "Deprecated", actionLevel: "Review",
            from: "SSLv3 and TLS 1.0/1.1 remain supported", to: "Legacy protocols remain available but are deprecated and generate warnings",
            implication: "Existing endpoints may still connect, but the deployment is on a path toward mandatory TLS 1.2 or later.",
            action: "Inventory every Splunk-to-Splunk and integration endpoint and begin certificate and protocol modernization before 10.4.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.0/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.0-read-this-first"
          }
        ], requirements: [
          ["Move Python 3.7 dependencies to 3.9", "Python 3.7 support is removed in 10.0. Confirm that apps and add-ons using Python work with the 3.9 interpreter before upgrading.", "Blocker", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.0/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.0-read-this-first", true],
          ["Replace Hadoop Data Roll", "Hadoop Data Roll is no longer supported and is turned off by default. Plan another archive destination for aged index data.", "Plan", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.0/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.0-read-this-first", true],
          ["Test OpenSSL 3 compatibility", "Review custom apps, certificates, and integrations for the OpenSSL 3 baseline and updated cryptographic defaults.", "Test", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.0/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.0-read-this-first", true]
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
        ],
        technicalChanges: [
          {
            component: "Python runtimes", domain: "Runtime & apps", changeType: "Runtime added", actionLevel: "Review",
            from: "Python 3.9 handles platform and Splunk Web functions", to: "Splunk Web uses Python 3.13; splunkd keeps Python 3.9 by default with Python 3.13 opt-in",
            implication: "The Web runtime and the application-extension runtime no longer have one simple version label.",
            action: "Test Splunk Web integrations separately and use Splunk's Python compatibility guidance before opting splunkd extensions into 3.13.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.2-read-this-first"
          },
          {
            component: "Embedded Node.js runtime", domain: "Runtime & apps", changeType: "Removed", actionLevel: "Review",
            from: "A deprecated Node.js runtime is bundled with Splunk Enterprise", to: "The bundled Node.js runtime is removed",
            implication: "Apps that assume Node.js is supplied by the platform will no longer run.",
            action: "Identify Node.js-dependent apps and redesign them or package a supported application-owned runtime.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.2-read-this-first"
          },
          {
            component: "Unix service identity", domain: "Host & operations", changeType: "Default restricted", actionLevel: "Review",
            from: "Splunk Enterprise can start as root by default", to: "Running as root is blocked by default",
            implication: "Startup, file ownership, privileged ports, boot integration, and scripted administration can depend on the service identity.",
            action: "Move to a least-privileged service account and validate file access, ports, startup, and operational automation.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.2-read-this-first"
          },
          {
            component: "Fishbucket checkpoint store", domain: "Data & storage", changeType: "Backend replaced", actionLevel: "Awareness",
            from: "Legacy Fishbucket database backend", to: "A more reliable checkpoint backend writes new file-monitoring state",
            implication: "The upgrade is automatic, but an unsupported downgrade can lose newer checkpoints and re-ingest data.",
            action: "No migration is required; preserve recovery planning and avoid treating a downgrade as a supported rollback.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.2-read-this-first"
          },
          {
            component: "Edge Processor host baseline", domain: "Host & operations", changeType: "Compatibility floor", actionLevel: "Review",
            from: "Older Linux distributions may host Edge Processor", to: "Security updates require a currently supported Linux distribution",
            implication: "Unsupported Edge Processor hosts can crash after the control plane upgrade and cause data loss.",
            action: "Upgrade every affected management and Edge Processor host operating system before moving the control plane to 10.2.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.2-read-this-first"
          }
        ], requirements: [
          ["Replace embedded Node.js dependencies", "The embedded Node.js runtime is removed. Apps that require Node.js must ship their own runtime or be redesigned.", "Blocker", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.2-read-this-first", true],
          ["Review service identity and Edge Processor hosts", "Splunk no longer runs as root by default. Unsupported Linux versions can also make Edge Processor crash and cause data loss; validate service accounts, file access, and every edge node.", "Blocker", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.2-read-this-first", true],
          ["Check federated provider names", "Federated provider names become case-insensitive. Resolve names that differ only by capitalization.", "Test", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.2-read-this-first", true]
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
        ],
        technicalChanges: [
          {
            component: "Enterprise 10.4 maintenance target", domain: "Platform operations", changeType: "Maintenance target", actionLevel: "Required",
            from: "Splunk Enterprise 10.4.2", to: "Splunk Enterprise 10.4.3 or higher",
            implication: "Version 10.4.2 can block tcpout forwarding pipelines when acknowledgements are enabled on a receiving heavy forwarder or indexer.",
            action: "Do not target 10.4.2. Use 10.4.3 or later and validate acknowledged forwarding before production rollout.",
            source: "https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/10.4/fixed-issues/fixed-issues/splunk-enterprise-10.4.3-fixed-issues"
          },
          {
            component: "Python application runtime", domain: "Runtime & apps", changeType: "Default changed", actionLevel: "Review",
            from: "splunkd uses Python 3.9 by default with Python 3.13 opt-in; Splunk Web already uses Python 3.13", to: "Python 3.13 becomes the default interpreter with Python 3.9 available as a fallback",
            implication: "Private apps, custom search commands, REST endpoints, scripted or modular inputs, and packaged libraries can expose Python-version assumptions when the default changes.",
            action: "Inventory Python-dependent extensions, confirm supported app releases, and test representative workflows with the 3.13 default before production rollout.",
            source: "https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/10.4/whats-new/welcome-to-splunk-enterprise-10.4"
          },
          {
            component: "Legacy TLS protocols", domain: "Security & cryptography", changeType: "Removed", actionLevel: "Required",
            from: "TLS 1.0 and 1.1 are deprecated but available", to: "TLS 1.0 and 1.1 support is completely removed",
            implication: "Splunk component and integration connections using a legacy protocol can no longer negotiate successfully.",
            action: "Move every endpoint to TLS 1.2 or later and validate the complete trust path before upgrading.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first"
          },
          {
            component: "Certificate signatures", domain: "Security & cryptography", changeType: "Removed", actionLevel: "Review",
            from: "SHA-1-signed certificates are deprecated", to: "SHA-1 certificate signatures are rejected; SHA-256 or stronger is required",
            implication: "Internal and external connections can fail even when the protocol version itself is acceptable.",
            action: "Inventory and reissue SHA-1-signed certificates, then validate trust chains and mutual-authentication paths.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first"
          },
          {
            component: "KV Store binaries", domain: "Data & storage", changeType: "Removed", actionLevel: "Required",
            from: "Install media retains older MongoDB engine binaries", to: "Unsupported MongoDB binaries are removed; engine 7 or later is required",
            implication: "A deployment still using an older KV Store engine cannot rely on the 10.4 package to perform that older transition.",
            action: "Upgrade KV Store to MongoDB engine 7 or later and verify app collections before starting the 10.4 upgrade.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first"
          },
          {
            component: "KV Store database engine", domain: "Data & storage", changeType: "Engine upgrade", actionLevel: "Review",
            from: "MongoDB 7 is the supported pre-upgrade KV Store baseline", to: "MongoDB 8.0, upgraded automatically from a supported 10.x path",
            implication: "MongoDB 4.x and 6.x cannot move directly to the 10.4 engine, so older deployments need a supported bridge release and a validated KV Store backup.",
            action: "Reach the documented MongoDB 7 floor before 10.4, retain a validated KV Store backup, and verify app collections after the automatic engine upgrade.",
            source: "https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/10.4/whats-new/welcome-to-splunk-enterprise-10.4"
          },
          {
            component: "KV Store TLS configuration", domain: "Security & cryptography", changeType: "Precedence changed", actionLevel: "Review",
            from: "Overlapping kvstore settings can be ignored in favor of sslConfig", to: "TLS settings in the kvstore stanza take precedence",
            implication: "Conflicting protocol settings can produce unexpected KV Store connection failures after the upgrade.",
            action: "Compare both server.conf stanzas and remove unused or conflicting TLS settings before upgrading.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first"
          },
          {
            component: "Windows service identity", domain: "Host & operations", changeType: "Privilege removed", actionLevel: "Review",
            from: "Splunk Enterprise can run under an administrator-level account", to: "Local service or non-administrator domain accounts are required",
            implication: "The installer can reconfigure a local-system deployment or halt when a domain service account remains an administrator.",
            action: "Choose and validate the target service account, file permissions, service control, and domain policy before upgrading.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first"
          },
          {
            component: "jQuery application baseline", domain: "Runtime & apps", changeType: "Removed", actionLevel: "Review",
            from: "jQuery 2 compatibility artifacts can remain", to: "jQuery 2, related feature flags, and the quarantine framework are removed",
            implication: "Apps that hotlink jQuery 2 or depend on version-specific APIs no longer function.",
            action: "Run AppInspect, migrate classic dashboards where required, and move custom JavaScript to jQuery 3-compatible APIs.",
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first"
          }
        ], requirements: [
          ["Use Enterprise 10.4.3 or higher", "Splunk recommends against 10.4.2 because tcpout with useACK=true can block forwarding pipelines. Target 10.4.3 or later and validate acknowledged forwarding.", "Blocker", "https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/10.4/fixed-issues/fixed-issues/splunk-enterprise-10.4.3-fixed-issues", true],
          ["Reach KV Store 7 before upgrading", "All deployments must use KV Store 7. Complete the migration and verify app collections before moving to 10.4.", "Blocker", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first", true],
          ["Modernize TLS and certificates", "TLS 1.0/1.1 and SHA-1-signed certificates are removed. Inventory every internal and external connection and replace incompatible endpoints.", "Blocker", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first", true],
          ["Move away from privileged services", "Root and administrator service identities are no longer supported. Confirm file ownership, ports, boot configuration, and service accounts.", "Blocker", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first", true],
          ["Validate apps and classic dashboards", "Run AppInspect, remove jQuery 2 dependencies, and plan migration for classic Simple XML dashboards affected by current lifecycle guidance.", "Test", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first", true],
          ["Review dashboard refresh permissions", "The auto_refresh_dashboards capability governs automatic dashboard refresh. Confirm roles retain intended behavior.", "Validate", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first", true]
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
        ],
        technicalChanges: [
          {
            component: "Search REST API", domain: "API & integrations", changeType: "Default changed", actionLevel: "Review",
            from: "Search API version 1 is enabled", to: "Search API version 1 is disabled by default; version 2 is the current contract",
            implication: "External clients that still call the older API can fail when the new default reaches the stack.",
            action: "Inventory API consumers, migrate them to version 2, and validate authentication, request, and response handling.",
            source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.0.2503/splunk-cloud-platform-release-notes/whats-new"
          },
          {
            component: "Federated saved-search naming", domain: "API & integrations", changeType: "Namespace changed", actionLevel: "Review",
            from: "Local saved searches can use the federated: prefix", to: "The prefix can conflict with federated-search naming behavior",
            implication: "Existing knowledge objects can resolve differently or collide with the platform namespace.",
            action: "Find locally defined saved searches using the prefix, rename them where necessary, and retest dependent content.",
            source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.0.2503/splunk-cloud-platform-release-notes/whats-new"
          }
        ], requirements: [
          ["Move Search API clients to v2", "Search API v1 is disabled by default. Inventory integrations and validate them against API v2.", "Test", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.0.2503/splunk-cloud-platform-release-notes/whats-new", true],
          ["Check federated saved-search names", "Local saved searches beginning with “federated:” can conflict with updated naming behavior.", "Validate", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.0.2503/splunk-cloud-platform-release-notes/whats-new", true]
        ]
      },
      "10.1.2507": {
        date: "2025", source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.1.2507/splunk-cloud-platform-release-notes/whats-new",
        features: [
          ["Field filters by default", "Security & compliance", "Advance least-privilege search", "Use field filters by default, including expanded accelerated-search support."],
          ["Audit Trail v2", "Platform operations", "Normalize audit visibility", "Work with JSON-formatted, CIM-aligned administrative audit events."],
          ["AI Assistant maturation", "Search & AI", "Build and understand SPL faster", "Use updated natural-language search guidance through the supported app."],
          ["Password network allow list", "Security & compliance", "Constrain credential use", "Limit password authentication to approved networks."]
        ],
        technicalChanges: [
          {
            component: "Field filters", domain: "Permissions & security", changeType: "Default changed", actionLevel: "Review",
            from: "Field filters require deliberate enablement", to: "Field filters are enabled by default with broader accelerated-search behavior",
            implication: "Search commands, data models, and security applications can interact differently with protected fields.",
            action: "Review restricted commands, protected-field rules, accelerated searches, and dependent premium applications.",
            source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.1.2507/splunk-cloud-platform-release-notes/whats-new"
          },
          {
            component: "Audit Trail events", domain: "Data contracts", changeType: "Schema modernized", actionLevel: "Review",
            from: "Legacy administrative audit-event representation", to: "JSON-formatted, Common Information Model-aligned Audit Trail v2 events",
            implication: "Detections, reports, and downstream consumers can depend on field names or event shape.",
            action: "Validate searches, alerts, dashboards, and exports that consume administrative audit data.",
            source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.1.2507/splunk-cloud-platform-release-notes/whats-new"
          }
        ], requirements: [
          ["Align the AI Assistant app", "AI Assistant in Search requires a supported app version; release 1.3.2 or later is cited for this platform line.", "Validate", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.1.2507/splunk-cloud-platform-release-notes/whats-new", false]
        ]
      },
      "10.2.2510": {
        date: "2025", source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.2.2510/splunk-cloud-platform-release-notes/whats-new",
        features: [
          ["SPL2 search experiences", "Search & AI", "Compose reusable data pipelines", "Use supported SPL2 functionality in Search and Dashboard Studio."],
          ["Azure data access expansion", "Data management", "Reach more cloud data in place", "Extend Dynamic Data Active Archive capabilities to supported Azure data."],
          ["Targeted app installation", "Platform operations", "Reduce app rollout scope", "Install compatible apps onto selected Victoria Experience search heads."],
          ["TLS sidecar verification", "Security & compliance", "Strengthen service-to-service trust", "Apply additional verification to platform sidecar connections."]
        ],
        technicalChanges: [
          {
            component: "Federated provider names", domain: "API & integrations", changeType: "Matching changed", actionLevel: "Review",
            from: "Provider names are case-sensitive", to: "Provider names are case-insensitive",
            implication: "Providers whose names differ only by capitalization can collide under the new matching behavior.",
            action: "Resolve case-only duplicates and test federated searches and automation that references provider names.",
            source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.2.2510/splunk-cloud-platform-release-notes/whats-new"
          },
          {
            component: "Platform sidecar trust", domain: "Permissions & security", changeType: "Verification strengthened", actionLevel: "Awareness",
            from: "Earlier service-to-service verification baseline", to: "Additional TLS verification protects platform sidecar connections",
            implication: "The managed service gains a stronger internal trust posture without exposing backend component administration to customers.",
            action: "No routine platform action is expected; validate customer-managed integrations separately when release guidance identifies them.",
            source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.2.2510/splunk-cloud-platform-release-notes/whats-new"
          }
        ], requirements: [
          ["Check federated provider names", "Provider names become case-insensitive. Resolve any names that differ only by capitalization.", "Validate", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.2.2510/splunk-cloud-platform-release-notes/whats-new", true]
        ]
      },
      "10.4.2604": {
        date: "2026", source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.4.2604/splunk-cloud-platform-release-notes/whats-new",
        features: [
          ["Dashboard Studio framework", "Dashboards & experience", "Create richer operational views", "Use custom visualizations, token management, network graphs, and accelerated line charts."],
          ["AI Canvas beta", "Search & AI", "Explore investigations visually", "For customers accepted into the beta and through its onboarding requirements, compose AI-assisted analytical workflows on a connected canvas."],
          ["Modern navigation reaches GA", "Dashboards & experience", "Move through the platform faster", "Use a production-ready navigation experience centered on common work."],
          ["Azure data self-service", "Data management", "Activate remote data sooner", "Extend Dynamic Data Self-Storage workflows to supported Azure storage."],
          ["Unified federation", "Search & AI", "Simplify cross-environment access", "Use a more consistent foundation for supported federated data sources."]
        ],
        technicalChanges: [
          {
            component: "Certificate signatures", domain: "Permissions & security", changeType: "Removed", actionLevel: "Review",
            from: "SHA-1-signed certificates can remain in applicable trust paths", to: "SHA-1 certificate signatures are removed from supported trust paths",
            implication: "Private integrations can fail when their certificate chain still uses SHA-1.",
            action: "Reissue affected certificates with SHA-256 or stronger signatures and validate integration trust chains.",
            source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.4.2604/splunk-cloud-platform-release-notes/whats-new"
          },
          {
            component: "Dashboard auto-refresh authorization", domain: "Permissions & security", changeType: "Capability required", actionLevel: "Review",
            from: "Eligible dashboard viewers can receive automatic refresh without a dedicated capability", to: "Non-administrator viewers need auto_refresh_dashboards",
            implication: "Operational dashboards can stop refreshing for roles that do not receive the new capability.",
            action: "Identify auto-refresh dashboards and grant the capability only to intended roles before validating behavior.",
            source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.4.2604/splunk-cloud-platform-release-notes/whats-new"
          },
          {
            component: "Legacy TLS protocols", domain: "Security & cryptography", changeType: "Default disabled", actionLevel: "Review",
            from: "TLS 1.0 and 1.1 remain enabled for applicable connections", to: "TLS 1.0 and 1.1 are disabled by default but remain available for documented migration use",
            implication: "Customer-managed integrations that still negotiate only a legacy protocol can fail when the managed release reaches the stack.",
            action: "Inventory integration endpoints, move them to TLS 1.2 or later, and use the release communication to validate timing for the affected stack.",
            source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.4.2604/splunk-cloud-platform-release-notes/whats-new"
          },
          {
            component: "Python application runtime", domain: "Apps & experience", changeType: "Default changed", actionLevel: "Review",
            from: "Python 3.9 is the default interpreter", to: "Python 3.13 becomes the default interpreter with Python 3.9 available as a fallback",
            implication: "Private apps and integrations with Python-version assumptions can behave differently even though Splunk manages the platform release.",
            action: "Confirm Cloud-compatible app versions and test private Python extensions against the 3.13 default for the scheduled stack release.",
            source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.4.2604/splunk-cloud-platform-release-notes/whats-new"
          }
        ], requirements: [
          ["Replace SHA-1 certificates", "SHA-1-signed certificates are removed from supported trust paths. Confirm private integrations use modern signatures.", "Blocker", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.4.2604/splunk-cloud-platform-release-notes/whats-new", true],
          ["Review automatic refresh roles", "Automatic dashboard refresh now requires the auto_refresh_dashboards capability. Confirm intended roles retain this behavior after the release.", "Validate", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.4.2604/splunk-cloud-platform-release-notes/whats-new", true],
          ["Treat AI Canvas as beta-only", "The app can be deployed but is inaccessible by default. Only customers participating in the beta and completing its onboarding requirements can use it.", "Validate", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.4.2604/splunk-cloud-platform-release-notes/whats-new", false],
          ["Modernize legacy-protocol integrations", "TLS 1.0 and 1.1 are disabled by default for this Cloud line. Move customer-managed integration endpoints to TLS 1.2 or later before the scheduled stack release.", "Validate", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.4.2604/splunk-cloud-platform-release-notes/whats-new", true]
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
          ["Targeted app installation on Victoria Experience", "Platform operations", "Control where apps land", "Deploy supported apps to selected search heads where the documented cloud-provider, stack-version, and role prerequisites are met."],
          ["Fine-grained field extraction access", "Security & compliance", "Delegate knowledge creation safely", "Separate field-extraction privileges with more precise access controls."],
          ["Cisco Cloud Control integration (Controlled Availability)", "Search & AI", "Connect a broader AI operations experience", "For enrolled customers, integrate supported Splunk workflows with Cisco Cloud Control and AI Canvas within the documented Controlled Availability scope."]
        ],
        technicalChanges: [
          {
            component: "OAuth authorization", domain: "API & integrations", changeType: "Protocol added", actionLevel: "Review",
            from: "Earlier OAuth client patterns", to: "OAuth 2.1 authorization with Proof Key for Code Exchange is available",
            implication: "Interactive integrations can adopt a more current authorization flow with stronger protection for authorization codes.",
            action: "Review supported client patterns and plan migration for applications that benefit from the newer flow.",
            source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.5.2605/splunk-cloud-platform-release-notes/whats-new"
          },
          {
            component: "Configuration management interface", domain: "API & integrations", changeType: "API contract added", actionLevel: "Awareness",
            from: "Configuration automation depends on feature-specific interfaces", to: "An OpenAPI-described configuration-management interface is available",
            implication: "Automation can be built against a discoverable and defined interface rather than undocumented implementation details.",
            action: "Evaluate the supported API surface for repeatable configuration workflows and keep automation within documented contracts.",
            source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.5.2605/splunk-cloud-platform-release-notes/whats-new"
          },
          {
            component: "Scheduled-search frequency", domain: "Workload controls", changeType: "Controlled Availability policy added", actionLevel: "Review",
            from: "Scheduling frequency is not constrained by the new minimum-interval policy", to: "Where the Controlled Availability feature is enabled, minimum schedule intervals can be set by role or trigger action",
            implication: "The control is not universally available. On an enabled stack, aggressive saved-search schedules can be governed, but critical workflows can also be delayed if limits are applied without inventory.",
            action: "Confirm feature availability with Splunk, inventory high-frequency searches, and validate service-level expectations before enabling or tightening interval limits.",
            source: "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.5.2605/splunk-cloud-platform-release-notes/whats-new"
          }
        ], requirements: [
          ["Validate targeted-app prerequisites", "Targeted app installation on Victoria Experience requires sc_admin. The documented minimum is 10.2.2510 on AWS and 10.5.2605.0 on GCP or Azure; confirm the actual cloud provider and stack before relying on the feature.", "Validate", "https://help.splunk.com/en/splunk-cloud-platform/administer/admin-manual/10.5.2605/manage-apps-and-add-ons-in-splunk-cloud-platform/targeted-app-installation-on-victoria-experience", false],
          ["Confirm and plan scheduled-search frequency limits", "This control is published as Controlled Availability. Confirm it is enabled for the stack, then inventory high-volume workloads and validate critical schedules before applying minimum intervals.", "Plan", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.5.2605/splunk-cloud-platform-release-notes/whats-new", false],
          ["Review password ACLs", "Password settings are restrictive by default in the new Credentials page. Review ACLs for app and data-input credentials, and validate intended administrative and operational access.", "Validate", "https://help.splunk.com/en/splunk-cloud-platform/release-notes/10.5.2605/splunk-cloud-platform-release-notes/whats-new", true]
        ]
      }
    }
  },
  migration: {
    label: "Splunk Enterprise → Splunk Cloud Platform",
    latest: "10.5.2605",
    scmaMinimum: "9.1",
    sources: {
      overview: "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Overview",
      readiness: "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Readiness",
      prepare: "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Prepare",
      validate: "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Validate",
      approaches: "https://lantern.splunk.com/Manage_Performance_and_Health/Selecting_the_best_cloud_migration_approach",
      scma: "https://splunkbase.splunk.com/app/4974"
    },
    technicalChanges: [
      {
        component: "Platform administration boundary", domain: "Operating model", changeType: "Responsibility changed", actionLevel: "Review",
        from: "Customer controls operating systems, services, local files, backups, capacity, and platform upgrades", to: "Splunk operates the Cloud Platform backend; customers use supported cloud administration surfaces",
        implication: "Runbooks and automation that depend on shell, filesystem, or unrestricted configuration access do not transfer directly.",
        action: "Inventory administrative procedures and redesign them around supported Cloud interfaces, APIs, and service-request boundaries.",
        source: "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Overview"
      },
      {
        component: "Application execution model", domain: "Apps & experience", changeType: "Compatibility boundary", actionLevel: "Required",
        from: "Enterprise apps can depend on locally available libraries, binaries, filesystem access, and private integrations", to: "Cloud apps must be Cloud-compatible, vetted, and remain within supported runtime and access boundaries",
        implication: "A functionally important app can require an updated package, AppInspect remediation, redesign, or replacement.",
        action: "Build an app compatibility matrix, update supported packages, run AppInspect, and prove every critical workflow in the target.",
        source: "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Prepare"
      },
      {
        component: "Forwarding trust", domain: "Connectivity & trust", changeType: "Credential model changed", actionLevel: "Required",
        from: "Enterprise receivers can use customer-designed mutual TLS settings such as requireClientCert", to: "Forwarders use the Splunk Cloud credentials package and supported forwarding configuration",
        implication: "The Enterprise requireClientCert pattern is not supported in Splunk Cloud Platform and can block data flow.",
        action: "Replace unsupported receiver-side certificate requirements and validate the Cloud credentials package on every forwarding tier.",
        source: "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Prepare"
      },
      {
        component: "Network path", domain: "Connectivity & trust", changeType: "Traffic path changed", actionLevel: "Required",
        from: "Data and integrations reach customer-operated Enterprise endpoints", to: "Forwarders, HTTP Event Collector clients, identity systems, and integrations must reach approved Cloud endpoints",
        implication: "Blocked egress, proxy behavior, inspection, name resolution, or unproven intermediate tiers can become migration showstoppers.",
        action: "Prove every required port, hostname, certificate path, proxy, and on-premises integration before migration execution.",
        source: "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Prepare"
      },
      {
        component: "Forwarder compatibility", domain: "Connectivity & trust", changeType: "Compatibility floor", actionLevel: "Required",
        from: "Older supported-by-Enterprise forwarders may remain deployed", to: "Forwarders must meet the Cloud destination's supported-version requirements",
        implication: "A large legacy forwarder estate can delay final cutover even when the Cloud stack itself is ready.",
        action: "Inventory forwarders by version and role, remediate unsupported lines early, and validate end-to-end acknowledgment where used.",
        source: "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Prepare"
      },
      {
        component: "Identity and authorization", domain: "Permissions & security", changeType: "Control plane changed", actionLevel: "Review",
        from: "Enterprise-local authentication, roles, and inherited administrative practices", to: "Cloud identity integration and a reconciled role-based access-control model",
        implication: "Equivalent role names do not guarantee equivalent access to data, knowledge objects, or cloud administration.",
        action: "Rebuild identity deliberately, simplify inherited roles where possible, and test personas during system and user acceptance.",
        source: "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Prepare"
      },
      {
        component: "Indexed history", domain: "Data & storage", changeType: "Migration decision", actionLevel: "Review",
        from: "Historical buckets remain on customer-managed storage", to: "History is migrated, dual-written and aged out, or retained behind according to the selected migration motion",
        implication: "Retention, outage tolerance, transfer time, duplicate ingestion, and temporary capacity vary materially by approach.",
        action: "Choose the migration motion from measured data volume, history requirements, cutover deadline, and production-load validation needs.",
        source: "https://lantern.splunk.com/Manage_Performance_and_Health/Selecting_the_best_cloud_migration_approach"
      }
    ],
    operatingBenefits: [
      ["Splunk-managed platform operations", "Platform operations", "Return time to higher-value work", "Splunk takes on most infrastructure, operating-system, backup, capacity, maintenance, and platform-upgrade responsibilities.", "Cloud operating model", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Overview"],
      ["Cloud Monitoring Console", "Platform operations", "Operate from service-level signals", "Monitor ingestion, data quality, forwarder connections, workload, license usage, and upgrade readiness from the managed Cloud Monitoring Console.", "Cloud operating model", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Overview"],
      ["Continuous managed releases", "Platform operations", "Reach innovation without platform projects", "Splunk manages recurring Cloud Platform releases and communicates maintenance and upgrade events to designated operational contacts.", "Cloud operating model", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Overview"],
      ["Familiar platform capabilities", "Search & AI", "Preserve the value already built", "Splunk documents greater than 95% feature overlap while noting that some capabilities and administrative interactions are implemented differently in Cloud Platform.", "Migration foundation", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Overview"],
      ["Self-service cloud administration", "Platform operations", "Move routine change closer to administrators", "Create indexes, manage retention, administer users and roles, configure supported inputs, and install eligible apps through cloud interfaces.", "Cloud operating model", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Overview"],
      ["Cloud-vetted application model", "Security & compliance", "Reduce extension risk", "Splunkbase and private apps follow Cloud compatibility and vetting paths, with AppInspect available to validate custom packages before installation.", "Migration foundation", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Overview"],
      ["Flexible data onboarding", "Data management", "Keep proven collection patterns", "Supported forwarders, HTTP Event Collector, modular inputs, and intermediate tiers remain available, with cloud-specific credentials and connectivity requirements.", "Migration foundation", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Overview"],
      ["Outcome-focused operating model", "Dashboards & experience", "Shift effort from upkeep to adoption", "Teams can redirect time from backend maintenance toward data governance, onboarding, workload performance, use cases, and measurable business value.", "Cloud operating model", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Readiness"]
    ],
    approaches: [
      {
        title: "Greenfield",
        signal: "Clean start",
        fit: "Best when historical data can remain behind or age out and the priority is a clean, no-outage cutover.",
        strengths: ["No migration outage", "Easy to align to current best practices", "Immediate user switchover after validation"],
        tradeoff: "Historical data is not copied, and load testing is limited before redirection."
      },
      {
        title: "Dual running",
        signal: "Lowest cutover risk",
        fit: "Best when the target must be validated with real production load and data can be sent to both environments temporarily.",
        strengths: ["No migration outage", "Full validation under load", "Historical access can age out naturally"],
        tradeoff: "Requires parallel capacity and usually creates the longest migration window."
      },
      {
        title: "Full migration",
        signal: "History moves too",
        fit: "Best when historical data must move and the on-premises environment has a firm retirement deadline.",
        strengths: ["Historical data is migrated", "Configuration can be prepared first", "Clear final-state cutover"],
        tradeoff: "Requires an outage sized to data volume and offers the least forgiving rollback path."
      }
    ],
    breakingChanges: [
      ["Open every required data and integration path", "Splunk lists blocked data-forwarding routes and blocked connections to on-premises services as migration showstoppers. Prove firewall egress and any ES, SOAR, UBA, HEC, or heavy-forwarder path before execution.", "Blocker", "Network gate", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Prepare"],
      ["Replace unsupported forwarding certificate patterns", "The requireClientCert = true setting in server.conf is not supported in Splunk Cloud Platform. Use the Cloud credentials package and a supported forwarding design instead.", "Blocker", "Forwarding security", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Prepare"],
      ["Remediate incompatible and custom apps", "Only Cloud-compatible, vetted apps can run in Splunk Cloud Platform. Custom apps and third-party apps that depend on unsupported or insecure access can require material redesign and can block a critical workflow.", "Delay risk", "App compatibility", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Prepare"],
      ["Upgrade unsupported forwarders before cutover", "Splunk identifies unsupported forwarder versions as a blocker to the final forwarding step. Large forwarder estates can take months to remediate, so start this work in parallel with migration planning.", "Cutover blocker", "Data flow", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Prepare"],
      ["Rework backend and administrative procedures", "Enterprise and Cloud Platform have substantial feature overlap, but some features and administrative interactions work differently and customers do not operate the backend. Validate operational procedures, permissions, and critical workflows in SAT and UAT.", "Behavior change", "Operating model", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Overview"]
    ],
    steps: [
      ["Define value, owners, and decision rights", "Align the migration value proposition to measurable pain points, establish the delivery team, and clarify post-migration roles before technical execution begins.", "First", "Mobilize", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Readiness"],
      ["Run the Cloud Migration Assessment App", "Install the current Splunk-supported SCMA on the Monitoring Console, review its directional KPI checks, and use its export only when you intentionally choose to share assessment results with Splunk.", "First", "Assess", "https://splunkbase.splunk.com/app/4974"],
      ["Choose the migration motion", "Decide between greenfield, dual running, and full historical migration using retention needs, outage tolerance, parallel cost, deadline, and production-load testing requirements.", "Decision", "Plan", "https://lantern.splunk.com/Manage_Performance_and_Health/Selecting_the_best_cloud_migration_approach"],
      ["Inventory and remediate apps", "Build a compatibility matrix for Splunkbase, premium, private, and custom apps. Update cloud-compatible versions and use AppInspect for private packages before installation.", "Blocker", "Prepare", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Prepare"],
      ["Rationalize data, searches, and retention", "Measure daily ingest and retention, identify costly searches, remove unused knowledge objects and accelerations, correct data-quality issues, and avoid copying obsolete complexity.", "Plan", "Prepare", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Prepare"],
      ["Prove network and forwarding paths", "Validate firewall egress, on-premises integrations, supported forwarder versions, the Cloud credentials package, HTTP Event Collector paths, and any intermediate tier required for syslog or restricted systems.", "Blocker", "Prepare", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Prepare"],
      ["Rebuild identity and access deliberately", "Audit roles and permission patterns, simplify role-based access control where possible, and configure the target identity integration as part of migration—not after cutover.", "Validate", "Prepare", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Prepare"],
      ["Build, pilot, and reconcile", "Install approved apps, migrate supported configuration, send representative data, compare hosts, sources, source types, searches, alerts, dashboards, and performance, then resolve differences before user transition.", "Test", "Migrate", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Validate"],
      ["Complete SAT before UAT", "Have administrators complete System Acceptance Testing before subject-matter experts begin User Acceptance Testing across navigation, features, workflows, performance, and cloud administration.", "Test", "Validate", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Validate"],
      ["Cut over, monitor, and retire safely", "Confirm forwarding and critical workloads, monitor the Cloud stack, retain rollback options for the agreed period, and retire on-premises components only after acceptance and retention obligations are satisfied.", "Operate", "Transition", "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Overview"]
    ]
  }
};
