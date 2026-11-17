# Server-secret export intake: inactive transport candidate

Run 44013305500 proved the real export producer on main 47ee3f9, with the
publisher job skipped and the workflow disabled afterward. It did not call an
intake or create admission. This increment prepares an actual sender/receiver
boundary around the existing protected intake; it does not add another evidence
validator. The original PR202 modules were not imported by a Worker build or workflow.
The subsequent local runtime integration is described below and remains undeployed.

## Smallest server boundary

The proposed endpoint is a bodyless POST to
`https://versioncompass.com/api/publisher/export-qualification`. The public Site's
audience is unchanged. Only a fresh GitHub OIDC Authorization token crosses this
boundary, using the existing fixed issuer/audience and source-pinned publisher
identity. The sender never reads or forwards GITHUB_TOKEN, a PAT or a Sites token.
The completed commissioning run cannot be reused as live request authority.

`tools/release-coordination/export-intake-route.mjs` checks exact origin/path,
empty body, no browser Origin and inactive controls before invoking the existing
`createProtectedExportIntake`. It receives no DB capability, imports no issuer
CAS and returns only the existing sanitized held response. There is no admission,
history write, staging or publication. Tests use synthetic signed identities and
simulated GitHub service responses, not new live authority.

Server configuration, not request input, selects:
- `VC_EXPORT_INTAKE_ENABLED`: must be explicitly `1`; missing remains held.
- Existing `VC_PUBLISHER_OIDC=1`, `VC_ACTIVE_DELIVERY=0`, `VC_PUBLISHER_ACTIVATION=0`.
- `VC_EXPORT_INTAKE_POLICY`: exact reviewed source commit/tree, workflow byte hash,
  qualifier job and upload step. No current values are defaults in this module.
- `VC_EXPORT_INTAKE_GITHUB_TOKEN`: server-only secret, never an inbound header.

The existing intake independently acquires fresh source/run/job/artifact facts,
downloads the unique original fixed-name qualifier artifact, binds its complete
strict schema and rechecks service state. It strips the API credential before
following the approved artifact-storage redirect. It trusts GitHub's control
plane and the complete reviewed runner graph, not arbitrary submitted JSON.
The graph must establish exactly one eligible request job after the successful
qualifier, in the same active attempt1. OIDC alone does not identify an ordinary
job. A new job graph still needs separate review and explicit commissioning.

## Credential provisioning decision, not performed

For bounded commissioning, a fine-grained PAT can select resource owner
LeiterConsulting and only `splunk-version-value-explorer`, with Actions read and
Contents read (plus mandatory metadata read). No write, workflow administration,
organization permission, classic repo scope or all-repositories selection is
needed. GitHub tokens inherently retain read access to public repositories; do
not claim that repository selection disables ordinary public reads elsewhere.
This application further restricts credential use to fixed GET endpoints in the
one repository. Use a short explicit expiry, preferably one commissioning day,
and revoke after completion or abandonment. Organization approval policy, if
applicable, must be honored. No token has been created or requested by this draft.

GitHub connector tools here do not create PATs. A later owner-authorized GitHub
account flow is necessary; never extract the connected app's credential. Prefer
owner entry directly into the Site's secret setting rather than pasting a token
into chat. The Sites native runtime configuration supports `is_secret=true`,
with masked readback. Keep the value out of source, hosting.json, browser assets,
workflow inputs, artifacts, logs and schedule prompts. Before an actual update,
obey that Site's returned runtime instructions; the current connector contract
requires publishing a saved version to apply the new environment revision.

Revoke the PAT at GitHub first to stop its use even by an old runtime. Then remove
the corresponding Site secret and apply the supported environment/deployment
change. Expired/revoked credentials fail closed; no fallback or automatic rotation
is implemented. Revocation cannot erase information already downloaded.

For sustained unattended use, GitHub recommends a GitHub App rather than a
personal token; that requires separately approved app installation/key management
and is not provisioned here. A PAT is a bounded commissioning choice, not a silent
long-lived production identity.

## Costs and remaining gates

This design requires no new subscription or paid external service. GitHub's
standard hosted runners for public repositories are free; artifact/storage and
Sites usage limits still apply. Actual account quotas/billing were not inspected.
Do not purchase capacity or add a paid plan as an implicit next step.

The transient custom-header GITHUB_TOKEN design remains rejected pending an
authoritative host redaction guarantee. Moving that secret into a request body,
query string or alternate header is not a workaround. This design uses the
existing server-secret acquisition contract instead.

Before any active import: review the exact request-job graph, explicit secret
lifecycle/authorization, runtime integration and ESM packaging, regenerated
engine/content identities, exact-candidate CI/exports and retained restore pair.
Normal Worker mount edits change engine identity; do not relabel them engine9328.
No current-engine rollback, browser readiness, semantic assessor authority,
runtime/head authority, stop/recovery authority or complete admission follows
from the local transport tests. No production route, secret, workflow enablement
or dispatch is changed by this candidate.

## Primary references checked November 17

- [GitHub fine-grained token management](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [Artifact download permissions](https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28)
- [Token expiration and revocation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation)
- [GitHub Actions billing and usage](https://docs.github.com/en/actions/concepts/billing-and-usage)
- [Sites runtime settings and responsibilities](https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites)

## Local runtime integration candidate (not deployed)

The subsequent local candidate wraps the built legacy Worker with
`worker/export-intake-entry.mjs`. Only the exact intake pathname is intercepted;
all other requests preserve the established handler. A lazily read configuration
object exposes six required bindings and excludes DB, assets, seed and storage.
Disabled controls cannot read the server credential or make outbound requests.

The pinned esbuild bundle preserves the existing legacy globals in one virtual
entry while resolving the actual intake ESM graph in separate module scope. The
metafile must contain exactly the expected inputs, one output and no external
imports. Packaging and dependency inputs are part of engine identity. Local Node
WebCrypto/decompression tests are not proof of Cloudflare runtime support or
identity/header handling at the host.

Before deployment retain the exact current Sites saved version, matching source
and Worker archive, production environment revision and independent data baseline.
The restored private v13 test from November17 is not a rollback rehearsal for this
new engine. Preserve the public audience and existing runtime. Rehearse the exact
restore package in the approved isolated setting with intake disabled and no new
credential; compare full data against the baseline. Do not fabricate a second
content revision or activate/stage to make a rollback test pass. There is no
production rollback or deployment authorization implied by this local candidate.

Validation, qualification-only and preparation workflow source now installs root
locked dependencies with `npm ci --ignore-scripts --no-audit --no-fund` before
tests/build. This executes no lifecycle scripts and adds no permissions, triggers
or requesting intake job. Workflow enablement/dispatch remains unchanged.

## Actual Worker runtime findings

A scratch Miniflare/workerd run of exact main6c6c0dd exposed invalid named constant
exports at the host entry, before any requests. A diagnostic-only wrapper then
showed that an empty HTTP POST can expose a non-null body stream. Neither the
initial run nor that diagnostic wrapper qualifies the original deployment.

The correction uses a real internal legacy-core ESM module and an outer
**default-only** handler export, with the exact virtual/real dependency closure
checked by the bundler. The body boundary now reads at most zero actual bytes
with a one-second deadline before configuration; Content-Length alone is not
trusted. Tests preserve rejection of nonempty and stalled streams. Signed test
identities are synthetic and network responses are simulated; no real credential
or admission authority is created by local runtime tests.

The corrected exact bundle was executed locally with Miniflare4.20260730.0 and
workerd1.20260730.1: default-off made zero outbound calls; synthetic signed stored
and deflated artifacts were acquired while admission stayed held; expired
identity and main drift were rejected. All outbound requests were intercepted by
synthetic service fixtures, no DB was bound and no Sites deployment occurred.
This establishes the tested local runtime behavior, not live host forwarding,
network permissions, secrets or restore readiness.
