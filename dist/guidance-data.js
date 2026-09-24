/* Explicit policy dates, and durable URL identities. */
(function (data) {
  "use strict";
  const policy = "https://www.splunk.com/en_us/legal/splunk-software-support-policy.html";
  data.guidance = {
    reviewed: "2026-09-24",
    lifecycle: {
      source: policy, reviewed: "2026-09-22", soonDays: 180,
      enterprise: { "8.1": "2023-04-19", "8.2": "2023-09-30", "9.0": "2024-06-14", "9.1": "2025-06-28", "9.2": "2026-01-31", "9.3": "2026-07-24", "9.4": "2026-12-16", "10.0": "2027-07-28", "10.2": "2028-01-15", "10.4": "2028-05-18" },
      es: { "7.3": "2026-02-28", "8.0": "2026-10-30", "8.1": "2027-06-10", "8.2": "2027-09-09", "8.3": "2027-11-19", "8.4": "2028-02-04", "8.5": "2028-04-08", "8.6": "2028-08-04", "8.7": "2028-09-02" },
      itsi: { "4.15": "2024-11-15", "4.17": "2025-06-13", "4.18": "2026-01-23", "4.19": "2026-05-28", "4.20": "2027-02-27", "4.21": "2027-09-02", "5.0": "2028-06-30" },
      maintenanceLines: { itsi: { "5.0.1": "5.0", "5.0.2": "5.0" } }
    },
    // Retain published release IDs and records. Add only reviewed, equivalent
    // aliases here; never map an old release to the newest release automatically.
    urlAliases: { product: {}, platform: {}, releases: {} }
  };

}(window.SPLUNK_DATA));
