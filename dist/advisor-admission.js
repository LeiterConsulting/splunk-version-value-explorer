/* Generated from content/advisor-admission.json; pins require scoped evidence review. */
window.VersionCompassAdvisorAdmission = {
  "schemaVersion": 1,
  "policy": "Exact canonical claim/source payload pins, limited to the named goal. Changed payloads fail closed. UI work does not refresh claim verification dates. No domain-wide or document-wide admission.",
  "goals": {
    "agent-mode": [
      "ai-saia-agent",
      "region-context",
      "serviceRegions",
      "saiaRegions",
      "source-aiSaiaAbout",
      "source-aiSaiaInstall",
      "source-aiSaiaAgentMode",
      "source-aiSaiaModelRuntime",
      "source-aiSaiaCloudConnected",
      "agentModeRegions",
      "source-aiSaiaKnownIssues",
      "agentModeCloudConnected"
    ],
    "itsi-versions": [
      "ai-itsi-subagent",
      "source-aiSaiaAbout",
      "source-aiSaiaInstall"
    ],
    "itsi-assistant": [
      "ai-itsi-subagent",
      "region-context",
      "serviceRegions",
      "saiaRegions",
      "source-aiSaiaAbout",
      "source-aiSaiaInstall"
    ],
    "soc-workflow": [
      "ai-es-soc",
      "region-context",
      "serviceRegions",
      "esEssentials",
      "esPremier",
      "esCloudConnect",
      "source-aiEsAgents88",
      "source-aiEsTriageNote88",
      "source-aiEsSocTask88",
      "source-aiEsSocTask87",
      "source-aiEsEditions",
      "source-aiEsRegions88",
      "source-aiEsRelease88",
      "source-aiSaiaInstall"
    ]
  },
  "claims": [
    {
      "id": "source-aiEsTriageNote88",
      "ref": "source:aiEsTriageNote88",
      "sha256": "0424114cd970444c31e936397a6425cb8cdf2520e57ae0d477a87eb57ec7401a",
      "scope": "November 4 current renamed Triage and Response aggregate row and Premier scope only; historical entitlement and other prerequisite dates remain separate.",
      "sources": [
        "aiEsTriageNote88"
      ]
    },
    {
      "id": "source-aiSaiaAbout",
      "ref": "source:aiSaiaAbout",
      "sha256": "95032f863788d093e31635db1d332bb009a19ca2a035bac77077d646b0dad160",
      "scope": "Requirements; features; ITSI subagent; where the assistant runs",
      "sources": [
        "aiSaiaAbout"
      ]
    },
    {
      "id": "source-aiSaiaInstall",
      "ref": "source:aiSaiaInstall",
      "sha256": "cc34f75b436632b36a0b6e16518e47f84fadda64c9a0f313bac5adc577115d1a",
      "scope": "FedRAMP deployments; supported regions; version compatibility",
      "sources": [
        "aiSaiaInstall"
      ]
    },
    {
      "id": "source-aiEsAgents88",
      "ref": "source:aiEsAgents88",
      "sha256": "3752f31f316baba29f9d9a661d28688a0eeb03105b9a1500e6d3c29fba5a25fa",
      "scope": "Exact current 8.8 edition, deployment, version, paired-SOAR, feature-stage, enablement and model rows; separate Cloud Connect setup owns its added dependency chain",
      "sources": [
        "aiEsAgents88"
      ]
    },
    {
      "id": "source-aiEsSocTask88",
      "ref": "source:aiEsSocTask88",
      "sha256": "9a407077830de3af8df08e4dd68041eb06bc1fd471bc17b8aa700e2ae8bbee11",
      "scope": "Task-specific ES 8.8 combined Triage and Response Cloud/CMP workflow limits and permissions; exact SOAR version pairing, region and customer authorization remain separate",
      "sources": [
        "aiEsSocTask88"
      ]
    },
    {
      "id": "source-aiEsSocTask87",
      "ref": "source:aiEsSocTask87",
      "sha256": "148979e75beb380d2fa97c05b5dbcc4da53aa1ee97eebe87936e72832faaef2f",
      "scope": "Task-specific ES 8.7 Cloud workflow limits and permissions; does not establish the 8.8 CMP path, SOAR version pairing, region or customer authorization",
      "sources": [
        "aiEsSocTask87"
      ]
    },
    {
      "id": "source-aiEsEditions",
      "ref": "source:aiEsEditions",
      "sha256": "1d5fa40575a02c7a48194a814c6159ee021c26f0198dc41f0ea8036303ce0444",
      "scope": "Current edition groupings and deployment qualifications; compared with the 8.8 agent table where sources conflict",
      "sources": [
        "aiEsEditions"
      ]
    },
    {
      "id": "source-aiEsRegions88",
      "ref": "source:aiEsRegions88",
      "sha256": "fe4c45c594bc298127e0c4e762e917b404fdeb60350c17dbbecb88c174f6ff14",
      "scope": "ES 8.8 Essentials component regions independently mapped; Premier and Cloud Connect exceptions, GCP/Azure scope and Security AI Assistant compatibility retained",
      "sources": [
        "aiEsRegions88"
      ]
    },
    {
      "id": "source-aiEsRelease88",
      "ref": "source:aiEsRelease88",
      "sha256": "b4dbddda5737e6c74e8769140f5091c549ab6000a4b05f07c5e0ebd9ee8c6e5f",
      "scope": "ES 8.8 release date, release-stage label and edition table",
      "sources": [
        "aiEsRelease88"
      ]
    },
    {
      "id": "ai-saia-agent",
      "ref": "capability:ai-saia-agent",
      "sha256": "4c2a52bbae81f94c082b501edb38a4299da4a0b3cf4078f4a8e623bebe335515",
      "scope": "Agent Mode has its own AWS-only region list; base SAIA or Azure Model Runtime availability does not establish this feature. Cloud Connected’s broad no-third-party assurance differs from the feature-specific external-processing documentation. Preserve both scopes; do not infer customer authorization or a residency guarantee. Current Cloud Connected compatibility is blocked/conflicting; meeting the feature guide’s minima does not restore that path. This restriction is not transferred to native Cloud deployments.",
      "sources": [
        "aiSaiaInstall",
        "aiSaiaAbout",
        "aiSaiaAgentMode",
        "aiSaiaModelRuntime",
        "aiSaiaCloudConnected",
        "aiSaiaKnownIssues"
      ]
    },
    {
      "id": "ai-itsi-subagent",
      "ref": "capability:ai-itsi-subagent",
      "sha256": "77f118ee1d9a37bbdd95d9b93c7ad5a3c73241381bc2afedcaff8f4c2d37a6ec",
      "scope": "Base assistant regional coverage does not establish subagent-specific rollout.",
      "sources": [
        "aiSaiaAbout",
        "aiSaiaInstall"
      ]
    },
    {
      "id": "ai-es-soc",
      "ref": "capability:ai-es-soc",
      "sha256": "7bcd91a2aefa31ba0f2855232ef1d35fec47b144d32b128e20fab4d9a021ea3e",
      "scope": "November 4 scoped workflow reconciliation: current documentation names Triage and Response under Premier; the earlier Essentials statement remains historical. Cloud/CMP prerequisites, the unreleased planned SAIA 2.4 dependency, pairing and permissions remain independently qualified. November 13 adds only the exact ES 8.8 Response rerun and later-added-finding limits from the existing versioned task. Original source and claim dates for the other scope are retained.",
      "sources": [
        "aiEsAgents88",
        "aiEsSocTask88",
        "aiEsSocTask87",
        "aiEsRelease88",
        "aiEsTriageNote88",
        "aiEsCloudConnectAgentic88",
        "aiSaiaInstall",
        "aiSaiaCloudConnected"
      ]
    },
    {
      "id": "saiaRegions",
      "ref": "policy:saiaRegions",
      "sha256": "deff7a5abb87fae0e90619eee166207b2414bbcdafd9f6a5ead33c08c6b1e8ce",
      "scope": "Listed base SAIA service regions only; does not admit ITSI subagent rollout.",
      "sources": [
        "aiSaiaInstall"
      ]
    },
    {
      "id": "serviceRegions",
      "ref": "policy:serviceRegions",
      "sha256": "5447cb6c78596e7babc590076c79d3f0e0b068e475c3c57c78bef01962d051bd",
      "scope": "SAIA-specific service location labels, not general Platform regions.",
      "sources": [
        "aiSaiaInstall"
      ]
    },
    {
      "id": "esEssentials",
      "ref": "policy:esEssentials",
      "sha256": "1efa83d6e3fce1e3734f224dd0e8b22e05997f897218b44d9addd357e03ae07c",
      "scope": "Exact ES 8.8 Essentials component exceptions.",
      "sources": [
        "aiEsRegions88"
      ]
    },
    {
      "id": "esPremier",
      "ref": "policy:esPremier",
      "sha256": "5196ff9e7b910dd5b7a99d76f1a4400c7d0eef83611495a29cecf625edb961d3",
      "scope": "Exact ES 8.8 Premier component exceptions.",
      "sources": [
        "aiEsRegions88"
      ]
    },
    {
      "id": "esCloudConnect",
      "ref": "policy:esCloudConnect",
      "sha256": "714a6b344224b0e76f6d47f69128038d2ecd6726c35a9873ddc28a01bb692850",
      "scope": "Exact Cloud Connect component exceptions; does not establish agent rollout.",
      "sources": [
        "aiEsRegions88"
      ]
    },
    {
      "id": "region-context",
      "ref": "environment:regions",
      "sha256": "abcda3f495ae35fda7e68d583a4c8320e1e28aceb8ea37f310acf633ab1961b9",
      "scope": "Location/provider identifiers only. This is not feature or authorization evidence.",
      "sources": []
    },
    {
      "id": "source-aiSaiaAgentMode",
      "ref": "source:aiSaiaAgentMode",
      "sha256": "913df0e7b6e2e8231077a04fb7e3b7ac0f8d6d984738947d23ea8497ecb65fc4",
      "scope": "Feature-specific AWS locations and Platform 10.1.x+; Cloud Connected app 2.1+; runtime/admin enablement and bidirectional setup. No tenant, entitlement or authorization finding.",
      "sources": [
        "aiSaiaAgentMode"
      ]
    },
    {
      "id": "source-aiSaiaModelRuntime",
      "ref": "source:aiSaiaModelRuntime",
      "sha256": "5632b9de202983c3d1a9ef1582f5dd64e2aa63e57f6984a945bcf11995ba07b2",
      "scope": "Model Runtime requirement for Agent Mode; Data zone versus Global routing; external LLM processing. Runtime support in Azure is not Agent Mode support.",
      "sources": [
        "aiSaiaModelRuntime"
      ]
    },
    {
      "id": "source-aiSaiaCloudConnected",
      "ref": "source:aiSaiaCloudConnected",
      "sha256": "36f0ae7672fc13016eebac9bb37cb55a3280716759b04329090472d77b89533f",
      "scope": "Current 2.2.0–2.3.6 Cloud Connected exclusion, 2.1.1 fallback without Agent Mode and planned 2.4.0; broad data assurance remains separate from feature-specific Model Runtime external processing.",
      "sources": [
        "aiSaiaCloudConnected"
      ]
    },
    {
      "id": "agentModeRegions",
      "ref": "policy:agentModeRegions",
      "sha256": "07a1c1337ea323a1296a711582b322fd07a30be07818aafef60e742701355a5a",
      "scope": "Exact Agent Mode 2.3.6 feature-specific AWS list; no inheritance from base SAIA or Model Runtime.",
      "sources": [
        "aiSaiaAgentMode"
      ]
    },
    {
      "id": "source-aiSaiaKnownIssues",
      "ref": "source:aiSaiaKnownIssues",
      "scope": "The versioned known issue blocks current Cloud Connected access and names a 2.1.1 workaround; no Agent Mode availability or future 2.4 release inferred.",
      "sources": [
        "aiSaiaKnownIssues"
      ],
      "sha256": "a84d25f5c03f57a947e389e76b8edf74112e65831f509021c2b270b1ca860147"
    },
    {
      "id": "agentModeCloudConnected",
      "ref": "policy:agentModeCloudConnected",
      "scope": "Current Cloud Connected compatibility block/disagreement; planned support is not released availability.",
      "sources": [
        "aiSaiaAgentMode",
        "aiSaiaCloudConnected",
        "aiSaiaKnownIssues"
      ],
      "sha256": "4a894024dc757fbf820c1fd8ebf5c428e2587a3a62060c063c8d8927026304b8"
    }
  ]
};
