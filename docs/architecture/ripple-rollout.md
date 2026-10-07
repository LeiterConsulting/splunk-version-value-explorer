# Ripple bounded rollout — October 7, 2026

The owner approved gradual source, data and UX expansion and a footer-linked transparency page. The first increment measures operations and preserves investigations before adding discovery sources.

## Implemented first increment

Automated refresh and assessment reserve each request against a persistent UTC-day counter (150 maximum). Retries for 429/5xx/timeouts are bounded to two and count toward the same counter. Four requests run concurrently, with a 70-second collection window inside the shared two-minute update lease. Budget exhaustion is deferred, not an unavailable-evidence or safe outcome. Existing evidence and verification dates remain intact.

Additive D1 tables retain investigation payloads, queue status, next review time, admitted research sessions and content/research events. The public snapshot remains schemaVersion 1 and a maximum 250-candidate projection; older queue rows are retained without deletion. This is an additive foundation, not a full normalized dependency catalog. Content history records actual claim changes. Usage figures start with this deployment; no historical timing is reconstructed.

POST /api/research is owner-private. The start operation admits one due investigation with a server-issued ID and 12-minute deadline; a maximum five sessions can be admitted per UTC day, reserving at most 60 minutes. Only one session may be active. Repeating start returns the existing active session. Finishing is idempotent and requires bounded evidence gaps, next action and public source links. The writer cannot promote affected/fixed/excluded claims. Expired work remains in the queue and can resume. External agent reasoning, token usage and charges are not measured or forcibly stopped by the server: the unattended agent must respect the deadline and stop instructions. No paid API or subscription is introduced.

The source helper scripts retrieve data with owner-private Sites service access through hidden stdin. Run refresh-hosted.mjs, then assess-hosted.mjs with a unique runId. Review their persisted readback. To investigate further, call research-hosted.mjs with action start, inspect primary evidence within the returned deadline, then finish with the sessionId and report {summary,gaps,nextAction,evidence:[{url,section}]}. On an uncertain finish retry, reuse sessionId. Unsupported conclusions stay gaps; supported calibration updates use reviewed source/publication workflow, then assessment and readback. Never approve an evidence fingerprint without source review.

## Public transparency

The footer links /ripple/updates. The page separates content/features, target roadmap dates, source/assessment operations and original claim verification. It does not expose local inventory or credentials. Main VersionCompass navigation remains unlinked.

Targets: operating review October 14; product/finding UX October 16; first source cohort October 21; repeatable cohorts October 28; VersionCompass integration review November 4. Targets are estimates, conditional on the stated gates. Past targets do not automatically become delivered. Update status and revised dates from actual evidence. lib/roadmap.ts is the editorial authority; the public mount mirrors it in tools/ripple/lib/roadmap.ts. Seven measured daily runs inform expansion, not a fixed wait before unrelated verified repairs.

## Validation boundary

Production workflow integration tests use SQLite with the actual additive migration and D1-shaped methods. They cover caps, retries, queue retention, admission/deadline, idempotency, gap preservation and existing source/claim behavior. TypeScript, build, hosted writer/readback and public read-only guards must also pass. Browser rendering and native exports are separate checks; unavailable capabilities are never reported as passing.
