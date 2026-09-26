window.VersionCompassMaintenance = {
  "schemaVersion": 1,
  "trackingSince": "2026-09-25",
  "scheduleSnapshot": "2026-09-25",
  "watches": [
    {
      "id": "csp-fedramp-watch",
      "name": "CSP FedRAMP Watch",
      "lastAttempt": "2026-09-25T11:19:20.913079+00:00",
      "lastSuccess": null,
      "outcome": "not-recorded",
      "summary": "Scheduler records an attempt; completion and review outcome were not captured in this ledger.",
      "history": [
        {
          "at": "2026-09-25T11:19:20.913079+00:00",
          "outcome": "not-recorded",
          "summary": "Imported scheduler attempt timestamp; not evidence of successful completion."
        }
      ]
    },
    {
      "id": "version-release-watch",
      "name": "Version Release Watch",
      "lastAttempt": "2026-09-26T09:11:11Z",
      "lastSuccess": "2026-09-26T09:20:06Z",
      "outcome": "changed",
      "summary": "Added an Enterprise 10.4.3-or-later maintenance target because Splunk advises against 10.4.2 for acknowledged forwarding; no other material release change was found.",
      "history": [
        {
          "at": "2026-09-25T09:49:25.513366+00:00",
          "outcome": "not-recorded",
          "summary": "Imported scheduler attempt timestamp; not evidence of successful completion."
        },
        {
          "at": "2026-09-26T09:11:11Z",
          "outcome": "running",
          "summary": "Reviewing official Splunk release, compatibility, migration, security and customer-managed Observability sources for changes affecting Version Compass.",
          "scope": "Splunk Enterprise, Cloud Platform, Enterprise-to-Cloud migration, Enterprise Security, ITSI, Observability Cloud, compatibility and security notices, Splunkbase app listings, and maintained OpenTelemetry component release streams."
        },
        {
          "at": "2026-09-26T09:20:06Z",
          "outcome": "changed",
          "summary": "Added an Enterprise 10.4.3-or-later maintenance target because Splunk advises against 10.4.2 for acknowledged forwarding; no other material release change was found.",
          "scope": "Splunk Enterprise, Cloud Platform, Enterprise-to-Cloud migration, Enterprise Security, ITSI, Observability Cloud, compatibility and security notices, Splunkbase app listings, and maintained OpenTelemetry component release streams."
        }
      ],
      "scope": "Splunk Enterprise, Cloud Platform, Enterprise-to-Cloud migration, Enterprise Security, ITSI, Observability Cloud, compatibility and security notices, Splunkbase app listings, and maintained OpenTelemetry component release streams."
    },
    {
      "id": "es-editions-watch",
      "name": "ES Editions Watch",
      "lastAttempt": "2026-09-25T10:03:41.288013+00:00",
      "lastSuccess": null,
      "outcome": "not-recorded",
      "summary": "Scheduler records an attempt; completion and review outcome were not captured in this ledger.",
      "history": [
        {
          "at": "2026-09-25T10:03:41.288013+00:00",
          "outcome": "not-recorded",
          "summary": "Imported scheduler attempt timestamp; not evidence of successful completion."
        }
      ]
    },
    {
      "id": "version-guidance-audit",
      "name": "Version Guidance Audit",
      "lastAttempt": "2026-09-24T12:45:24.855849+00:00",
      "lastSuccess": null,
      "outcome": "not-recorded",
      "summary": "Scheduler records an attempt; completion and review outcome were not captured in this ledger.",
      "history": [
        {
          "at": "2026-09-24T12:45:24.855849+00:00",
          "outcome": "not-recorded",
          "summary": "Imported scheduler attempt timestamp; not evidence of successful completion."
        }
      ]
    }
  ]
};
