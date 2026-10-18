/* Generated from content/datasets/guidance.json. Edit the JSON source, not this adapter. */
window.SPLUNK_DATA.guidance = {
  "reviewed": "2026-10-18",
  "lifecycle": {
    "source": "https://www.splunk.com/en_us/legal/splunk-software-support-policy.html",
    "reviewed": "2026-10-01",
    "soonDays": 180,
    "enterprise": {
      "8.1": "2023-04-19",
      "8.2": "2023-09-30",
      "9.0": "2024-06-14",
      "9.1": "2025-06-28",
      "9.2": "2026-01-31",
      "9.3": "2026-07-24",
      "9.4": "2026-12-16",
      "10.0": "2027-07-28",
      "10.2": "2028-01-15",
      "10.4": "2028-05-18",
      "10.6": "2028-09-30"
    },
    "es": {
      "7.3": "2026-02-28",
      "8.0": "2026-10-30",
      "8.1": "2027-06-10",
      "8.2": "2027-09-09",
      "8.3": "2027-11-19",
      "8.4": "2028-02-04",
      "8.5": "2028-04-08",
      "8.6": "2028-08-04",
      "8.7": "2028-09-02"
    },
    "itsi": {
      "4.15": "2024-11-15",
      "4.17": "2025-06-13",
      "4.18": "2026-01-23",
      "4.19": "2026-05-28",
      "4.20": "2027-02-27",
      "4.21": "2027-09-02",
      "5.0": "2028-06-30"
    },
    "maintenanceLines": {
      "itsi": {
        "5.0.1": "5.0",
        "5.0.2": "5.0"
      }
    }
  },
  "urlAliases": {
    "product": {},
    "platform": {},
    "releases": {}
  },
  "sources": {
    "prep11operator": {
      "title": "Splunk Operator 3.2 compatibility matrix",
      "url": "https://help.splunk.com/en/splunk-enterprise/splunk-operator-for-kubernetes-guide/3.2/splunk-operator-for-kubernetes-overview/splunk-operator-compatibility-matrix",
      "section": "SOK to Splunk Enterprise version compatibility; Upgrade path guidance",
      "checked": "2026-10-15",
      "reviewed": "2026-10-15"
    },
    "prep11changelog": {
      "title": "Splunk Operator change log",
      "url": "https://splunk.github.io/splunk-operator/reference/ChangeLog.html",
      "section": "3.2.0 (2026-09-08); Breaking Changes; Supported Kubernetes and Splunk versions",
      "checked": "2026-10-15",
      "reviewed": "2026-10-15"
    },
    "prep11architecture": {
      "title": "Splunk Validated Architecture: Operator for Kubernetes",
      "url": "https://help.splunk.com/en/splunk-enterprise/splunk-validated-architectures/applied-svas/splunk-operator-for-kubernetes",
      "section": "Deployment Options; Storage Considerations; Application Lifecycle Management / App Framework / Premium Apps; Resilience and Scaling",
      "checked": "2026-10-15",
      "reviewed": "2026-10-15"
    },
    "prep11workload": {
      "title": "Enterprise 10.6 workload management on Kubernetes",
      "url": "https://help.splunk.com/en/splunk-enterprise/administer/manage-workloads/10.6/use-workload-management-on-kubernetes",
      "section": "Workload management modes",
      "checked": "2026-10-15",
      "reviewed": "2026-10-15"
    },
    "prep11migration": {
      "title": "Splunk Lantern: Cloud migration readiness",
      "url": "https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Readiness",
      "section": "Organizational readiness guide: staffing plan, communications plan and post-migration staffing transition plan",
      "checked": "2026-10-15",
      "reviewed": "2026-10-15"
    },
    "prep11enterprise": {
      "title": "Welcome to Splunk Enterprise 10.6",
      "url": "https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/10.6/whats-new/welcome-to-splunk-enterprise-10.6",
      "section": "Release introduction; upgrade and system-requirement links",
      "checked": "2026-10-15",
      "reviewed": "2026-10-15"
    },
    "prep11platformnews": {
      "title": "Splunk Platform 10.6 public announcement",
      "url": "https://www.splunk.com/en_us/blog/platform/announcing-splunk-cloud-platform-10-6-and-splunk-enterprise-10-6.html",
      "section": "Keep Apps and Integrations Ready for Updated Versioning",
      "sourceDate": "2026-09-30",
      "checked": "2026-10-15",
      "reviewed": "2026-10-15"
    },
    "prep11ainews": {
      "title": "Cisco announces self-managed Splunk AI",
      "url": "https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2026/m09/cisco-delivers-trusted-ai-at-scale-through-new-splunk-advancements.html",
      "section": "Self-managed Splunk AI, accelerated by NVIDIA",
      "sourceDate": "2026-09-15",
      "checked": "2026-10-15",
      "reviewed": "2026-10-15"
    }
  },
  "preparation11": {
    "id": "splunk-11-preparation",
    "title": "Prep for Splunk 11.x",
    "scope": "Upcoming Splunk Enterprise 11.x and later major releases",
    "checked": "2026-10-15",
    "evidenceStatus": "Awaiting version-specific public evidence",
    "summary": "Follow public announcements, understand the decisions ahead, and prepare against documented current capabilities while 11.x details develop.",
    "boundary": "No version-specific public 11.x release announcement was located in the sources checked on October 15, 2026. Release timing, deployment requirements and migration paths remain unconfirmed here.",
    "announcementPolicy": "An announcement records a stated plan. Released documentation, exact compatibility matrices and service-specific evidence are required before a plan becomes an installation path, supported pairing or availability claim.",
    "announcements": [],
    "baseline": [
      {
        "id": "prep11-operator-baseline",
        "title": "Start with an exact Operator compatibility tuple",
        "track": "infrastructure",
        "kind": "baseline",
        "version": "SOK 3.2.0 / Enterprise 9.4.15–10.6.0",
        "effectiveDate": null,
        "verified": "2026-10-15",
        "status": "Current baseline · source discrepancy",
        "text": "The 3.2 help matrix lists Kubernetes 1.32–1.37 and Enterprise 9.4.15–10.6.0. The linked change log lists Kubernetes 1.32–1.36 and Enterprise 10.6.0 for 3.2.0. Its September 8 heading also differs from the matrix’s September 24 release date.",
        "qualification": "Preserve both published scopes. Confirm the exact Kubernetes, Operator and Enterprise combination before using it; neither source certifies 11.x.",
        "action": "Record the intended Kubernetes distribution and version, Operator release and exact Enterprise build. Resolve the differing 3.2 version/date statements before relying on their disputed range.",
        "src": [
          "prep11operator",
          "prep11changelog"
        ]
      },
      {
        "id": "prep11-architecture-baseline",
        "title": "Design storage and failure recovery before moving workloads",
        "track": "infrastructure",
        "kind": "baseline",
        "version": "Current Operator validated architecture",
        "effectiveDate": null,
        "verified": "2026-10-15",
        "status": "Current preparation guidance",
        "text": "The Operator validated architecture describes single-site and multi-site layouts, persistent storage, SmartStore and the App Framework. It discourages distributed non-clustered deployments because they lack the redundancy expected in Kubernetes.",
        "qualification": "Current architecture guidance is preparation context. An 11.x topology, sizing or migration requirement is not established.",
        "action": "Map search heads, indexers and management roles to availability zones, storage classes, recovery objectives and a tested restore design.",
        "src": [
          "prep11architecture"
        ]
      },
      {
        "id": "prep11-app-delivery",
        "title": "Inventory apps and configuration delivery",
        "track": "apps",
        "kind": "baseline",
        "version": "Current Operator App Framework and premium-app guidance",
        "effectiveDate": null,
        "verified": "2026-10-15",
        "status": "Current preparation guidance",
        "text": "The current Operator architecture covers app distribution through the App Framework and separate considerations for premium apps. Existing apps, add-ons, scripts, credentials and filesystem assumptions need their own review.",
        "qualification": "App installation and a container image do not prove ES, ITSI, SOAR or third-party compatibility with 11.x.",
        "action": "Build an app and integration inventory, identify persistent state and external dependencies, and plan repeatable deployment and rollback tests. Keep exact premium-product matrices as a separate decision gate.",
        "src": [
          "prep11architecture"
        ]
      },
      {
        "id": "prep11-workload-baseline",
        "title": "Recheck search resource controls",
        "track": "operations",
        "kind": "baseline",
        "version": "Enterprise 10.6 documentation; capability introduced in 10.4+",
        "effectiveDate": null,
        "verified": "2026-10-15",
        "status": "Current baseline",
        "text": "Current workload-management guidance distinguishes Advanced mode, requiring writable CPU and memory cgroups, from Basic mode, which supports admission rules on systems such as Kubernetes.",
        "qualification": "Basic mode does not establish full workload-pool or placement-rule parity. This is current-release behavior, not an 11.x promise.",
        "action": "Inventory admission, placement and monitoring rules; validate which controls work in the chosen current lab topology before assuming equivalent behavior.",
        "src": [
          "prep11workload"
        ]
      },
      {
        "id": "prep11-cloud-option",
        "title": "Compare the future operating model with a Cloud migration",
        "track": "cloud",
        "kind": "baseline",
        "version": "Current Splunk Cloud Platform migration guidance",
        "effectiveDate": null,
        "verified": "2026-10-15",
        "status": "Planning option",
        "text": "Splunk Lantern’s migration readiness guidance calls for team ownership, communication and an operating model for the move to Splunk Cloud Platform.",
        "qualification": "Cloud is a separate migration program. Enterprise announcements do not establish Cloud rollout, entitlement or FedRAMP Moderate/High authorization.",
        "action": "Assess ownership, staffing, communication and post-migration responsibilities. Use the released Enterprise-to-Cloud guide for technical assessment and exact service-specific evidence.",
        "src": [
          "prep11migration"
        ]
      }
    ],
    "questions": [
      {
        "id": "prep11-release-scope",
        "title": "When will 11.x be available, and at what release stage?",
        "text": "A confirmed public release date, preview or general-availability stage is not recorded in this evidence set.",
        "needed": "A dated official announcement and version-specific release notes."
      },
      {
        "id": "prep11-kubernetes-scope",
        "title": "What deployment models will 11.x support?",
        "text": "Supported deployment models, platform requirements and component-specific support for 11.x remain unconfirmed here.",
        "needed": "Version-specific system requirements and an official deployment/support statement."
      },
      {
        "id": "prep11-upgrade-path",
        "title": "How will existing deployments reach 11.x?",
        "text": "No 10.x-to-11.x upgrade edge, in-place conversion or data-movement procedure is published in this guide.",
        "needed": "READ THIS FIRST, an exact upgrade-path table, migration procedure and rollback limits."
      },
      {
        "id": "prep11-app-pairing",
        "title": "Which premium products, apps and forwarders will pair?",
        "text": "Existing 10.x support does not establish 11.x support for ES, ITSI, SOAR, apps, forwarders or receiver topologies.",
        "needed": "Exact app, runtime, premium-product and forwarder/receiver matrices."
      },
      {
        "id": "prep11-support-security",
        "title": "What changes for support, security and lifecycle?",
        "text": "No 11.x support deadline, runtime floor, FIPS status or security baseline is inferred from adjacent releases.",
        "needed": "The applicable public support-policy line, system requirements, advisories and cryptographic guidance."
      },
      {
        "id": "prep11-cloud-scope",
        "title": "What changes for Cloud or regulated environments?",
        "text": "Commercial Enterprise plans do not establish a Cloud service date, regional rollout or FR-M/FR-H authorization.",
        "needed": "Current Cloud Service Details, product-specific regional evidence and exact authorized Marketplace offerings."
      }
    ],
    "sourceIds": [
      "prep11operator",
      "prep11changelog",
      "prep11architecture",
      "prep11workload",
      "prep11migration",
      "prep11enterprise",
      "prep11platformnews",
      "prep11ainews"
    ],
    "monitoring": {
      "owner": "Version Release Watch",
      "audit": "Version Guidance Audit",
      "scope": "Discover official public 11.x+ announcements and version-specific documentation; recheck this finite source inventory and affected claims; coordinate ES editions and Cloud/FedRAMP evidence with their existing owners.",
      "checked": "2026-10-15",
      "outcome": "No version-specific 11.x announcement located; current preparation context verified",
      "followUp": "Add the first verifiable public 11.x announcement with its exact statement, source date, release stage, applicability and remaining unknowns. Preserve prior statements as dated history."
    },
    "contextUpdates": [
      {
        "id": "prep11-news-versioning",
        "title": "Review custom version-detection logic",
        "kind": "context",
        "status": "Published announcement · 10.6 context",
        "sourceDate": "2026-09-30",
        "effectiveDate": null,
        "verified": "2026-10-15",
        "text": "The 10.6 announcement asks app and automation owners to use supported product-identification methods rather than relying on version numbers alone to distinguish Enterprise from Cloud.",
        "qualification": "This is published 10.6 guidance and a useful preparation task. It does not announce an 11.x release or a migration path.",
        "src": [
          "prep11platformnews"
        ]
      },
      {
        "id": "prep11-news-selfmanaged-ai",
        "title": "Kubernetes-based architecture announced for Cisco AI POD for Splunk",
        "kind": "context",
        "status": "Published announcement · adjacent product scope",
        "sourceDate": "2026-09-15",
        "effectiveDate": null,
        "verified": "2026-10-15",
        "text": "Cisco’s announcement describes Kubernetes-based self-managed AI infrastructure for Splunk customers. It describes AI Assistant as available and Agent Launchpad as coming later in 2026.",
        "qualification": "The statement is specific to self-managed AI and Cisco AI POD for Splunk. It does not establish an 11.x deployment model or confirm later delivery of the named planned feature.",
        "src": [
          "prep11ainews"
        ]
      }
    ]
  }
};
