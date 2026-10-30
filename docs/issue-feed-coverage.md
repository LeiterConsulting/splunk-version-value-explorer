# Issue feed coverage register

Checkpoint three, October 30, 2026. Contract and publication protocol remain **1.0.0**.

Current cumulative coverage: **12 findings, 23 assessments, 3 publication checkpoints**.
This expands the initial two-finding/four-assessment pilot by ten findings and nineteen
historical assessments. All original records, IDs and snapshot hashes remain intact.

## Included concerns

| Finding identity | Assessed concern | Claim assessment dates retained |
| --- | --- | --- |
| `vci-soar-cloud-880-release-stage` | SOAR Cloud 8.8 release-stage wording conflicts within the release entry | 2026-10-29, 2026-10-30 |
| `vci-itsi-subagent-region` | ITSI subagent regional availability remains unestablished | 2026-10-29, 2026-10-30 |
| `vci-es-87-connector-builder-editions` | ES 8.7 Connector Builder edition descriptions conflict | 2026-10-29, 2026-10-30 |
| `vci-es-88-triage-editions` | ES 8.8 Triage component edition scope remains conflicting | 2026-10-29, 2026-10-30 |
| `vci-es-guided-response-enhancement-scope` | Guided Response enhancement scope is distinct from base entitlement | 2026-10-29, 2026-10-30 |
| `vci-es-malware-phishing-version-floor` | Malware and phishing task prerequisites differ from the aggregate agent row | 2026-10-29, 2026-10-30 |
| `vci-app-for-soar-es-pairing` | App for SOAR pairing with later ES releases is not established by the reviewed matrix | 2026-10-29, 2026-10-30 |
| `vci-es-activity-pricing-deployment-scope` | ES activity-based pricing deployment eligibility remains unresolved | 2026-10-29, 2026-10-30 |
| `vci-saia-high-runtime-scope` | SAIA FedRAMP High announcement does not settle version, mode and runtime scope | 2026-10-29, 2026-10-30 |
| `vci-cloud-s3-restricted-scope` | Restricted-environment S3 search descriptions need version and feature reconciliation | 2026-10-29, 2026-10-30 |
| `vci-svd-2026-1015-applicability` | SVD-2026-1015 product applicability and remediation remain unestablished | 2026-10-29 |
| `vci-enterprise-kv-106-upgrade-bridge` | Enterprise 10.6 general upgrade route and KV-specific bridge need scope clarification | 2026-10-12, 2026-10-25 |

## Evidence scope and dates

The published evidence comes from Version Guidance Audit, Version Release Watch,
ES Editions Watch and CSP FedRAMP Watch, including a bounded October 25 Heavy
Forwarder semantic assessment retained in the public source-mapping register.
The original audit/mapping commit, exact record pointer, source sections and
original labels are retained in each provenance entry. These are normalized
historical observations, not new official-document reviews.

Most included concerns have October 29/30 assessments. The SVD-2026-1015 assessment
remains October 29 even though Release Watch checked its source on October 30.
The KV Store concern retains October 12 and October 25 claim assessments; the
October 25 follow-up is specifically scoped to the Heavy Forwarder Enterprise
package with KV Store. Neither a newer audit nor this feed publication advances
those claim dates or broadens that follow-up to Universal Forwarders.

The ES 8.7 Connector Builder and ES 8.8 Triage findings preserve both conflicting
descriptions. Guided Response, agent minimum versions, restricted S3 search and
KV Store routes retain different version/component/environment scopes; they are
not promoted into a proven same-scope error. An unlisted App for SOAR pairing is
not an explicit incompatibility. Unknown advisory applicability is not evidence
that a product is affected or that a particular version remediates it.

No new real coverage-gap finding is emitted: extraction failure, unavailable
source bodies and a finite verification backlog do not demonstrate a missing
answer across a successfully searched finite corpus. Synthetic examples remain
a separate stream.

## Consumer continuation

Resolve the current repository commit, fetch the pinned index and replay from
the saved checkpoint using the unchanged [consumer contract](issue-feed.md).
The prior pilot checkpoint remains:

```text
vci-e1be5a90eb89a51c1af75f167631ed0beceec8f7b4dd1374b8cf1bd6d4e81a0b
```

The expanded checkpoint is:

```text
vci-6572ebf44f4d23f196af851d95dcd01ff0fd5d4d873725979069aa5da00924c7
```

Replaying from the prior checkpoint returns one new cumulative snapshot with
35 record revisions: 12 findings and 23 assessments. Six record revisions already
existed in the pilot; idempotent upserts add only 29 new record revisions. No schema
migration, identity reset, history deletion or automatic work closure is implied.

## Remaining normalization limits

- This is a bounded named set, not a complete export of every audit, historical
  concern or maintained source. Snapshot coverage and exclusions remain authoritative.
- Confirmed ordinary facts are context rather than new issue findings.
- Remaining preparation-page questions, other capability regional unknowns and
  unavailable issue-table content require claim-specific assessed evidence before
  promotion into additional findings.
- Existing watches must compare their actual scoped issue reviews with these
  identities and append supported new findings or assessments. Preserving an old
  verification date is not a new assessment. There is no new schedule or fixed SLA.
- Source revisions and exact excerpts not retained by the underlying observations
  remain explicitly unavailable.
