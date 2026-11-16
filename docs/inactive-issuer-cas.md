# Inactive issuer identity, audit and atomic admission primitive

This is a privileged, **inactive reference**, not an authenticated admission
service. Nothing imports it from the active Worker or workflow. No schema is
installed, credential granted, route published, publisher enabled or production
content changed by these files. Protected export intake remains read-only and
cannot call this primitive. Synthetic test decisions are not genuine authority.

## Explicit trust boundary

`scripts/lib/issuer-intent.cjs` verifies the existing fixed GitHub publisher OIDC
policy with a bounded JWKS acquisition and final expiry check. It requires
attempt 1 and source/workflow commit agreement, reuses schema-2 `createBinding`
and `compareLive`, and deterministically hashes the signed principal and binding
into owner and operation identities. Caller owner, epoch and admitted fields are
rejected. A signed principal and structural binding do not establish semantic,
runtime, rollback or stop authority. The result says `authority: not-established`.

`retainTrustedIssuerRequest` accepts an explicitly privileged server decision as
an upstream dependency, not a verified callback or HTTP body. Its evidence,
policy, runtime and rollback digests are commitments, not proof by themselves.
It must never be wired to the current incomplete export intake. Real authority
must independently acquire and validate every required observation before this
call: preparing already permits staging writes.

## Storage and installation contract

Apply only in a separately authorized inactive database, after publication,
fence, retained-history and seal schemas. The supplemental SQL adds immutable
request, commit, audit and stop-event tables. Initialization requires an explicit
revision-0 unstopped stop row from the authorized administrator. An absent or
unreadable row is unknown, never permission. Later stop revisions must advance
exactly one; stopped is sticky. There is deliberately no stop-clear, history
reset, owner takeover or retry endpoint.

Unclaimed legacy preparing/admitted admissions are preserved but frozen by
supplemental guards on staging, binding, seal, publication and consumption.
Consumed baseline history remains intact and can precede an exact-identity
successor. Do not install assuming that an in-flight legacy writer will continue.
Installation and any legacy recovery require their own reviewed operational plan.

The single commit INSERT atomically checks actual nullable head, generation,
retained maximum epoch, exact consumed current owner/operation/epoch (or true
bootstrap absence), and explicit stop revision. Epoch is derived from retained
history, bounded to safe integers. Its trigger installs preparing admission,
retained history, binding and commit audit together; any failure rolls back all
of them. Two contenders cannot both advance the same precondition. This local
transaction cannot make remote runtime observations atomic or fresh.

## Denials and uncertain outcomes

Denied/uncertain evaluations live in a separate immutable audit table, not fake
admission rows. They prevent reuse of either the operation or its channel/binding
under another owner. Audit fields contain bounded identities, digests and reason
enums only, never bearer tokens, credentials or private raw evidence.

Writes require a successful native result. D1 counts trigger changes in commit
metadata, so commit accepts a positive safe-integer change count rather than
assuming exactly one. A missing/failed result is uncertain, not saved. After a
lost response use `reconcileIssuerCommit` for the **same operation**, read-only;
never allocate another operation or epoch automatically. Reconciliation checks
complete immutable decision/binding/audit identities and retained history. An
uncertainty observation does not erase a claim that actually committed. Historical
commit does not imply current admission, completed publication or delivery.

## Remaining complete-issuer integration

1. Provision the reviewed, fixed qualifier workflow/artifact packaging and scoped
   GitHub read credential described in `release-protected-evidence-intake.md`; acquire and
   validate original bytes, publisher context and independently pinned source.
2. Implement real semantic-policy evidence acquisition with participating-watch
   coverage, exact candidate/rollback binding, and assessment freshness checks.
3. Acquire actual hosted runtime/control and rollback observations; bind their
   exact identities and freshness limits. Obtain current authorized stop policy,
   not a request boolean. Preserve acquisition receipts outside public audit.
4. Construct the complete trusted decision from those verified observations,
   derive signed principal identity, read the real local precondition, and retain
   and commit the request. Denied and uncertain paths audit without staging.
5. Reconcile the claim, prepare canonical content, acquire/recheck real seal
   authority, seal, and use the existing fenced bootstrap/promotion adapters.
   Independently qualify hosted races, rollback, stop and ambiguous-write paths
   before any active import, endpoint, credential or production activation.

These are missing integration/authority gates, not defaults supplied by this
primitive. There is no production-ready issuer claim.

## Verification

`node --test tests/issuer-cas.test.cjs` exercises actual SQLite transactions:
identity verification, malformed/expired tokens, deterministic binding, immutable
audit, denied/uncertain reuse, lost-result reconciliation, contention, stale
head/owner/generation, sticky stop, integer exhaustion, legacy freeze and atomic
history/binding/audit failures. The positive path uses actual canonical bundle
validation, `prepareFencedBatch`, seal SQL, `bootstrapFenced` and consumed history.
A separate local actual-workerd D1 qualification exercises native trigger change
counts and transactions, including that full downstream path and stop-history
failure. Both use explicitly synthetic authority, not genuine semantic admission.
