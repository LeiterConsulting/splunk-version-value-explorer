# VersionCompass public issue feed

Contract version: **1.0.0**. Transport: **read-only, commit-pinned repository JSON**.

This feed supports discovery and assessment of issues identified by VersionCompass:
conflicting statements, suspected errors, uncertain claims and bounded coverage
gaps that affect a reader's decision. It publishes evidence and independent public
observations, not instructions to close work or a guarantee of product availability.
Any consumer can use it. No consumer identity, operational state or private evidence
is part of the publication contract.

## Supported entry points

Repository: `LeiterConsulting/splunk-version-value-explorer`.

| Path | Purpose |
| --- | --- |
| [`feeds/issues/v1/index.json`](../feeds/issues/v1/index.json) | Discovery index, latest checkpoint, all retained publication descriptors and delivery/cadence qualifications. |
| [`feeds/issues/v1/schema.json`](../feeds/issues/v1/schema.json) | JSON Schema Draft 2020-12 for indexes, snapshots, findings and assessments. |
| `feeds/issues/v1/snapshots/<sha256>.json` | Immutable cumulative snapshot, declared coverage and record descriptors. |
| `feeds/issues/v1/records/<sha256>.json` | Immutable finding revision or assessment revision. |
| [`feeds/issues/v1/examples/index.json`](../feeds/issues/v1/examples/index.json) | Separate synthetic fixture stream; never import as real findings. |
| [`scripts/read-issue-feed.cjs`](../scripts/read-issue-feed.cjs) | Node 22+ reference consumer; verifies pinned paths, byte digests, identities and checkpoint lineage. |

These are repository paths, **not `versioncompass.com` API routes**. There is no
designated live-site endpoint for this feed. Existing `/api/content/manifest`,
`/api/content/bundle` and `/api/content/records` remain the separate content-catalog
contract. Content records are context, not a replacement for issue assessments.
Website deployment, D1 health and report verification do not certify this feed.

For discovery, resolve `main` once to its full 40-character commit SHA using GitHub
or Git. Then retrieve the index and every referenced object from that same commit:

```text
https://raw.githubusercontent.com/LeiterConsulting/splunk-version-value-explorer/<COMMIT>/feeds/issues/v1/index.json
```

Replace `<COMMIT>` with the resolved SHA. Relative descriptor paths resolve beneath
`feeds/issues/v1/`; for examples they resolve beneath `feeds/issues/v1/examples/`.
Reading `main` independently for each object risks combining publications. Commit
pinning supplies a consistent repository view. Hashes verify bytes against that
view; they do not independently authenticate the publisher or prove product facts.

## Current coverage

Checkpoint three expands the production stream to **twelve findings and twenty-three
historical assessments** across four contributing watch families. See the
[coverage register](issue-feed-coverage.md) for the exact concerns, source dates,
exclusions and the migration from the initial two-finding pilot. The schema and
protocol remain 1.0.0. Re-resolve the repository commit and replay from the saved
checkpoint; no reset or new finding identity is required for the original concerns.

All additions normalize already-published evidence. Original claim dates, unknown
source revisions and narrower follow-up scopes remain intact; no fresh review is
implied by the expanded publication.

## Initial pilot and the first publication

The initial bounded pilot normalizes **two real concerns and four assessments**:

- SOAR Cloud 8.8.0 release-stage wording: October 29 Guidance Audit and October 30
  ES Editions Watch both preserve a Controlled Availability / General Availability
  contradiction.
- ITSI subagent regional availability: October 29 and October 30 CSP FedRAMP Watch
  both leave regional rollout unestablished. Related-app prerequisites and
  base-assistant availability are insufficient to establish that rollout.

The two bootstrap checkpoints ship together in this first repository release.
Checkpoint one contains the selected October 29 observations; checkpoint two adds
the already-published October 30 follow-ups under the same finding identities.
They demonstrate history/recovery; they are **not two newly conducted reviews or
proof that a feed existed on October 29**. `recordedAt` records normalization into
this contract. Each provenance entry pins the original public audit commit and
JSON Pointer. Original claim-assessment dates and labels remain separate.

Every real pilot record has `basis: published-audit-normalization`. No new direct
official-document review is claimed by this conversion. The feed does not export
every finding, historical audit, watch family or source. Always read the snapshot's
`coverage.completeness`, `watchFamilies`, `evidenceThrough` and `exclusions`.

The examples contain three invented concerns (contradiction, uncertain claim and
coverage gap), baseline/follow-up snapshots, a partial result and inconclusive
results. Their dates, statements and `example.invalid` URLs are synthetic. The
production index never references them.

## Publication and recovery semantics

The index is mutable; every snapshot and record is immutable and named by its
SHA-256 digest. Every descriptor includes `path`, `sha256` and UTF-8 `byteLength`.
A publication also has consecutive `sequence`, `publishedAt` and
`publicationId: vci-<snapshot-sha256>`. A snapshot's `previousPublicationId` links
to its predecessor. Sequence is local to a stream; real and synthetic checkpoints
are not interchangeable.

`publishedAt` is the producer's declared feed issue time. Actual repository
availability is established by the Git commit containing it. It is not a website
deployment timestamp, claim-review timestamp or source-check timestamp. The index
explicitly reports repository transport and `liveSiteDelivery.status: not-designated`.

All retained snapshots are listed in sequence order. Snapshots are cumulative:
previously published record revisions remain present. A newer revision is appended,
not substituted for historical bytes. Withdrawals, merges and supersessions do
not delete records. No pagination is used in v1: at most 1,000 publications per
index, 2,000 record revisions per snapshot and 2 MiB per JSON object. Reaching a
bound requires a documented contract extension; truncation is not permitted.

Recommended intake:

1. Resolve and retain one repository commit; fetch and validate its index.
2. On first intake, read the latest complete snapshot. For recovery, locate the
   saved checkpoint and replay every subsequent snapshot in sequence.
3. Verify each snapshot and record against its exact digest and byte length;
   validate schema, stream identity, lineage and descriptor/record identity.
4. Upsert record revisions by `(kind, id, revision)`. Group finding history by
   `findingId` and assessment history by `assessmentId`; retain each distinct
   assessment and its scope. The same identity/revision with different bytes is
   an integrity conflict, not an update.
5. Persist records, unknown fields/quarantined records and the checkpoint in one
   consumer transaction. Advance the checkpoint only after successful persistence.
6. On failure, retain the last good state and retry from the same checkpoint.
   A checkpoint missing from retained history requires explicit reconciliation.
   Do not silently reset it, treat a retrieval failure as a finding or infer a fix.

After cloning this repository, a read-only trial is:

```bash
node scripts/read-issue-feed.cjs --commit FULL_COMMIT_SHA
node scripts/read-issue-feed.cjs --commit FULL_COMMIT_SHA --checkpoint vci-SNAPSHOT_SHA256
node scripts/read-issue-feed.cjs --commit FULL_COMMIT_SHA --examples
```

Use an actual `vci-` followed by the 64-character snapshot digest for the checkpoint
placeholder. The command writes the validated result to stdout and performs no
persistence, assignment, messaging or closure. Its returned `checkpoint` is a
proposed persistence boundary, not proof that a consumer committed its state.
The reference consumer can read GitHub raw paths only, rejects redirects, uses a
15-second timeout per object, and enforces the 2 MiB byte limit. It is deliberately
sequential and bounded. Consumers may cache immutable objects by digest.

## Record definitions

All records carry `schemaVersion`, `kind`, `synthetic`, `revision`, `recordedAt`,
`findingId`, `evidence` and `provenance`. IDs are stable opaque strings; do not
derive scope or status by parsing their spelling. Revisions start at one and are
consecutive per identity. A correction appends a revision with explicit rationale;
a new claim assessment gets a new `assessmentId`.

### Finding

| Field | Meaning |
| --- | --- |
| `findingId`, `revision` | Issue identity across watches/dates, and immutable description revision. Finding identity is distinct from claim identity. |
| `title`, `problem`, `concernType` | Readable problem; type is `contradiction`, `suspected-error`, `uncertain-claim` or `coverage-gap`. |
| `scope` | Separate products, versions, editions, deployments, regions, audiences and explicit exclusions. `null` means unknown/not recorded; `[]` means explicitly no values, never “all”. |
| `impact` | Customer scenario, consequence and separately stated impact level. `unknown` does not mean harmless. |
| `confidence` | Separately qualified confidence. The pilot uses `not-rated`; original labels are not converted into numeric scores. |
| `claimIds` | Original related claim identifiers; multiple claims can participate in one issue. They are not finding IDs. |
| `scopeComparison` | Required for contradictions: why the opposing statements are comparable, plus any scope uncertainty. |
| `coverageSearch` | Required for coverage gaps: customer question, expected answer, finite searched corpus by evidence ID, search time and limits. |
| `lifecycle` | Editorial disposition (`active`, `withdrawn`, `superseded`, `merged`) with reason, independent of factual assessment. |
| `relationships` | Explicit related, merged-into, superseding and superseded-by finding IDs. Similar wording is insufficient to merge concerns. |

Contradictions identify both observed and challenging statements, exact public
URLs and sections. A suspected error separates the observed statement from the
challenging evidence. Coverage gaps require a finite successfully retrieved corpus;
a failed request or missing issue-table extraction alone is not a knowledge gap.
Routing hints, if later added, must remain qualified hints, not proof of ownership,
support, entitlement or an SLA.

### Assessment / reassessment

An assessment has `assessmentId`, the same `findingId`, `assessedAt`,
`reviewedScope`, `comparedAssessmentIds`, `outcome`, `rationale`,
`remainingConcerns`, evidence and provenance. A follow-up explicitly names the
assessment IDs it compares. Do not infer reviewed scope from a report-wide date.

| Outcome | Meaning |
| --- | --- |
| `still-present` | The reviewed concern remains present in the stated scope. |
| `partially-addressed` | Evidence addresses part of the concern; remaining concerns stay explicit. |
| `addressed-in-reviewed-scope` | The cited evidence addresses the concern only within the reviewed scope; broader applicability is not established. |
| `unable-to-verify` | Available reviewed evidence cannot establish the answer. This is neither a correction nor proof of unavailability. |
| `not-reassessed` | Explicitly no new claim assessment. `assessedAt` may be null; `recordedAt` is not a substitute. |

No outcome automatically closes consumer work. An editorial withdrawal or
supersession is not a public correction. An omitted concern, HTTP 200, fresh audit,
unchanged record, confidence score or status label alone establishes no fix.

### Evidence and provenance

An evidence item identifies `evidenceId`, public HTTPS `url`, exact `section`,
qualified `statement`, optional bounded `excerpt`, `role`, `sourceCheckedAt`,
`availability` and `documentRevision`. `statement` is a summary, not an exact quote.
`excerpt: null` means exact quoted text was not retained; do not display it as a quote.
Excerpts, when present, are limited to 300 characters and must be independently
checked against publication and quotation requirements.

`documentRevision` is either a recorded `sha256` response-body digest or
`unavailable` with null value and a qualification. A body digest identifies fetched
bytes, including possible page chrome; it is not a semantic diff, source-publisher
revision or retained copy of the source. Where no revision was retained, the feed
does not invent one. The original audit's commit pin supplies immutable observation
provenance but does not make the mutable official document immutable.

Provenance includes `basis`, commit-pinned public audit `url`, JSON `pointer` and
`originalLabel`. The pilot retains original labels such as `conflict-confirmed`,
`conflict-preserved` and `verified-unchanged-with-qualifications`, alongside the
normalized outcome. Source availability/check time, claim assessment time,
normalization time and feed issue time are distinct. Report-wide source inventories
never become claim-specific evidence through format conversion.

## Compatibility and unknown data

`schemaVersion` describes data shape/semantics; `publicationVersion` describes the
publication protocol. Both start at 1.0.0. Additive optional fields may use a minor
version; incompatible required semantics, identity or outcome changes require a
new major contract. Consumers reject unsupported major versions. Within supported
majors, preserve unknown fields and quarantine unknown kinds/types/outcomes for
review without interpreting them as resolved, unavailable or harmless. The
reference consumer does this for record kinds, concern types and outcomes.

Known malformed records, integrity conflicts and missing immutable objects fail
intake. Do not partially advance the checkpoint. JSON Schema checks shape; the
producer additionally enforces links, cumulative history, bounded coverage,
consecutive revisions, scope/evidence requirements and append-only history.

## Producer maintenance

The issue observation ledger is [`content/issue-feed.json`](../content/issue-feed.json);
synthetic fixtures are separate in `content/issue-feed-examples.json`. They do not
replace canonical product facts in `content/datasets/*.json`. Generated exports
must never be edited directly.

Existing watches should append an assessment only after actually reviewing the
named claim and public evidence. Coordinate shared finding identities across watch
families; do not mint an issue per report. Preserve unknown source revisions and
original dates, labels, scope and provenance. Normalization is an explicit basis,
not a new independent review. This release adds repository instructions and CI
checks; it creates no timer or scheduler change and does not guarantee that every
future watch run will produce a finding or reassessment.

```bash
node scripts/sync-issue-feed.cjs
node scripts/sync-issue-feed.cjs --check
node --test tests/issue-feed.test.cjs
```

The normal publication gates, complete test suite and build still apply. The
generator refuses changed published record/snapshot history relative to Git HEAD
and its available parents, unknown generated files and inconsistent references.
CI fetches two generations so it can also reject a committed historical rewrite.
Reviewers must also reject history rewriting; Git itself is the history authority.
Retain published records and snapshots rather than pruning them. No operational
state, credentials, private evidence, consumer identifiers or write-back channel
belongs in this feed. The publication remains public-source-only and read-only.
