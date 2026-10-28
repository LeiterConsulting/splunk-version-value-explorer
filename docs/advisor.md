# Advisor: bounded first build

Advisor is visibly **Work in progress** at `?view=advisor`, including the shared
mobile navigation and Ripple masthead. It offers deterministic, goal-specific
paths from already assessed published Splunk documentation. It has no runtime
model, external discovery, new schedule or automatic environment inventory.

## Current goals

- SAIA Agent Mode: deployment-specific Platform floor and scoped commercial
  service-region evidence; app pairing, permissions, activation and runtime
  remain explicit conditions. Regulated or unknown context is insufficient.
- ITSI assistance: the assessed ITSI/SAIA/MCP version floors. A separate narrow
  version-only goal can return no version change indicated. It never claims
  complete pairing or feature access. Subagent regional rollout stays unknown.
- ES AI SOC workflow: preserve the 8.8 aggregate versus 8.7 task-specific
  version floors and the Triage edition contradiction, with both sources and
  impact. The component is never substituted for the aggregate workflow.
- Keeping current capabilities can produce no change proposed. Reported ingest
  pressure produces insufficient evidence, without capacity or remedy inference.

Licensing, sizing and operational advice without enough assessed evidence are
excluded from this build and recorded as future potential. Inputs are explicitly
self-reported, unknown is allowed, and access confirmation does not establish
entitlement, health, compliance or customer authorization.

## Claim admission and maintenance

`content/advisor-admission.json` is an admission registry, not a parallel factual
dataset. Each named goal references exact canonical capability/policy/source
payloads with SHA-256 pins and an explicit scope. Location metadata admits only
identifiers, not feature availability. Every cited source has its own pinned
review scope; a domain or document is not blanket approval. Canonical facts
remain in the existing datasets. Dates are rendered from those unchanged facts.

Runtime verifies every required pin before offering a factual path. A changed
claim or source pauses that goal for reassessment. Review the actual changed
claim, supporting section, contradictions and impact before updating its pin;
never refresh pins automatically during a content sync. Then run
`node scripts/sync-advisor.cjs` to regenerate its adapter and add scenario tests
for new reasoning. The generator only copies reviewed admission metadata.

## Local profile and reporting

Profiles save only when requested in browser localStorage. Save/load/clear use
one namespaced key. Nothing is sent to an Advisor API. URL history and copied
links contain only the goal and appearance. PDF and dated HTML deliberately
include the self-reported context and supporting evidence. Invalid or private
URL fields block exports until the link is corrected. New export routes and a
six-case responsive/appearance interaction matrix are in exact-candidate CI.
