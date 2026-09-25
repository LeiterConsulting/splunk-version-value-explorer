# Published maintenance outcomes

The About page consumes dist/maintenance-status.js. Its initial lastAttempt fields come from scheduler metadata inspected September 25, 2026. They establish attempts, not successful review or publication. Initial outcomes and lastSuccess remain unknown; do not backfill from a release note or schedule alone.

For each run, use scripts/record-maintenance.cjs with a JSON object on stdin: watch (the stable ID in the ledger), outcome, explicit ISO at timestamp, summary, and scope. Record running at actual start, then changed, no-change, blocked, or failed. A completed changed/no-change check advances lastSuccess. This is success of the named review scope, not deployment. Keep details factual and concise; never log credentials or private conversations.

Publish outcome-only records even when no factual changes were found. This explicitly supersedes the prior rule against no-change commits/deployments for this small operational ledger only. Add a brief operational entry to the existing daily release note (create today's note when necessary), and use the standard metadata/source synchronization and tests. Do not advance factual badge cycles or source dates for operational updates.

Retain history; reconcile concurrent writes before recording or publishing. If access, validation or publication fails, preserve the failed/blocked record in an authorized durable location when possible and surface it in the task result. Reconcile it on the next successful publication. Never bypass permissions to report a failure. This static site cannot independently report a failure that prevents its own publication: its UI explicitly says these are last published records.

The public outcome is not a claim that all source URLs were reviewed: scope identifies what was actually checked. The manual targeted verification in this UI change is documented in source annotations/release notes, not misrepresented as a full successful scheduled watch.
