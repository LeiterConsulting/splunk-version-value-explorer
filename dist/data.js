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
            source: "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.0/upgrade-or-migrate-splunk-e…75872 tokens truncated…re Analytics entity-discovery, history and business-context scope.",
      "events": [
        {
          "date": "2026-09-25",
          "event": "First recorded in source register; earlier usage date not established"
        },
        {
          "date": "2026-09-26",
          "event": "Review status updated: Reviewed · 2026-09-26"
        },
        {
          "date": "2026-09-27",
          "event": "Review status updated: Reviewed · 2026-09-27"
        },
        {
          "date": "2026-09-28",
          "event": "Review status updated: Reviewed · 2026-09-28"
        },
        {
          "date": "2026-09-29",
          "event": "Review status updated: Reviewed · 2026-09-29"
        },
        {
          "date": "2026-09-30",
          "event": "Review status updated: Reviewed · 2026-09-30"
        }
      ]
    },
    {
      "url": "https://www.splunk.com/en_us/legal/splunk-software-support-policy.html",
      "title": "splunk software support policy.html",
      "areas": [
        "Release guide"
      ],
      "references": [
        "release.guidance.lifecycle.source"
      ],
      "reviews": [
        "2026-09-28"
      ],
      "usage": "In use",
      "reviewed": "2026-09-28",
      "status": "Reviewed",
      "firstRecorded": "2026-09-25",
      "firstUsed": null,
      "outdatedAsOf": null,
      "reason": "The lifecycle review date records a scoped policy-table verification; it does not recalculate deadlines, establish Cloud availability or advance unrelated source-review dates.",
      "section": "Splunk Enterprise, Enterprise Security and IT Service Intelligence supported-version tables",
      "verificationScope": "Checked every maintained Enterprise 8.1 through 10.4, Enterprise Security 7.3 through 8.7 and ITSI 4.15 through 5.0 support deadline against the current published tables, including the explicit Enterprise Security 7.3 support extension. Cloud-managed selections do not inherit these customer-managed lifecycle dates, and the 180-day reminder remains a Version Compass planning threshold rather than a support-policy rule.",
      "events": [
        {
          "date": "2026-09-25",
          "event": "First recorded in source register; earlier usage date not established"
        },
        {
          "date": "2026-09-28",
          "event": "Review status updated: Reviewed · 2026-09-28"
        }
      ]
    },
    {
      "url": "https://www.splunk.com/en_us/products/exposure-analytics.html",
      "title": "Exposure Analytics product page",
      "areas": [
        "ES editions"
      ],
      "references": [
        "editions.sources.ea.u",
        "editions: editions.capabilities.4",
        "editions: editions.workflows.3"
      ],
      "reviews": [
        "2026-09-30"
      ],
      "usage": "In use",
      "reviewed": "2026-09-30",
      "status": "Reviewed",
      "firstRecorded": "2026-09-25",
      "firstUsed": null,
      "outdatedAsOf": null,
      "reason": "Named coming-soon enhancements are not presented as currently shipped capabilities.",
      "section": "Features, packaging FAQ and coming-soon labels",
      "verificationScope": "Checked core ES inclusion at no additional cost, current entity discovery and investigation context, and separate coming-soon labels for posture metrics and Entity Profiling.",
      "events": [
        {
          "date": "2026-09-25",
          "event": "First recorded in source register; earlier usage date not established"
        },
        {
          "date": "2026-09-26",
          "event": "Review status updated: Reviewed · 2026-09-26"
        },
        {
          "date": "2026-09-27",
          "event": "Review status updated: Reviewed · 2026-09-27"
        },
        {
          "date": "2026-09-28",
          "event": "Review status updated: Reviewed · 2026-09-28"
        },
        {
          "date": "2026-09-29",
          "event": "Review status updated: Reviewed · 2026-09-29"
        },
        {
          "date": "2026-09-30",
          "event": "Review status updated: Reviewed · 2026-09-30"
        }
      ]
    },
    {
      "url": "https://www.splunk.com/en_us/products/pricing.html",
      "title": "Splunk pricing — Enterprise Security and SOAR",
      "areas": [
        "ES editions"
      ],
      "references": [
        "editions.sources.pricing.u",
        "editions: editions.capabilities.0",
        "editions: editions.capabilities.3",
        "editions: editions.capabilities.11",
        "editions: editions.notes.4",
        "editions: editions.conflicts.2.claims.0"
      ],
      "reviews": [
        "2026-09-30"
      ],
      "conflict": true,
      "usage": "In use",
      "reviewed": "2026-09-30",
      "status": "Needs reconciliation",
      "firstRecorded": "2026-09-25",
      "firstUsed": null,
      "outdatedAsOf": null,
      "reason": "The broad pricing page remains alongside the narrower pricing-model eligibility FAQ.",
      "section": "Enterprise Security, SOAR and Attack Analyzer purchasing sections",
      "verificationScope": "Checked the two-edition, deployment, capability, quote, trial and listed activity-, workload- and ingest-pricing statements. No price or universal eligibility is inferred.",
      "events": [
        {
          "date": "2026-09-25",
          "event": "First recorded in source register; earlier usage date not established"
        },
        {
          "date": "2026-09-25",
          "event": "Review status updated: Needs reconciliation · 2026-09-23"
        },
        {
          "date": "2026-09-26",
          "event": "Review status updated: Needs reconciliation · 2026-09-26"
        },
        {
          "date": "2026-09-27",
          "event": "Review status updated: Needs reconciliation · 2026-09-27"
        },
        {
          "date": "2026-09-28",
          "event": "Review status updated: Needs reconciliation · 2026-09-28"
        },
        {
          "date": "2026-09-29",
          "event": "Review status updated: Needs reconciliation · 2026-09-29"
        },
        {
          "date": "2026-09-30",
          "event": "Review status updated: Needs reconciliation · 2026-09-30"
        }
      ]
    },
    {
      "url": "https://www.splunk.com/en_us/products/pricing/pricing-models.html",
      "title": "Splunk pricing models and eligibility FAQ",
      "areas": [
        "ES editions"
      ],
      "references": [
        "editions.sources.pricingModels.u",
        "editions: editions.notes.4",
        "editions: editions.conflicts.2.claims.1"
      ],
      "reviews": [
        "2026-09-30"
      ],
      "conflict": true,
      "usage": "In use",
      "reviewed": "2026-09-30",
      "status": "Needs reconciliation",
      "firstRecorded": "2026-09-25",
      "firstUsed": null,
      "outdatedAsOf": null,
      "reason": "The unresolved activity-pricing discrepancy remains explicit instead of becoming commercial advice.",
      "section": "Activity-, workload- and ingest-pricing eligibility FAQ",
      "verificationScope": "Checked product eligibility wording for all three models. The activity-based entry still names Cloud Platform rather than Enterprise Security.",
      "events": [
        {
          "date": "2026-09-25",
          "event": "First recorded in source register; earlier usage date not established"
        },
        {
          "date": "2026-09-25",
          "event": "Review status updated: Needs reconciliation · 2026-09-23"
        },
        {
          "date": "2026-09-26",
          "event": "Review status updated: Needs reconciliation · 2026-09-26"
        },
        {
          "date": "2026-09-27",
          "event": "Review status updated: Needs reconciliation · 2026-09-27"
        },
        {
          "date": "2026-09-28",
          "event": "Review status updated: Needs reconciliation · 2026-09-28"
        },
        {
          "date": "2026-09-29",
          "event": "Review status updated: Needs reconciliation · 2026-09-29"
        },
        {
          "date": "2026-09-30",
          "event": "Review status updated: Needs reconciliation · 2026-09-30"
        }
      ]
    },
    {
      "url": "https://www.splunk.com/en_us/products/user-and-entity-behavior-analytics.html",
      "title": "Splunk UEBA product page",
      "areas": [
        "ES editions"
      ],
      "references": [
        "editions.sources.ueba.u",
        "editions: editions.capabilities.12",
        "editions: editions.workflows.2"
      ],
      "reviews": [
        "2026-09-30"
      ],
      "usage": "In use",
      "reviewed": "2026-09-30",
      "status": "Reviewed",
      "firstRecorded": "2026-09-25",
      "firstUsed": null,
      "outdatedAsOf": null,
      "reason": "The legacy standalone Splunk UBA lifecycle is not applied to integrated UEBA.",
      "section": "UEBA FAQ — edition, deployment and Splunk UBA lifecycle",
      "verificationScope": "Checked Premier inclusion, non-standalone/non-add-on status, Cloud-versus-on-premises differences, and separate legacy Splunk UBA lifecycle statements.",
      "events": [
        {
          "date": "2026-09-25",
          "event": "First recorded in source register; earlier usage date not established"
        },
        {
          "date": "2026-09-26",
          "event": "Review status updated: Reviewed · 2026-09-26"
        },
        {
          "date": "2026-09-27",
          "event": "Review status updated: Reviewed · 2026-09-27"
        },
        {
          "date": "2026-09-28",
          "event": "Review status updated: Reviewed · 2026-09-28"
        },
        {
          "date": "2026-09-29",
          "event": "Review status updated: Reviewed · 2026-09-29"
        },
        {
          "date": "2026-09-30",
          "event": "Review status updated: Reviewed · 2026-09-30"
        }
      ]
    }
  ]
};
