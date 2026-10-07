# Splunk Forwarders — maintained route

The peer product route is `?product=forwarders`. `forwarders-data.js` records scoped evidence and `forwarders.js` uses the shared comparison graph engine. `forwarders-ui.js` renders the same assessment for the screen, print/PDF and self-contained HTML snapshots. Its read-only `compare_forwarder_routes` WebMCP tool returns that assessment and source catalog.

## Coverage boundaries

- Selected release lines: 9.4, 10.0, 10.2, 10.4 and 10.6. These are not patch selectors or exhaustive historical coverage.
- UF edges: 9.4 → 10.0; 10.0 → 10.2, 10.4 or 10.6; 10.2 → 10.4 or 10.6; 10.4 → 10.6. Splunk's 10.6 READ THIS FIRST page explicitly allows direct UF upgrades from 10.0.x and later. HF reuses the Enterprise graph. The versioned 10.6 Enterprise table now records 9.4.x → 10.0.x or 10.2.x first, followed by the listed 10.0.x/10.2.x/10.4.x → 10.6.x paths. Preserve the different UF and HF evidence even where their release-line edges now coincide.
- Receiver compatibility is separate from upgrade support, OS support, feature availability, support lifecycle and authorization. Preserve the service table's omitted Cloud 10.4 pairing for UF/HF 10.0, rather than filling it by inference.
- OS records are selected exact 10.4 and 10.6 package combinations. Unlisted combinations and other target OS requirements remain Not established. Conditional rows retain Splunk's qualification rather than becoming generally supported combinations.
- Splunk's current Enterprise receiver matrix and Cloud Service Details now publish exact 10.6 forwarder/receiver rows. The Enterprise table covers the listed forwarding modes and an intermediate forwarding tier; the Cloud table applies to the forwarder directly connected to the stack. Preserve separate topology, provider, region, entitlement and authorization checks rather than generalizing these rows.
- HF technical records reference the existing Enterprise data and select forwarding-relevant components. Target runtime history is separate from route changes. Bundled-runtime changes never establish app-owned runtime or premium-app patch compatibility.
- Automatic certificate renewal is a target-eligibility feature, not a newly introduced 10.4 feature. Preserve commercial AWS, excluded regions, direct topology, version floors, opt-in and single-output qualifications.
- SVD-2026-0404 and SVD-2026-0505 are selected advisory-specific patch floors, not a complete vulnerability assessment. The 10.4.2 useACK defect also concerns receiving HF/indexers.
- The deployment choices are Splunk Enterprise (customer-managed), Splunk Cloud, a hybrid Enterprise + Cloud output, FedRAMP Moderate and FedRAMP High. Enterprise is the default and does not show a Cloud certificate-renewal feature. Hybrid shows separate Enterprise receiver and Cloud stack checks; the Cloud table applies to the tier directly connected to Cloud, so an intermediate tier requires its own assessment. Two output groups may clone or selectively route events, but this comparison does not verify the configuration or event equivalence. Generic offering evidence cannot establish feature scope. Existing exact product/patch qualifications remain intact.

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

The source-register generator resolves the stable `claimSources` registry back to exact official URLs and sections. Regression coverage requires mappings for Universal and Heavy Forwarder upgrade steps, Enterprise and Cloud receivers, direct/intermediate/hybrid topology evidence, OS packages, certificate renewal, maintenance/issue records and advisory-specific patch floors. Adding a Forwarder claim without a mapped source and section must fail the source-register test.

## Concise interactive flow

The screen leads with forwarder, current, target, deployment and receiver; the documented path appears immediately. Hybrid adds a second Cloud stack selector and explains the two receiving legs. OS, architecture, provider, region and topology are together under one optional refinement control; provider and region are hidden for Enterprise-only routes. Receiver, package and authorization assessments remain separate. Required actions, selected issue/security guidance and an optional technical section follow. Each upgrade step links to its own evidence. Print/PDF and saved HTML retain the full selected report with qualifications and dated citations.

A restriction documented for named regions must not become a global Unavailable label when no region is selected. A broad selection without positive evidence remains Not established; the exact regional records are available in source context.

## October 1 independent re-audit

The 10.6 receiving-leg guard now prevents UF/HF selections from inheriting older Enterprise or Cloud matrix rows, including each hybrid output. UF certification is not receiver certification. A regression test reproduced the erroneous Available result before the guard and verifies both receiving legs afterward. The morning Release Watch generator repair is retained; no duplicate generator rewrite was made. Its source-to-claim regression is independently rechecked and the HF 10.6 KV Store/TLS records now have explicit section mappings. Native keyboard, narrow-screen, PDF, reopened snapshot and browser WebMCP execution remain unperformed because browser approval timed out and the local runtime lacks its browser binary.

## October 7 receiver-table update

Splunk has since added exact 10.6 rows to both the Enterprise receiver matrix and the Cloud supported-forwarder table. The route now marks listed Enterprise 10.6 pairings Available and the exact commercial Cloud 10.6 direct pairing Conditional. It still does not infer Edge Processor, an unlisted release combination, an intermediate Cloud-facing tier, a regulated-environment pairing, entitlement or authorization. The historical October 1 guard remains preserved as the record of the prior evidence gap.
