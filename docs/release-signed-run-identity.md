# Inactive signed run identity inspection

This isolated reference is not imported into the Worker, release workflow or
publisher. It preserves the current fixed GitHub issuer, repository IDs, main
workflow ref, audience, signature and expiration checks. A regression test binds
its verifier to the active implementation apart from the named identity extension.
No existing verifier semantics are changed by adding this module.

The reference requires signed run_id and run_attempt as canonical positive decimal
strings of at most20digits and workflow_sha as a40character lowercase hex SHA.
Strings avoid rounding identifiers. The returned immutable record preserves these
claims but separately marks serviceRunVerified, artifactUploadAttemptVerified and
productionActionAllowed false. workflow_sha is the executing workflow revision,
not necessarily the candidate commit, and is never silently substituted for it.

A valid signature authenticates the issuer's claims. It does not prove a particular
validation run completed, an artifact belongs to that attempt, or a deployment
occurred. Independently fetched exact run/attempt and original artifact provenance
must establish those facts. matchExpectedRun is only a structural field comparison;
it accepts neither service authority nor permission from caller assertions.

Tests use an ephemeral synthetic RSA key and fixed responses, not real credentials
or live issuer qualification. Wrong issuer/audience/repository/workflow/ref/event,
expired tokens, modified signed run attempts, malformed identifiers and redirects
fail. No route, credential, workflow trigger, activation or public-site change is
included. Existing denied operations remain denied. Next: bounded authenticated
service evidence acquisition and read-only shadow admission before any write path.

The fetcher and clock options are trusted test/runtime dependencies, never request
input. Synthetic tests intentionally supply a fixture signing-key response. A
future admission route must bind the real fixed issuer fetch and trusted finite
clock internally; exposing these options would defeat identity/time guarantees.
