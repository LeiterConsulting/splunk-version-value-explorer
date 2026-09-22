/* Public-source ES edition evidence; preview only. See docs/es-editions.md. */
window.VersionCompassEditions = {
  "schemaVersion": 2,
  "reviewed": "2026-09-22",
  "release": "8.7",
  "releaseDate": "2026-09-02",
  "sources": {
    "rn87": {
      "t": "ES 8.7 release notes",
      "u": "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.7/splunk-enterprise-security-release-notes/release-notes-for-splunk-enterprise-security",
      "reviewed": "2026-09-22"
    },
    "matrix": {
      "t": "Editions Cloud Capability Matrix",
      "u": "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.7/splunk-enterprise-security-release-notes/splunk-enterprise-security-editions-cloud-capability-matrix",
      "reviewed": "2026-09-22"
    },
    "editions": {
      "t": "Overview of ES Editions",
      "u": "https://help.splunk.com/en/splunk-enterprise-security-8/enterprise-security-editions",
      "reviewed": "2026-09-22"
    },
    "conf26": {
      "t": ".conf26 Agentic SOC announcement",
      "u": "https://www.splunk.com/en_us/blog/security/evolving-to-autonomous-defense-new-agentic-soc-capabilities.html",
      "reviewed": "2026-09-22"
    },
    "agentic": {
      "t": "Agentic AI offerings in ES",
      "u": "https://help.splunk.com/en/splunk-enterprise-security-8/administer/8.7/ai-assistant-in-security-and-agentic-capabilities/agentic-ai-offerings-in-splunk-enterprise-security",
      "reviewed": "2026-09-22"
    },
    "cloudcx": {
      "t": "Access Splunk Cloud Connect in ES",
      "u": "https://help.splunk.com/en/splunk-enterprise-security-8/user-guide/8.7/introduction/access-splunk-cloud-connect-in-splunk-enterprise-security-to-access-cloud-extensions",
      "reviewed": "2026-09-22"
    },
    "aiassist": {
      "t": "AI Assistant overview (ES)",
      "u": "https://help.splunk.com/en/splunk-enterprise-security-8/administer/8.7/ai-assistant-in-security-and-agentic-capabilities/ai-assistant-overview",
      "reviewed": "2026-09-22"
    },
    "saia": {
      "t": "Splunk AI Assistant 2.2.0 release notes",
      "u": "https://help.splunk.com/en/splunk-enterprise/search/splunk-ai-assistant/2.2.0/release-notes/whats-new-in-splunk-ai-assistant",
      "reviewed": "2026-09-22"
    },
    "pricing": {
      "t": "Splunk for Security Pricing",
      "u": "https://www.splunk.com/en_us/products/pricing/cyber-security.html",
      "reviewed": "2026-09-22"
    },
    "ueba": {
      "t": "Splunk UEBA product page",
      "u": "https://www.splunk.com/en_us/products/user-and-entity-behavior-analytics.html",
      "reviewed": "2026-09-22"
    },
    "ea": {
      "t": "Exposure Analytics product page",
      "u": "https://www.splunk.com/en_us/products/exposure-analytics.html",
      "reviewed": "2026-09-22"
    },
    "licensing": {
      "t": "ES licensing and trials (8.6 documentation)",
      "u": "https://help.splunk.com/en/splunk-enterprise-security-8/user-guide/8.6/introduction/licensing-for-splunk-enterprise-security",
      "reviewed": "2026-09-22"
    },
    "regions": {
      "t": "ES 8.7 compatibility and regional availability",
      "u": "https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.7/splunk-enterprise-security-release-notes/compatibility-and-regional-availability",
      "reviewed": "2026-09-22"
    },
    "guided": {
      "t": "Guided Response prerequisites (8.6 documentation)",
      "u": "https://help.splunk.com/en/splunk-enterprise-security-8/administer/8.6/ai-assistant-in-security-and-agentic-capabilities/run-soar-response-actions-using-the-guided-response-agent-in-splunk-enterprise-security",
      "reviewed": "2026-09-22"
    },
    "triage": {
      "t": "Triage agent setup (8.6 documentation)",
      "u": "https://help.splunk.com/en/splunk-enterprise-security-8/administer/8.6/ai-assistant-in-security-and-agentic-capabilities/setting-up-the-triage-agent-in-splunk-enterprise-security",
      "reviewed": "2026-09-22"
    }
  },
  "capabilities": [
    {
      "id": "siem",
      "name": "Splunk Enterprise Security 8 (SIEM)",
      "lane": "Core platform",
      "ess": {
        "v": "yes",
        "n": "Cloud and On-premises"
      },
      "prem": {
        "v": "yes",
        "n": "Cloud and On-premises"
      },
      "desc": "Detection, triage, investigation, response and case management in the ES application.",
      "src": [
        "editions",
        "pricing"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "ai",
      "name": "Artificial intelligence (platform-wide)",
      "lane": "AI",
      "ess": {
        "v": "yes",
        "n": "Feature-specific scope"
      },
      "prem": {
        "v": "yes",
        "n": "Feature-specific scope"
      },
      "desc": "AI capabilities appear in both editions, but individual agents have separate edition, version and deployment requirements.",
      "src": [
        "editions",
        "agentic"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "tim",
      "name": "Threat Intelligence Management (TIM)",
      "lane": "Threat intelligence",
      "ess": {
        "v": "yes",
        "n": "Cloud; on-prem via Cloud Connect"
      },
      "prem": {
        "v": "yes",
        "n": "Cloud; on-prem via Cloud Connect"
      },
      "desc": "Threat intelligence enrichment, including Cisco Talos. Detection Studio and TIM reach on-premises environments through Cloud Connect. Review the 8.7 release notes for deprecated feeds.",
      "src": [
        "editions",
        "cloudcx",
        "rn87"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "detection-studio",
      "name": "Detection Studio",
      "lane": "Detection engineering",
      "ess": {
        "v": "yes",
        "n": "Cloud; on-prem via Cloud Connect"
      },
      "prem": {
        "v": "yes",
        "n": "Cloud; on-prem via Cloud Connect"
      },
      "desc": "Detection authoring and lifecycle management. The Cloud capability matrix records general availability in ES 8.4; on-premises access uses Cloud Connect.",
      "src": [
        "editions",
        "matrix",
        "pricing",
        "cloudcx"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "exposure",
      "name": "Exposure Analytics",
      "lane": "Exposure management",
      "tag": "conf",
      "ess": {
        "v": "yes",
        "n": "Cloud and On-premises"
      },
      "prem": {
        "v": "yes",
        "n": "Cloud and On-premises"
      },
      "desc": "Entity and business context for exposure prioritization. Included in ES licensing at no additional cost; the September announcement describes entity discovery, change history and business context.",
      "src": [
        "editions",
        "ea",
        "conf26"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "ai-assistant",
      "name": "Splunk AI Assistant for Security",
      "lane": "AI",
      "ess": {
        "v": "part",
        "n": "Cloud only, where available"
      },
      "prem": {
        "v": "yes",
        "n": "Cloud; on-prem via Cloud Connect"
      },
      "flag": "The editions overview limits Essentials to Cloud, where available, and lists Premier access through Cloud Connect. The general administration page describes Cloud Connect without specifying an edition; it does not establish an Essentials on-premises entitlement.",
      "desc": "The assistant embedded in ES, distinct from the separately versioned Splunk AI Assistant platform app.",
      "src": [
        "editions",
        "rn87",
        "aiassist",
        "cloudcx"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "mcp",
      "name": "Enterprise Security on MCP",
      "lane": "AI / extensibility",
      "tag": "new",
      "ess": {
        "v": "yes",
        "n": "New in 8.7"
      },
      "prem": {
        "v": "yes",
        "n": "Inherited from Essentials"
      },
      "desc": "ES 8.7 adds investigation-context tools through the Splunk MCP Server app. These are Splunk product tools, separate from Version Compass browser-based WebMCP.",
      "src": [
        "rn87",
        "matrix"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "nav",
      "name": "Updated navigation experience",
      "lane": "Analyst experience",
      "tag": "new",
      "ess": {
        "v": "yes",
        "n": "New in 8.7"
      },
      "prem": {
        "v": "yes",
        "n": "Inherited from Essentials"
      },
      "desc": "ES 8.7 changes menus and analyst queues, with navigation customization and preview.",
      "src": [
        "rn87"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "change-history",
      "name": "View Change History",
      "lane": "Analyst experience",
      "tag": "new",
      "ess": {
        "v": "yes",
        "n": "New in 8.7"
      },
      "prem": {
        "v": "yes",
        "n": "Inherited from Essentials"
      },
      "desc": "ES 8.7 exposes fuller analyst-change context through Activity Log searches.",
      "src": [
        "rn87"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "detection-builder",
      "name": "Detection Builder Agent",
      "lane": "Agentic SOC Workforce",
      "ess": {
        "v": "yes",
        "n": "Cloud only"
      },
      "prem": {
        "v": "yes",
        "n": "Cloud only"
      },
      "desc": "Assists detection authoring and troubleshooting. Cloud only; Splunk platform 10.1.x+ and ES 8.6+. ES 8.7 improves SPL guidance and validation.",
      "src": [
        "agentic",
        "rn87"
      ],
      "reviewed": "2026-09-22",
      "tag": "updated"
    },
    {
      "id": "sop-agent",
      "name": "SOP Agent",
      "lane": "Agentic SOC Workforce",
      "ess": {
        "v": "yes",
        "n": "Cloud only"
      },
      "prem": {
        "v": "yes",
        "n": "Cloud only"
      },
      "desc": "Converts an existing SOP to a response plan. Cloud only; requires the ES AI Assistant and permission to view and edit response templates.",
      "src": [
        "agentic"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "soar",
      "name": "Splunk SOAR",
      "lane": "Automation and response",
      "ess": {
        "v": "no",
        "n": "Not in the edition; sold standalone"
      },
      "prem": {
        "v": "yes",
        "n": "Included, natively integrated"
      },
      "flag": "Pairing has separate version and deployment constraints. Splunk Enterprise 9.4.0–9.4.2 does not support ES–SOAR pairing. Check the exact pairing matrix before planning integration.",
      "desc": "Premier includes SOAR; standalone SOAR is also offered with user-seat pricing. Edition entitlement does not prove that a compatible instance is paired.",
      "src": [
        "editions",
        "pricing",
        "regions"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "ueba",
      "name": "User and Entity Behavior Analytics (UEBA)",
      "lane": "Behavior analytics",
      "ess": {
        "v": "no",
        "n": "No add-on path exists"
      },
      "prem": {
        "v": "yes",
        "n": "Cloud and On-premises"
      },
      "flag": "Legacy Splunk UBA is a separate product: its product FAQ records end of sale in December 2025 and end of support in January 2027.",
      "desc": "Behavioral analytics embedded in Premier. Splunk does not offer this UEBA feature standalone or as an Essentials add-on. Cloud and on-premises detections and data coverage differ.",
      "src": [
        "ueba",
        "editions"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "ata",
      "name": "Automated Threat Analysis (Splunk Attack Analyzer)",
      "lane": "Automation and response",
      "ess": {
        "v": "no"
      },
      "prem": {
        "v": "yes",
        "n": "Cloud only, where available"
      },
      "desc": "Automated analysis of suspicious content, powered by Splunk Attack Analyzer. Premier lists it as Cloud only, where available. This does not establish the standalone Attack Analyzer licensing options.",
      "src": [
        "editions",
        "matrix",
        "regions"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "triage-agent",
      "name": "Triage Agent",
      "lane": "Agentic SOC Workforce",
      "ess": {
        "v": "no"
      },
      "prem": {
        "v": "yes",
        "n": "8.7 Cloud matrix; verify setup scope"
      },
      "flag": "Do not infer missing deployment or version prerequisites from that omission. The linked setup page belongs to the 8.6 documentation set; confirm applicability to the target release.",
      "desc": "Investigates queued findings and presents a disposition, rationale and suggested next steps. The 8.6 setup guide describes response plans, actions and SPL searches as investigation guidance; the 8.7 Cloud matrix lists enhancements under Premier.",
      "src": [
        "matrix",
        "triage",
        "agentic"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "guided-response",
      "name": "Guided Response Agent",
      "lane": "Agentic SOC Workforce",
      "ess": {
        "v": "review",
        "n": "Confirm edition scope"
      },
      "prem": {
        "v": "part",
        "n": "Cloud; paired SOAR"
      },
      "flag": "Source discrepancy: the 8.7 Cloud matrix places Guided Response enhancements under Premier, but the 8.6 task guide allows both editions. Do not equate an enhancement label with base-feature entitlement; confirm the 8.7 scope.",
      "desc": "Helps run SOAR response actions. The 8.6 task guide documents Cloud, both editions, platform 10.2+, ES 8.6+ and paired SOAR.",
      "src": [
        "matrix",
        "guided"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "malware-reversing",
      "name": "Malware Reversing and Phishing Agent",
      "lane": "Agentic SOC Workforce",
      "ess": {
        "v": "no"
      },
      "prem": {
        "v": "yes",
        "n": "Cloud only"
      },
      "desc": "Summarizes suspicious scripts. Premier, Cloud only; ES 8.5+ and paired SOAR.",
      "src": [
        "agentic"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "automation-builder",
      "name": "Automation Builder Agent",
      "lane": "Agentic SOC Workforce",
      "tag": "updated",
      "ess": {
        "v": "yes",
        "n": "Cloud only; needs paired SOAR"
      },
      "prem": {
        "v": "yes",
        "n": "Cloud; paired SOAR required"
      },
      "flag": "Premier includes SOAR, but still requires a supported, configured pairing. Buying a standalone SOAR license alone does not establish that this prerequisite is met.",
      "desc": "Builds and explains playbooks. Both editions, Cloud only; ES 8.6+ and paired SOAR. ES 8.7 improves context handling.",
      "src": [
        "agentic",
        "rn87",
        "regions"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "connector-builder",
      "name": "Connector Builder Agent",
      "lane": "Agentic SOC Workforce",
      "tag": "new",
      "ess": {
        "v": "review",
        "n": "Sources disagree"
      },
      "prem": {
        "v": "part",
        "n": "Cloud; paired SOAR; confirm enablement"
      },
      "flag": "Source conflict: the agent compatibility table lists Essentials and Premier; the 8.7 release notes list Premier and representative enablement. Confirm Essentials entitlement with Splunk; the preview does not resolve this conflict.",
      "desc": "Generates and refines connectors. The compatibility table requires Cloud, ES 8.7+ and paired SOAR.",
      "src": [
        "agentic",
        "rn87",
        "matrix"
      ],
      "reviewed": "2026-09-22"
    },
    {
      "id": "ai-soc-analyst",
      "name": "AI SOC Analyst Agent",
      "lane": "Agentic SOC Workforce",
      "tag": "new",
      "ess": {
        "v": "no"
      },
      "prem": {
        "v": "yes",
        "n": "Cloud only; rep-enabled"
      },
      "desc": "Assists investigation and response. Premier, Cloud only; platform 10.2+, ES 8.6+, paired SOAR and representative enablement. Listed as new in the 8.7 notes.",
      "src": [
        "agentic",
        "rn87"
      ],
      "reviewed": "2026-09-22"
    }
  ],
  "history": {
    "8.2": {
      "e": [
        "Enterprise Security",
        "Threat Intelligence Management (TIM)",
        "Splunk AI Assistant for Security",
        "Detection authoring and governance",
        "Findings and investigation workflow",
        "Threat intelligence and platform extensibility"
      ],
      "p": [
        "SOAR",
        "User and Entity Behavior Analytics integration (UEBA)"
      ]
    },
    "8.3": {
      "e": [
        "Splunk AI Assistant for Security additional capabilities",
        "New Entity Risk Scoring (ERS) in Enterprise Security",
        "Investigations enhancements"
      ],
      "p": [
        "UEBA enhancements"
      ]
    },
    "8.4": {
      "e": [
        "Detection Studio (GA)",
        "Cisco Talos integration",
        "Investigations enhancements",
        "Threat Intelligence Management (TIM) enhancements"
      ],
      "p": [
        "UEBA finding exclusion rules (entity list support)"
      ]
    },
    "8.5": {
      "e": [
        "Exposure Analytics",
        "Investigations enhancements",
        "Detection Studio enhancements"
      ],
      "p": [
        "Splunk Attack Analyzer integration: threat analysis for phishing investigations",
        "UEBA enhancements"
      ]
    },
    "8.6": {
      "e": [
        "Exposure Analytics enhancements"
      ],
      "p": [
        "AI-Powered Detection and Response Agents",
        "ES–SOAR integration enhancements",
        "Phishing Investigation and Response enhancements",
        "UEBA enhancements"
      ]
    },
    "8.7": {
      "e": [
        "Security MCP workflow tools"
      ],
      "p": [
        "Triage and Guided Response enhancements",
        "Security automation authoring, including Connector Builder and Automation Builder enhancements",
        "UEBA data-source and Entity Analysis performance improvements"
      ]
    }
  },
  "notes": [
    {
      "id": "cloud-connect",
      "title": "Cloud Connect and on-premises scope",
      "text": "Detection Studio and TIM use Cloud Connect for on-premises access. The editions overview lists the ES AI Assistant through Cloud Connect under Premier. Cloud Connect supports private cloud and on-premises deployments; it does not turn Cloud-only agents into on-premises features.",
      "src": [
        "editions",
        "cloudcx",
        "agentic"
      ],
      "details": "The guide requires access to *api.scs.splunk.com:443 and *auth.scs.splunk.com:443, or proxy configuration. Proxy settings affect the whole platform. Full access requires cloud_connection_product_get, license_read and license_edit; the first two allow read-only connection status."
    },
    {
      "id": "availability",
      "title": "Edition inclusion is only one requirement",
      "text": "Regional availability and ES–SOAR pairing must be checked separately. A Cloud listing does not establish availability on every stack, cloud provider or regulated deployment.",
      "src": [
        "regions"
      ],
      "details": "Splunk publishes distinct SOAR pairing matrices for Premier and other paired deployments. Pairing is unsupported on Enterprise 9.4.0–9.4.2. Review the source for exact SOAR versions, hybrid certificate requirements and government-cloud exclusions."
    },
    {
      "id": "assistants",
      "title": "Keep the two AI assistants distinct",
      "text": "The ES AI Assistant is governed by ES edition scope. Splunk AI Assistant is a separately versioned platform app; its 2.1.0 notes support Agent Mode for Cloud Connected Enterprise customers in eligible AWS regions.",
      "src": [
        "aiassist",
        "saia"
      ],
      "details": "The original comparison applied an old 1.1.0 on-premises restriction to the whole platform-app release history. That restriction is not a current blanket rule."
    },
    {
      "id": "licensing",
      "title": "Licensing and trial terms",
      "text": "ES is used with Splunk Enterprise or Cloud Platform and does not add ingestion capacity. The 8.6 licensing guide documents 30-day Essentials and 90-day Premier trials.",
      "src": [
        "licensing"
      ],
      "details": "Existing Essentials customers trialing Premier revert to their purchased Essentials entitlement with retained access to Essentials features and processed data. Other trial expiry restrictions can block Mission Control, Detection Editor and Content Management; Premier trials also restrict UEBA. Confirm the applicable trial and contract terms."
    },
    {
      "id": "pricing",
      "title": "Public pricing models",
      "text": "Splunk publishes workload and ingest options for ES and per-user-seat pricing for standalone SOAR. Public pages are a model overview, not a quote or a guarantee of a particular configuration.",
      "src": [
        "pricing"
      ],
      "details": "Do not infer prices, seat counts or contractual eligibility. Evaluate standalone SOAR against the supported pairing guide; it does not automatically establish agent entitlement."
    },
    {
      "id": "announcement",
      "title": "Announcements and shipped releases",
      "text": "The September Agentic SOC announcement describes expanded workflows and Exposure Analytics. Release-specific availability still comes from the product documentation.",
      "src": [
        "conf26",
        "rn87"
      ],
      "details": "Keep marketing announcements, release features, regional delivery and customer enablement separate. Workflow groupings are explanatory, not an entitlement matrix."
    }
  ],
  "conflicts": [
    {
      "id": "connector-builder",
      "kind": "Direct edition conflict",
      "title": "Can Essentials use Connector Builder?",
      "claims": [
        {
          "src": [
            "agentic"
          ],
          "text": "The 8.7 agent compatibility table lists both Essentials and Premier, Cloud only, with ES 8.7+ and paired SOAR."
        },
        {
          "src": [
            "rn87"
          ],
          "text": "The 8.7 release notes assign Connector Builder to Premier and require enablement through a Splunk representative."
        }
      ],
      "meaning": "These pages assign different editions to the same agent in the same release. Essentials availability remains unconfirmed; Premier still has pairing and enablement conditions.",
      "question": "Ask Splunk to confirm Essentials entitlement and the enablement path for the target deployment."
    },
    {
      "id": "guided-response",
      "kind": "Version and enhancement scope",
      "title": "Does the 8.7 label change Guided Response entitlement?",
      "claims": [
        {
          "src": [
            "guided"
          ],
          "text": "The 8.6 task guide allows Essentials and Premier on Cloud, with platform 10.2+, ES 8.6+ and paired SOAR."
        },
        {
          "src": [
            "matrix"
          ],
          "text": "The 8.7 Cloud matrix places Triage and Guided Response enhancements in the Premier column."
        }
      ],
      "meaning": "An enhancement grouping does not establish that the underlying feature became Premier-only. The sources cover different versions and scopes; 8.7 Essentials applicability remains unresolved.",
      "question": "Ask which 8.7 Guided Response capabilities are available in Essentials, and which enhancements require Premier."
    }
  ],
  "workflows": [
    {
      "title": "Build and maintain detections",
      "text": "Detection Studio manages detection content; Detection Builder assists authoring and troubleshooting. Automation Builder works with playbooks, while Connector Builder generates and refines integrations. The latter has an unresolved edition conflict.",
      "ids": [
        "detection-studio",
        "detection-builder",
        "automation-builder",
        "connector-builder"
      ],
      "src": [
        "editions",
        "agentic",
        "rn87"
      ]
    },
    {
      "title": "Investigate and respond",
      "text": "Triage helps assess incoming findings; Guided Response helps run SOAR actions. AI SOC Analyst uses investigation and response-plan context. Check each agent’s edition and pairing requirements before treating this as an available end-to-end workflow.",
      "ids": [
        "triage-agent",
        "guided-response",
        "ai-soc-analyst"
      ],
      "src": [
        "triage",
        "guided",
        "agentic",
        "rn87"
      ]
    },
    {
      "title": "Understand suspicious activity",
      "text": "Premier adds native UEBA for behavioral analysis and Automated Threat Analysis powered by Attack Analyzer. Its Malware Reversing and Phishing Agent summarizes suspicious scripts; that agent is Cloud only and requires paired SOAR.",
      "ids": [
        "ueba",
        "ata",
        "malware-reversing"
      ],
      "src": [
        "editions",
        "ueba",
        "agentic"
      ]
    },
    {
      "title": "Bring context and procedures together",
      "text": "TIM supplies threat intelligence, Exposure Analytics adds entity and business context, and the SOP Agent converts an existing procedure into a response plan. The SOP Agent needs the ES assistant and response-template permissions.",
      "ids": [
        "tim",
        "exposure",
        "sop-agent"
      ],
      "src": [
        "editions",
        "ea",
        "agentic"
      ]
    }
  ],
  "highlights": [
    {
      "title": "Agent authoring and response",
      "text": "8.7 introduces AI SOC Analyst and Connector Builder, with representative enablement. Automation Builder improves context handling; Detection Builder improves SPL guidance. Connector Builder’s edition scope remains disputed.",
      "src": [
        "rn87",
        "agentic"
      ]
    },
    {
      "title": "Investigation context and navigation",
      "text": "Security MCP tools expose investigation context. Navigation gains customization and preview; View Change History opens fuller analyst-change context through Activity Log searches.",
      "src": [
        "rn87"
      ]
    },
    {
      "title": "Cloud matrix additions",
      "text": "The 8.7 matrix records Triage and Guided Response enhancements, automation-authoring changes and UEBA data-source and Entity Analysis performance improvements in Premier. Agent-level scope still needs the qualifications below.",
      "src": [
        "matrix"
      ]
    }
  ]
};
