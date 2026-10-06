# Release notes

Repository-only release history for Version Compass. Browse by year, then month. Historical records begin September 16, 2026.

## Releases

- [2026](2026/README.md)

## Recording policy

- New notes use `docs/releases/YYYY/MM/YYYY-MM-DD.md`, dated in `America/New_York`.
- Keep one authoritative note per date; append same-day changes to the note returned by `scripts/release-archive.cjs`, including an existing legacy note.
- Previously published flat files are retained at their original URLs, with their headings and relative links intact. They are listed in `legacy-dates.json`; do not add new flat dates or create duplicate copies. Year/month indexes include these historical notes.
- Record material repository or live-site changes and concise published maintenance outcomes. Outcome-only entries must not advance factual review dates, lifecycle dates, or content-change cycles.
- Summarize user-visible behavior, compatibility or risk implications, authoritative evidence, validation and actual publication state.
- Keep release history in the repository, not in the comparison interface.
- Run `node scripts/sync-release-metadata.cjs`, then its `--check` gate. The generator discovers both layouts, keeps the latest-note link accurate, and maintains every year/month index. It fails on duplicate dates, invalid dates, misplaced notes and new flat files.
