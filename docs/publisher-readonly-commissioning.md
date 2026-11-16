# Read-only publisher identity commissioning route (not deployed)

`GET /api/publisher/commissioning-identity` is a real Worker route proposed for
separate reviewed deployment. Adding this code does not deploy it, enable a
workflow, install a credential, change permissions, or admit publication.

It requires all three controls explicitly: publisher OIDC on, active delivery off,
publisher activation off. It accepts only a freshly verified existing GitHub OIDC
identity for the fixed repository, main ref, existing publisher workflow and
versioncompass.com audience, with workflow_dispatch event and canonical signed
run_id/run_attempt/workflow_sha. Maintenance tokens do not qualify. Existing
publisher signature verification and all other routes are unchanged.

The response exposes only fixed repository, signed commit/run/attempt/workflow
identity, bundled runtime manifest identity and false writer controls. It does not
forward the bearer token to GitHub APIs, include token contents, echo exceptions,
read request bodies, access any database, or initialize content. Query strings,
other origins and non-GET methods are rejected. Signing-key acquisition and
verification have a 12-second route deadline with abort; key bytes retain the
existing 128 KiB verifier cap. Responses remain no-store.

A successful response establishes signed claims observation at this deployed
boundary, not actual GitHub run-result truth, artifact upload-attempt proof,
semantic approval, admission, D1 integrity, or visitor delivery. All those fields
remain explicitly held/false. Tests use synthetic signing keys through trusted
test infrastructure; they are not a real executor commissioning run.

## Still required before owner handoff

- Review and qualify exact resulting source/build/export and approve deployment
  of this read-only route while publication remains off; preserve bundled service.
- The matching `commissioning-only` manual mode/client is implemented in the
  existing workflow, using its unchanged id-token authority. It binds exact main,
  checkout/workflow SHA, run/attempt, and the same-candidate manifest engine,
  revision and digest; it deliberately rejects a different deployed candidate.
  Two bounded GET requests at most (issuer and fixed route), no retries, 10 seconds
  each/20 seconds total, redirect refusal and byte caps produce a sanitized
  `publisher-commissioning-outcome.json`. No candidate selector or writer runs.
  No workflow permission or automatic trigger change is part of this patch.
- Only after the matching route/client are qualified may the owner enable the
  existing workflow for one observe-only execution and disable it afterward.
  No previously rejected enable action is retried or bypassed.
- Independently compare its original run-bound response with GitHub exact attempt
  evidence. Keep the separate artifact-attempt trust-policy decision unresolved
  until explicitly reviewed; do not upgrade log correlation to attestation.
