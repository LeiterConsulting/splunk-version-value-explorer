# Splunk Forwarders — September 28 increment

The peer product route is `?product=forwarders`. `forwarders-data.js` records scoped evidence and `forwarders.js` uses the shared comparison graph engine. `forwarders-ui.js` renders the same assessment for the screen, print/PDF and self-contained HTML snapshots. Its read-only `compare_forwarder_routes` WebMCP tool returns that assessment and source catalog.

## Coverage boundaries

- Selected release lines: 9.4, 10.0, 10.2 and 10.4. These are not patch selectors or exhaustive historical coverage.
- UF edges: 9.4 → 10.0; 10.0 → 10.2 or 10.4; 10.2 → 10.4. HF reuses the Enterprise graph. Preserve the different UF and HF intermediate requirements.
- Receiver compatibility is separate from upgrade support, OS support, feature availability, support lifecycle and authorization. Preserve the service table's omitted Cloud 10.4 pairing for UF/HF 10.0, rather than filling it by inference.
- OS records are selected exact 10.4 package combinations. Unlisted combinations and earlier target OS requirements remain Not established. Windows 11 ARM UF emulation remains conditional and not certified.
- HF technical records reference the existing Enterprise data and select forwarding-relevant components. Target runtime history is separate from route changes. Bundled-runtime changes never establish app-owned runtime or premium-app patch compatibility.
- Automatic certificate renewal is a target-eligibility feature, not a newly introduced 10.4 feature. Preserve commercial AWS, excluded regions, direct topology, version floors, opt-in and single-output qualifications.
- SVD-2026-0404 and SVD-2026-0505 are selected advisory-specific patch floors, not a complete vulnerability assessment. The 10.4.2 useACK defect also concerns receiving HF/indexers.
- Shared feature availability now supplies Cloud/CMP/FR-M/FR-H disclosures. Generic offering evidence cannot establish feature scope. Missing CMP feature-specific records remain Not established rather than an inferred availability badge. Existing exact product/patch qualifications remain intact.

## Supplied-source resolution in this run

| Supplied source | Outcome |
| --- | --- |
| `ES_RN_CompatibilityMatrix` redirect | Retrieval failed twice; unresolved, not newly verified. Existing edition matrix evidence preserved. |
| `c47ad359d-8339-4aa0-93d0-1a7313283c1d` | Resolved to [AI Assistant 2.3.3 Agent Mode](https://help.splunk.com/en/splunk-cloud-platform/search/splunk-ai-assistant/2.3.3/use-splunk-ai-assistant/agent-mode-in-splunk-ai-assistant). Requirements and supported-region sections inspected; no global feature recertification. |
| `rb827e0de-1509-4a1b-a007-181af9a79391` | Retrieval failed twice; unresolved, not newly verified. |
| Data Management Solutions, onboard-data route | Current platform/access comparison inspected. |
| Data Management Solutions, transform-and-route route | Redirects to the onboard-data canonical page. |
| UF 10.0 Cloud receiver page | Certificate renewal prerequisites inspected and recorded with exact scope. |

## Maintenance ownership and release safeguards

Existing schedules remain unchanged; no additional recurring watch.

- Version Release Watch: forwarder releases, known/fixed issues, advisory applicability, patch floors and deprecations.
- CSP FedRAMP Watch: forwarder destination/provider/region/topology restrictions; feature authorization separate from offering authorization.
- Version Guidance Audit: UF/HF upgrade paths, each receiver hop, exact OS/package support, runtime/add-on scope, invalid links, keyboard/tap, both themes and screen/link/print/snapshot parity.
- ES Editions Watch: ES-specific forwarding and ingestion dependencies only; do not assume forwarder compatibility grants an ES entitlement or pairing.

Keep compact summaries, actionable blocker/check/question counts, the common share/save controls, category URL restoration, route-specific skip links and complete ES snapshot environment content. Run the full tests and all three synchronization gates. Failed checks block publication. Record actual limitations, task changes and deployment outcome in the Eastern-date release note. Routine factual updates continue during the soak; further Phase 2 stages require owner approval. A configured review or deployment attempt does not start a soak; only verified publication does.
