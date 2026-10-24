# AI Availability

The owner's October 23 instruction authorizes the normal-navigation tab
?view=ai-availability, alongside Release Guide, ES Editions and Prep for 11.x.
It answers what named AI capabilities do, where their reviewed evidence applies,
and which versions, services, permissions and entitlements need confirmation.

## Canonical model

guidance.aiAvailability in content/datasets/guidance.json is the canonical
catalog. guidance.sources contains its exact public URLs and supporting sections.
The seven-dataset publication contract is unchanged. Generated adapters/catalogs,
source register, immutable manifest and engine revisions use the established
sync pipeline. AI catalog records retain explicit product/evidence-version scope.

Current coverage is nine capabilities: SAIA SPL assistance, SAIA Agent Mode,
the ITSI SAIA subagent, four ES capabilities, the Observability AI Assistant
and the Observability AI troubleshooting agent. This is a curated inventory,
not all Splunk AI. Their product identities remain distinct.

The initial SAIA documentation scope is 2.3.6. ITSI's subagent requirements are
ITSI 5.0+, SAIA 2.2+ and MCP Server 1.2.1+. ES agent and regional evidence is
versioned 8.8; the release remains Controlled Availability. A release stage never
substitutes for tenant enablement, entitlement or regional availability.

## Filters and report behavior

The view supports product, deployment, service environment, provider, service
region, ES edition, evidence version, search and environment/comparison modes.
Evidence version filters the documentation scope; it does not evaluate an actual
installed stack. The location is the AI service location, not the customer's
server location or a universal model-processing residency statement.

Region/provider mismatches and malformed/duplicate/foreign URL inputs preserve
the original link and disable both exports. Valid combinations without evidence
remain selectable and return not established. Provider changes visibly clear an
incompatible region. Product changes visibly clear incompatible version filters.
Shared URLs retain context, mode, theme, search and meaningful anchors.

Comparison varies deployment/compliance across four columns while retaining
product, service region and edition. Screen, print and saved HTML use the same
engine. Reports include every matching capability, full requirements, limitations
and numbered sources, including comparison conditions. Existing read-only WebMCP
tool names remain unchanged; no new tool is registered for this view.

## Evidence boundaries

States are documented available, available with conditions, documented unavailable,
not established, or conflicting guidance. All initial positive states retain
prerequisites. Offering authorization is separate and is not established by this
feature assessment.

SAIA's limited IL2 statement, excluded Agent Mode and fixed hosted-model runtime
do not establish complete Moderate or High coverage. The commercial-stack
introduction/GovCloud-row scope question is retained. No base-SAIA regional row
certifies ITSI subagent rollout.

ES 8.8 Premier and Cloud Connect tables are distinct. Their differing Montréal/
Calgary exceptions remain scoped. Cloud GovCloud component exclusions are not
silently applied to CMP connectivity. GCP/Azure's explicit non-ES/SOAR component
exclusion is a Cloud rule. SOP retains its Security AI Assistant prerequisite.
Essentials-specific 8.8 regional mapping and new CMP agent-region scope are
explicit backlog items rather than inferred from Premier or 8.7.

The Observability AI Assistant is documented for AWS realms excluding GovCloud
and for GCP realms. Version Compass applies only the provider-region mappings
in the current service description. The assistant page also lists `us3`, while
that service description does not map `us3`; the realm stays unresolved rather
than being assigned to an adjacent region. Log queries affect SVC quota, recent
chat access is limited to 30 days, essential-purpose data use applies, and
optional research sharing is off by default. The troubleshooting agent remains
limited to non-Governmental realms, supported default metrics and supported
alerts; custom metrics are unsupported, automatic organization enablement
requires support, and remediation plans are currently Kubernetes-specific.

The ES 8.8 regional body was retrieved through an official indexed source;
direct opening failed in this session. Record that retrieval limitation.
Existing October 1 edition qualifications and October 22 release-stage evidence
retain their actual dates; today's publication does not reverify those scopes.

## Maintenance ownership

| Existing task | AI responsibility |
| --- | --- |
| Version Release Watch | Own SAIA/ITSI identity, releases, versions/dependencies and discovery of additional documented capabilities. |
| ES Editions Watch | Own ES capability, edition, deployment, pairing, enablement and release-stage qualifications; reconcile detailed task guides. |
| CSP FedRAMP Watch | Own per-capability provider, region, regulated scope, runtime-location qualifications and authorization boundaries. |
| Version Guidance Audit | Independently check complete coverage, conflicts, source-to-claim sections, filters, dependencies, links and report parity. |
| Existing delivery checkpoint | Carry finite verification/publication follow-through without restarting its timer or changing its disabled state. |

Coordinate logical sections of the shared canonical file using fresh GitHub/Sites
source, preserve concurrent edits, and never overwrite one task's newer facts.
Read the finite backlog in the catalog; prioritize compatibility, authorization,
entitlement and implementation blockers. Do not create an AI-specific recurring
task or change existing maintenance cadence.

## Validation

Run the four sync commands in required order, their check gates, full Node tests
and build. The exact-candidate export matrix includes default, filtered, region-
specific, comparison, unknown and invalid AI routes in both themes, with actual
phone layout, keyboard, native PDF and independently reopened offline HTML checks.
Inspect retained screenshots/PDF pages for novel layout separately from automated
geometry checks. Keep source checks, claim checks, tests, browser/artifact evidence,
deployment and production content/D1 verification distinct.
