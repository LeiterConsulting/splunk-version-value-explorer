# Inactive unattended caller preparation

`scripts/advance-content-inactive.mjs` is **not** connected to the publisher workflow.
Its CLI always fails closed with zero requests. Environment variables and CLI
arguments cannot enable it. The three existing publication holds, disabled
workflow and active-reader settings are unchanged.

The exported adapter accepts an explicit injected transport for isolated tests.
It reuses `advance` rather than resurrecting the retired stage-before-head writer.
Before credential acquisition it validates exact Actions/workflow/main identity,
clean checkout (production input loader), explicit manual context and
candidate bundle, then reads only the public static engine manifest. It rejects
engine changes; no runtime deployment or bootstrap fallback exists. The runtime
still independently verifies signed OIDC, exact candidate bytes and CI evidence.

Fixed bounded requests are static manifest, OIDC credential, authenticated head,
one bounded stage-batch, conditional CAS activation, and final head readback. Current or disabled heads skip
writes. Request redirects are rejected; each request is limited to ten seconds,
all requests to sixty seconds, response bodies to explicit caps. No mutation is
retried. A rejected or uncertain mutation requires independent history/provenance
reconciliation. Responses are schema-checked; stage provenance must match the
candidate commit with a positive safe-integer validation run, and final head generation must match the reported operation.
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

## Bounded manual preparation

Automatic `workflow_run` inputs now return `held-automatic-trigger` before any
network request or credential acquisition, even for successful exact-main runs.
The server accepts stage-batch only with manual OIDC; this module does not widen
that trust boundary. Existing selector logic is not scheduled delivery authority.

Each injected invocation sends at most one `/api/publisher/stage-batch` POST,
never the legacy unbounded `/stage`. Its exact eight-field response must bind
the candidate engine/revision, nonnegative integer progress totaling the exact
record count, at most 50 attempted rows, and the appropriate integrity status.
Partial progress requires null provenance and returns `stage-partial` without
CAS or another request. It is neither a failed publication nor delivery. An
independent readback is required before any separately authorized continuation.
Complete or already-complete progress requires full integrity and exact verified
provenance before the existing head/generation-bound CAS path is allowed in the
injected test adapter. Already-complete requires zero attempted rows. Unknown,
malformed, rejected, redirected or lost responses never retry or permit CAS.

This change adds no workflow reference, timer, runtime flag or production entry
point. Hosted candidate staging, real manual OIDC, end-to-end activation and any
future recurring-event eligibility still require their own qualification and
approval. Tests with injected transports are not that evidence.
