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
- SVD-2026-0404 and SVD-2026-0505 are selected advisory-specific patch floors, not a complete vulnerability assessment. SVD-2026-1007 establishes the October 21 Enterprise floors for Enterprise-package heavy forwarders; it is not a Universal Forwarder or Cloud rollout claim. The 10.4.2 useACK defect also concerns receiving HF/indexers.
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

## October 12 borrowed KV Store evidence

The current Enterprise-package KV Store record and exact source mapping now retain the ES 8.7-and-lower postponement boundary alongside ITSI. A separate mapped HF technical record qualifies the KV-specific 10.2-or-higher source bridge versus the general table's direct 10.0 edge. Both apply only when KV Store is present; neither becomes UF compatibility or a rewrite of the general Enterprise upgrade graph. Existing source-register regression ownership and all schedules are preserved.

## October 18 inherited runtime verification

Two exact 10.2 runtime mappings were semantically rechecked: Web Python 3.13 versus historical splunkd 3.9 default/3.13 opt-in, and removal of bundled Node.js versus separately packaged app-owned runtimes. Their actual claim dates advance independently; the sixteen other mapping dates and existing conflicts do not. A new semantic negative fixture rejects a mandatory-all-components Python substitution. Native export coverage now includes HF 10.4-to-10.6 in both themes, preserving the explicit target-runtime-history qualification and later default supersession. The existing 900-route and missing-inherited-reference regression remains; this is not complete historical semantic reverification.

## October 21 FIPS and TLS semantic verification

Two exact 10.0 mappings were semantically rechecked against READ THIS FIRST. The FIPS 140-3 module change applies to FIPS-mode Enterprise-package instances and retains the dedicated migration procedure; it is not a universal HF requirement or authorization evidence. SSL 3.0 and TLS 1.0/1.1 remain supported with warnings in 10.0 while deprecated, distinct from the later removal. New negative fixtures reject universal FIPS scope, premature TLS removal and UF inheritance. The other twelve mapping dates remain unchanged; broader historical verification is still partial.

## October 22 Python and Fishbucket semantic verification

Two additional borrowed Heavy Forwarder mappings were semantically rechecked against their exact READ THIS FIRST sections. Enterprise 10.0 removes Python 3.7 support and makes Python 3.9 the default, but that package-level fact does not certify every installed app or app-owned runtime and does not become a UF claim. Enterprise 10.2 replaces the Fishbucket backend without an explicit or implicit checkpoint migration: it reads legacy checkpoints and writes new state, while an unsupported downgrade can miss newer checkpoints and cause reingestion or duplicates. Negative fixtures reject universal app compatibility, UF inheritance, a required checkpoint migration and checkpoint loss during a supported upgrade. Ten other borrowed mapping dates remain earlier; broader historical semantic verification is still partial.

## October 23 security and Cloud maintenance scope

The October 21 Enterprise advisories establish fixed versions 9.4.16, 10.0.11, 10.2.8 and 10.4.4 for customer-managed Enterprise packages, including Heavy Forwarders where the Enterprise package evidence applies. They do not establish Universal Forwarder fixes, Cloud stack rollout, direct-receiver compatibility or authorization. Separately, the Cloud maintenance feed now lists 10.6.2.1; its preceding 10.6.2.0 row contains SPL-312665 for a tcpout `useACK=true` pipeline blockage. That Cloud fix remains exact-build and stack-specific and cannot be transferred to an Enterprise or Forwarder package without its own evidence.

Two older borrowed mappings were independently rechecked against their exact READ THIS FIRST sections: 10.2 blocks root execution by default but retains the documented temporary `--run-as-root` override, and 10.4 gives KV Store's `[kvstore]` TLS settings precedence over overlapping `[sslConfig]` settings. Both remain Enterprise-package, component/OS-conditional Heavy Forwarder facts; neither becomes a Universal Forwarder or Cloud-managed host rule. Existing negative mapping regressions continue to reject those broadenings, and eight older mapping dates remain unchanged.

## October 25 KV Store evidence review

Two remaining 10.6 borrowed Heavy Forwarder mappings were independently rechecked against their exact current sections. The cohosted PostgreSQL transition retains its KV Store 7.0+, disk, health and parallel-backup prerequisites; migration starts automatically unless postponed, impairs writes, and requires ITSI 5.0.x and lower to set and verify `postgresMigrateOnStartup=false` before the Enterprise 10.6 upgrade. Separately, the KV Store guide still requires a 10.2-or-higher bridge for sources at Enterprise 10.0 or lower, while the general Enterprise table still lists a direct 10.0-to-10.6 route. Both scopes and the conflict remain visible. New negative fixtures reject a non-postponable/write-safe migration substitution, universal direct-upgrade guidance and UF inheritance. Two older borrowed mapping dates remain unchanged; historical semantic verification is still bounded rather than complete.

## October 29 Node.js advisory status

SVD-2026-1015 lists Splunk Enterprise and Universal Forwarder as **Under Investigation** for four Node.js vulnerabilities. The exact advisory is mapped to the UF and HF security source groups, but no affected version, fixed version, workaround or patch floor is recorded. Heavy Forwarder applicability remains conditional on Enterprise-package evidence, and Universal Forwarder applicability remains its own product determination. Cloud rollout, receiver compatibility, topology, entitlement and authorization remain separate.
