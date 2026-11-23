# November 22 cycle and November 23 schedule

## What reached visitors on Sunday

Times are Eastern. ES integrated its first [six-section review](https://github.com/LeiterConsulting/splunk-version-value-explorer/pull/239) at 06:32 and [its handoff](https://github.com/LeiterConsulting/splunk-version-value-explorer/pull/240) at 06:47. CSP integrated its [seven primary sections](https://github.com/LeiterConsulting/splunk-version-value-explorer/pull/241) at 08:21, [issue-feed provenance](https://github.com/LeiterConsulting/splunk-version-value-explorer/pull/242) at 08:42 and the [final handoff](https://github.com/LeiterConsulting/splunk-version-value-explorer/pull/243) at 09:02. Validation of that exact main commit finished at 09:13. [Main validation and export evidence](https://github.com/LeiterConsulting/splunk-version-value-explorer/actions/runs/45030610064).

The steward started at 10:31:53, deployed v307 at 10:39:37 and finished its readback at 10:44:01. The selected GitHub commit was `d8e82aaa32a830c7c74177041ee9c2dcd53963b9`. Both public hosts served `content-7c994bf0e60671c1c60bdb20` with 1,019 bundled records and passed all six delivery diagnostics in 27 requests per host. A representative D1 historical read returned 668 records. Live Advisor tests exercised Agent Mode, ITSI Versions and SOC Workflow across five example profiles per host, including PDF and offline HTML. All three briefs were within their review windows. The first Advisor form load timed out at 15 seconds on both hosts and subsequently appeared at about 21–22 seconds on fresh visits.

The 12:14 operational audit found 13 of 40 primary sections assessed on GitHub and zero matched to the latest native attempts. ES contributed six and CSP seven. The Release task displayed the ES result at 06:48, including the same two ES pull requests. No Release-owned receipt was found. Its outstanding sections comprise nine Release Guide paths, eight 11.x Prep checks, five Exact Releases scopes, three AI Availability scopes and two Advisor dependencies. Guidance had no Sunday run due.

## Sunday recovery results

At 20:21 Eastern the independent auditor matched 37 of 40 primary sections to the latest successful scheduled owner results. All three watches returned their own headings. All 40 sections had a Sunday public source review. The Release Guide for Enterprise, Observability and SOAR each retained an earlier review and a later deferred disposition. The public Site stayed at v307 throughout the recovery.

| Owner | Reviewed Sunday | Matched to latest native run | Actual start–finish, Eastern |
| --- | ---: | ---: | --- |
| Release | 27 | 24 | 19:50:56–20:09:15 |
| ES Editions | 6 | 6 | 17:30:57–17:56:08 |
| CSP FedRAMP | 7 | 7 | 18:26:44–18:49:05 |

The [primary review receipt](2026-11-22-primary-review-reconciliation.json) accounts for all 40 primary sections. The [independent native observations](2026-11-22-owner-run-reconciliation.json) retain the GitHub revision, measurement time, actual run identity and source of each later count. The [feed incident](2026-11-22-release-feed-fork-incident.json) records which changes remain on the held Release candidate. The 09:00 Eastern steward retains public Site publication authority.

Release’s later [scheduled receipt](2026-11-22-version-release-watch-review-2-coverage.json) identifies seven primary sections that still needed evidence during that particular run. For the next assessment, the earlier [Release source receipt](2026-11-22-version-release-watch-review-1-sources.json) records the exact 10.4 TLS passages and the public Splunkbase package metadata for migration and ITSI. The [source readback](2026-11-22-release-recovery-source-readback.json) records the failed AI locators and named official replacements. The [Release Guide follow-through](2026-11-22-release-guide-followthrough.json) links the Enterprise package and advisories, Observability prerequisites and collector changes, and separate SOAR Cloud and on-premises evidence. Reopen the relevant public sources for the new attempt and preserve any contradictions, missing scopes and actual assessment times.

Two Sunday readbacks reproduced specific misses from the scheduled Release run.

- The 10.4 upgrade guide contains a 10.4 TLS-removal section and a separate, older 9.4 deprecation section. Match the 10.4 heading, applicable component and introduced version. The 10.4 release feature table separately describes migration availability. Keep both statements attributed and retain the unresolved exact-build question. [Upgrade guide](https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.4-read-this-first) · [Release table](https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/10.4/whats-new/welcome-to-splunk-enterprise-10.4)
- Both public Splunkbase HTML pages returned their release data in `script#__NEXT_DATA__`. In `props.pageProps.appDetails.releases`, select the row whose `name` exactly matches the package. Its `publishedDatetime` and `versionCompatibility[].versionString` are available for SCMA 5.4.11 and ITSI 5.0.3. Evaluate the package listing alongside the corresponding migration or platform matrix and retain exact patch uncertainties. [Cloud Migration Assessment App](https://splunkbase.splunk.com/app/4974) · [IT Service Intelligence](https://splunkbase.splunk.com/app/1841)

The subsequent native run re-opened those exact TLS and Splunkbase sources. Its remaining Enterprise question concerns itemized patch fixes, its Observability question concerns A2A, RUM and instrumentation prerequisites, and its SOAR questions concern the issue list and exact Broker pairing. An independent public read found that the Enterprise 10.6.2 fixed-issues page refers readers to security advisories and displays no itemized fixes. The SOAR page headed 8.8.0 labels its fixed-issues text 8.7.0. Neither observation establishes a fix for a specific issue. [Enterprise 10.6.2 fixed issues](https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/10.6/fixed-issues/fixed-issues/splunk-enterprise-10.6.2-fixed-issues) · [SOAR fixed issues](https://help.splunk.com/en/splunk-soar/soar-on-premises/release-notes/8.8.0/splunk-soar-on-premises-release-notes/fixed-issues-for-splunk-soar-on-premises)

For the next Observability review, check the tenant and client prerequisites in the A2A topic, the SDK-specific minimums for mobile metrics, and each language’s instrumentation and realm restrictions. Keep the SOAR Broker compatibility question attached to its own release series. [A2A prerequisites](https://help.splunk.com/en/splunk-observability-cloud/splunk-ai-assistant/connect-your-agent-to-the-observability-ai-assistant/use-a2a-with-the-splunk-observability-ai-assistant) · [Mobile RUM instrumentation](https://help.splunk.com/en/splunk-observability-cloud/manage-data/instrument-front-end-applications/instrument-mobile-and-web-applications-for-splunk-real-user-monitoring-rum/instrument-mobile-applications-for-splunk-rum) · [Language-specific instrumentation](https://help.splunk.com/en/splunk-observability-cloud/monitor-application-security/set-up-secure-application/set-up-manual-instrumentation/do-language-specific-steps) · [Automation Broker release notes](https://help.splunk.com/en/splunk-soar/splunk-automation-broker/splunk-soar-automation-broker-release-notes/whats-new-in-splunk-soar-automation-broker)

## Schedule effective Monday, November 23

| Eastern time | Existing task | Cadence |
| --- | --- | --- |
| 03:00 | Version Release Watch | Daily |
| 04:00 | ES Editions Watch | Daily |
| 05:00 | CSP FedRAMP Watch | Daily |
| 06:15 | Version Guidance Audit | Monday and Thursday |
| 07:00 | Refresh Ripple exposure intelligence | Daily |
| 09:00 | Maintain VersionCompass GitHub | Daily, sole public Site publisher |
| 09:45 | Audit VersionCompass and Ripple | Daily, read-only |

The seven enabled task editors were saved and reopened. Their next occurrences were read again after reloading the scheduler. Guidance retained Monday and Thursday. Release and Guidance now explicitly use Eastern in their editors. Sites independently returned one enabled schedule on the public Site, for the same steward, with daily recurrence at 09:00 in America/New_York. Sunday’s production deployment predates these edits. The Monday execution and time visitors receive its package still need observation.

## Timing evidence

The table counts the first same-day integration on the main branch of a dated standard watch, coverage or source audit. The [dated receipt sample](2026-11-22-watch-timing-sample.csv) comprises 144 watch-days with qualifying records across October and November through November 22. Days without such a record supply no timing observation. Vendor posting time, scheduler dispatch, final handoff and validation completion are separate measurements.

| Watch | October observations | Median / 90th percentile ET | November observations | Median / 90th percentile ET |
| --- | ---: | --- | ---: | --- |
| Release | 28 | 05:48 / 06:10 | 18 | 05:50 / 06:30 |
| ES | 23 | 06:25 / 09:14 | 20 | 06:50 / 07:22 |
| CSP | 22 | 08:04 / 11:03 | 21 | 08:04 / 08:23 |
| Guidance | 5 | 08:32 / 09:50 | 7 | 08:54 / 17:18 |

Moving CSP to 05:00 gives it four hours before steward dispatch. A repeat of Sunday's 07:00-to-09:13 scheduled-start-to-qualified-main interval would leave about 1 hour 47 minutes. Guidance has the most variable observed times and a small sample. To judge the earlier schedule, record each watch's actual start, latest source posting it could see, final qualified commit, steward selection, time both public hosts serve it and any material updates arriving later that day.

## Open repairs

1. Trace Release and ES task routing. Preserve the task ID, native attempt ID and actual start through the public handoff. Recover all 27 Release sections with source-specific receipts and actual assessment dates.
2. Capture ES and CSP native completion and result evidence. CSP’s public handoff reports a failed attempt with no exposed cause. Reconcile the current native configuration baselines after the retime using supported full scheduler snapshots. The editor evidence supports the timetable only. Review the two renamed ES 8.8 source locators for CSP’s secondary Advisor SOC obligation. [CSP handoff](2026-11-22-csp-fedramp-watch-handoff.json).
3. Measure Advisor's first-load delay from navigation to usable inputs on both hosts, including a narrow screen. Preserve the working decision, sharing and export paths.
4. Reconcile the Ripple session ledger with the runner’s reported exhausted allowance. The refresh finished, with three of five sessions recorded and 15 investigations due. Preserve the existing research limits while diagnosing the discrepancy.
