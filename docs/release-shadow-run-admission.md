# Inactive fixed-source run observation

Depends on the signed identity inspector. No Worker/workflow import or new route;
no credential or activation change. inspectShadowRun verifies signed claims first,
then reads fixed GitHub REST endpoints for that exact run and attempt. Optionally
reads an explicitly selected publisher evidence artifact by canonical ID. It never
accepts a URL or forwards the OIDC token to GitHub. Trusted transport and clock
options are implementation dependencies, never request input.

API contracts: https://docs.github.com/en/rest/actions/workflow-runs#get-a-workflow-run-attempt
and https://docs.github.com/en/rest/actions/artifacts#get-an-artifact . The attempt
endpoint was independently exercised through the authorized connector on an actual
historical publisher run, not treated as a live authenticated execution test.

A bounded one-MiB response reader, fixed origin, manual redirect rejection and ten
second fetch signal keep acquisition constrained. Non200, unreadable data, changed
attempt/head/state or artifact mismatch fail without retries. Run IDs received as
JSON numbers must be safe integers; signed IDs remain exact decimal strings.

The API artifact contract supplies workflow_run identity, not upload attempt.
Therefore originalBytesVerified and uploadAttemptVerified remain false. Metadata
digest is not a byte inspection. Workflow SHA claims are preserved but workflow
source bytes remain unverified. No validation run, semantic admission, exact-head
CI or deployment result is invented from the publisher run. Even complete success
returns admission held and productionActionAllowed false.

Tests use ephemeral RSA and service fixtures; public API shape was read separately.
No current issuer token or genuine authorized running executor has qualified this
combined path. Next stages must bind independent candidate validation/export,
semantic coverage, durable intent and remote action authority. Denied workflow
activation remains denied; this module is not a substitute execution route.

Run states are explicitly schema-checked; unknown enums and inconsistent status/conclusion pairs hold. Sequential reads are not an atomic snapshot or future-action freshness guarantee. Token validity is checked at supplied trusted acquisition time, not a promise it remains valid for later actions.
