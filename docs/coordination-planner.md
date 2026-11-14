# Offline coordination planning (not activated)

`scripts/lib/coordination-planner.cjs` is a transport-free, opt-in review aid.
Nothing invokes it automatically. It creates no branch, claim, timer, scheduler
change, merge, Site version, deployment or database write. All outputs retain
`authority: unverified`, `claimOwnership: unverified`, `nativeCompletion:
unverified`, and `claimedDelivered: false`. `eligible` means only that supplied
facts are internally suitable for independent review, never permission to act.

## Interface

- `validateRecord(record, {now, maxAgeMs})`: validate an allowlisted v1 claim-state
  or observer-work record plus cross-field consistency and explicit freshness.
- `planTransition(previous, next, context, expectedRef)`: propose an append-only
  state transition with increasing sequence and acquisition epoch. This does not
  implement Git compare-and-swap or inspect any remote ref. An idle/settled to
  claimed transition is acquisition; every active owner/candidate/invocation/
  authorization/resource binding must be present and immutable thereafter.
- `planPublication(facts, context)`: review supplied assessment/check/readiness
  facts. Handoff requires an own terminal report; in-run review requires the
  actual producer still running and invocation ownership. Neither path converts
  a source assessment into native completion or customer delivery.

All booleans are required and strictly typed; unknown fields are rejected.
UTC timestamps use `Z`, with up to three fractional digits; malformed, future and
stale observations fail closed. Higher-precision receipt timestamps are rejected rather than truncated.
This new receipt format is separate from native attempt identity matching. Callers must retain the
original full-precision strings for existing task-runtime identity checks.
The schema validator implements only the keywords present in the pinned local
schema, not arbitrary external JSON Schema documents. No external refs load.

Digests have format validation only. Candidate ID, evidence digests, report
fingerprint, authorization and all supplied booleans are assertions, NOT
cryptographic/source authentication. Deterministic candidate identity derivation,
service adapters, authenticated exact-main/CI/artifact/Site matching, and trusted
native result extraction are deliberately deferred. Existing `task-runtime`
wrong-owner/duplicate/stale-result checks remain authoritative and unchanged.
A new candidate requires a newly reviewed identity and fresh evidence; this
module rejects changing any candidate field in an active claim.

Pending or uncertain writes are sticky. There is deliberately no authenticated
outcome/recovery adapter in this slice, so the planner cannot clear or replace a
pending action, release an uncertain claim, or accept a new delivery outcome.
Even a schema-valid asserted success cannot clear it. A later implementation
must bind actual outcome to exact action, candidate, owner and epoch, and prove
old-owner quiescence. An elapsed attention deadline never grants takeover.
Observer receipts retain explicit null native identity; non-null native identity
and claimed approved-baseline matches are rejected until independent adapter
verification exists. Read-only work may be complete while native completion,
notification, baseline, assessment and delivery remain unverified.

## Intended later adoption, not supplied by this patch

The shared window should cover main merge through exact-main validation and
Sites save/deploy/readback. Draft branches/source review remain parallel.
Expected-SHA/non-forced metadata-only ref updates could coordinate cooperating
writers, but no ref is provisioned here. Sites has no server fencing parameter;
creating a ref alone does not solve old-writer quiescence or unattended safety.
Every normal writer must adopt before claiming mutual exclusion. Contenders
retain candidates and defer to an existing authorized continuation/review, no
busy polling, timer or automatic transfer of publishing authority. Claim release
does not wake a waiter. Guaranteed immediate follow-through is not implemented.

Due classification/adaptive prioritization is outside this minimum slice.
Future ranking must use actual recurrence, timezone, flexible timing, evidence
freshness, dependency readiness and existing caps; off-day/unknown/late flexible
runs are distinct. It must not move publication to the read-only auditor, grant
new authority or bypass required checks.

Normal deployment-pinned Sites delivery stays separate from the disabled
independent database publisher. Both publisher holds and active-delivery state
are unchanged. No workflows, saved prompts, cadence, permissions, canonical
content, publication history or runtime files are changed by this module.

Run `node --test tests/coordination-planner.test.cjs` or the existing `npm test`.
All fixtures are synthetic. No private native identities or prompts are included.
