# Contributing

Thank you for helping improve Version Compass. Contributions from Splunk practitioners, customers, partners, and the broader community are welcome.

The published project is available at [versioncompass.com](https://versioncompass.com).

## Ways to contribute

- Add newly released Splunk Platform, Enterprise Security, or ITSI versions
- Add a meaningful dated Splunk Observability Cloud milestone or customer-managed OpenTelemetry prerequisite
- Correct an upgrade transition or readiness requirement
- Correct a premium-product platform pairing or Cloud-managed availability statement
- Improve Enterprise-to-Cloud assessment, preparation, validation, cutover, or operating-model guidance
- Add or correct a route-specific technical transition
- Add a meaningful capability or customer outcome
- Improve citations, accessibility, responsive behavior, or interface clarity
- Report an issue or propose a larger enhancement

For substantial changes, open an issue first so the intended scope and approach can be discussed before implementation.

## Content principles

Contributed guidance should be:

1. **Source-backed.** Link factual release and upgrade claims to official Splunk documentation.
2. **Outcome-oriented.** Explain why a capability matters instead of reproducing release-note text.
3. **Journey-specific.** Treat Splunk Enterprise transitions as customer-managed upgrade paths, Splunk Cloud Platform releases as Splunk-managed capability milestones, Enterprise-to-Cloud moves as environment-dependent migration programs, premium apps as platform-dependent products, and Observability Cloud as a rolling SaaS service with separately versioned customer-managed components.
4. **Technically scoped.** Distinguish bundled from app-owned runtimes, default from optional behavior, deprecation from removal, and a component change from a potential breaking change.
5. **Environment-aware.** Avoid presenting summarized guidance as a substitute for compatibility review or environment-specific planning.
6. **Privacy-preserving.** Do not add forms, tracking, registration, or collection of customer details.

## Adding a release

Platform release content lives in `dist/data.js`. Enterprise Security, ITSI, and Observability content lives in `dist/product-data.js`.

1. Add the release identifier to the appropriate `releases` array.
2. Add the release date and official release-note URL under `releasesData`.
3. Add notable capabilities with a title, value theme, outcome, and concise explanation.
4. Add each meaningful technical transition to `technicalChanges`. Include the component, technical domain, change type, action level, documented `from` and `to` states, operational implication, recommended action, and an official source.
5. Add documented blockers, tests, validation work, or planning considerations. Use the optional fifth `requirements` value (`true`) only when the source identifies a potential breaking change, removed support, changed default, compatibility constraint, or other behavior that can materially disrupt the selected route.
6. For Splunk Enterprise, update the `edges` map with supported release transitions.
7. For Enterprise Security or ITSI, update the platform-line mapping from the official patch-specific compatibility matrix and separately review the current Splunk Cloud service pairing.
8. For Observability, use a dated service milestone and attach Collector, chart, instrumentation, RUM, realm, or entitlement prerequisites only where the official guidance supports them.
9. Update the applicable `latest` value and the reviewed date in `dist/index.html`.
10. Test several combinations, including an Enterprise step upgrade, an incompatible premium-app pairing, a Cloud-managed pairing, and an Observability milestone. Confirm the technical section remains collapsed on screen but expands in print.

See `docs/product-tracks.md` for the product dependency model and `docs/technical-changes.md` for field definitions, classification rules, and review guidance.

## Updating Enterprise-to-Cloud guidance

Migration content lives in the top-level `migration` object in `dist/data.js`.

1. Confirm the current SCMA release and its supported Splunk Enterprise versions on Splunkbase.
2. Review Splunk's migration guided path for changes to readiness, preparation, validation, and transition guidance.
3. Review the selected destination's Cloud Platform release notes and update destination capabilities separately from operating-model benefits.
4. Keep migration approaches descriptive. Do not prescribe one without customer-specific discovery.
5. Review `migration.technicalChanges` for changes to apps, runtimes, connectivity, trust, identity, data movement, APIs, and the customer/Splunk operating boundary.
6. Review `migration.breakingChanges` against Splunk's current blockers/showstoppers and potential delay-causing risks. Keep those callouts separate from the sequenced action plan.
7. Add or change a recommended action only when its source explains the underlying requirement or practice.
8. Update `docs/enterprise-to-cloud.md`, the reviewed date, and screenshots when the user experience or guidance model changes materially.

## Release notes for published changes

Every material change that reaches the repository or live site must be represented in the release notes:

1. Use `docs/releases/YYYY-MM-DD.md`, dated in `America/New_York`.
2. Append to an existing note when more than one change is published on the same local date.
3. Summarize the user-visible result, compatibility or risk impact, authoritative sources, validation, and publication status.
4. Keep the note concise and written for reviewers; do not copy raw diffs or automation transcripts.
5. Do not create a release note for a no-change audit.
6. Add a new date to `docs/releases/README.md` when the day's first material change is published.

## Pull-request checklist

- [ ] Every factual release claim has an official source URL
- [ ] Upgrade paths match the applicable Splunk upgrade-path table
- [ ] Enterprise Security and ITSI pairings match the official compatibility matrix and preserve patch-level caveats
- [ ] Cloud premium-app availability is not inferred from Enterprise compatibility
- [ ] Observability SaaS milestones are separated from Collector, chart, instrumentation, RUM, realm, and entitlement dependencies
- [ ] New content is concise and written for a customer read-ahead
- [ ] Existing Enterprise and Cloud comparisons still render correctly
- [ ] Enterprise-to-Cloud guidance clearly separates blockers, decisions, tests, and operating steps
- [ ] Potential breaking changes are sourced, route-specific, and not presented as exhaustive
- [ ] Technical changes state the correct scope and do not turn every component update into a breaking-change claim
- [ ] Technical records include a useful implication and an evidence-supported recommended action
- [ ] The applicable Eastern-date release note summarizes every published material change
- [ ] Shareable URLs restore the selected product, platform context, host release, and both comparison values
- [ ] The print view includes all value categories, expands technical details, and remains readable when saved as PDF
- [ ] Partner-authored Splunk Lantern material is identified as guidance and not represented as a product warranty
- [ ] Keyboard navigation and mobile layout remain usable
- [ ] No secrets, customer data, analytics, or tracking code are included

## Working locally

The project is a dependency-free static site. From the repository root:

```bash
python -m http.server 8000
```

Open `http://localhost:8000/dist/`.

## Collaboration

Be respectful, specific, and constructive. Assume good intent, explain the evidence behind requested changes, and keep discussions focused on improving the project for its users.
