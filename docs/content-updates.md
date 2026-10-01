# Content-change markers

Small New, Updated, Corrected, Deprecated and Removed badges identify exact changed content. Their registry is `dist/content-updates.js`, keyed to a product-scoped capability/component or stable environment/edition record ID. Unregistered content has no badge. Existing ES version labels remain historical release context rather than evidence of a recent website update.

New means new to this guide, not necessarily newly released by Splunk. Updated/Corrected describe an editorial change. Deprecated and Removed require explicit linked vendor evidence and exact component/version scope; never infer removal from deprecation, age, a disappeared page or a source conflict. The underlying warning remains after the temporary badge expires.

Hover, keyboard focus or tapping exposes guide-change date, affected version/scope, explanation, source date, official citation and release note. Escape dismisses focused context. Print includes readable change context without relying on hover or color. Marker content is presentation metadata, not a new availability claim or WebMCP schema.

## Provisional retention

`policy.retentionCycles` is 2. An entry is visible in its introduction cycle and the following material content cycle; it expires at a difference of 2. Advance `currentCycle` once per published factual-content batch across the site, regardless of which watch publishes it. Multiple related changes in one batch share a cycle. No-change runs, source-date-only rechecks, UI fixes, badges themselves and task edits do not advance it. Do not reset dates/cycles for unchanged records. Keep expired metadata as history. Reconcile concurrent watch changes before assigning the next cycle.

The initial cycle records the verified September 25 content changes already in the release note. Do not mark every existing item New at rollout. Future relevant capability, technical, environment and edition changes need a scoped entry alongside their actual content update. Titles currently identify release capabilities/components; a rename must update its registry key. New categories require useful maintained content rather than speculative role claims.

When the same maintained record changes again, keep the stable record key for the newest badge and retain the earlier event under a unique history key with `recordKey` pointing back to that stable record. This keeps the screen marker singular while allowing route-specific change history and saved reports to preserve both events.

Verify rollover boundaries, correct targeting, no duplicate badges, both themes, keyboard/touch access, links and readable print context. Maintain the normal source-validation, release-note, review-date synchronization and matching GitHub/Sites publication requirements. Report unsupported browser/PDF checks honestly.

Entries whose component title recurs across releases can declare exact `milestones`. Technical badges and comparison change history filter those entries against the selected technical record's milestone, so Enterprise 10.6 corrections cannot label Enterprise 10.4 or Cloud records. Preserve older metadata as history with the original release scope.
