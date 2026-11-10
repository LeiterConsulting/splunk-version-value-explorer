# Read-only coordination observation and local CAS tests

This increment builds on the offline planner without activating it. Nothing is
scheduled or invoked automatically. No shared ref is created or updated, and
there is no Sites adapter, permission change, publication, or database action.

`observeRevision(request, {readJson, now, maxBytes})` accepts one fixed repository
and the allowlisted refs `main`, `coordination/offline-planner-20261110`, and
`coordination/versioncompass-writer`. The reserved coordination ref requires the
claim-state profile; other refs require source-identity. Expected commit, tree
and first parent must be supplied. Requests execute exactly six reads on success:
ref, commit, nonrecursive root tree, two blobs, ref. Any error stops immediately,
without retry. URLs are constructed internally; response URLs are never followed.

Claim-state requires exactly state.json and schema.json, both ordinary 100644
blobs, with a single-parent commit. Git tree and blob SHA1 object hashes are
recomputed. Remote schema bytes must exactly equal the reviewed local schema;
remote schema code/references are never loaded or executed. State JSON must use
exact `JSON.stringify(parsedState) + '\n'` bytes (no whitespace variants or
repeated keys), then satisfy the existing local schema/cross-field validator.
This is a new, unprovisioned metadata format, not an accepted migration of an
existing ref. No historical records are rewritten to canonicalize them.

Source-identity inspects root tree and AGENTS.md/package.json blobs only. It does
not validate the whole source tree or declare a metadata claim. Raw commit hash
reconstruction and signatures are not verified; commit/parent linkage remains
transport-observed metadata. Stable first/last ref reads are only an observation,
not a lease. The ref may change immediately afterward, including undetected
intervening movement back to the same SHA.

Each decoded JSON response is limited to maxBytes (1 KiB–1 MiB), complete root
trees to 200 entries, and observation to 30 seconds. A transport promise timeout
returns unavailable; it cannot cancel an already-dispatched external GET. No
further read follows. The injected transport must itself bound bytes before JSON
parsing; the module cannot stop allocation already performed by its caller.
Malformed UTF8/base64, symlink/submodule modes, truncated trees, wrong schemas,
ref movement, missing refs and transport errors fail closed. Connector error
text is not copied into receipts.

Outputs always retain transportOrigin, authority, claimOwnership and native
completion as unverified, and claimedDelivered false. A callback or self-supplied
capture cannot authenticate its own provenance. Native GitHub connector receipts
must be retained independently if this adapter is exercised by an authorized
external orchestrator. No real connector run is implied by synthetic tests.

`tests/coordination-git-cas.test.cjs` uses real subprocess Git update-ref with an
expected-old SHA in fresh temporary bare repositories containing synthetic
identities only. Tests assert one sibling winner, recognizable ref-contention
failure, delayed stale-writer failure after a subsequent settled commit, and
readback after a simulated lost acknowledgement. All repositories are cleaned up. Inherited GIT_* variables are stripped; only
explicit synthetic identities/configuration are supplied. Initialization uses an
empty template and every command uses an empty hooks path. Subprocess errors,
interruptions and five-second timeouts fail the test, not count as CAS losers.
A poisoned-environment regression checks a separate temporary repository remains
byte-for-byte unchanged. Discarded acknowledgement/readback leaves the existing
planner uncertain-write hold in place.
These tests prove local Git CAS behavior, NOT GitHub connector atomicity, remote
permissions, complete writer adoption, old-owner quiescence or Sites fencing.
The unchanged planner still prohibits clearing pending/uncertain actions without
a future authenticated recovery adapter. Normal Sites delivery remains separate
from the disabled database publisher, whose holds are unchanged.

## Explicit normalized-text connector mapping

The optional `readBlobText(url)` callback is separate from `readJson(url)`. When
present it must be a function returning only a JavaScript string, not metadata,
bytes or a tool-result wrapper. It serves only the two blob reads and shares the
same six-read count, deadline and no-retry behavior. No fallback path runs after
an error. Without this callback the strict raw REST JSON/base64 path is unchanged.

The current GitHub fetch connector may normalize blob results into decoded text
instead of preserving REST metadata. An external caller can explicitly select
this mapping and extract the normalized text. The adapter checks strict type,
UTF8 byte size, Unicode roundtrip (rejecting unpaired surrogates), and recomputes
the Git blob SHA against the independently pinned, rehashed tree entry. Truncated,
changed or otherwise lossy text fails. No sha/size/encoding service metadata is
fabricated. Schema bytes must still exactly match the reviewed local pin.

The result records `blobRepresentation: normalized-utf8-text-hash-verified`.
This establishes byte identity against the supplied tree pin only, not original
service JSON, service authentication, transport provenance or publication rights.
Actual connector evidence must be retained separately by its caller; callback
fixtures do not assert that a real connector capture has succeeded.
