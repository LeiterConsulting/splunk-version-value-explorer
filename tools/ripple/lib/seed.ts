import type { Assessment, Snapshot } from "./types";

export const families = [
  { id: "networking", name: "Networking", products: "IOS / IOS XE / IOS XR, Catalyst, Nexus, ACI, wireless" },
  { id: "security", name: "Security", products: "Secure Firewall, ISE, Secure Endpoint, Secure Email / Web, Umbrella, Duo, XDR" },
  { id: "collaboration", name: "Collaboration", products: "Webex, Unified Communications, Contact Center, Expressway" },
  { id: "compute", name: "Compute & data center", products: "UCS, HyperFlex, Intersight, infrastructure management" },
  { id: "meraki", name: "Meraki", products: "MX / MS / MR / MV / MT, Systems Manager, dashboard" },
  { id: "splunk", name: "Splunk", products: "Enterprise / Cloud, Universal & Heavy Forwarders, ES, ITSI, SOAR, UBA, apps" },
  { id: "observability", name: "Observability", products: "AppDynamics, ThousandEyes, Splunk Observability Cloud" },
  { id: "iot", name: "Industrial & IoT", products: "Industrial networking, Cyber Vision, Field Network Director, IOx" },
  { id: "wan", name: "SD-WAN & SASE", products: "Catalyst SD-WAN, vManage, Secure Access, cloud connectivity" },
  { id: "service-provider", name: "Service provider", products: "NCS, optical, Ultra Cloud Core, mobility, cable" },
  { id: "management", name: "Management & services", products: "Catalyst Center, Crosswork, NSO, Prime, CX Cloud, collectors" },
];
const cisco = "https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/";
export const sources = [
  { id: "log4j", name: "Cisco PSIRT · Log4j", url: cisco + "cisco-sa-apache-log4j-qRuKNEbd", expected: "CVE-2021-44228" },
  { id: "http2", name: "Cisco PSIRT · HTTP/2", url: cisco + "cisco-sa-http2-reset-d8Kf32vZ", expected: "CVE-2023-44487" },
  { id: "openssl", name: "Cisco PSIRT · OpenSSL", url: cisco + "cisco-sa-openssl-W9sdCc2a", expected: "CVE-2022-3602" },
  { id: "splunk-july", name: "Splunk · SVD-2025-0710", url: "https://advisory.splunk.com/advisories/SVD-2025-0710", expected: "CVE-2024-9143" },
  { id: "splunk-curl", name: "Splunk · SVD-2024-0303", url: "https://advisory.splunk.com/advisories/SVD-2024-0303", expected: "CVE-2023-38545" },
  { id: "splunk-uba", name: "Splunk · SVD-2025-0713", url: "https://advisory.splunk.com/advisories/SVD-2025-0713", expected: "CVE-2024-40635" },
];
export const feeds = [
  { id: "cisco-feed", name: "Cisco PSIRT advisory feed", url: "https://sec.cloudapps.cisco.com/security/center/psirtrss20/CiscoSecurityAdvisory.xml" },
  { id: "splunk-feed", name: "Splunk advisory feed", url: "https://advisory.splunk.com/feed.xml" },
  { id: "cisa-kev", name: "CISA known exploited catalog", url: "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json" },
];
const verifiedAt = "2026-10-06";
const make = (a: Omit<Assessment, "verifiedAt">): Assessment => ({ ...a, verifiedAt });
const log = { cve: "CVE-2021-44228", component: "Apache Log4j", title: "Log4j remote code execution", severity: "Critical" as const, relationship: "embedded" as const, sourceId: "log4j", scope: "Historical advisory product scope; patch state required.", condition: "Confirm installed release and vendor patch.", rationale: "Listed in the Cisco Log4j advisory. The library name alone does not determine deployment exposure." };
const http = { cve: "CVE-2023-44487", component: "HTTP/2 implementation", title: "HTTP/2 Rapid Reset", severity: "High" as const, relationship: "protocol" as const, sourceId: "http2", verdict: "affected" as const, scope: "Feature-specific product scope; verify release with Cisco bug details.", rationale: "Cisco identifies a specific product feature as affected." };
const records: Assessment[] = [
  make({ ...http, id: "http2-iosxe", product: "Cisco IOS XE", family: "networking", feature: "gNMI server", condition: "gNMI server feature", action: "Advisory lists 17.15.1; consult CSCwi23471 for platform details.", section: "Vulnerable Products → IOS XE Software (gNMI Server feature)" }),
  make({ ...http, id: "http2-ftd", product: "Cisco Secure Firewall FTD", family: "security", feature: "Streaming telemetry DIAL-IN", condition: "Streaming telemetry DIAL-IN mode", action: "Advisory lists 7.4.2; consult CSCwi12388.", section: "Vulnerable Products → Firepower Threat Defense" }),
  make({ ...http, id: "http2-expressway", product: "Cisco Expressway", family: "collaboration", condition: "Release and HTTP/2 configuration require validation.", action: "Advisory lists X14.3.3; consult CSCwh88665.", section: "Vulnerable Products → Expressway Series" }),
  make({ ...log, id: "log4j-ise", product: "Cisco Identity Services Engine", family: "security", verdict: "affected", action: "Check branch-specific ISE hotfix in CSCwa47133.", section: "Vulnerable Products → Cisco Identity Services Engine (ISE)" }),
  make({ ...log, id: "log4j-intersight", product: "Cisco Intersight Virtual Appliance", family: "compute", verdict: "affected", action: "Advisory lists 1.0.9-361; consult CSCwa47304.", section: "Vulnerable Products → Cisco Intersight Virtual Appliance" }),
  make({ ...log, id: "log4j-vmanage", product: "Cisco SD-WAN vManage", family: "wan", verdict: "affected", action: "Use branch-specific fixes in CSCwa47745.", section: "Vulnerable Products → Cisco SD-WAN vManage" }),
  make({ ...log, id: "log4j-meraki", product: "Cisco Meraki MX", family: "meraki", verdict: "not_affected", scope: "Meraki MX Series as listed in the 2021 advisory.", condition: "Vendor exclusion is CVE-specific.", action: "No remediation for this CVE in the listed product scope.", rationale: "Cisco explicitly lists Meraki MX as not vulnerable in this advisory.", section: "Products Confirmed Not Vulnerable → Meraki MX Series" }),
  make({ cve: "CVE-2022-3602", component: "OpenSSL", title: "X.509 email address buffer overflow", id: "openssl-fnd", product: "Cisco IoT Field Network Director", family: "iot", severity: "High", verdict: "review", relationship: "embedded", scope: "Cisco lists product affected by one or more of the paired OpenSSL CVEs; individual CVE applicability needs bug confirmation.", condition: "Confirm component, release and per-CVE detail in CSCwd44112.", action: "Advisory lists 4.8.1, 4.9.0 and 5.0.0 fixes; consult bug.", sourceId: "openssl", section: "Vulnerable Products → IoT Field Network Director", rationale: "Vendor advisory groups CVE-2022-3602 and CVE-2022-3786. Product-level exposure is documented; do not assume identical applicability." }),
  ...[ ["appd", "AppDynamics Cloud", "observability"], ["te", "ThousandEyes Cloud", "observability"], ["duo", "Duo Cloud", "security"] ].map(([id, product, family]) => make({ id: "openssl-" + id, cve: "CVE-2022-3602", component: "OpenSSL", title: "X.509 email address buffer overflow", product, family, severity: "High", verdict: "not_affected", relationship: "embedded", scope: "Named cloud offering in the November 2022 advisory.", condition: "Does not cover customer integrations or host software.", action: "No remediation in the listed cloud scope for this CVE.", sourceId: "openssl", section: "Cisco Cloud Offerings → " + product.replace(" Cloud", ""), rationale: "Cisco reports this cloud offering as not affected by the paired OpenSSL CVEs." })),
  make({ id: "splunk-setuptools", cve: "CVE-2024-6345", component: "Python setuptools", title: "Third-party package remediation", product: "Splunk Enterprise", family: "splunk", severity: "High", verdict: "affected", relationship: "embedded", scope: "Python 3.9 setuptools package in the vendor-listed release branches.", condition: "Check installed Splunk branch and version.", action: "Use the mapped vendor fix for the selected branch.", sourceId: "splunk-july", section: "Description → setuptools / note 1; Product Status", rationale: "Splunk publishes affected ranges and fixed versions for this package update.", rules: [{branch:"9.4",from:"9.4.0",through:"9.4.2",fixed:"9.4.3"},{branch:"9.3",from:"9.3.0",through:"9.3.4",fixed:"9.3.5"},{branch:"9.2",from:"9.2.0",through:"9.2.6",fixed:"9.2.7"},{branch:"9.1",from:"9.1.0",through:"9.1.9",fixed:"9.1.10"}] }),
  ...[ ["enterprise", "Splunk Enterprise"], ["uf", "Splunk Universal Forwarder"] ].map(([id, product]) => make({id: "splunk-openssl-"+id, cve:"CVE-2024-9143",component:"OpenSSL",title:"Explicit vendor exclusion",product,family:"splunk",severity:"Informational",verdict:"not_affected",relationship:"embedded",scope:"Bundled OpenSSL as described in SVD-2025-0710, note 9.",condition:"Upgraded library does not imply this CVE affected the product.",action:"No action for this CVE in the documented component scope.",sourceId:"splunk-july",section:"Description → OpenSSL, note 9",rationale:"Splunk explicitly excludes both Enterprise and Universal Forwarder for this CVE."})),
  make({id:"splunk-curl",cve:"CVE-2023-38545",component:"libcurl",title:"SOCKS5 heap buffer overflow",product:"Splunk Enterprise",family:"splunk",severity:"High",verdict:"not_affected",relationship:"embedded",scope:"Splunk Enterprise per SVD-2024-0303 note 3.",condition:"Applies to the product-specific vendor exclusion.",action:"Distinguish library maintenance from CVE exposure.",sourceId:"splunk-curl",section:"Description → curl, note 3",rationale:"The vendor explicitly excludes Enterprise, although curl was updated."}),
  make({id:"splunk-uba-containerd",cve:"CVE-2024-40635",component:"containerd",title:"Third-party container runtime update",product:"Splunk User Behavior Analytics",family:"splunk",severity:"Medium",verdict:"affected",relationship:"embedded",scope:"UBA 5.4 releases below 5.4.3.",condition:"Selected version must be on the verified 5.4 branch.",action:"Vendor fix: UBA 5.4.3.",sourceId:"splunk-uba",section:"Description → containered.io; Product Status",rationale:"Vendor maps this container runtime CVE to UBA remediation.",rules:[{branch:"5.4",from:"5.4.0",through:"5.4.2",fixed:"5.4.3"}]}),
];
export function baseline(): Snapshot {
  return {schemaVersion:1,records:structuredClone(records),candidates:[],checks:[],lastRun:null,storage:"baseline",updateStatus:"not_run",runs:0};
}
