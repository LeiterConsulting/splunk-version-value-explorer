/* Explicit policy dates, setup qualifications, and durable URL identities. */
(function (data) {
  "use strict";
  const policy = "https://www.splunk.com/en_us/legal/splunk-software-support-policy.html";
  data.guidance = {
    reviewed: "2026-09-19",
    lifecycle: {
      source: policy, reviewed: "2026-09-19", soonDays: 180,
      enterprise: { "8.1": "2023-04-19", "8.2": "2023-09-30", "9.0": "2024-06-14", "9.1": "2025-06-28", "9.2": "2026-01-31", "9.3": "2026-07-24", "9.4": "2026-12-16", "10.0": "2027-07-28", "10.2": "2028-01-15", "10.4": "2028-05-18" },
      es: { "7.3": "2026-02-28", "8.0": "2026-10-30", "8.1": "2027-06-10", "8.2": "2027-09-09", "8.3": "2027-11-19", "8.4": "2028-02-04", "8.5": "2028-04-08", "8.6": "2028-08-04", "8.7": "2028-09-02" },
      itsi: { "4.15": "2024-11-15", "4.17": "2025-06-13", "4.18": "2026-01-23", "4.19": "2026-05-28", "4.20": "2027-02-27", "4.21": "2027-09-02", "5.0": "2028-06-30" },
      maintenanceLines: { itsi: { "5.0.1": "5.0", "5.0.2": "5.0" } }
    },
    // Retain published release IDs and records. Add only reviewed, equivalent
    // aliases here; never map an old release to the newest release automatically.
    urlAliases: { product: {}, platform: {}, releases: {} }
  };

  function activation(track, release, title, label, detail, source) {
    const record = track.releasesData[release];
    const feature = record.features.find(function (item) { return item[0] === title; });
    if (!feature) throw new Error("Activation record does not match a capability: " + title);
    // Optional fifth field is a structured activation record, not a readiness claim.
    feature[4] = { label: label, detail: detail, source: source || record.source, reviewed: "2026-09-19" };
  }
  activation(data.enterprise, "10.2", "SPL2 in Search", "Network prerequisite", "For clustered deployments, allow the documented PostgreSQL communication between members before expecting SPL2 to work.", "https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.2/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-10.2-read-this-first");
  activation(data.cloud, "10.4.2604", "AI Canvas beta", "Beta onboarding", "App deployment alone does not grant access. Participation in the beta and its onboarding steps are required.");
  activation(data.cloud, "10.4.2604", "Azure data self-service", "Storage configuration", "Configure a customer-managed Azure Blob destination for DDSS; upgrading does not establish that storage workflow.");
  activation(data.cloud, "10.4.2604", "Unified federation", "Dataset configuration", "Set up remote datasets and their schemas in the Data Management app before using the federated workflow.");
  activation(data.productTracks.es, "8.7", "AI SOC Analyst", "Premier + enablement", "Requires Premier edition and access enabled through your Splunk representative.");
  activation(data.productTracks.es, "8.7", "Connector and Automation Builder agents", "Edition-dependent", "Connector Builder needs Premier and Splunk enablement. Automation Builder is documented for Essentials and Premier.");
  activation(data.productTracks.es, "8.7", "Enterprise Security on MCP", "App + access setup", "Use Splunk MCP Server app 1.3.x or later, appropriate tool permissions, and an encrypted access token. Verify that the relevant tools are enabled.", "https://help.splunk.com/en/splunk-enterprise-security-8/user-guide/8.7/introduction/use-the-splunk-mcp-server-app-to-access-tools-in-splunk-enterprise-security");
  activation(data.productTracks.itsi, "5.0.1", "Prioritized episode policies", "Enabled by the release", "Prioritization is always enabled in 5.0.1; review matching priorities because the prior opt-out is removed.");
  activation(data.productTracks.itsi, "5.0.1", "ITSI MCP tools", "MCP configuration", "Configure the Splunk MCP Server integration and authorized client access before using ITSI tools.", "https://help.splunk.com/en/splunk-it-service-intelligence/splunk-it-service-intelligence/administer/5.0/use-it-service-intelligence-with-splunk-mcp-server");
  activation(data.productTracks.observability, "Jul 2026", "Incident grouping", "Controlled availability", "The July release documents us1 availability. Confirm access with Splunk and configure incident notification rules for the relevant services.");
  activation(data.productTracks.observability, "Sep 2026", "Collector 0.161 pipeline controls", "Collector update", "Deploy the standalone Collector update and validate changed defaults. A Cloud service milestone does not update customer-managed collectors.", "https://github.com/signalfx/splunk-otel-collector/releases/tag/v0.161.0");
  activation(data.productTracks.observability, "Sep 2026", "Collector lookup processor", "Pipeline configuration", "Use a Collector distribution containing the lookup processor and configure it in the relevant pipeline.", "https://github.com/signalfx/splunk-otel-collector/releases/tag/v0.160.1");
}(window.SPLUNK_DATA));
