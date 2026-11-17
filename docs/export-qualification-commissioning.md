# Original-export qualification workflow commissioning

The existing disabled publisher workflow now has a proposed manual
`qualify-exports-only` job. This connects the existing real original-byte
acquisition, pinned offline signature verification and export checker to their
intended runner. It is not another authority validator or a completed issuer.
Nothing in this change enables or dispatches the workflow or changes production.

After merge, an authorized commissioning execution would select the exact main
commit and its successful push validation run, both attempt 1. The dedicated job
has only contents/actions read permission, no OIDC capability, and never enters
the legacy publisher job. Its trusted input guard precedes acquisition. Existing
qualifier logic independently acquires and rechecks moving main, exact run/jobs,
original artifact metadata/ZIPs and source tree. Failure holds; no retry, admission
or D1 operation follows. The official verifier archive and binary are hash-pinned;
the retained trust-root review deadline remains November 23 and is not extended.

The exact fixed-name artifact `qualification-<run-id>-1` contains only the real
`qualification.json`. The fixed job is `qualify-exports`; its upload step is
`Retain fixed original-export qualification`. Separate `qualification-audit`
artifacts retain original ZIPs, original attestation, service observations and
partial-failure evidence under existing repository artifact access and 30-day
retention. No token or request headers are written into these outputs. Failure
before output creation produces no audit artifact. Missing audit is not success.

## Still disconnected, deliberately

There is no request job, private intake endpoint, issuer CAS, preparing admission,
semantic authority or production activation in this increment. A later protected
intake must review and pin the complete workflow/dependency graph, not merely trust
the job and artifact names. Existing workflows with broad repository privileges
remain part of the GitHub trust boundary. The separately uploaded audit artifact
is not the intake authority artifact.

Two concrete connection prerequisites remain: a supported scoped Actions-read
credential for the private server, and supported machine authentication to the
owner-private Sites dispatcher. Assistant connector access is not a provisioned
server credential; a short-lived local Sites probe token is not a durable runner
integration. Never make the site public, repurpose issuer tokens for GitHub API
access, or enable another workflow to bypass these boundaries.

Authenticated semantic candidate scope/assessor provenance, current runtime/head,
applicable rollback and stop/recovery authority remain separate requirements.
PR199 continuity is not semantic admission. A passing qualification execution
must still report admission held and productionActionAllowed false.

## Verification and commissioning status

Local dispatch/graph tests and existing producer tests precede source review.
Exact-head CI and an authorized real manual execution are distinct later gates;
neither is claimed from the draft. Existing workflow enablement remains unchanged.
