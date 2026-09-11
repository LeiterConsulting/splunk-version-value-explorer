# Contributing

Thank you for helping improve the Splunk Version Value Explorer. Contributions from Splunk practitioners, customers, partners, and the broader community are welcome.

## Ways to contribute

- Add newly released Splunk Enterprise or Splunk Cloud Platform versions
- Correct an upgrade transition or readiness requirement
- Add a meaningful capability or customer outcome
- Improve citations, accessibility, responsive behavior, or interface clarity
- Report an issue or propose a larger enhancement

For substantial changes, open an issue first so the intended scope and approach can be discussed before implementation.

## Content principles

Contributed guidance should be:

1. **Source-backed.** Link factual release and upgrade claims to official Splunk documentation.
2. **Outcome-oriented.** Explain why a capability matters instead of reproducing release-note text.
3. **Platform-specific.** Treat Splunk Enterprise transitions as customer-managed upgrade paths and Splunk Cloud Platform releases as Splunk-managed capability milestones.
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

## Pull-request checklist

- [ ] Every factual release claim has an official source URL
- [ ] Upgrade paths match the applicable Splunk upgrade-path table
- [ ] New content is concise and written for a customer read-ahead
- [ ] Existing Enterprise and Cloud comparisons still render correctly
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
