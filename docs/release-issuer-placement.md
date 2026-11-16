# Admission issuer placement and evidence handoff (inactive design)

This design creates no authority, workflow mode, route, credential, migration or
deployment. Existing publisher workflow enablement remains unchanged. Do not
create even a `preparing` admission while authority gates are missing: preparing
already permits stamped content writes.

## What has actually been qualified

Main `aafd8b62b7fb1920677141749491b3cee0098c2f`, validation run
`43956953910` attempt 1, produced original export artifact `14272997474`.
Independent original ZIP inspection, pinned signature verification and 226 export
cases passed. Modified ZIP, predicate, signature and wrong-run tests held. This
qualifies original artifact evidence, not semantic admission or production delivery.

The separate owner-private D1 harness exercised canonical JS bootstrap with the
reference fence/history/seal SQL. Its admission was explicitly synthetic. It
does not qualify an authenticated admission issuer. The historical real publisher
commissioning run `43907989048` establishes historical identity observation, not
current authority; its token cannot authorize another operation.

## Computation placement

Prefer the existing approved GitHub publisher runner as the evidence producer.
It already has Node and read-only repository/actions access and declares GitHub
OIDC support. A reviewed inactive producer can use the existing bounded original
ZIP acquisition/inspection and pinned Python/gh verifier without inventing a new
host. No workflow is enabled or dispatched by this proposal. Acquisition runs
before obtaining a fresh short-lived token for the final protected request.

Retain original source/tree, run/attempt/job observations, original artifact
metadata/bytes, signature envelope, measured payload manifest, export results,
semantic review scope, policy revision, exact runtime/environment/head and
rollback readbacks. Recheck moving main, service run state and readbacks after
expensive verification. Preserve acquisition times; sequential reads are not an
atomic remote snapshot.

The producer must reuse `createBinding` schemaVersion 2 and `compareLive`. These
functions validate structure and drift, not authority. The publisher workflow
(`publish-content.yml`) and validation signer (`validate.yml`) have distinct run
IDs and roles. Bind their independently verified source commits/workflow SHAs;
never substitute the publisher run ID for the validation run.

## Cryptographic handoff is not yet implemented

The existing export-upload attestation has a deliberately closed schema and
predicate type. It binds original export bytes and upload attempt. It does not
sign an admission decision, policy, semantic review, live runtime or rollback
snapshot. Do not add fields silently or treat its signature as covering them.

A future admission-evidence predicate requires a separately reviewed type and
strict canonical schema, including the original evidence hashes, complete release
binding, exact producing workflow/source/run/attempt and all policy/runtime/
rollback/semantic bindings. Missing evidence must prevent predicate production,
not become a signed `false`/`unknown` permission or fabricated success. Signing
does not independently establish the truth of a compromised producer's claims.

The selected minimal handoff can use GitHub's authenticated control plane rather
than adding a Worker Sigstore verifier. This explicitly trusts GitHub and the
entire reviewed allowlisted workflow/dependency graph as the evidence authority;
it does not claim OIDC cryptographically signs arbitrary HTTP receipt JSON.

A future pinned workflow has a qualification job, followed by a separate narrow
request job. The server verifies a fresh OIDC identity from the latter and derives
the run and source itself. It independently reads that exact attempt, the known
qualification job and upload step, and exactly one fixed-name evidence artifact.
Only attempt 1 is accepted. The source/tree/workflow must match the reviewed pin,
with no untrusted alternative uploader paths. The server downloads original bytes
from a fixed service-selected artifact, verifies the API digest/size and complete
strict schema, and rechecks attempt/source afterward. It accepts no caller-selected
receipt body, artifact URL, authority boolean or alternative run.

GitHub artifact metadata alone does not prove upload attempt. Attempt-1-only
execution plus the exact approved job/upload graph and no other uploader paths
are essential; ambiguous or missing artifacts hold. Expiration or deletion does
not authorize recreating evidence. Original evidence must be durably retained by
the authority with observed times and immutable hashes. A compromised approved
workflow or GitHub control plane is outside this assurance, and must be stated.

The private-route acquisition policy and pinned workflow graph are not implemented
by this slice. A separate new admission Sigstore predicate is optional additional
proof, not a substitute for missing authority adapters. If selected later it needs
a compatible verifier: the existing pinned Python/gh cannot run inside the Worker.

Do not grant broad D1 credentials to the GitHub runner to avoid this boundary.
Do not forward the publisher token to GitHub APIs or an arbitrary evidence URL.
The eventual private route must acquire evidence from fixed sources and derive
owner from fresh verified claims, not request-selected owner/epoch/admitted flags.

## Database and administration boundary

After every external authority gate passes, the sole server-owned writer may
allocate a monotonically increasing epoch against retained channel history using
one compare-and-swap transaction. Admission intent, evidence binding and initial
history must commit together. A stop revision must be checked in that transaction.
The current reference's preparing/admitted/consumed states do not by themselves
retain every denied or uncertain pre-admission attempt; that audit contract still
needs implementation. Never replace or delete prior decisions to retry.

Canonical preparation/readback precedes the existing seal transaction. Missing
semantic review, current service snapshot, stop/recovery authority or qualified
runtime/schema rollback prevents preparing as well as admitted. v299 is not
automatically compatible with the fenced schema. Unknown writes reconcile by
read-only immutable operation identity; no automatic replay.

Triggers protect supported writers and races, not malicious code holding an
unrestricted D1 binding. Namespaces do not create capability isolation. Fresh
remote runtime observations cannot be made atomic with D1 by hashing them or
placing their hashes in a transaction. A concrete bounded freshness/drift policy
and sole-writer release coordination must be qualified separately.

## Smallest useful implementation sequence

1. Automate the existing genuine original-artifact acquisition and verification
   in an inactive runner producer, retaining original service/byte provenance.
   This replaces manual assembly, not admission authority.
2. Define and review concrete semantic, runtime, rollback and stop authorities;
   do not substitute injected callback fixtures or caller JSON for these adapters.
3. Qualify the fixed-source GitHub handoff and pinned job graph above. Then implement the
   canonical admission-evidence producer and the narrow server-owned constructor
   together, including immutable denial/uncertainty records and epoch CAS.
4. Review an explicit workflow patch and private test route. Run a fresh approved
   publisher execution and adversarial isolated tests before any production
   activation request. Preserve the existing workflow-disabled boundary until
   independently authorized execution is available.

This is an architecture checkpoint, not a completed issuer. No production action
or delivered state follows from this document.

## Inactive original-export producer

`scripts/qualify_admission_exports.py` is not imported by any workflow. It uses
server/workflow-selected validation run and local paths, validates the publisher
runner context and clean exact checkout, independently acquires validation run/
attempt/jobs and original export/signature artifacts, invokes the pinned verifier
and existing export checker, and rechecks moving service state. A new output
directory retains original bytes and before/after service observations. Failure
preserves partial evidence and does not retry or create admission. No publisher
OIDC token is requested, no semantic/runtime/rollback claims are fabricated and
no complete admission predicate is signed. This is reusable evidence acquisition,
not an issuer or an authenticated HTTP API. Local environment variables alone are
not authentication; the future server handoff must independently validate the
actual GitHub run/source/job graph above.
