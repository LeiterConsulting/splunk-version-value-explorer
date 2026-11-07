# Bounded rollout observation and delivery verification

This is local/CI tooling for a separately authorized release. Adding it does not
run a workflow, publish content, deploy Sites, repair D1, resolve the November 7
timeout, establish readiness or lift any production hold. `VC_ACTIVE_DELIVERY`
remains off. Runtime release, content publication, factual assessment, saved-task
execution and active-reader activation gates remain separate.

## One no-write seed observation

The existing trusted `.github/workflows/publish-content.yml` now has an explicit
manual `mode: observe-only`. Use **that mode**, not the default `publish`, only
when an authorized operator has reconciled the deployed runtime and current main.
The private observation route must already exist on the deployed runtime; this
change cannot observe the older rollback runtime or a caller-selected historical
seed. A missing route/failed observation is a stop, not a reason to try the public
health API or the publication CLI.

For an authorized manual dispatch on `main`, supply:

- `mode`: `observe-only`.
- `expected_commit`: the exact 40-character main SHA that will run. Read the
  manifest at that commit, not from a stale checkout or another candidate.
- `expected_ref`: `refs/heads/main`.
- `expected_engine`: that commit's `content/publication.json` engine revision.
- `expected_revision`: that commit's bundled content revision.

Inputs enter the script as environment values, not interpolated shell commands.
Before any network request, it requires Actions, manual dispatch, this repository,
main branch, the existing workflow path, matching workflow/expected/checkout SHAs,
and matching explicit engine/revision plus a valid local bundled descriptor.
An expected SHA that differs from the selected workflow SHA fails closed. This
binds the selected dispatch commit, not current-main freshness: a queued run or
rerun may still use its original SHA after main advances. Reconcile current main
and deployed state before dispatch/rerun rather than inferring freshness. Neither the manual inputs nor the local claim check replaces the
Worker's independent OIDC signature/claim authentication.

The script obtains one short-lived OIDC credential from the existing GitHub Actions
issuer endpoint with the unchanged `https://versioncompass.com` audience. It then
makes exactly one authenticated **GET** to
`https://versioncompass.com/api/publisher/observe-seed`, without query parameters,
request body or GitHub evidence credential. It never runs candidate selection,
`publish-content.mjs`, health/content requests, head reads, staging, bootstrap or
activation. There is no alternate origin, token argument, stdin credential, retry,
new secret, trust path, permission scope or schedule. Automatic `workflow_run`
publication and explicit manual `publish` keep their existing selection, engine
hold and truthful publication receipts.

Each of the two requests has a 10-second deadline covering headers and the entire
body, with a 20-second aggregate observation budget and monotonic checks within
stream reads/decoding so immediately resolved chunks cannot starve the timer.
The OIDC JSON cap is 32 KiB; the observation cap is 16 KiB. Redirects are
rejected, including redirected response identities. Timeout cancels the client
without waiting for transport cancellation. It does not establish that a server
operation was cancelled. Tokens, issuer request URLs, raw response/error text,
headers and arbitrary returned fields are not logged or retained.

The separate `seed-observation-RUN-ATTEMPT` artifact retains
`seed-observation-outcome.json` for 30 days, including script failures; the job
summary also states the outcome. Failures before the script can run, such as
checkout/setup cancellation, cannot produce a script receipt and are not an
observation. Inspect the exact run/attempt, commit and both expected identities.
A failed script exits nonzero and retains only allowlisted categories. A valid
503 retains the validated unavailable phase in the failing receipt. An invalid
schema or wrong identity is not retained as a trusted observation.

HTTP 200 and a green observe-only job mean **observation returned**, even when the
seed is missing, incomplete or inconsistent. The receipt explicitly retains
`readiness: not-assessed`, `integrity: not-validated`, `claimedDelivered: false`
and `mutationAttempted: false`. Metadata/count consistency is not validation of
record bytes, provenance, factual currency, activation eligibility or durable
hosted behavior. Overflow counts are lower bounds. The engine/revision are those
of the deployed bundle, not a historical revision selected by the caller.

Keep this artifact separate from `publisher-outcome-RUN-ATTEMPT`; never submit an
observation as publication evidence. A controller looking only at workflow name
or green conclusion cannot distinguish this mode. The current pipeline diagnostic
already leaves delivery unverified; inspect mode and the separate artifact rather
than interpreting a green run as a successful stage. A newer observe-only run does
not resolve an earlier publication failure. Controlled run titles help operators
distinguish the modes, but titles are not trusted publication evidence. Other traffic may still seed
D1 during a no-write observation. The workflow retains the existing concurrency
group, which serializes its own runs but does not lock visitor traffic.

## Sequential delivery verification can write storage

`node scripts/diagnose-content.cjs https://versioncompass.com/` retains its existing
CLI and six evidence check names. The URL must be supplied deliberately for an
authorized rollout. Local preview remains the default; explicit HTTP(S) staging
origins remain supported. All request paths are generated locally, capped at 512
characters and restricted to the same origin and known content/fallback routes.
No response-supplied link is followed and no credentials are sent.

**This is not observe-only.** Valid content GET **and HEAD** can call
`ensureRevision` and initialize/write D1 before responding, including when active
delivery is off. The script uses valid GETs. Running it against production needs
the applicable release/verification authority; do not use it as an innocent
preflight while production is held. Client timeout/abort does not cancel server
initialization or prove whether storage work completed.

The verifier makes no parallel request, retry or warm-up. It stops all subsequent
requests after the first unsuccessful check, including timeout, transport error,
503, identity/digest/content mismatch or rejected guard expectation. Remaining
checks are explicitly skipped. Preserve the receipt and hold further probes while
reviewing matching authorized Worker evidence; do not automatically retry or
change a timeout into a claimed historical root cause.

Its finite limits are 10 seconds per request including body, 120 seconds for the
whole sequence, 64 requests, 16 MiB per body and 10,000 expected records. Injected
tests may reduce budgets but cannot increase them. Each stream has a byte cap;
redirects and changed response URLs fail closed. A larger future dataset or slower
sequence that exceeds a budget must stop for review rather than silently extending
it. Receipts contain only bounded identities, summaries, safe failure categories,
request paths and timings, never raw response bodies/errors or credentials.

Checks, in order:

1. Exact static manifest first, before a content API can initialize D1. Then D1
   health must match expected revision, engine, storage and count.
2. Exact full live manifest, including all dataset hashes and policy fields.
3. Exact full bundle manifest, recomputed whole globals/catalog digest, catalog
   schema, count and unique IDs.
4. Every unfiltered record in fixed pages of 200, with exact revision/offset/limit,
   every ID and full record matching the verified bundle once, plus an empty
   terminal page to detect extras. No sampled-only success. Then the bounded SOAR
   filter and invalid limit/offset/dataset/revision/engine, duplicate and unknown
   parameter guards.
5. POST to the public manifest must reject with 405. This method guard does not
   mean valid GET/HEAD are free of database writes.
6. All seven fallback adapters must match the local generated bytes by SHA-256.
   A generated-file marker alone is insufficient.

For the unchanged 922-record bundle, successful verification uses 26 sequential
requests, including six pagination pages (five containing records, one empty).
Neither successful timing nor a digest proves claim currency. These observations
are not an atomic snapshot and do not satisfy browser journeys, native exports,
real activation/rollback or active-reader atomic/fallback verification.

## Evidence and local checks

The separate private synthetic hosted test of the pinned main source completed
19 requests in 27.085 seconds, with maximum caller latency 7.066 seconds and a
922-record import in 19 batches. That evidence supports its synthetic test scope;
it does not explain the original production timeout, demonstrate cold-isolate
behavior or establish current production state. No two-warm-check latency SLA is
introduced by this tooling.

The added tests use injected fetch and local streams only, covering authorization
context/mode/ref/SHA, mutation-path exclusion, receipt redaction, incomplete and
unavailable observations, redirects, stalled headers/body, caps, full identities,
corrupt/duplicate/missing pagination and no automatic retry. Run:

```bash
node --test tests/observe-seed.test.cjs tests/diagnose-content.test.cjs
npm run maintenance:sync
npm run maintenance:verify
git diff --check
```

Local checks are not hosted verification. Exact-candidate CI/export artifacts,
review, authorized deployment, source/version reconciliation and actual live
readback still have their existing gates. This tooling leaves canonical factual
dates, admission pins, Worker code and engine/content identities unchanged.
