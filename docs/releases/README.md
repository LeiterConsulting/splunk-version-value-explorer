# Release notes

This directory contains concise, repository-only release notes for Version Compass. Historical records begin September 16, 2026.

## Releases

- [September 25, 2026](2026-09-25.md)
- [September 24, 2026](2026-09-24.md)
- [September 23, 2026](2026-09-23.md)
- [September 22, 2026](2026-09-22.md) — Kubernetes chart 0.161.0, Collector migration guidance, and release metadata synchronization
- [September 21, 2026](2026-09-21.md) — Current product-first interface and capability screenshots
- [September 19, 2026](2026-09-19.md) — Route takeaways, lifecycle guidance, durable links, WebMCP tools, and Collector 0.161 boundaries
- [September 18, 2026](2026-09-18.md) — ITSI 5.0.2 maintenance release, MCP pagination, and reliability fixes
- [September 17, 2026](2026-09-17.md) — Platform runtime guidance, Cloud scope corrections, and ES 8.7 edition boundaries
- [September 16, 2026](2026-09-16.md) — Observability/OpenTelemetry updates and the Enterprise Security 8.6.1 security floor

## Recording policy

- Use one file per `America/New_York` calendar date: `YYYY-MM-DD.md`.
- Append later changes to the existing note when multiple updates ship on the same date.
- Record only material repository or live-site changes. A completed audit with no changes does not create an empty entry.
- Summarize customer-visible behavior, compatibility or risk implications, authoritative evidence, validation, and publication state.
- Write the note as part of the same reviewed change set whenever possible.
- Keep the website itself focused on comparison and reporting; release history remains in this repository.
- Before publishing, run `node scripts/sync-release-metadata.cjs` followed by `node scripts/sync-release-metadata.cjs --check`. This derives all publication labels and the direct header link from the newest dated note and maintains this index. CI and report tests reject stale metadata.
