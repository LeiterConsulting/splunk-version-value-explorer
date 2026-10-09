# Evidence-based delivery and post-release observation

The owner's October 6, 2026 instruction replaces the mandatory 72-hour advancement delay. Deliver useful, bounded improvements as soon as their applicable material checks pass. Minor, reversible issues may remain in a tracked repair backlog. The 72-hour period is an observation window, not a minimum wait or a claim that all behavior was verified.

This supersedes earlier fixed-wait instructions in architecture documentation and task prompts. The October 5 authorization for bounded autonomous improvements remains. Public sources, privacy, the existing audience, stable read-only WebMCP tools, exact GitHub/Sites publication checks and the four watches' established Eastern schedules do not change.

## Release blockers versus repair backlog

Hold broken or silently changed legacy comparisons, inaccurate or unsupported guidance, uncertain compatibility/entitlement/authorization, missing or corrupted content, privacy/security failures, destructive migrations, new commercial commitments, and failed or missing applicable material verification. Never waive a failure simply by calling it minor.

A nonblocking minor issue must be explicitly recorded with `severity: minor`, `reversible: true`, `affectedFunctionWorks: true`, a tracking issue or repository record, owner, next action, validation and a future `reviewBy` deadline. No protected risk may be present. Unclassified or overdue issues block until triaged; resolved protected risks need recorded resolution evidence. Cosmetic defects do not hold unrelated validated improvements.

Keep the change small enough to validate and roll back. Isolate a blocked enhancement instead of holding independent work. Confidence is completed checks and recorded evidence, not a model score, customer silence or a synthetic preference.

## Impact-scoped checks

Continue recording source checks, claim checks, automated tests, browser journeys, exports and live verification separately, with actual dates and evidence. `failed`, `blocked` and `not-performed` are never success.

The full gate inventory remains in `content/soak-policy.json`. Tests, shared-link checks, content parity, live revision and maintenance outcomes cannot be scoped away. Other checks may be `not-applicable` only when an explicit impact analysis establishes they are unaffected: record `scope.unaffected: true`, a rationale and evidence such as the exact changed-file inventory. Unavailable tooling is not evidence of irrelevance. Changes to rendering, comparison meaning or data delivery require the affected actual browser/export checks; file parsing does not certify a rendered export.

A repository-only archive or policy change need not repeat native PDF pagination when report code and content are unchanged. Record its repository publication separately; do not claim it deployed website code. Source and claim review dates never advance merely because a file moved, an index changed or delivery succeeded.

## Legacy compatibility

The [export verification process](export-verification.md) supplies candidate-bound native PDF, offline HTML and viewport evidence from application CI. Import its verified retained artifact with `--exports`; these checks may precede deployment and remain applicable to identical report inputs. A current actual failure still blocks. Missing capabilities in a later interactive session do not reopen a verified historical baseline or justify rollback on their own.

Preserve the visitor's original comparison intent, not necessarily the old architecture. Decode legacy URLs into the current comparison model using explicit, deterministic, reviewed mappings. Preserve exact versions, product, platform/host, environment, perspective, theme, history and meaningful anchors. Never silently substitute latest or relax a compatibility warning. Unknown or ambiguous links get assisted recovery retaining the original input and an explicit explanation, not an unrelated default report. See [legacy-link migration](architecture/legacy-link-migration.md).

## Advancement and observation

Run `node scripts/check-soak.cjs RESULT.json` with the actual verified baseline, evaluation time, separate check records and findings. `minimumHours` is now zero. Once applicable checks pass and remaining findings satisfy the minor-issue rule, the next bounded increment is eligible without waiting for October 8 or restarting a three-day countdown.

Retain the prior complete revision and a verified rollback path for material delivery changes. Record dataset/engine/website revisions, GitHub/Sites commits and matching tree, saved version, deployment ID and actual live-check timestamp. Failed or unverified publication is never described as live.

Use the SAME existing one-time progress task and the four existing watches for follow-through; do not create duplicate or recurring three-day jobs. Preserve their schedules unless explicitly changed. Record the observation window for newly verified material releases, but do not use it to block unrelated work or automatically reschedule the task 72 hours later. Factual-only, operational and documentation changes do not manufacture a new material baseline. At each run, report meaningful shipped work, new consequential findings and the next bounded action; do not repeat unchanged blocker lists.
