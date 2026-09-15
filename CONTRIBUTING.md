# Contributing

Thank you for helping improve the Splunk Version Value Explorer. Contributions from Splunk practitioners, customers, partners, and the broader community are welcome.

The published project is available at [versioncompass.com](https://versioncompass.com).

## Ways to contribute

- Add newly released Splunk Enterprise or Splunk Cloud Platform versions
- Correct an upgrade transition or readiness requirement
- Improve Enterprise-to-Cloud assessment, preparation, validation, cutover, or operating-model guidance
- Add a meaningful capability or customer outcome
- Improve citations, accessibility, responsive behavior, or interface clarity
- Report an issue or propose a larger enhancement

For substantial changes, open an issue first so the intended scope and approach can be discussed before implementation.

## Content principles

Contributed guidance should be:

1. **Source-backed.** Link factual release and upgrade claims to official Splunk documentation.
2. **Outcome-oriented.** Explain why a capability matters instead of reproducing release-note text.
3. **Journey-specific.** Treat Splunk Enterprise transitions as customer-managed upgrade paths, Splunk Cloud Platform releases as Splunk-managed capability milestones, and Enterprise-to-Cloud moves as environment-dependent migration programs.
4. **Environment-aware.** Avoid presenting summarized guidance as a substitute for compatibility review or environment-specific planning.
5. **Privacy-preserving.** Do not add forms, tracking, registration, or collection of customer details.

## Adding a release

Release content lives in `dist/data.js`.

1. Add the release identifier to the appropriate `releases` array.
2. Add the release date and official release-note URL under `releasesData`.
3. Add notable capabilities with a title, value theme, outcome, and concise explanation.
4. Add documented blockers, tests, validation work, or planning considerations.
5. For Splunk Enterprise, update the `edges` map with supported release transitions.
6. Update the platform's `latest` value and the reviewed date in `dist/index.html`.
7. Test several version combinations, including one that requires an intermediate Enterprise step upgrade.

## Updating Enterprise-to-Cloud guidance

Migration content lives in the top-level `migration` object in `dist/data.js`.

1. Confirm the current SCMA release and its supported Splunk Enterprise versions on Splunkbase.
2. Review Splunk's migration guided path for changes to readiness, preparation, validation, and transition guidance.
3. Review the selected destination's Cloud Platform release notes and update destination capabilities separately from operating-model benefits.
4. Keep migration approaches descriptive. Do not prescribe one without customer-specific discovery.
5. Add or change a recommended action only when its source explains the underlying requirement or practice.
6. Update `docs/enterprise-to-cloud.md`, the reviewed date, and screenshots when the user experience or guidance model changes materially.

## Pull-request checklist

- [ ] Every factual release claim has an official source URL
- [ ] Upgrade paths match the applicable Splunk upgrade-path table
- [ ] New content is concise and written for a customer read-ahead
- [ ] Existing Enterprise and Cloud comparisons still render correctly
- [ ] Enterprise-to-Cloud guidance clearly separates blockers, decisions, tests, and operating steps
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
