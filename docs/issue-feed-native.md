# Native issue-feed publication

The public issue feed is a required output of VersionCompass's normal independent
review process. [Producer policy](../feeds/issues/v1/producer-policy.json) and the
index's additive `producer` metadata declare `enabled: true`, `mode: native`.
The transport and consumer contract remain commit-pinned repository JSON, version
1.0.0. There is no new service, live-site endpoint, consumer identity, write-back,
workflow authority or automatic closure.

The initial twelve findings and twenty-three historical assessments are a baseline,
not a quota or cap. Add any supported issue within the maintained review scope.
Future coverage remains explicitly bounded. The legacy v1 `coverage.mode` value
`bounded-pilot` is retained for consumer compatibility; it describes the bounded
snapshot convention, not whether native publication is enabled. Consumers can
ignore the new optional producer metadata and continue from the same checkpoint.
Enabling the producer does not itself create a claim review or new checkpoint.

## Required reviewer behavior

All four existing watch families include feed disposition in every new run. Release
Watch owns platform/component/security issues; ES Editions Watch owns ES-specific
edition, capability, prerequisite and pairing concerns; CSP FedRAMP Watch owns
provider/region/regulated questions; Guidance Audit independently checks cross-product
claims, feed coverage and reassessment consistency. Keep existing timing and access.

1. Review public evidence independently, using the existing source and claim rules.
   Identify supported new issues and actually reassessed existing issues. Keep
   source retrieval, claim assessment, publication and downstream action separate.
2. Reuse stable finding identities when scope matches. Append distinct assessment
   IDs for actual follow-ups, including still-present, partial, addressed-in-scope
   and unable-to-verify outcomes. A source check or repeated audit alone creates
   no assessment. Preserve unreviewed scope explicitly.
3. Publish evidence-backed observations of conflicts and uncertainty with their
   qualifications. This does not authorize an unsupported product recommendation
   or the suppression of uncertainty pending clarification. A retrieval failure
   alone is not a knowledge gap.
4. Append records to `content/issue-feed.json`, add a cumulative publication only
   when new record revisions are introduced, and run `scripts/sync-issue-feed.cjs`.
   Never regenerate identity/history from scratch or manufacture a daily finding.
5. Record a feed outcome in each changed main/source watch audit using the command
   below. Validate, publish and read back the actual repository bytes before
   reporting delivery. A pending or blocked feed is incomplete delivery.

## Public provenance without self-referential commits

A record must cite an immutable public audit commit. When that audit is not yet
public, record `pending-public-provenance` with a finite deferral and publish the
audit through the normal authorized repository process. Then pin that public
commit, finish the records/feed in a follow-up, update the audit's feed outcome and
publish/read back the final checkpoint. Do not invent a commit, substitute a
mutable `main` citation, claim publication early or leave the pending step described
as fully delivered. If the boundary is blocked, record and report it honestly.

If the supporting audit is already public, the final observation can be published
directly with its exact provenance. Historical normalization must remain labeled
`published-audit-normalization`; it is not a new independent source review.

## Audit outcome declaration

Supported future audit paths are `docs/audits/YYYY-MM-DD-<watch-id>.json` and the
corresponding `-sources.json` path. The four IDs are in the producer policy. Add a
declaration using JSON on stdin:

```bash
node scripts/record-issue-feed-outcome.cjs \
  --audit docs/audits/YYYY-MM-DD-version-release-watch.json <<'JSON'
{
  "status": "no-new-observations",
  "publicationId": "vci-REPLACE_WITH_ACTUAL_RETAINED_SNAPSHOT_DIGEST",
  "recordKeys": [],
  "notReassessedFindingIds": [],
  "deferredConcerns": [],
  "qualification": "Replace with the actual bounded run outcome and scope."
}
JSON
```

The placeholder is not runnable; use a real retained publication ID. The command
sets the exact watch ID, actual `recordedAt` and the review-input digest itself.

| Status | Meaning and required evidence |
| --- | --- |
| `published` | Nonempty `recordKeys` exist in the declared retained snapshot and cite this audit as provenance. Record keys use `finding:ID@REVISION` or `assessment:ID@REVISION`. This is not proof of downstream intake or closure. |
| `no-new-observations` | No new issue record/reassessment was produced. `recordKeys` is empty; explain scope and list known findings not reassessed. This does not mean no issues exist. |
| `pending-public-provenance` | The audit must become public before the feed follow-up. Empty record keys and a finite explicit deferral are required. Finish the follow-up before claiming full delivery. |
| `blocked` | Feed work could not complete. Empty record keys, finite deferrals and a qualified explanation are required. Keep the previous complete publication. |

The audit's `issueFeed` object binds its review input to `reviewDigest`. Publication,
validation, baseline receipts and `issueFeed` itself are excluded from that digest,
so recording later delivery evidence does not pretend a new claim review occurred.
Changing other review fields invalidates the declaration until it is refreshed.

`notReassessedFindingIds` preserves explicit unreviewed known issues; it is not a
finding-withdrawal mechanism. `deferredConcerns` preserves finite normalization or
publication work. Unknown fields/labels, uncertain facts and insufficient evidence
stay unknown rather than being coerced into an outcome that closes work.

## Native gate

Run the normal four synchronization gates, Advisor and feed checks, then:

```bash
node scripts/check-native-issue-feed.cjs
node --test tests/*.test.cjs
npm run build
```

CI checks changed/new supported watch audit reviews against Git HEAD and its
available parents, requiring the current declaration, retained checkpoint and
consistent record provenance. Historical unchanged audits are not retroactively
relabeled as native runs. The gate rejects deleted watch audit history. It is a
structural and publication-accountability check; it cannot certify claim truth,
independent judgment or successful consumer action. The reviewer must perform
those evidence checks and the consumer owns its own verification decisions.

Native enablement reuses the four existing review tasks. Their prompts explicitly
require this process; schedules, timing modes and enabled states remain unchanged.
No new timer is created. Feed-only repository work does not imply a Site runtime
deployment; changed report/runtime inputs retain all existing exact-candidate
browser/export, repository/Sites and live verification gates.
