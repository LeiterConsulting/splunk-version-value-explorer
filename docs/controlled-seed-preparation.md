# Controlled bounded deployment-seed preparation

Public content GET/HEAD no longer initializes or repairs D1. Missing or incomplete
bundled seed returns unavailable while static bundled assets remain usable.
Unpinned active delivery still requires its verified publisher head/provenance.
This changes readiness semantics deliberately: probing health is not a write.

The manual resume-only workflow mode prepares only the exact currently deployed
bundle, bound to the reviewed deployment record and current validated main
candidate. Server-side GitHub OIDC authentication and exact repository/CI
verification precede database writes. A maintenance secret alone is not accepted
for this new route. Default/automatic publication remains held.

Each dispatch makes one bounded POST, no loop or retry. It may create one immutable
incomplete revision row and insert at most 50 previously missing records, then
read back the complete bounded projection. Existing rows must exactly match the
seed; schema, manifest, bundle, identity and duplicate/extra/corrupt rows are
checked. Missing revision plus orphan records rejects before creation. Only full
exact projection integrity permits completion marking. Supported writers are
append-only conflict-do-nothing writers; arbitrary concurrent administrative SQL
mutation is outside this qualification.

Partial progress is not completion, readiness, publication or delivery. A timeout
can follow committed work: preserve its receipt and inspect metadata/counts before
another explicitly authorized dispatch. Do not automatically retry a lost response.
No publication pointer, event or provenance is created here. Existing historical
partial seeds are neither selected nor deleted. Bootstrap/head history remains a
separate explicit step after exact seed preparation.

## Release and use
Code integration changes the engine naturally. Deploy the exact tested runtime
with both reader and publisher activation flags disabled, save a truthful
deployment-identity record, and verify those identities. Old v295 partial storage
remains unchanged. New runtime seed preparation starts independently.
Run one reviewed resume-only dispatch at a time; retain run/attempt receipt.
Budget at most ceil(recordCount/50) successful batches for an empty seed, stopping
on any rejection/uncertainty until reconciled. Each request retains existing
10-second request/20-second total caller limits; bounded rows do not guarantee
hosted latency. No caller timeout extension masks an unresolved D1 issue.

After preparation, independently verify full immutable data, then separately
qualify bootstrap, authenticated head, public reader/fallback/report exports and
rollback before requesting reader activation. This implementation is not hosted
D1 performance evidence, scheduler execution, activation approval or completed
recovery of an older revision.
