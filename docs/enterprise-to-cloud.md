# Enterprise-to-Cloud guidance model

This guidance supports the published [Version Compass](https://versioncompass.com) experience.

The Enterprise-to-Cloud journey is a customer-facing planning aid for early migration conversations. It asks only for the Splunk Enterprise release in place and the Splunk Cloud Platform destination line. It does not collect topology, data volume, retention, app inventory, compliance, identity, network, or customer-contact details.

Because those inputs materially affect a migration, the explorer recommends discovery and decision gates instead of claiming to produce a complete migration plan.

## What the journey shows

The selected versions drive five parts of the experience:

1. **Migration route.** A five-gate program view from the source release through assessment, preparation, acceptance, and the selected Cloud destination.
2. **Migration motion.** Greenfield, dual-running, and full historical migration patterns with their best-fit signals and principal tradeoffs.
3. **Value return.** Cloud operating-model benefits combined with notable capabilities available by the selected destination release.
4. **Migration blockers and delay risks.** A dedicated section based on Splunk's blockers/showstoppers, potential delay-causing risks, and material differences in the Cloud operating model. Destination-specific Cloud behavior changes are included when relevant.
5. **Recommended next steps.** A sequenced list covering ownership, SCMA, apps, data, connectivity, identity, testing, cutover, monitoring, and retirement.

For Enterprise 8.1 or 8.2, the journey adds a source-readiness blocker because the current SCMA listing supports Splunk Enterprise 9.1 and later. For supported but older source lines, it asks the team to decide whether modernizing the source first is worthwhile. This is a planning prompt, not a claim that every migration must follow the same technical sequence.

## Source map

| Source | How it is used |
| --- | --- |
| [Splunk Cloud Platform Migration guided path](https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Overview) | Cloud operating model, migration phases, platform differences, app and data-input considerations, transition framing |
| [Readiness](https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Readiness) | Value proposition, team structure, communication, and post-migration operating roles |
| [Prepare](https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Prepare) | Source modernization, app inventory, data and retention analysis, network preparation, RBAC, and risk reduction |
| [Validate](https://lantern.splunk.com/Splunk_Cloud_Platform_Migration/Validate) | System Acceptance Testing before User Acceptance Testing and reconciliation checks |
| [Selecting a cloud migration approach](https://lantern.splunk.com/Manage_Performance_and_Health/Selecting_the_best_cloud_migration_approach) | Greenfield, dual-running, and full-migration tradeoffs; this Lantern article is partner-authored guidance |
| [Cloud Migration Assessment App for Splunk](https://splunkbase.splunk.com/app/4974) | Current app version, compatibility floor, directional assessment scope, and explicit-upload behavior |
| [Splunk Cloud Platform release notes](https://help.splunk.com/en/splunk-cloud-platform/release-notes) | Capabilities and readiness items for each selected Cloud destination |
| [Splunk Enterprise upgrade paths](https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/how-to-upgrade-splunk-enterprise/upgrade-paths-to-version-10.4) | Supported step path to the current SCMA compatibility floor when the selected source is older |

Splunk Lantern combines Splunk and community-authored operational guidance. The site links directly to each source and avoids presenting summarized guidance as a warranty, fixed timeline, or Statement of Work.

## Maintaining the journey

Enterprise-to-Cloud content is centralized in `dist/data.js` under `migration`:

- `scmaMinimum` controls the version-aware readiness gate.
- `sources` contains canonical documentation URLs.
- `operatingBenefits` contains enduring Cloud operating-model value.
- `approaches` describes migration motions and tradeoffs.
- `breakingChanges` contains source-backed blockers, delay risks, and material operating-model differences that deserve explicit attention.
- `steps` contains the sequenced, source-backed action plan.

When Splunk publishes a new Enterprise version, Cloud version, SCMA release, or migration guide revision:

1. Verify the source directly and record only claims supported by it.
2. Update the Enterprise or Cloud release object first.
3. Change the migration model only if the new material changes compatibility, sequencing, a migration approach, or an operating-model benefit.
4. Reconcile `migration.breakingChanges` with Splunk's current showstopper and delay-risk guidance, then review the target Cloud release for changed defaults or compatibility constraints.
5. Test a pre-SCMA source line, a supported older source line, and the latest Enterprise source against at least two Cloud destinations.
6. Update the reviewed date and any screenshots affected by the change.

## Scope and privacy

The explorer stores selections only in the page URL so a report can be shared. The **Copy report link** action copies that URL, including the journey, source, and destination selections. The **Print / save PDF** action uses the browser's native print dialog and does not upload report content.

The site has no registration, contact form, analytics, tracking, or customer-data submission. Any SCMA export is produced and shared outside this site and only through an explicit customer action described by Splunk.
