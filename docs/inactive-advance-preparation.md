# Inactive unattended caller preparation

`scripts/advance-content-inactive.mjs` is **not** connected to the publisher workflow.
Its CLI always fails closed with zero requests. Environment variables and CLI
arguments cannot enable it. The three existing publication holds, disabled
workflow and active-reader settings are unchanged.

The exported adapter accepts an explicit injected transport for isolated tests.
It reuses `advance` rather than resurrecting the retired stage-before-head writer.
Before credential acquisition it validates exact Actions/workflow/main identity,
clean checkout (production input loader), selected successful push trigger and
candidate bundle, then reads only the public static engine manifest. It rejects
engine changes; no runtime deployment or bootstrap fallback exists. The runtime
still independently verifies signed OIDC, exact candidate bytes and CI evidence.

Fixed bounded requests are static manifest, OIDC credential, authenticated head,
stage, CAS activation, and final head readback. Current or disabled heads skip
writes. Request redirects are rejected; each request is limited to ten seconds,
all requests to sixty seconds, response bodies to explicit caps. No mutation is
retried. A rejected or uncertain mutation requires independent history/provenance
reconciliation. Responses are schema-checked; stage provenance must match the
candidate commit, and final head generation must match the reported operation.
No raw credential, request URL containing credentials, response or exception text
is retained. Every outcome keeps claimedDelivered=false.

This is preparatory code, not production activation authority. The isolated hosted
D1 lifecycle test exercises storage/CAS/idempotency/stale/rollback behavior only;
it does not certify production HTTP readers, browser adoption/fallback, OIDC,
GitHub workflow or scheduled delivery. Production wiring requires separate review
of those gates and explicit approval for exact changes to all holds and runtime
reader activation. Do not wire this module by merely setting a boolean or copying
a successful fixture receipt. Preserve commit-bound selection: delayed older
validation never publishes newer main in that older OIDC context.
