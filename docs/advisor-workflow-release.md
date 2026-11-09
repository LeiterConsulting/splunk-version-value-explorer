# Advisor candidate release and rollback

## Candidate identity and local verification

The source basis is main commit `2df5510ac9ac4f31a0702a174fe996a8aa167d0f`,
tree `01ceeb458e47d10f65c7a22698d8854faa1c6651`. Frozen R3 engineering review
accepted the current AI scope wording, host-evidence preservation and editor
ownership repairs. The sanitized commit preserves that behavior, normalizes only
terminal blank lines in three workflow sources, and regenerates their assets.
Packaging removes unused examples/caches/private engineering notes, relocates a synthetic
compatibility fixture without its captured report, and adds these public contracts.
The actual candidate commit/tree, changed-file allowlist, full raw-byte manifest and
R3 delta belong in the external review receipt, avoiding a self-referential hash.

Use a checkout of the exact candidate. Before committing, run
`npm run maintenance:sync`, then `npm run maintenance:verify`. After committing,
repeat the check/complete unit/build gates against clean committed inputs and run:

```bash
npm ci --prefix tools/export-verification
tools/export-verification/node_modules/.bin/playwright install chromium
node tools/export-verification/verify.mjs
node scripts/export-evidence.cjs export-artifacts
```

Poppler (`pdftoppm`, `pdftotext`) and Python are required. The matrix covers the
existing site, guided comparisons, native replacement route, both themes/phone
layouts, explicit legacy/profile recovery, history ownership, Guide handoff,
relevant host withdrawal/missing evidence, and independent offline/PDF reopening.
Artifact checks verify every raw hash and bind actual commit/tree plus export-input
fingerprint. Inspect novel layouts separately; counts are not semantic review.
Retain failed/interrupted attempts distinctly from final passing evidence.

For local review, `npm run dev -- --port 4173` serves the built Worker at
`http://localhost:4173/?view=advisor`. The blank standalone file opens directly
offline. No installation data or customer fixture is required. Optional operator
brief feedback can proceed independently and is not an engineering hold.

## Remote CI boundary

The existing `validate.yml` runs on `push` and `pull_request`, tests/builds the
candidate, renders native exports, validates the artifact and retains it for 30
days. A later separately authorized non-force push to a new feature branch gives
exact-head validation. PR validation uses a distinct merge commit and must be
reported separately. Download the verified run's artifact, verify its archive digest
and run `scripts/export-evidence.cjs` in the same candidate checkout. Local evidence
does not establish authenticated GitHub Actions provenance.

This repository is public: a branch push discloses committed source/tests/docs,
CI logs and uploaded artifacts. Review the explicit allowlist and sanitizer receipt
first. Read-only connected access does not prove CLI push authentication or branch
protection settings. A local-only commit has no remote CI until an authorized
remote write occurs. Do not dispatch workflows to bypass that boundary.

`publish-content.yml` listens to validation completion only for main, plus manual
dispatch. Its automatic/default publisher has an explicit pre-request hold.
`prepare-publication.yml` is separate manual preparation for an exact main SHA.
Neither is ordinary feature-branch validation. Do not enable/dispatch either,
alter the hold, or infer hosted status from source. No deployment workflow is added
to the branch-validation contract. External GitHub App integrations are not
enumerated by this source review.

## Ordered review and publication gates

1. Reconcile fresh main and the exact candidate delta; preserve concurrent work.
   Validate the sanitized source/fixture boundary and inspect unchanged R3 inputs.
2. Obtain authorized exact-head CI and independent artifact validation. Re-review
   any changed runtime or report inputs. Resolve applicable failures; refresh only
   actually reassessed factual sections if their review windows expire.
3. Obtain explicit repository integration/publication approval. Reconcile main
   again, validate the resulting integration commit and retain the prior complete
   verified source/artifacts. No PR/merge authority is implied by local readiness.
4. Resolve the separate site-wide production hold with its owners and existing
   evidence requirements. Runtime release, repository integration, content/D1
   publication and active-reader activation are distinct. Do not use public content
   requests as no-write diagnostics. No new production request is authorized here.
5. Only after separately authorized publication, verify actual saved/deployed
   version and source identity, exact live assets/manifests, affected navigation,
   private handoff and exports. A green job alone does not establish delivery.

No mandatory elapsed-time gate is introduced. Scheduled responsibility remains
inactive pending its own configuration/readback and real-run evidence; full active
delivery is not an added candidate-review prerequisite. A release date remains
uncommitted while approval/hosted gates are outstanding.

## Rollback

Before a release, record the immediately preceding complete verified source commit,
tree, hosted version and artifact digests. The November 9 basis above is a source
comparison target, not a claim about the live deployment. Rehearse both routes and
legacy/profile intent against the selected restore bundle locally.

For an evidenced regression, restore the coherent prior router, shell, generated
assets and canonical bundle with their original dates. Revert the bounded feature
delta on fresh main or construct a reviewed restoration that preserves unrelated
newer changes; never force-reset main or restore only one JavaScript file. A
deployment rollback requires separate authorization and verification. It must not
delete browser-local profiles/private files or reinterpret private briefs. Existing
captured standalone snapshots retain their stated engine/source identity.

Record the actual restore commit/tree, CI/artifact evidence, hosted result and
remaining uncertainty. Missing tooling alone is not evidence of a production
regression. No automatic rollback, publisher change or production action is enabled
by this document.
