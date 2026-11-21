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
      "agentModeCloudConnected",
      "source-aiSaiaRelease240",
      "source-aiSaiaCloudConnected240",
      "source-aiSaiaAgentMode240",
      "source-aiSaiaKnownIssues240",
      "source-aiSaiaModelRuntime240",
      "source-aiSaiaInstall240"
    ],
    "itsi-versions": [
      "ai-itsi-subagent",
      "source-aiSaiaAbout",
      "source-aiSaiaInstall",
      "source-aiSaiaAbout240"
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
      "source-aiSaiaInstall",
      "source-aiEsTriageTask88",
      "source-aiEsAutonomousResponse88",
      "source-aiEsCloudConnectAgentic88",
      "source-aiSaiaCloudConnected",
      "source-aiSaiaCloudConnected240"
    ]
  },
  "claims": [
    {
      "id": "source-aiEsTriageNote88",
      "ref": "source:aiEsTriageNote88",
      "sha256": "74c1d0d17e72a7192991dae449bf5cd8168a16e37da4979787f6b43b716b667a",
      "scope": "November 20 current Triage and Autonomous Response component rows and Premier scope only; historical entitlement and other prerequisite dates remain separate.",
      "sources": [
        "aiEsTriageNote88"
      ]
    },
    {
      "id": "source-aiSaiaAbout",
      "ref": "source:aiSaiaAbout",
      "sha256": "4d49a8b5afa611c97d30f482634521fe706800e9b0a26bb5023a77823d0fd92a",
      "scope": "Requirements; features; ITSI subagent; where the assistant runs",
      "sources": [
        "aiSaiaAbout"
      ]
    },
    {
      "id": "source-aiSaiaInstall",
      "ref": "source:aiSaiaInstall",
      "sha256": "a19bb272f9cf1329f2ec2ad339d973c865301f992939d67eb7a01c2c3568bdbb",
      "scope": "FedRAMP deployments; supported regions; version compatibility",
      "sources": [
        "aiSaiaInstall"
      ]
    },
    {
      "id": "source-aiEsAgents88",
      "ref": "source:aiEsAgents88",
      "sha256": "eda72d1578d521c1a58edf38d77ae438681e3ab52ee8e60d5a916c7633f52782",
      "scope": "Exact current 8.8 edition, deployment, version, paired-SOAR and feature-stage rows, including separate Triage and Controlled Availability Autonomous Response components; setup, region, entitlement and authorization remain separate.",
      "sources": [
        "aiEsAgents88"
      ]
    },
    {
      "id": "source-aiEsSocTask88",
      "ref": "source:aiEsSocTask88",
      "sha256": "a1d9031845936f266306564bfd568ab6254b9423e211756a37445fb9d5265a03",
      "scope": "November 21 exact ES 8.8 Triage parent-versus-detailed-task quota/revision conflict and separate Response limits; no tenant behavior, model residency, entitlement, pairing or authorization certification.",
      "sources": [
        "aiEsSocTask88"
      ]
    },
    {
      "id": "source-aiEsSocTask87",
      "ref": "source:aiEsSocTask87",
      "sha256": "0545fd7a8f386c9d6804a886faaa5697ab86e64728e54db2b448b3332b0ef89e",
      "scope": "Task-specific ES 8.7 Cloud workflow limits and permissions; does not establish the 8.8 CMP path, SOAR version pairing, region or customer authorization",
      "sources": [
        "aiEsSocTask87"
      ]
    },
    {
      "id": "source-aiEsEditions",
      "ref": "source:aiEsEditions",
      "sha256": "adb7301287c5a60703ff79955b97e12cedc82599806e151ec0b16a4035cfdf86",
      "scope": "Current edition groupings and deployment qualifications; compared with the 8.8 agent table where sources conflict",
      "sources": [
        "aiEsEditions"
      ]
    },
    {
      "id": "source-aiEsRegions88",
      "ref": "source:aiEsRegions88",
      "sha256": "fbcb14f9ae064003c00a21bd58924e31b0fd585153351c9618f0673b543c2eed",
      "scope": "November 21 scoped current ES 8.8 regional/compatibility assessment: Milan and Sao Paulo correction, preserved edition/deployment/provider/GovCloud exceptions. No new per-agent rollout, entitlement, authorization or SOC task resolution.",
      "sources": [
        "aiEsRegions88"
      ]
    },
    {
      "id": "source-aiEsRelease88",
      "ref": "source:aiEsRelease88",
      "sha256": "898bb0febf2de42d4b94f4f25891e59e8ed85963146012d58c9aa45d5059b06e",
      "scope": "ES 8.8 release date, release-stage label and edition table",
      "sources": [
        "aiEsRelease88"
      ]
    },
    {
      "id": "ai-saia-agent",
      "ref": "capability:ai-saia-agent",
      "sha256": "7f97e5015c793e1164f9ec891bf76a9349c0278df076d58da25a774ca0418cf7",
      "scope": "The two installation paths have different requirements. The 2.3.6 Cloud Connected restriction is version-specific. For 2.4.0 distinguish documented installation from tenant enablement. Agent Mode has its own AWS-only regions. The installer’s no-third-party assurance and Model Runtime’s external-processing guidance require separate consideration.",
      "sources": [
        "aiSaiaInstall",
        "aiSaiaAbout",
        "aiSaiaAgentMode",
        "aiSaiaModelRuntime",
        "aiSaiaCloudConnected",
        "aiSaiaKnownIssues",
        "aiSaiaRelease240",
        "aiSaiaCloudConnected240",
        "aiSaiaAgentMode240",
        "aiSaiaKnownIssues240",
        "aiSaiaModelRuntime240",
        "aiSaiaInstall240"
      ]
    },
    {
      "id": "ai-itsi-subagent",
      "ref": "capability:ai-itsi-subagent",
      "sha256": "cec9a22119d3897a3658a70b1f1f6e1599a6d5c7943039f42789585067294ad6",
      "scope": "Base assistant regional coverage does not establish subagent-specific rollout.",
      "sources": [
        "aiSaiaAbout",
        "aiSaiaInstall",
        "aiSaiaAbout240"
      ]
    },
    {
      "id": "ai-es-soc",
      "ref": "capability:ai-es-soc",
      "sha256": "990a468780b624b932ce6c89db70e0b3d84f0a35cf676c532c1bf3e3d671622e",
      "scope": "November 21 exact ES 8.8 Triage parent-versus-detailed-task quota/revision conflict and separate Response limits; no tenant behavior, model residency, entitlement, pairing or authorization certification.",
      "sources": [
        "aiEsAgents88",
        "aiEsSocTask88",
        "aiEsAutonomousResponse88",
        "aiEsSocTask87",
        "aiEsRelease88",
        "aiEsTriageNote88",
        "aiEsCloudConnectAgentic88",
        "aiSaiaInstall",
        "aiSaiaCloudConnected",
        "aiSaiaCloudConnected240",
        "aiEsTriageTask88"
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
      "sha256": "db770e438ce7820f466a8a2a1690d07d367a47409e64f05383f78eed2aca138f",
      "scope": "November 21 scoped current ES 8.8 regional/compatibility assessment: Milan and Sao Paulo correction, preserved edition/deployment/provider/GovCloud exceptions. No new per-agent rollout, entitlement, authorization or SOC task resolution.",
      "sources": [
        "aiEsRegions88"
      ]
    },
    {
      "id": "esPremier",
      "ref": "policy:esPremier",
      "sha256": "586bbaf664ee3b066a25e370cb7b8e96aca041b373cd2aa7b74670e2405dd7dd",
      "scope": "November 21 scoped current ES 8.8 regional/compatibility assessment: Milan and Sao Paulo correction, preserved edition/deployment/provider/GovCloud exceptions. No new per-agent rollout, entitlement, authorization or SOC task resolution.",
      "sources": [
        "aiEsRegions88"
      ]
    },
    {
      "id": "esCloudConnect",
      "ref": "policy:esCloudConnect",
      "sha256": "437a5779ee7e3e342e0d29210a5a5c8416b490bb97b5f7917d43d77e242207da",
      "scope": "November 21 scoped current ES 8.8 regional/compatibility assessment: Milan and Sao Paulo correction, preserved edition/deployment/provider/GovCloud exceptions. No new per-agent rollout, entitlement, authorization or SOC task resolution.",
      "sources": [
        "aiEsRegions88"
      ]
    },
    {
      "id": "region-context",
      "ref": "environment:regions",
      "sha256": "4e80f8f02f1e2144d7dc86e8a1ac87dd910ade62ddf8bc987691feac3da079f7",
      "scope": "Location/provider identifiers only. This is not feature or authorization evidence.",
      "sources": []
    },
    {
      "id": "source-aiSaiaAgentMode",
      "ref": "source:aiSaiaAgentMode",
      "sha256": "b207ee4df1211c026e6c8bf91e4368c606b0f0561e832513f1cbefdc7b175e62",
      "scope": "Feature-specific AWS locations and Platform 10.1.x+; Cloud Connected app 2.1+; runtime/admin enablement and bidirectional setup. No tenant, entitlement or authorization finding.",
      "sources": [
        "aiSaiaAgentMode"
      ]
    },
    {
      "id": "source-aiSaiaModelRuntime",
      "ref": "source:aiSaiaModelRuntime",
      "sha256": "6f63603bc9ae6d0dd18ee5851d45d1a574a63321bc842ddeb0380d0232422b35",
      "scope": "Model Runtime requirement for Agent Mode; Data zone versus Global routing; external LLM processing. Runtime support in Azure is not Agent Mode support.",
      "sources": [
        "aiSaiaModelRuntime"
      ]
    },
    {
      "id": "source-aiSaiaCloudConnected",
      "ref": "source:aiSaiaCloudConnected",
      "sha256": "28e18614dd3363cbcabde438a49fcaefff7f576d9d37592fa83374c642be0e58",
      "scope": "The 2.3.6 installer excludes 2.2.0–2.3.6, lists a 2.1.1 fallback without Agent Mode and describes a then-planned 2.4.0 release. See the separate 2.4.0 installer for the newer setup and the feature-specific Model Runtime guidance for processing scope.",
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
      "scope": "Historical SAIA-9918 exclusion for 2.2.0–2.3.6 and the 2.1.1 workaround without Agent Mode. Its older prediction is retained for comparison with the 2.4.0 release notes.",
      "sources": [
        "aiSaiaKnownIssues"
      ],
      "sha256": "0038152ada3d3830b7b6cbc6b28c6f92faeab615f9176091d59ed03a06aca09b"
    },
    {
      "id": "agentModeCloudConnected",
      "ref": "policy:agentModeCloudConnected",
      "scope": "SAIA 2.3.6 historical scope. SAIA-9918 excludes 2.2.0–2.3.6 and the 2.1.1 fallback lacks Agent Mode. The separate 2.4.0 installer and release notes document the new Cloud Connect route.",
      "sources": [
        "aiSaiaAgentMode",
        "aiSaiaCloudConnected",
        "aiSaiaKnownIssues"
      ],
      "sha256": "7d48770ffeb0e729fb0512756575425318bb137aba5cf59445f3558926d90f19"
    },
    {
      "id": "source-aiEsTriageTask88",
      "ref": "source:aiEsTriageTask88",
      "sha256": "d52a7654686ea8f7224a88e70d42ca050e00926d4133a8df848ac169b2c19fbf",
      "scope": "Detailed task: Cloud ES 8.7+ and CMP chain, existing findings, first-ten and approximate 200-finding limits, no-rerun statement and investigation permissions. Conflicts with the parent guide credit/revision model; not proof of actual tenant behavior.",
      "sources": [
        "aiEsTriageTask88"
      ]
    },
    {
      "id": "source-aiSaiaRelease240",
      "ref": "source:aiSaiaRelease240",
      "sha256": "eda7b4883a66a97171463da953f4940a73ee5b9d2fc1d5234ba897ee78dff455",
      "scope": "2.4.0 ships an Enterprise installation path through Cloud Connect. Supported FedRAMP High core SPL generation and explanation exclude Agent Mode.",
      "sources": [
        "aiSaiaRelease240"
      ]
    },
    {
      "id": "source-aiSaiaCloudConnected240",
      "ref": "source:aiSaiaCloudConnected240",
      "sha256": "2ecefd6ab7625e01725b443fa361baecd2b17d69419117f78a0548611ae9c822",
      "scope": "SAIA 2.4.0+, Cloud Connect 2.0.0+ and Enterprise 10.4+ Cloud Connect path with paid-license, fresh-setup, network, certificate, named permission, email, commercial-region and data-processing qualifications. ES edition, agent stage, SOAR pairing and authorization remain separate.",
      "sources": [
        "aiSaiaCloudConnected240"
      ]
    },
    {
      "id": "source-aiSaiaAgentMode240",
      "ref": "source:aiSaiaAgentMode240",
      "sha256": "7411ab9b231639455eb952bd65fc193714d7815f46d4c09528bc02f0eef836c9",
      "scope": "The feature requires Platform 10.1.x+, administrator activation, a supported AWS service region and Model Runtime. The separate Enterprise installer raises the Platform minimum.",
      "sources": [
        "aiSaiaAgentMode240"
      ]
    },
    {
      "id": "source-aiSaiaKnownIssues240",
      "ref": "source:aiSaiaKnownIssues240",
      "sha256": "e5e28015b2e3edcb067db064b630ea6166cfc0e2a2394e0ef41e95bc994630b1",
      "scope": "The issue describes the 2.2.0–2.3.6 restriction and 2.1.1 fallback without Agent Mode. Its future-tense 2.4.0 note differs from that version’s release notes and installer.",
      "sources": [
        "aiSaiaKnownIssues240"
      ]
    },
    {
      "id": "source-aiSaiaModelRuntime240",
      "ref": "source:aiSaiaModelRuntime240",
      "sha256": "33ab2b2ba116b40a3f235da58b9348d3eb6199226d4532edd9d7f80f77e8abea",
      "scope": "Data zone and Global routing differ. Requests can reach a third-party model outside the Splunk platform boundary.",
      "sources": [
        "aiSaiaModelRuntime240"
      ]
    },
    {
      "id": "source-aiSaiaInstall240",
      "ref": "source:aiSaiaInstall240",
      "sha256": "8bd971b2a7d9f99519b99bc4aa20cb205c09060e1dd98556be264fe42ed843ce",
      "scope": "The Cloud installer identifies 2.4.0 as generally available. Base AWS and Azure service locations, including the separately listed GovCloud rows, cannot establish Agent Mode availability.",
      "sources": [
        "aiSaiaInstall240"
      ]
    },
    {
      "id": "source-aiSaiaAbout240",
      "ref": "source:aiSaiaAbout240",
      "sha256": "97eb68e92c5663f5f5405bfe9ece0ad64f4cb3ff05f2637ffde268d52fc30749",
      "scope": "The integration requires ITSI 5.0.0+, SAIA 2.2.0+ and MCP Server 1.2.1+. Its list of tools and base service regions does not identify a subagent-specific region.",
      "sources": [
        "aiSaiaAbout240"
      ]
    },
    {
      "id": "source-aiEsAutonomousResponse88",
      "ref": "source:aiEsAutonomousResponse88",
      "sha256": "4be7f051885f3e72e3ff750c8cfda72a815c8a99fb6cfc32c309356ea3c3e686",
      "scope": "Controlled Availability component stage, Cloud availability statement, deployment floors, paired SOAR, frontier-model, inherited connector and granular asset-role requirements",
      "sources": [
        "aiEsAutonomousResponse88"
      ]
    },
    {
      "id": "source-aiEsCloudConnectAgentic88",
      "ref": "source:aiEsCloudConnectAgentic88",
      "sha256": "1a63810776b126894d3c33f5e3f4b626444038e25dddac3fb7a5fbb9ce05edfc",
      "scope": "Directly retrieved Cloud Connected agentic SOC dependency and setup chain; no edition entitlement, region, SOAR pairing or customer authorization inference",
      "sources": [
        "aiEsCloudConnectAgentic88"
      ]
    }
  ]
};
