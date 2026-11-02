/* Generated from content/advisor-goals.json. Coverage configuration is not new product evidence. */
window.VersionCompassAdvisorGoals = {
  "schemaVersion": 1,
  "reviewPolicy": {
    "sourceCheckDays": 14,
    "claimAssessmentDays": 30,
    "onDependencyChange": "Pause the affected decision until its exact claim and source scope are reassessed.",
    "qualification": "These are Advisor review windows, not vendor support periods. A stored match identifies assessed content; it does not prove the upstream page is unchanged."
  },
  "goals": [
    {
      "id": "agent-mode",
      "title": "Plan for SAIA Agent Mode",
      "question": "Which documented requirements should I resolve before pursuing Agent Mode?",
      "coverage": "Enterprise version minimum, assessed commercial AI service locations and documented feature limitations.",
      "exclusions": "Full app/Platform compatibility, tenant activation, entitlement and regulated authorization are not established.",
      "admission": "agent-mode",
      "record": "ai-saia-agent",
      "inputs": [
        "deployment",
        "compliance",
        "platformVersion",
        "region",
        "access"
      ],
      "owners": [
        "Version Release Watch",
        "CSP FedRAMP Watch",
        "Version Guidance Audit"
      ],
      "releaseGates": [
        "Enterprise below/met/unknown version",
        "Cloud does not inherit Enterprise minimum",
        "Unknown/unlisted/regulated location",
        "Missing access",
        "Changed or overdue evidence",
        "Private Release Guide handoff"
      ]
    },
    {
      "id": "itsi-versions",
      "title": "Check ITSI assistant dependencies",
      "question": "Do my reported ITSI, SAIA and MCP Server versions meet the documented integration minimums?",
      "coverage": "Three documented version minimums, missing dependencies and the next pairing/enablement questions.",
      "exclusions": "Meeting the minimums does not establish a supported complete pairing or subagent-specific regional rollout.",
      "admission": "itsi-versions",
      "record": "ai-itsi-subagent",
      "inputs": [
        "itsiVersion",
        "saiaVersion",
        "mcpVersion"
      ],
      "owners": [
        "Version Release Watch",
        "CSP FedRAMP Watch",
        "Version Guidance Audit"
      ],
      "releaseGates": [
        "Each minimum below/met/unknown",
        "No-change limited to these minimums",
        "No inherited subagent regional availability",
        "Changed or overdue evidence"
      ]
    },
    {
      "id": "soc-workflow",
      "title": "Untangle ES AI SOC requirements",
      "question": "Which Cloud or Cloud Connected requirements apply, and which claims still need clarification?",
      "coverage": "Assessed deployment-specific prerequisites, the current Cloud version discrepancy and the corrected historical Triage wording.",
      "exclusions": "Exact SOAR pairing, agent-specific regional rollout, component entitlement and customer authorization remain separate.",
      "admission": "soc-workflow",
      "record": "ai-es-soc",
      "inputs": [
        "deployment",
        "compliance",
        "edition",
        "platformVersion",
        "esVersion",
        "cloudConnectVersion",
        "access"
      ],
      "owners": [
        "ES Editions Watch",
        "CSP FedRAMP Watch",
        "Version Guidance Audit"
      ],
      "releaseGates": [
        "Cloud discrepancy remains unresolved",
        "CMP minima remain separate",
        "Historical Triage wording is not a current contradiction",
        "Unknown edition/deployment/access",
        "Changed or overdue evidence"
      ]
    }
  ],
  "notCovered": [
    {
      "id": "ingest-pressure",
      "title": "Ingest troubleshooting, sizing and licensing",
      "reason": "The assessed evidence does not support diagnosing a cause or prescribing a remedy from reported pressure alone."
    },
    {
      "id": "stay",
      "title": "A general keep-current or readiness verdict",
      "reason": "No broad no-change, health, compliance or compatibility conclusion is established by this build."
    }
  ],
  "expansionBacklog": [
    {
      "priority": 1,
      "opportunity": "Exact app/Platform pairing decisions",
      "gate": "Admit exact assessed pairing rows, patch qualifications and supported negative cases; keep minimums distinct from recommended targets.",
      "publicNote": "Exact pairing and patch qualifications are needed, rather than a minimum-version comparison alone."
    },
    {
      "priority": 2,
      "opportunity": "ITSI and ES agent-specific location decisions",
      "gate": "Require capability-specific assessed rollout evidence. A base assistant or hosting region is insufficient.",
      "publicNote": "Capability-specific rollout evidence is needed; base-assistant or hosting coverage is insufficient."
    },
    {
      "priority": 3,
      "opportunity": "Additional release and capability decisions",
      "gate": "Demonstrate a useful bounded outcome, missing-fact path, negative/conflict tests and an existing maintenance owner before adding a card.",
      "publicNote": "New decisions will be offered when their outcomes and limitations are supported by assessed documentation."
    },
    {
      "priority": 4,
      "opportunity": "Licensing, sizing and operational decisions",
      "gate": "Future potential only until sufficient assessed published documentation supports the exact recommendation and its limitations.",
      "publicNote": "Future potential only until enough assessed documentation supports the exact advice and its limits."
    }
  ]
};
