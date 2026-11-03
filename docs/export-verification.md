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

## Prep11 pagination regression coverage

`pagination.py` accepts `headingOccurrence` to bind a check to a particular heading
in printed page order, then requires its following text after that heading on the
same page. Use this for repeating titles. The earlier any-page matcher could accept
a broken first citation when its title repeated later in the source register.
The retained six-page Safari text fixture reproduces the actual split; its JSON
provenance binds both original PDF and extracted text hashes. This historical
fixture tests detection, not the candidate's rendering in Safari.

Prep11 default/shared cases dynamically cover every canonical record, question and
source. The positive native Chromium PDFs must keep each short card's paragraphs
and each citation's title/URL/review scope together. Receipt fields
`prep11PaginationCoverage` and `paginationRegression` retain coverage and the
negative replay. The negative disables containment in fresh Chromium output; it
is explicitly controlled, not labeled an actual Safari or original-layout replay.
The existing forced-page-boundary fallback is recorded distinctly when needed.

Every Prep11 report section must also contain a lead group with its heading and
initial content. Include every paragraph, question title and first list entry in
that group's page assertions. A retained seven-page native Safari fixture
reproduces the question, source-directory and verification-register section
orphans that the original card/citation-only gate omitted. Use the complete first
verification entry: its title also occurs earlier in the source directory and can
otherwise produce an ambiguous match. The current matrix checks 73 pairs across
all five section leads, seven records, six questions and eight numbered sources.

Both default Prep11 theme cases also retain `oversized/`: a fresh synthetic card
with 48 uniquely numbered paragraphs and a final marker. Every paragraph must
survive native printing; the result must span multiple pages while keeping its
label/heading/lead together. Each page is rendered and checked for blank pages and
out-of-bounds text. The probe is a separate CI page and cannot change the visitor's
selection or canonical dataset. Its root/body theme classes and computed print
text/background colors must match the canonical page, including citation/scope
contrast. The first page must contain the first synthetic paragraph; a revision-only
preface cannot stand in for meaningful first-page output. Inspect the retained images separately from these
automated checks. Chromium checks, historical Safari evidence, new Safari capture
and actual downloaded-HTML reopening remain distinct verification states.

## Rollback decisions

A later session's missing capabilities do not invalidate recorded applicable verification or establish a production regression. Do not roll back a healthy verified deployment solely because the assistant cannot reopen HTML or capture PDF. Hold a new unverified candidate, retrieve CI evidence or repair the runner, and retain the last verified deployment. Roll back for an evidenced regression, corrupted delivery, unsupported/unsafe published guidance or failed applicable material check, recording the finding and known complete restore target. Reconcile fresh GitHub/Sites revisions so older maintainers cannot overwrite newer verified fixes.

The process repair initially left the rolled-back October 9 factual batch staged in Git history. The owner-requested restoration subsequently passed its own 30-case native export matrix and was published as Site version 141; see [the restoration audit](audits/2026-10-09-held-revisions-publication.json). The earlier rollback remains historical evidence.

## Advisor pagination regression coverage

Advisor reports keep short brief sections, evidence-date section leads, evidence
items and complete source-entry blocks together. Oversized blocks remain free to
fragment; containment is never implemented with clipping or fixed heights. The
shared verification register opts into an Advisor lead without changing Prep11's
existing groups or other report families.

Every valid Advisor route in both themes supplies dynamic heading-occurrence
pairs for all four section leads, bounded briefs, table caption/first row,
evidence-item paragraphs and complete source entries. The verifier retains
coverage counts and a controlled no-containment native negative; a forced native
page-boundary fallback is identified separately. Historical actual Chromium
page text from PR #66 at `f3eb1fb` reproduces the observed date-grid, table and
source-scope splits, with original PDF/text hashes and Actions artifact provenance.
These historical negatives test detection and do not constitute new Safari checks.

The Agent Mode known-context cases also print fresh oversized brief and source
blocks, each with 48 unique paragraphs and an end marker. Every fragment must
survive across multiple pages, the first page must contain real test content and
both theme appearances must match the canonical print theme. Artifact acceptance
requires the Advisor containment, negative replay and oversized completeness
records as well as the existing complete PDF/HTML/viewport inventory. Selected
rendered-page visual review remains separate from these automated checks.
