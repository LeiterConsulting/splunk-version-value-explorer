Describe the concrete change and its evidence scope. Open automation PRs as drafts.

- Source claims: exact official sections, versions/components, assessment dates,
  uncertainty and affected decisions (or explicitly no factual change).
- Coverage/native feed: retained run, mandatory dispositions, checkpoint and any
  finite pending-provenance follow-up.
- Candidate: exact head SHA; isolated preparation, full tests/build, push/PR CI;
  first failed/skipped/cancelled checks remain visible.
- Exports: exact run/attempt, ZIP digest, repository verifier result and separate
  visual review or its limit.
- Delivery: repository, D1 stage/activation, Sites runtime and live readback as
  separate states; do not infer delivery from a green publisher job.
- Recovery: known verified baseline, remaining blockers and accountable follow-up.

Follow [automation operations](../docs/automation-operations.md). Do not merge,
deploy, change schedules, credentials or security settings without authorization.
