# About and source compendium

The About route is `?view=about`. Its source register is generated from all five maintained product/evidence data files and directly embedded official guidance URLs. One row per exact URL preserves version and fragment distinctions. Catalog source identifiers are resolved back to consuming content locations. Conflicting evidence is marked for reconciliation, not silently invalidated.

Run `node scripts/sync-source-register.cjs` after any citation or source-review change, then `node scripts/sync-source-register.cjs --check` before publication. This is a local data synchronization, not a source recheck. Do not advance review dates merely because the script ran or the website was published.

The generated register is a persistent ledger: commit it and never regenerate from an empty file. Removed citations remain retired with a dated event; reinstatement creates another event. First recorded starts with the register baseline. First used is unknown unless supported by independent history. Earlier retired citations are not reconstructed. Exact source-level checked/reviewed fields supply dates; dataset-wide dates and page publication dates do not.

Use `docs/source-annotations.json`, keyed by exact URL, for independently verified `firstUsed`, `reviewed`, `outdatedAsOf`, `conflict`, and `reason`. Outdated findings require a dated determination and an explanation of affected scope or replacement. A source can be retired but accurate for historical use, or still cited while disputed/outdated. Never infer inaccuracy from age, a removed reference, or a broken link alone. Preserve findings and events during subsequent updates. Correct or qualify affected product claims when a source becomes inaccurate.

The About page describes actual scheduled checks in Eastern time: releases daily 05:00, editions daily 06:00, Cloud/FedRAMP daily 07:00, guidance Monday/Thursday 08:00. Update its schedule explanation when tasks change. These are schedules, not claims that a check completed. Keep both themes, source filters/sort, shared query state, empty results, mobile layout and accessible status feedback working.

## Verification details

Source annotations now support supporting `section` and `verificationScope`. Verify the actual body/table, not just accessibility or a publication timestamp. A source-level date applies only to that recorded scope. Claim evidence disclosures explicitly distinguish source-level verification from claim-specific dates; unknown sections/dates remain unknown. Preserve existing source questions. The September 25 targeted check covers the 10.4 upgrade table (origins 9.3, 9.4, 10.0, 10.2), selected ES/ITSI compatibility rows, and Moderate package F1607197917 offering status. It does not reverify all historical paths or certify feature authorization.
