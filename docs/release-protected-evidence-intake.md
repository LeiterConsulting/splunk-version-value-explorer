# Inactive protected export-evidence intake

This increment implements a protected **read-only evidence intake**, not an
admission issuer. It is not imported by Worker builds or workflows. It has no D1
argument, route registration, schema migration, writer, credential provisioning,
workflow activation or production default. Even authenticated acquisition returns
`admission: held`; no preparing row can be created.

## Concrete transport contract

`createProtectedExportIntake` takes trusted server configuration, not HTTP input:
reviewed source commit/tree, raw publisher workflow SHA256, qualification job and
upload-step names, a server-side repository Actions-read credential and transport/
clock dependencies. The complete pinned tree and dependency graph must be reviewed
for exclusive uploader ownership, including actions/reusable workflows/dependency
integrity. Matching names alone is not such a review. No actual current workflow
is allowlisted by this increment: the qualifier/request job split is absent.

The future workflow must upload **only `qualification.json`** from the existing
`qualify_admission_exports.py` output as an artifact named
`qualification-<publisher-run-id>-1`. The implementation consumes that actual
producer schema, including its five missing-authority labels. It does not invent
an admission receipt. Do not upload the full producer output directory, which
contains the much larger original export and signature files. This packaging step
is a future reviewed workflow change, not present functionality.

The callable handler accepts an empty POST at `/internal/qualification/intake`,
with exactly one Bearer token and no browser Origin, URL query, request body,
artifact selector, owner/epoch or authority fields. This is a proposed path inside
an unregistered function, **not a deployed endpoint**. Fresh issuer signature,
repository IDs, audience, main source and reviewed workflow pin precede acquisition.
Only attempt 1 is accepted; reruns hold.

The server independently reads fixed GitHub repository endpoints for main, current
publisher run and attempt, commit/tree, exact workflow bytes, completed unique
qualifier job/upload step and exactly one fixed-name artifact. It downloads the
original ZIP through one allowlisted service redirect, strips its API credential
before storage access, verifies the API SHA256/byte count, and decodes exactly one
bounded `qualification.json`. Publisher and validation run identities remain
separate. Original validation run/attempt and export artifact metadata are checked
against the runner assertion as well. Source/run/job/artifact facts and fresh token
validity are rechecked after acquisition, including token expiration during the
last JWKS fetch. Mutable execution duration and unrelated jobs are not authority
facts and are not treated as drift.

The code caps acquisitions at 32 fetches / 60 seconds, each API JSON at 1 MiB,
original qualification ZIP at 256 KiB and expanded qualification at 64 KiB. Body
reads have deadline races, including issuer JWKS. ZIP layout, local/central
agreement, name, method, CRC, size, encryption, ZIP64 and extra-entry rejection are
checked. JSON rejects duplicate keys, malformed UTF-8 and excessive nesting.
No issuer token is forwarded to GitHub or storage. Raw errors, API credentials,
signed storage URLs and acquired evidence are not returned by the HTTP handler.
The internal acquisition result retains original ZIP/qualification bytes for a
future protected evidence store; this increment does not create durable storage.

The current Worker has **no server GitHub Actions-read credential**. The connected
assistant's GitHub access does not automatically supply one. Before any deployment,
a narrowly scoped supported server credential/installation capability needs its
own approved provisioning and rotation plan. This patch does not ask for, mint,
store or grant that access. Publisher OIDC cannot be substituted as a GitHub REST
API credential.

## What the trust assertion means

The authenticated GitHub control plane plus the complete reviewed runner graph is
the authority for the acquired assertion. It is not an independent Worker-side
Sigstore verification of the original 457 MB archive. The source-pinned producer
performed that heavy verification; the server verifies its provenance and the
original small result bytes. Compromise of GitHub or the approved runner graph is
outside this trust model. The OIDC signature does not sign arbitrary request JSON.

The result explicitly records `github-control-plane-and-reviewed-runner` trust and
`runnerAssertion`. It never upgrades the producer's signature fields into a new
independent cryptographic verification claim. Export verification does not supply
semantic approval, current runtime consistency, rollback safety or stop authority.

## Exact remaining path to preparing admission

The remaining gaps are executable contracts, not an instruction to turn held
booleans into true values:

1. **Semantic/policy evidence producer.** Extend the reviewed qualifier job to run
   the existing coverage/native-feed and scope-specific review gates over the
   canonical candidate and exact report inputs. Retain original assessor outputs,
   assessed claim dates/scope, coverage-policy revision and source/tree hashes.
   `check-soak.cjs --exports`/structural readiness alone cannot manufacture a new
   semantic review. Define the independent assessor identity and how its approved
   scope is authenticated before emitting any complete-admission schema.
2. **Runtime/head adapter.** Acquire exact Sites deployment/source/environment
   revision from its authenticated control plane and actual D1 channel head,
   generation and controls from the sole server writer. Retain original responses
   with acquisition times. Build schemaVersion 2 `createBinding` input, then run
   `compareLive` on freshly acquired state. Unknown head is not absent. The current
   binding module is Node/CommonJS, so construct the binding in the reviewed Node
   qualifier and explicitly verify its canonical fields/identity at the server;
   do not silently invent a second planner. Specify bounded freshness and drift
   coordination, because a remote runtime snapshot is not atomic with D1.
3. **Rollback adapter.** Bind a retained actual compatible runtime/archive/schema
   and content rollback target, source/engine identities and real private rollout/
   interruption/readback qualification. Private history-insert failure proves a
   transaction rolled back, not that a production runtime/schema downgrade is safe.
   Existing v299 is not automatically a compatible fenced-runtime rollback.
4. **Policy/stop authority.** Define authenticated stop and explicit recovery
   administration and retain its monotonically increasing revision. A request or
   qualifier cannot clear a stop. The server must read the actual local revision
   and include it in the same conditional decision transaction; a runner snapshot
   or synthetic hash does not establish that current authority.
5. **Immutable audit + CAS constructor.** Add a separately reviewed local audit
   record covering denied/uncertain pre-admission evaluations, with evidence-store
   references and immutable bytes. Current history only accepts preparing/admitted/
   consumed; do not insert a fake preparing state just to audit a denial. After all
   gates, derive owner from verified repository/workflow/source/run/attempt, derive
   one stable operation identity from that principal and full canonical binding,
   and allocate `MAX(retained channel epoch)+1` under a single conditional
   transaction. That transaction must compare current channel owner/state, expected
   head/generation, retained epoch and stop revision; retain decision/evidence and
   initial history atomically. Existing unique `(channel,epoch)` and immutable
   decisions are necessary, not a complete issuer CAS. No resetting stopped rows,
   replacing history, automatic retry or minting another operation after uncertainty.
   Lost outcomes reconcile the same immutable operation read-only.
6. **Real execution qualification.** Review qualifier/request workflow split and
   all actions/dependencies, pin the actual final source graph and provision only
   the approved narrow service capability. Use a fresh authorized workflow/OIDC
   execution against the private test route, with original raw receipts and hostile
   cases. The previous commissioning token is expired; test signing keys do not
   substitute. None of these workflow/route changes or executions occur here.

Only after this full path is reviewed and qualified can the existing stamped
preparation/seal/bootstrap adapters be called. Production migration/runtime gates
remain separate. A compromised unrestricted D1 binding remains privileged; SQL
namespaces and readable owner stamps are not capability separation.

## Verification scope

Tests use ephemeral RSA signatures and exact service/producer fixtures, exercise
original ZIP decompression and provenance checks, and reject body authority,
reruns, mismatches, duplicate artifacts, hostile redirects, mutated ZIP/JSON,
service drift and final-fetch token expiry. A separate local actual-workerd smoke
runs the entire 24-fetch fixture path with native deflate-raw decompression.
These are implementation checks, not real issuer commissioning or a deployed
endpoint. No producer job graph, new credential or admission has been created.
