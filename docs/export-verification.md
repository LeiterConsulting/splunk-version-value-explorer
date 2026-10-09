# PDF and saved-HTML verification

The October 9 owner instruction establishes a permanent artifact-checking process. Application CI owns pinned Chromium and Poppler; it does not depend on the interactive maintenance browser supporting file URLs, native PDF capture or viewport control. Do not install a replacement browser in managed Sites preview.

## Before publishing a candidate

`Validate release metadata and reports` runs `node tools/export-verification/verify.mjs` on every candidate. It starts the actual local Worker from the built source, then checks `tools/export-verification/routes.json` in both appearances: Enterprise, Cloud, migration, ES, ITSI, Observability, UF, hybrid HF, SOAR, ES Editions, historical links and rejected inputs. Extend that inventory for consequential new routes.

CI downloads HTML through the public save control, saves the downloaded bytes and reopens the file in an independent offline Chromium context with network denied. It checks complete report text, inactive scripts and no external asset dependency. It generates native Chromium PDFs through production print events/CSS, renders every page with Poppler, and checks page count, nonblank text, page-bound text geometry, section completeness and content identity. It checks a real 390 × 844 viewport, both themes and restored URL/disclosure state. Invalid selections must disable both exports.

These are automated rendered-artifact checks, not human page-by-page visual inspection. Every PDF page PNG, PDF, saved HTML, reopened screenshot, desktop/phone screenshot, page inspection and receipt is retained as `export-evidence-<commit>` for 30 days. Inspect images for novel layouts or visual findings and record review separately. Do not call CI human review or live production D1 verification.

## Consume and retain evidence

Wait for the exact candidate's required CI to succeed before Sites deployment or independent content activation. The publisher requires the successful export step: a test/build-only candidate cannot activate. Keep failed and unavailable CI distinct and retain the preceding complete live revision while repairing a candidate.

Download the artifact through the GitHub connector from a verified Actions run in this repository. Confirm its exact commit, successful workflow/job/step and artifact digest. Run `node scripts/export-evidence.cjs <extracted-artifact-directory>` on the checkout to publish. This rejects incomplete route matrices, missing pages, changed artifact bytes and mismatched report inputs. Receipts bind commit/tree/run/timestamps and engine/content identity to a SHA-256 fingerprint of report code, delivery code, data and verifier. A receipt does not substitute for trusting its Actions origin.

`node scripts/check-soak.cjs RESULT.json --exports <extracted-artifact-directory>` imports verified checks. Verification may correctly precede deployment. Documentation-only follow-ups may reuse evidence for identical report inputs. A current actual failure wins over prior success. Content/rendering/delivery changes require new candidate evidence. Arbitrary JSON passes, file parsing, print-button invocation and missing tooling never substitute for it.

Keep October 7 owner verification accepted for its historical baseline; do not invent hashes or generalize it to new content. Keep source/claim dates, browser checks, artifacts, CI, live delivery and owner review separate. No new waiting period or schedule change applies.

## Rollback decisions

A later session's missing capabilities do not invalidate recorded applicable verification or establish a production regression. Do not roll back a healthy verified deployment solely because the assistant cannot reopen HTML or capture PDF. Hold a new unverified candidate, retrieve CI evidence or repair the runner, and retain the last verified deployment. Roll back for an evidenced regression, corrupted delivery, unsupported/unsafe published guidance or failed applicable material check, recording the finding and known complete restore target. Reconcile fresh GitHub/Sites revisions so older maintainers cannot overwrite newer verified fixes.

The process repair initially left the rolled-back October 9 factual batch staged in Git history. The owner-requested restoration subsequently passed its own 30-case native export matrix and was published as Site version 141; see [the restoration audit](audits/2026-10-09-held-revisions-publication.json). The earlier rollback remains historical evidence.
