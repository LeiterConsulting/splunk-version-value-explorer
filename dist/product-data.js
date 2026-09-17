/* Premium-product and rolling-service content. Keep every claim traceable to an official source. */
(function (data) {
  "use strict";

  Object.assign(data.categories, {
    "Detection & analytics": { icon: "⌖", description: "Find, tune, and explain threats" },
    "Investigation & response": { icon: "◎", description: "Move from signal to coordinated action" },
    "Automation & AI": { icon: "✦", description: "Accelerate expert workflows with automation" },
    "Risk & exposure": { icon: "◇", description: "Prioritize the risk that matters" },
    "Service health": { icon: "◉", description: "Understand service impact and health" },
    "Event operations": { icon: "⇥", description: "Group, enrich, and resolve operational events" },
    "Integrations & content": { icon: "⌁", description: "Connect tools and reusable content" },
    "APM & troubleshooting": { icon: "⌕", description: "Trace behavior and isolate root cause" },
    "Infrastructure & Kubernetes": { icon: "⬡", description: "Navigate infrastructure in context" },
    "Digital experience": { icon: "◫", description: "Understand real user and synthetic journeys" },
    "Telemetry & OpenTelemetry": { icon: "⇄", description: "Collect and govern telemetry" },
    "Usage & governance": { icon: "▦", description: "Control access, cost, and consumption" }
  });

  data.products = {
    platform: { label: "Splunk Platform", short: "Splunk", description: "Enterprise, Cloud, and migration" },
    es: { label: "Splunk Enterprise Security", short: "Enterprise Security", description: "SIEM, investigation, and response" },
    itsi: { label: "Splunk IT Service Intelligence", short: "ITSI", description: "Service health and event operations" },
    observability: { label: "Splunk Observability Cloud", short: "Observability Cloud", description: "APM, infrastructure, and digital experience" }
  };

  const compatibilitySource = "https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/compatibility-matrix/splunk-products-version-compatibility/splunk-products-version-compatibility-matrix";
  const cloudServiceSource = "https://help.splunk.com/en/splunk-cloud-platform/get-started/service-terms-and-policies/10.5.2605/information-about-the-service/splunk-cloud-platform-service-details";
  const collector160Source = "https://github.com/signalfx/splunk-otel-collector/releases/tag/v0.160.0";
  const collector160PatchSource = "https://github.com/signalfx/splunk-otel-collector/releases/tag/v0.160.1";
  const collectorChart160Source = "https://github.com/signalfx/splunk-otel-collector-chart/releases/tag/splunk-otel-collector-0.160.0";
  const node411Source = "https://github.com/signalfx/splunk-otel-js/releases/tag/v4.11.0";
  const rum31Source = "https://github.com/signalfx/splunk-otel-js-web/releases/tag/v3.1.0";

  data.productTracks = {
    es: {
      label: "Splunk Enterprise Security",
      latest: "8.7",
      releases: ["7.3", "8.0", "8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7"],
      compatibilitySource: compatibilitySource,
      cloudServiceSource: cloudServiceSource,
      cloudCurrent: { platform: "10.5", product: "8.6" },
      compatibility: {
        enterprise: {
          "7.3": ["9.2", "9.3", "9.4", "10.0", "10.2"],
          "8.0": ["9.2", "9.3", "9.4"],
          "8.1": ["9.3", "9.4", "10.0", "10.2"],
          "8.2": ["9.3", "9.4", "10.0", "10.2"],
          "8.3": ["9.3", "9.4", "10.0", "10.2", "10.4"],
          "8.4": ["9.3", "9.4", "10.0", "10.2", "10.4"],
          "8.5": ["9.3", "9.4", "10.0", "10.2", "10.4"],
          "8.6": ["10.0", "10.2", "10.4"],
          "8.7": ["10.2", "10.4"]
        }
      },
      releasesData: {
        "7.3": {
          date: "Baseline line",
          source: "https://help.splunk.com/en/splunk-enterprise-security-8/install/8.7/upgrading/upgrade-splunk-enterprise-security",
          features: [],
          requirements: []
        },
        "8.0": {
          date: "2025",
          source: "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.0/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security",
          features: [
            ["Unified TDIR workspace", "Investigation & response", "Work one incident story", "Bring findings, investigations, cases, and response activity into the unified Enterprise Security experience."],
            ["Finding-based detections", "Detection & analytics", "Preserve more risk context", "Create findings that can be grouped and investigated instead of relying only on the legacy notable-event workflow."],
            ["SOAR Cloud pairing", "Automation & AI", "Launch automation in context", "Pair Enterprise Security with Splunk SOAR Cloud so analysts can run actions and playbooks while working an investigation."]
          ],
          technicalChanges: [
            {
              component: "Security investigation data model", domain: "Findings & cases", changeType: "Architecture changed", actionLevel: "Required",
              from: "Legacy notable events and investigations", to: "Findings, finding groups, and unified investigations",
              implication: "Saved searches, custom fields, dashboards, and procedures built around legacy notable-event objects do not automatically become equivalent finding workflows.",
              action: "Inventory custom correlation-search stanzas and downstream consumers, preserve required legacy investigation history, and validate the new finding pipeline before cutover.",
              source: "https://help.splunk.com/en/splunk-enterprise-security-8/install/8.7/upgrading/upgrade-splunk-enterprise-security"
            },
            {
              component: "Index and technology-add-on layout", domain: "Data model & storage", changeType: "New dependencies", actionLevel: "Required",
              from: "Enterprise Security 7.x index and add-on baseline", to: "Enterprise Security 8.x indexes and updated supporting technology add-ons",
              implication: "An application-only install can leave indexers without the supporting package required by the new security data path.",
              action: "Deploy the documented indexer technology add-on before installing Enterprise Security 8 on the search tier.",
              source: "https://help.splunk.com/en/splunk-enterprise-security-8/install/8.7/upgrading/upgrade-splunk-enterprise-security"
            }
          ],
          requirements: [
            ["Use 7.3.2 as the bridge from 6.x or earlier", "Splunk requires environments on Enterprise Security 6.x or earlier to upgrade to 7.3.2 before moving to any 8.x release.", "Blocker", "https://help.splunk.com/en/splunk-enterprise-security-8/install/8.7/upgrading/upgrade-splunk-enterprise-security", true],
            ["Back up the search tier and KV Store", "The move to Enterprise Security 8 is one-way. Take the documented full search-head and KV Store backups and retain the restoration path before installation.", "Blocker", "https://help.splunk.com/en/splunk-enterprise-security-8/install/8.7/upgrading/upgrade-splunk-enterprise-security", true],
            ["Preserve required legacy investigations", "Legacy investigations are not available in the new interface after the upgrade unless they are preserved through Splunk's documented process.", "Plan", "https://help.splunk.com/en/splunk-enterprise-security-8/install/8.7/upgrading/upgrade-splunk-enterprise-security", true]
          ]
        },
        "8.1": {
          date: "June 2025",
          source: "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.1/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security",
          features: [
            ["Detection version comparison", "Detection & analytics", "Review change with context", "Compare detection revisions before promoting or troubleshooting a change."],
            ["On-premises SOAR pairing", "Automation & AI", "Extend response choice", "Pair an on-premises Splunk SOAR deployment with the unified Enterprise Security workflow."],
            ["Saved Analyst Queue views", "Investigation & response", "Return to the right work", "Save queue filters and views for repeatable analyst workflows."]
          ],
          requirements: []
        },
        "8.2": {
          date: "September 2025",
          source: "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.2/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security",
          features: [
            ["AI-assisted investigation", "Automation & AI", "Accelerate initial analysis", "Use AI assistance to summarize findings and support investigation workflows where the feature is entitled and available."],
            ["Detection test and validation", "Detection & analytics", "Ship safer detections", "Test, validate, and audit detection changes with a clearer version history."],
            ["Hybrid SOAR pairing", "Automation & AI", "Coordinate response across deployment models", "Pair supported SOAR deployments with Enterprise Security investigation workflows."]
          ],
          requirements: []
        },
        "8.3": {
          date: "November 2025",
          source: "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.3/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security",
          features: [
            ["Detection version management", "Detection & analytics", "Govern the detection lifecycle", "Manage detection versions and review activity from the product interface."],
            ["Entity risk scoring", "Risk & exposure", "Prioritize the riskiest entities", "Use entity-centered risk scoring to focus investigation and response."],
            ["Pinned and nested findings", "Investigation & response", "Keep complex evidence organized", "Pin important findings and use nested groupings while working an investigation."]
          ],
          technicalChanges: [
            {
              component: "Analyst Queue storage", domain: "Search & KV Store", changeType: "Performance changed", actionLevel: "Review",
              from: "Earlier queue storage and query behavior", to: "KV Store performance improvements for Analyst Queue workloads",
              implication: "Large queues benefit from the new implementation, but custom searches or operational baselines should be re-measured.",
              action: "Re-run queue performance and search-concurrency checks with production-like volumes.",
              source: "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.3/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security"
            }
          ],
          requirements: []
        },
        "8.4": {
          date: "February 2026",
          source: "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.4/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security",
          features: [
            ["Detection Studio", "Detection & analytics", "Build detections with clearer guidance", "Create and refine detections in a purpose-built authoring experience."],
            ["Simplified findings and investigations", "Investigation & response", "Reduce analyst friction", "Work findings and investigations through a more focused interface."],
            ["Detection version controls", "Detection & analytics", "Make changes auditable", "Use version controls while accounting for the maintenance-release status documented by Splunk."]
          ],
          technicalChanges: [
            {
              component: "Detection versioning", domain: "Detection content", changeType: "Maintenance behavior", actionLevel: "Review",
              from: "Versioning enabled by default in 8.4.0", to: "Versioning disabled in the 8.4.1 maintenance release",
              implication: "Behavior differs inside the same minor line; treating 8.4 as a single undifferentiated target can produce the wrong expectation.",
              action: "Target the supported maintenance release and verify the documented versioning state before rollout.",
              source: "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.4/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security"
            }
          ],
          requirements: [
            ["Replace older finding-based detections", "Splunk warns that some finding-based detections created in earlier releases can stop working after the 8.4 transition. Inventory, update, and test them before production.", "Blocker", "https://help.splunk.com/en/splunk-enterprise-security-8/install/8.7/upgrading/upgrade-splunk-enterprise-security", true],
            ["Use the supported 8.4 maintenance release", "Splunk directs customers to 8.4.1 rather than 8.4.0. Reconcile maintenance-level guidance before scheduling the change.", "Validate", "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.4/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security", false]
          ]
        },
        "8.5": {
          date: "April 2026",
          source: "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.5/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security",
          features: [
            ["Detection tuning and promotion", "Detection & analytics", "Separate test from production", "Tune and validate detection content before promoting it into production use."],
            ["Exposure Analytics", "Risk & exposure", "Connect exposures to security work", "Bring exposure context into prioritization and investigation."],
            ["SOAR app administration in ES", "Automation & AI", "Manage automation closer to analysts", "Configure supported SOAR apps from the Enterprise Security experience."],
            ["Built-in response plans", "Investigation & response", "Standardize common investigations", "Apply reusable response plans to guide consistent analyst action."]
          ],
          technicalChanges: [
            {
              component: "Enterprise Security workload placement", domain: "Search workload", changeType: "Control added", actionLevel: "Review",
              from: "Shared search workload defaults", to: "Enterprise Security workload-pool configuration support",
              implication: "The capability can isolate security workloads, but poor pool sizing can move rather than remove contention.",
              action: "Baseline scheduled-search demand and validate workload-pool policy under representative detection volume.",
              source: "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.5/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security"
            }
          ],
          requirements: []
        },
        "8.6": {
          date: "July 2026",
          source: "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.6/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security",
          features: [
            ["Agentic SOC capabilities", "Automation & AI", "Compress repetitive investigation work", "Use supported detection, triage, malware, phishing, guided-response, and automation agents when entitled and available."],
            ["Team Queue and activity history", "Investigation & response", "Coordinate analyst ownership", "Use team-aware work queues and activity history to make handoffs and changes visible."],
            ["UEBA-connected cloud detections", "Risk & exposure", "Broaden behavioral context", "Use documented behavioral-analytics capabilities for eligible cloud-connected deployments."],
            ["Detection Studio improvements", "Detection & analytics", "Refine content faster", "Build, preview, and manage detections through the expanded authoring workflow."]
          ],
          technicalChanges: [
            {
              component: "AI model runtime", domain: "Data boundary & AI", changeType: "Service dependency", actionLevel: "Review",
              from: "Local security analytics workflows", to: "Eligible AI features can use Splunk-hosted or Azure OpenAI model services",
              implication: "Model choice, regional availability, entitlement, and the documented data boundary matter before sensitive security workflows are enabled.",
              action: "Confirm edition, region, model runtime, data-handling terms, and approved use cases with the Splunk team.",
              source: "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.6/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security"
            },
            {
              component: "Enterprise Security 8.6 maintenance level", domain: "Security hardening", changeType: "Security fix floor", actionLevel: "Required",
              from: "Enterprise Security versions below 8.6.1", to: "Enterprise Security 8.6.1 or higher",
              implication: "Earlier 8.6 maintenance levels are affected by documented Analyst Queue SPL injection and UEBA search-macro permission vulnerabilities.",
              action: "Use Enterprise Security 8.6.1 or higher and verify the installed maintenance release rather than treating 8.6 as an undifferentiated target.",
              source: "https://advisory.splunk.com/advisories/SVD-2026-0807"
            }
          ],
          requirements: [
            ["Use Enterprise Security 8.6.1 or higher", "Splunk's August 19, 2026 security advisory identifies releases below 8.6.1 as affected and sets 8.6.1 as the fixed version.", "Blocker", "https://advisory.splunk.com/advisories/SVD-2026-0807", true],
            ["Check the platform requirement for updated navigation", "Splunk documents the updated Enterprise Security navigation experience with Enterprise Security 8.6 and Splunk Platform 10.4. Do not promise the same navigation on an older host.", "Validate", "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.6/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security", false],
            ["Replace deprecated threat-intelligence feeds", "URLHaus and the Abuse SSL IP Blacklist are deprecated in this line. The replacement URLHaus source requires an API key.", "Plan", "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.6/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security", true]
          ]
        },
        "8.7": {
          date: "September 2026",
          source: "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.7/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security",
          features: [
            ["AI SOC Analyst", "Automation & AI", "Advance investigations with guided analysis", "Use the Premier-edition AI SOC Analyst after Splunk enables access for the entitled deployment."],
            ["Connector and Automation Builder agents", "Automation & AI", "Create integrations and workflows faster", "Use Connector Builder in Premier after Splunk enables access, or Automation Builder in Essentials and Premier."],
            ["Enterprise Security on MCP", "Integrations & content", "Expose governed security tools", "Use the Essentials-edition MCP capability—also included in Premier—to connect Enterprise Security context to supported AI clients."],
            ["Detection Builder improvements", "Detection & analytics", "Move from idea to tested logic", "Use the Essentials-edition Detection Builder enhancements, which are also included in Premier, to create and refine detections."]
          ],
          technicalChanges: [
            {
              component: "Custom secondary navigation", domain: "UI configuration", changeType: "Customization conflict", actionLevel: "Required",
              from: "Customized secondary-navigation default.xml", to: "Enterprise Security 8.7 navigation baseline",
              implication: "Existing navigation customization can conflict with the new default layout.",
              action: "Back up default.xml, restore the Enterprise Security default, then deliberately reapply and test required customization.",
              source: "https://help.splunk.com/en/splunk-enterprise-security-8/install/8.7/upgrading/upgrade-splunk-enterprise-security"
            }
          ],
          requirements: [
            ["Install from the CLI on Splunk Enterprise 10.x", "Splunk documents that Enterprise Security 8 cannot be uploaded through the Splunk Web app manager on Splunk Enterprise 10.x; use the supported CLI installation path.", "Blocker", "https://help.splunk.com/en/splunk-enterprise-security-8/install/8.7/upgrading/upgrade-splunk-enterprise-security", true],
            ["Confirm Enterprise Security 8.7 edition and enablement", "AI SOC Analyst and Connector Builder Agent are Premier features that require Splunk enablement. Automation Builder is listed for Essentials and Premier; Enterprise Security on MCP and Detection Builder are listed for Essentials and are also included in Premier.", "Validate", "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.7/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security", false],
            ["Grant model-listing capability where AITK is used", "Enterprise Security 8.7 with AI Toolkit 6.0.2 requires the list_models capability for users who need to list models.", "Validate", "https://help.splunk.com/en/splunk-enterprise-security-8/install/8.7/upgrading/upgrade-splunk-enterprise-security", false],
            ["Reapply custom secondary navigation", "Back up the existing navigation configuration, restore the 8.7 default, and reapply only the customization that still passes validation.", "Plan", "https://help.splunk.com/en/splunk-enterprise-security-8/install/8.7/upgrading/upgrade-splunk-enterprise-security", true]
          ]
        }
      }
    },

    itsi: {
      label: "Splunk IT Service Intelligence",
      latest: "5.0.1",
      releases: ["4.15", "4.17", "4.18", "4.19", "4.20", "4.21", "5.0", "5.0.1"],
      compatibilitySource: compatibilitySource,
      relatedAppsSource: "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/install-and-upgrade/5.0/planning/itsi-compatibility-with-related-apps-and-add-ons",
      cloudServiceSource: cloudServiceSource,
      cloudCurrent: { platform: "10.5", product: "5.0" },
      compatibility: {
        enterprise: {
          "4.15": ["9.2"],
          "4.17": ["9.2"],
          "4.18": ["9.2", "9.3"],
          "4.19": ["9.2", "9.3", "9.4"],
          "4.20": ["9.2", "9.3", "9.4", "10.0"],
          "4.21": ["9.3", "9.4", "10.0", "10.2", "10.4"],
          "5.0": ["10.2", "10.4"],
          "5.0.1": ["10.2", "10.4"]
        }
      },
      releasesData: {
        "4.15": {
          date: "Baseline line",
          source: compatibilitySource,
          features: [],
          requirements: []
        },
        "4.17": {
          date: "Compatibility milestone",
          source: compatibilitySource,
          features: [],
          requirements: []
        },
        "4.18": {
          date: "2024",
          source: "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/4.18/release-notes/new-features-in-splunk-it-service-intelligence",
          features: [
            ["ML-assisted KPI thresholds", "Service health", "Set better thresholds faster", "Generate threshold recommendations from KPI history and use them as a starting point for adaptive service monitoring."],
            ["Entity status remediation", "Service health", "Trace unhealthy entities to configuration", "Navigate from entity status to the discovery search that contributes to the result."],
            ["Collapsible service trees", "Service health", "Focus on the affected dependency", "Filter and collapse service trees by severity and depth during root-cause work."],
            ["Expanded upgrade prechecks", "Platform operations", "Find configuration blockers earlier", "Detect entity, filtering, and base-search issues before the version change."]
          ],
          requirements: []
        },
        "4.19": {
          date: "2025",
          source: "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/4.19/release-notes/new-features-in-splunk-it-service-intelligence",
          features: [
            ["Service Sandbox", "Service health", "Model before publishing", "Map, simulate, and validate service relationships in a demo environment before production publication."],
            ["Configuration Assistant", "Platform operations", "Turn configuration health into action", "Find and remediate issues across services, KPIs, and entities from one dashboard."],
            ["Service impact analysis", "Service health", "Explain a degraded health score", "See the KPIs and entities contributing to service-health degradation."],
            ["Webhook, Jira, and PagerDuty integrations", "Integrations & content", "Connect episode work", "Send and correlate alert or incident activity through supported integrations."]
          ],
          requirements: [
            ["Run the new upgrade-readiness prechecks", "Splunk added checks that run when moving to the next ITSI version, including automatic remediation for documented object issues.", "Validate", "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/4.19/release-notes/new-features-in-splunk-it-service-intelligence", false]
          ]
        },
        "4.20": {
          date: "2025",
          source: "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/4.20/release-notes/new-features-in-splunk-it-service-intelligence",
          features: [
            ["KPI drift detection", "Service health", "Catch slow degradation", "Identify gradual or sudden KPI drift so teams can remediate before it becomes a service problem."],
            ["Scaled adaptive thresholding", "Service health", "Apply ML at larger scale", "Apply adaptive thresholds to as many as 100,000 KPIs in supported deployments."],
            ["Guided alert onboarding", "Event operations", "Normalize third-party alerts faster", "Use a guided workflow to ingest and normalize alert data from external monitoring tools."],
            ["Rules Engine queue mode", "Event operations", "Process bursts more predictably", "Use the default queue-processing system to reduce notable-event processing latency."]
          ],
          technicalChanges: [
            {
              component: "Rules Engine", domain: "Event processing", changeType: "Default changed", actionLevel: "Review",
              from: "Earlier notable-event processing mode", to: "Queue mode enabled by default",
              implication: "Throughput and backlog behavior change, and NATS becomes an operational component to monitor.",
              action: "Baseline alert volume, validate aggregation latency, and add the NATS Monitoring Dashboard to operating procedures.",
              source: "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/4.20/release-notes/new-features-in-splunk-it-service-intelligence"
            }
          ],
          requirements: [
            ["Align AI Toolkit and scientific Python", "ITSI 4.20 is tested with AI Toolkit 5.5.0, and Splunk explicitly excludes several Python for Scientific Computing releases. Verify the exact supported pairing before installation.", "Blocker", "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/install-and-upgrade/5.0/planning/itsi-compatibility-with-related-apps-and-add-ons", true]
          ]
        },
        "4.21": {
          date: "2025–2026",
          source: "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/4.21/release-notes/new-features-in-splunk-it-service-intelligence",
          features: [
            ["Event iQ grouping", "Event operations", "Reduce manual alert correlation", "Use machine learning to group alerts and surface actionable episode insights."],
            ["Adaptive entity thresholds", "Service health", "Detect entity-level anomalies", "Apply AI-assisted adaptive thresholding to entity data."],
            ["Recurring maintenance windows", "Event operations", "Keep planned work out of the noise", "Schedule daily, weekly, monthly, or annual maintenance windows."],
            ["Cisco network content pack", "Integrations & content", "See network health in service context", "Ingest and aggregate Catalyst Center and Meraki data into ITSI service views."]
          ],
          technicalChanges: [
            {
              component: "Splunk platform APIs", domain: "Custom integrations", changeType: "API version changed", actionLevel: "Required",
              from: "Custom scripts can depend on Splunk v1 APIs", to: "Splunk 10 and ITSI 4.21 support Splunk v2 APIs",
              implication: "Custom applications that keep calling disabled or superseded v1 endpoints can fail after the platform transition.",
              action: "Inventory custom API clients, move them to v2 endpoints, and test authentication and response handling.",
              source: "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/4.21/release-notes/new-features-in-splunk-it-service-intelligence"
            },
            {
              component: "Rules Engine Java runtime", domain: "Runtime", changeType: "Runtime floor", actionLevel: "Required",
              from: "ITSI 4.21.2 and earlier can use Java 8, 11, or 17", to: "ITSI 4.21.3 requires Java 17 and supports through Java 21",
              implication: "Java 8 and 11 are no longer supported for the 4.21.3 Rules Engine.",
              action: "Install and validate a supported Java 17–21 runtime before updating to ITSI 4.21.3 or later.",
              source: "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/4.21/release-notes/new-features-in-splunk-it-service-intelligence"
            }
          ],
          requirements: [
            ["Move custom clients to Splunk v2 APIs", "ITSI 4.21 and Splunk 10 support v2 APIs. Splunk says custom scripts and applications must be updated.", "Blocker", "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/4.21/release-notes/new-features-in-splunk-it-service-intelligence", true],
            ["Match Python mode to the platform", "ITSI 4.21 uses Python 3.7 on Splunk 9.3/9.4 and Python 3.9 on Splunk 10.0/10.2 according to the tested compatibility table.", "Validate", "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/install-and-upgrade/5.0/planning/itsi-compatibility-with-related-apps-and-add-ons", true],
            ["Upgrade Java for ITSI 4.21.3+", "Java 17 is the minimum supported runtime and Java 21 is supported; Java 8 and 11 are no longer supported for this maintenance level.", "Blocker", "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/4.21/release-notes/new-features-in-splunk-it-service-intelligence", true]
          ]
        },
        "5.0": {
          date: "2026",
          source: "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/5.0/release-notes/new-features-in-splunk-it-service-intelligence",
          features: [
            ["Event iQ Detect and Diagnose", "Automation & AI", "Move from episode to likely cause", "Use AI-assisted summarization and root-cause context for eligible episode workflows."],
            ["Redesigned Episode Review", "Event operations", "Triage with more context", "Use enhanced summaries, flexible aggregation, and a refreshed review experience."],
            ["Expanded monitoring integrations", "Integrations & content", "Onboard more operational signals", "Use documented integrations for Dynatrace, Zabbix, Oracle Enterprise Manager, and Datadog."],
            ["Team-aware ownership and sharing", "Service health", "Make operational ownership explicit", "Apply team RBAC, service sharing, and ownership to service-intelligence work."]
          ],
          technicalChanges: [
            {
              component: "ITSI Python runtime", domain: "Runtime & apps", changeType: "Runtime changed", actionLevel: "Required",
              from: "Python 3.7 or 3.9 depending on the 4.x platform pairing", to: "Python 3.13 for ITSI 5.0 and 5.0.1",
              implication: "Private apps, algorithms, scripts, and packaged dependencies that are not Python 3.13-compatible can fail.",
              action: "Run the documented Python migration assessment, update code and dependencies, and test every ITSI extension on the target platform.",
              source: "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/install-and-upgrade/5.0/planning/itsi-compatibility-with-related-apps-and-add-ons"
            },
            {
              component: "Related apps and add-ons", domain: "Dependency stack", changeType: "Compatibility set changed", actionLevel: "Required",
              from: "ITSI 4.x-era CIM, content packs, ticketing add-ons, and AI Toolkit", to: "ITSI 5.0 tested dependency set, including CIM 8.5.x and current conditional integrations",
              implication: "Updating only the ITSI package can leave required or optional integrations on an incompatible dependency line.",
              action: "Build an installed-dependency inventory and reconcile every used integration against the ITSI 5.0 compatibility table.",
              source: "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/install-and-upgrade/5.0/planning/itsi-compatibility-with-related-apps-and-add-ons"
            }
          ],
          requirements: [
            ["Complete the Python 3.13 migration", "ITSI 5.0 uses Python 3.13. Validate private apps, custom scripts, algorithms, and their packaged libraries before the upgrade.", "Blocker", "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/install-and-upgrade/5.0/planning/itsi-compatibility-with-related-apps-and-add-ons", true],
            ["Reconcile the complete dependency matrix", "CIM, AI Toolkit, scientific Python, Content Packs, ServiceNow, Jira, AI Assistant, Cloud Connect, MCP, and SAP components are conditional but version-specific when used.", "Blocker", "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/install-and-upgrade/5.0/planning/itsi-compatibility-with-related-apps-and-add-ons", true],
            ["Validate TLS and certificate integrations", "ITSI inherits the target platform's TLS 1.3 and OpenSSL changes. Test outbound integrations, compiled extensions, certificates, and cipher compatibility.", "Validate", "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/5.0/release-notes/new-features-in-splunk-it-service-intelligence", true]
          ]
        },
        "5.0.1": {
          date: "August 2026",
          source: "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/5.0/release-notes/new-features-in-splunk-it-service-intelligence",
          features: [
            ["ITSI MCP tools", "Integrations & content", "Connect approved assistants to ITSI", "Use documented MCP tools to expose governed ITSI functions to supported AI clients."],
            ["Security hardening", "Platform operations", "Reduce application attack surface", "Apply security improvements across Event Analytics, data integrations, Glass Tables, Entity Detail, Service Sandbox, and RBAC."],
            ["Prioritized episode policies", "Event operations", "Apply deterministic aggregation order", "Use the always-enabled policy-prioritization model for episode aggregation."]
          ],
          technicalChanges: [
            {
              component: "Notable Event Aggregation Policy order", domain: "Event processing", changeType: "Behavior enforced", actionLevel: "Required",
              from: "Policy prioritization can be disabled", to: "Policy prioritization is always enabled; opt-out is removed",
              implication: "Overlapping aggregation policies can group alerts differently when explicit priority was not previously part of the design.",
              action: "Review policy order and overlapping match criteria, then replay representative alert traffic before rollout.",
              source: "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/5.0/release-notes/new-features-in-splunk-it-service-intelligence"
            },
            {
              component: "ServiceNow alert action", domain: "Ticketing integration", changeType: "Parameter renamed", actionLevel: "Required",
              from: "worknotes parameter", to: "work_notes parameter",
              implication: "Custom actions or automation that keep the earlier parameter name can stop populating work notes.",
              action: "Update saved actions and custom integration code to use work_notes, then test create/update flows.",
              source: "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/5.0/release-notes/new-features-in-splunk-it-service-intelligence"
            }
          ],
          requirements: [
            ["Rehearse the enforced episode-policy order", "ITSI 5.0.1 removes the opt-out for NEAP prioritization. Validate overlapping policies and expected episode grouping with production-like alerts.", "Blocker", "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/5.0/release-notes/new-features-in-splunk-it-service-intelligence", true],
            ["Update ServiceNow work-note parameters", "Change custom uses of worknotes to work_notes and validate both create and update actions.", "Blocker", "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/5.0/release-notes/new-features-in-splunk-it-service-intelligence", true],
            ["Use Java 17 or 21", "ITSI 5.0.1 requires Java 17 at minimum and supports Java 21. Java 8 and Java 11 are not supported.", "Blocker", "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/release-notes-and-resources/5.0/release-notes/new-features-in-splunk-it-service-intelligence", true]
          ]
        }
      }
    },

    observability: {
      label: "Splunk Observability Cloud",
      latest: "Sep 2026",
      releases: ["Nov 2024", "Mar 2025", "Sep 2025", "Jan 2026", "Apr 2026", "Jul 2026", "Sep 2026"],
      releaseOverview: "https://help.splunk.com/en/splunk-observability-cloud/release-notes/release-notes-overview",
      collectorSource: "https://help.splunk.com/en/splunk-observability-cloud/manage-data/splunk-distribution-of-the-opentelemetry-collector/get-started-with-the-splunk-distribution-of-the-opentelemetry-collector",
      releasesData: {
        "Nov 2024": {
          date: "November 2024",
          source: "https://help.splunk.com/en/splunk-observability-cloud/release-notes/november-2024",
          features: [],
          requirements: []
        },
        "Mar 2025": {
          date: "March 2025",
          source: "https://help.splunk.com/en/splunk-observability-cloud/release-notes/march-2025",
          features: [
            ["Service-centric APM", "APM & troubleshooting", "Reach unhealthy services faster", "Use the redesigned service map, service-first navigation, and error-based troubleshooting to isolate likely causes."],
            ["AI context inside Splunk Cloud search", "Automation & AI", "Bring observability into investigations", "Use the Observability AI Assistant tab in Splunk Cloud Related Content when AI Assistant and Unified Identity are enabled."],
            ["Recurring Synthetics downtime", "Digital experience", "Protect SLAs from planned work", "Align synthetic monitoring downtime with recurring maintenance windows."],
            ["MFA-enabled synthetic tests", "Digital experience", "Test protected journeys", "Run supported synthetic journeys that require time-based one-time passwords."]
          ],
          requirements: [
            ["Confirm Unified Identity for cross-product AI context", "The Observability AI Assistant experience in Splunk Cloud Related Content requires both AI Assistant entitlement and Unified Identity.", "Validate", "https://help.splunk.com/en/splunk-observability-cloud/release-notes/march-2025", false]
          ]
        },
        "Sep 2025": {
          date: "September 2025",
          source: "https://help.splunk.com/en/splunk-observability-cloud/release-notes/september-2025",
          features: [
            ["Call Graph Profiling", "APM & troubleshooting", "See code-level execution", "Collect call stacks and inspect method execution while troubleshooting application performance."],
            ["Business transaction view", "APM & troubleshooting", "Follow critical transactions", "Monitor transaction performance and preserve context through service-map drilldowns."],
            ["Unified workflow navigation", "Dashboards & experience", "Find work by task", "Use the Digital Experience section, clearer terminology, recents, and favorites."],
            ["Alert enrichment for Synthetics", "Digital experience", "Send more useful alerts", "Add detector context through alert-enrichment variables."]
          ],
          technicalChanges: [
            {
              component: "Browser RUM Core Web Vitals", domain: "RUM data model", changeType: "Metric removed", actionLevel: "Required",
              from: "rum.webvitals.fid", to: "Interaction to Next Paint metrics",
              implication: "Charts, detectors, and exports that still query First Input Delay can lose data after the documented removal date.",
              action: "Replace FID queries and thresholds with the documented INP metric names before November 15, 2025.",
              source: "https://help.splunk.com/en/splunk-observability-cloud/release-notes/september-2025"
            },
            {
              component: "Observability navigation vocabulary", domain: "UI & runbooks", changeType: "Names changed", actionLevel: "Review",
              from: "Detectors and SLOs, Log Observer, Metric Finder", to: "Alerts, Logs, Metrics",
              implication: "Training, runbooks, deep links, and support procedures can use labels that no longer match the interface.",
              action: "Update operating documentation and validate saved links used by responders.",
              source: "https://help.splunk.com/en/splunk-observability-cloud/release-notes/september-2025"
            }
          ],
          requirements: [
            ["Move Browser RUM from FID to INP", "Splunk removed the FID field from the RUM data model after documenting INP as the replacement. Update every chart, detector, API consumer, and export that references FID.", "Blocker", "https://help.splunk.com/en/splunk-observability-cloud/release-notes/september-2025", true],
            ["Upgrade and validate the RUM browser agent", "The release includes Browser RUM agent 1.0.0. Follow the documented agent-upgrade path and test data shape, session continuity, and dashboards.", "Validate", "https://help.splunk.com/en/splunk-observability-cloud/release-notes/september-2025", false]
          ]
        },
        "Jan 2026": {
          date: "January 2026",
          source: "https://help.splunk.com/en/splunk-observability-cloud/release-notes/january-2026",
          features: [
            ["New Kubernetes experience", "Infrastructure & Kubernetes", "Troubleshoot without losing context", "Use denser tables, OTel tags, related entities, YAML comparison, HPA entities, and an in-context detail flyout."],
            ["Histogram archive and restore", "Usage & governance", "Retain history at lower real-time cost", "Archive histogram metrics and restore them on demand through Metrics Pipeline Management."],
            ["Multi-dimension APM MetricSets", "APM & troubleshooting", "Filter services with more precision", "Create Monitoring MetricSets with as many as five custom dimensions."],
            ["PostgreSQL Database Monitoring", "APM & troubleshooting", "Connect queries to applications", "Correlate PostgreSQL query behavior with the Java applications that originate it."]
          ],
          technicalChanges: [
            {
              component: "Kubernetes experience", domain: "Collector & UI", changeType: "Version floor", actionLevel: "Required",
              from: "Classic Kubernetes navigator and earlier Collector", to: "New Kubernetes experience with Collector 0.138.1 or later for full functionality",
              implication: "Opening the new interface does not create the entity properties and telemetry required by every feature.",
              action: "Upgrade the Splunk OpenTelemetry Collector for Kubernetes to 0.138.1 or later, validate pipelines, then opt in to the new experience.",
              source: "https://help.splunk.com/en/splunk-observability-cloud/release-notes/january-2026"
            }
          ],
          requirements: [
            ["Upgrade Kubernetes Collectors to 0.138.1+", "Splunk requires Collector 0.138.1 or later for access to all features in the new Kubernetes experience.", "Blocker", "https://help.splunk.com/en/splunk-observability-cloud/release-notes/january-2026", true],
            ["Move runbooks off the classic navigator", "The classic Kubernetes navigator was scheduled for deprecation by February 2026. Validate replacement views, filters, dashboards, and responder training.", "Plan", "https://help.splunk.com/en/splunk-observability-cloud/release-notes/january-2026", true]
          ]
        },
        "Apr 2026": {
          date: "April 2026",
          source: "https://help.splunk.com/en/splunk-observability-cloud/release-notes/april-2026",
          features: [
            ["Metric Explorer", "Usage & governance", "Find coverage before building", "Explore metrics by entity or name, filter by dimensions, and inspect population coverage before creating charts or alerts."],
            ["Automatic APM–infrastructure context", "APM & troubleshooting", "Correlate services and hosts with less setup", "Populate Related Content on APM views for OpenTelemetry users without requiring the SignalFx exporter."],
            ["Secure Application", "Risk & exposure", "Prioritize live runtime risk", "Use the existing Splunk OpenTelemetry distribution for runtime attack detection alongside vulnerability monitoring."],
            ["Subscription usage 2.0", "Usage & governance", "See entitlement consumption together", "Monitor usage across infrastructure, APM, Synthetics, and RUM in one view."]
          ],
          technicalChanges: [
            {
              component: "APM to infrastructure correlation", domain: "Collector configuration", changeType: "Configuration simplified", actionLevel: "Review",
              from: "SignalFx exporter configuration required for Related Content", to: "Related Content auto-populates for OpenTelemetry users without that exporter",
              implication: "Existing configurations can remain, but teams should understand which pipeline elements are still required for their broader telemetry design.",
              action: "Validate correlation, then simplify only after confirming no other pipeline depends on the exporter.",
              source: "https://help.splunk.com/en/splunk-observability-cloud/release-notes/april-2026"
            },
            {
              component: "RUM Monitoring MetricSet dimensions", domain: "RUM data model", changeType: "Defaults reduced", actionLevel: "Required",
              from: "Broader page-level dimension set", to: "Most page-level MMS dimensions deactivated by default; used dimensions retained for existing users",
              implication: "New and existing organizations can see a different metric-dimension footprint, affecting coverage, cardinality, charts, and detectors.",
              action: "Inventory required dimensions, compare cardinality and coverage, and explicitly enable only those justified by analysis needs.",
              source: "https://help.splunk.com/en/splunk-observability-cloud/release-notes/april-2026"
            }
          ],
          requirements: [
            ["Validate RUM dimension coverage", "Splunk deactivated most page-level RUM MMS dimensions by default for new users and retained only used dimensions for existing users. Confirm critical charts and detectors still have the dimensions they need.", "Validate", "https://help.splunk.com/en/splunk-observability-cloud/release-notes/april-2026", true]
          ]
        },
        "Jul 2026": {
          date: "July 2026",
          source: "https://help.splunk.com/en/splunk-observability-cloud/release-notes/july-2026",
          features: [
            ["AI troubleshooting agent", "Automation & AI", "Move from error to remediation plan", "Identify likely causes of APM business-transaction errors and review a suggested remediation plan."],
            ["Application overview and trace flowmap", "APM & troubleshooting", "Keep application context while drilling down", "See application health, related instances, service relationships, and the high-level path of a trace."],
            ["APM and database correlation", "APM & troubleshooting", "Connect slow code to database work", "Navigate from services and trace waterfalls to correlated database instances and normalized queries."],
            ["OpenTelemetry Fleet Management", "Telemetry & OpenTelemetry", "See collector drift at fleet scale", "Track health, status, version, and effective configuration for collectors and instrumentation agents."],
            ["Incident grouping", "Event operations", "Respond to one issue, not isolated alerts", "View related alerts as an incident and route them through notification rules where the controlled-availability feature is offered."]
          ],
          requirements: [
            ["Treat incidents as availability-bound", "The July release notes identify the incident experience as Controlled Availability and initially limited to the us1 realm. Confirm realm and entitlement before planning adoption.", "Validate", "https://help.splunk.com/en/splunk-observability-cloud/release-notes/july-2026", false],
            ["Enroll collectors before relying on fleet posture", "Fleet Management reports the health, version, and effective configuration of managed collectors and agents; establish enrollment and ownership before using it as an operational control.", "Plan", "https://help.splunk.com/en/splunk-observability-cloud/release-notes/july-2026", false]
          ]
        },
        "Sep 2026": {
          date: "September 2026",
          source: "https://help.splunk.com/en/splunk-observability-cloud/release-notes/september-2026",
          features: [
            ["Agent Observability", "Automation & AI", "Evaluate GenAI and agent behavior", "Use the integrated SaaS offering to observe, evaluate, and apply guardrails to eligible generative-AI and agentic applications."],
            ["AI token and cost monitoring", "Usage & governance", "Connect AI activity to spend", "Monitor and alert on token use and cost across supported AI agents and infrastructure providers."],
            ["Collector lookup processor", "Telemetry & OpenTelemetry", "Enrich telemetry in the pipeline", "Use the lookup processor added in Splunk OpenTelemetry Collector 0.160.1 where its documented component scope fits the pipeline."],
            ["Browser RUM 3.1", "Digital experience", "Capture richer interaction context", "Use expanded frustration signals, navigation context, Synthetics correlation, and more resilient Session Replay retry behavior after reviewing the new defaults."]
          ],
          technicalChanges: [
            {
              component: "Linux auto-instrumentation injector", domain: "Collector installation", changeType: "Configuration path changed", actionLevel: "Required",
              from: "Custom injector configuration under /etc/splunk/zeroconfig with runtime-specific files", to: "Official OpenTelemetry injector configuration under /etc/opentelemetry/injector with a shared default_env.conf",
              implication: "Existing custom values are not migrated automatically. Runtime variables outside the documented OTEL_* and SPLUNK_* set are ignored by the shared file, and instrumented services must be restarted after the preload or configuration change.",
              action: "Inventory the legacy java.conf, node.conf, and dotnet.conf values, migrate supported variables before upgrading, move runtime-specific settings to each service environment, and plan the documented restart or reboot.",
              source: collector160Source
            },
            {
              component: "Scripted inputs receiver", domain: "Collector pipeline", changeType: "Removed", actionLevel: "Required",
              from: "Deprecated scripted_inputs receiver remains available", to: "scripted_inputs is removed; splunk_inputs is the replacement behind the enableTArunner feature gate",
              implication: "A Collector configuration that still declares scripted_inputs cannot preserve that collection path after the 0.160 upgrade.",
              action: "Replace scripted_inputs with the documented splunk_inputs configuration, enable and validate the required feature gate, and test Linux or Windows scripts before rollout.",
              source: collector160Source
            },
            {
              component: "Kubernetes attributes processor", domain: "Collector configuration", changeType: "Option removed", actionLevel: "Required",
              from: "deployment_name_from_replicaset can remain in k8sattributes configuration", to: "The option is removed and its presence causes a hard Collector startup failure",
              implication: "Helm values or generated configurations that retain the key can prevent the Collector from starting. Old-format k8sattributes internal metrics are also disabled by default in this line.",
              action: "Remove deployment_name_from_replicaset, validate the documented ReplicaSet-derived behavior, and migrate dashboards or alerts that rely on the old processor self-telemetry format.",
              source: collector160Source
            },
            {
              component: "Linux log sourcetypes", domain: "Log data contract", changeType: "Defaults changed", actionLevel: "Review",
              from: "Hardcoded linux:varlog and linux:bash_history assignments in the packaged Linux configuration", to: "Filename-based Splunk TA-style assignments, including bash_history, syslog, linux_secure, linux_audit, and config_file",
              implication: "Saved searches, routing, field extraction, retention, and billing assumptions keyed to the earlier sourcetypes can change after the package upgrade.",
              action: "Compare representative Linux events before and after the upgrade and update downstream content only after confirming the new sourcetype contract.",
              source: collector160Source
            },
            {
              component: "Node.js instrumentation attributes", domain: "Semantic conventions", changeType: "Attribute names changed", actionLevel: "Required",
              from: "Pre-stable OpenTelemetry HTTP and database semantic-convention attribute names", to: "Stable semantic conventions in Splunk OpenTelemetry Node.js 4.11.0",
              implication: "Detectors, dashboards, MetricSets, routing, and API consumers that query renamed HTTP or database attributes can lose matches when the agent changes.",
              action: "Diff the documented HTTP and database attribute migrations, update queries and rules, and validate dual-version traffic during the agent rollout.",
              source: node411Source
            },
            {
              component: "Browser RUM 3.1 defaults", domain: "RUM behavior", changeType: "Defaults changed", actionLevel: "Review",
              from: "Rage clicks enabled by default, a five-second page-completion quiet window, and 2 MB localStorage retry persistence", to: "Four frustration signals enabled, a one-second quiet window, and up to 100 MB IndexedDB persistence for failed Session Replay uploads",
              implication: "Interaction volume, Page Completion Time baselines, client storage, privacy review, and replay retry behavior can differ without an application-code change.",
              action: "Review consent and storage policy, compare Page Completion Time baselines, and explicitly retain or disable earlier behaviors where the application requires them.",
              source: rum31Source
            }
          ],
          requirements: [
            ["Confirm access to Agent Observability", "Splunk directs customers to contact their Splunk team for access to the Agent Observability SaaS deployment. Treat it as availability-bound, not universally enabled.", "Validate", "https://help.splunk.com/en/splunk-observability-cloud/release-notes/september-2026", false],
            ["Treat chart 0.160.0 as a Collector 0.160 upgrade", "The Kubernetes chart released September 15, 2026 uses Collector 0.160.1 and updates bundled operator and instrumentation versions. Rehearse the Collector breaking changes instead of treating the Helm update as an isolated chart change.", "Blocker", collectorChart160Source, true],
            ["Migrate injector configuration before Collector 0.160", "The 0.160 line replaces the custom injector shim and does not automatically migrate existing values into the new configuration files.", "Blocker", collector160Source, true],
            ["Replace removed scripted_inputs pipelines", "Collector 0.160 removes scripted_inputs. Convert to the splunk_inputs receiver and validate the required enableTArunner feature gate before production.", "Blocker", collector160Source, true],
            ["Remove the retired Kubernetes processor option", "Any k8sattributes configuration that still includes deployment_name_from_replicaset fails hard at startup in Collector 0.160.", "Blocker", collector160Source, true],
            ["Validate the 0.160.1 patch release", "Collector 0.160.1 is the current 0.160 patch and is the version paired with Kubernetes chart 0.160.0. Validate its new lookup processor and experimental disk-queue extension only within their documented scope.", "Validate", collector160PatchSource, false],
            ["Reconcile Node.js semantic conventions", "The chart updates Node.js instrumentation to 4.11.0, which adopts stable OpenTelemetry HTTP and database semantic conventions with renamed attributes.", "Validate", node411Source, true],
            ["Baseline Browser RUM 3.1 defaults", "Browser RUM 3.1 changes frustration-signal collection, Page Completion Time quiet-window behavior, and failed-replay storage defaults. Confirm privacy, storage, and detector assumptions before broad rollout.", "Validate", rum31Source, true]
          ]
        }
      }
    }
  };
}(window.SPLUNK_DATA));
