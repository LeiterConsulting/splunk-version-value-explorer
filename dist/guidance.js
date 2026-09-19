/* Shared route guidance and transparent URL resolution. No storage or network. */
(function () {
  "use strict";
  const data = window.SPLUNK_DATA;
  const own = function (o, key) { return Object.prototype.hasOwnProperty.call(o, key); };
  function today() {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const part = function (type) { return parts.find(function (p) { return p.type === type; }).value; };
    return part("year") + "-" + part("month") + "-" + part("day");
  }
  function lifecycle(product, platform, release, asOf) {
    asOf = asOf || today();
    const policy = data.guidance.lifecycle;
    const base = { product: product, platform: platform, release: release, asOf: asOf, verifiedOn: policy.reviewed, source: policy.source, endOfSupport: null };
    if (product === "observability") return Object.assign(base, { status: "service_milestone", label: "Service milestone", detail: "This date describes rolling service capabilities, not an installed version with a support deadline.", source: data.productTracks.observability.releaseOverview });
    if (platform === "cloud") return Object.assign(base, { status: "managed_service", label: "Splunk-managed", detail: "Confirm the stack's maintenance schedule and managed product pairing with Splunk. No on-premises deadline is inferred for this Cloud selection.", source: data.productTracks.es.cloudServiceSource });
    const key = product === "platform" ? "enterprise" : product;
    const line = (policy.maintenanceLines[key] || {})[release] || release;
    const end = own(policy[key] || {}, line) ? policy[key][line] : null;
    if (!end) return Object.assign(base, { status: "unverified", label: "Verify support date", detail: "No verified support deadline is recorded for this release. Check the policy before planning." });
    const days = Math.round((Date.parse(end + "T00:00:00Z") - Date.parse(asOf + "T00:00:00Z")) / 86400000);
    const status = days <= 0 ? "end_of_support" : days <= policy.soonDays ? "ending_soon" : "supported";
    return Object.assign(base, { status: status, label: status === "end_of_support" ? "End of support" : status === "ending_soon" ? "Support ending soon" : "Within support window", endOfSupport: end, daysRemaining: Math.max(0, days), policyLine: line,
      detail: (line !== release ? "Maintenance release follows the " + line + " support window. " : "") + "Version eligibility also depends on active support, compatible products, and supported operating systems. The 180-day planning flag is a Version Compass reminder." });
  }
  function routeLifecycle(state, asOf) {
    const migration = state.product === "platform" && state.platform === "migration";
    const rows = [Object.assign({ role: "In place" }, lifecycle(state.product, migration ? "enterprise" : state.platform, state.from, asOf)), Object.assign({ role: "Target" }, lifecycle(state.product, migration ? "cloud" : state.platform, state.to, asOf))];
    if (state.product !== "platform") rows.push(Object.assign({ role: "Platform context" }, lifecycle("platform", state.platform, state.host, asOf)));
    return rows;
  }
  function routeUrl(state, reviewed) {
    const params = new URLSearchParams();
    ["product", "platform", "host", "from", "to"].forEach(function (key) { if (state[key]) params.set(key, state[key]); });
    params.set("reviewed", reviewed || data.guidance.reviewed);
    return "?" + params.toString();
  }
  function activationFor(feature, state) {
    if (feature.activation) return feature.activation;
    // Missing qualification is explicitly unknown, never assumed automatic.
    return { label: "Verify activation", status: "not_assessed", detail: "This guide has not verified the activation steps for this capability. Review its source for setup, access, and availability before treating it as ready to use.", source: feature.source };
  }
  function takeaway(state) {
    const engine = window.VersionCompassComparison.create(data, state);
    const features = engine.selectedFeatures();
    const rows = [], categories = new Set();
    features.slice().reverse().forEach(function (f) { if (rows.length < 3 && !categories.has(f.category)) { rows.push({ text: f.outcome + " — " + f.title, source: f.source }); categories.add(f.category); } });
    const compat = engine.compatibilityAssessment();
    const readiness = engine.selectedReadinessItems();
    const breaking = engine.selectedBreakingChanges();
    const priority = { Blocker: 0, Required: 1, Validate: 2, Test: 3, Plan: 4 };
    const risk = breaking.slice().sort(function (a,b) { return (priority[a.level] ?? 5) - (priority[b.level] ?? 5); })[0];
    const prerequisite = readiness.find(function (r) { return r.level === "Blocker"; }) || readiness[0];
    const path = engine.selectedPath();
    let before = compat && compat.status === "warning" ? { text: compat.title + ". " + compat.detail, source: compat.source } : prerequisite ? { text: prerequisite.title, source: prerequisite.source } : null;
    if (engine.isCore() && state.platform === "enterprise") before = { text: !path.length ? "No supported path is recorded; confirm the official upgrade route." : (path.length > 2 ? "Plan intermediate releases: " + path.slice(1,-1).join(" → ") + "." : "A direct route is recorded; validate apps, topology, and exact maintenance releases."), source: data.enterprise.upgradeSource };
    return { highlights: rows, prerequisite: before, risk: risk ? { text: risk.title, source: risk.source } : { text: "No specific breaking change is highlighted in this interval; still review the full official guidance.", source: engine.isMigration() ? data.migration.sources.prepare : engine.activeTrack().releasesData[state.to].source }, note: "Selected highlights from this guide; availability and implementation still depend on your environment." };
  }
  function resolveUrl(search, defaults) {
    const params = new URLSearchParams(search);
    const keys = ["product", "platform", "host", "from", "to", "reviewed"];
    const requested = {}, reasons = [], errors = [];
    keys.forEach(function (key) { if (params.has(key)) { requested[key] = params.get(key); if (params.getAll(key).length > 1) errors.push("The link repeats " + key + "; choose one value."); } });
    const hasRoute = keys.some(function (key) { return params.has(key); });
    const aliases = data.guidance.urlAliases;
    function identity(key, value, allowed, fallback, map) {
      if (value === undefined) return fallback;
      if (allowed.includes(value)) return value;
      const entry = own(map || {}, value) ? map[value] : null;
      if (entry && allowed.includes(entry.to)) { reasons.push({ code: "mapped_identifier", text: key + " “" + value + "” now uses “" + entry.to + "”. " + entry.reason, source: entry.source }); return entry.to; }
      errors.push("The link's " + key + " “" + value + "” is not recognized. Select a supported value below.");
      return fallback;
    }
    const product = identity("product", requested.product, Object.keys(data.products), "platform", aliases.product);
    const platform = identity("platform", requested.platform, product === "platform" ? ["enterprise","cloud","migration"] : ["enterprise","cloud"], "enterprise", aliases.platform);
    const selected = defaults[product][platform];
    const migration = product === "platform" && platform === "migration";
    const track = product === "platform" ? data[migration ? "enterprise" : platform] : data.productTracks[product];
    const targetTrack = migration ? data.cloud : track;
    const state = { product: product, platform: platform, host: selected.host || "", from: selected.from, to: selected.to, category: "All" };
    state.from = identity("source release", requested.from, track.releases, selected.from, aliases.releases[product + ":" + (migration ? "enterprise" : platform)]);
    state.to = identity("target release", requested.to, targetTrack.releases, selected.to, aliases.releases[product + ":" + (migration ? "cloud" : platform)]);
    if (product !== "platform") {
      state.host = identity("platform release", requested.host, data[platform].releases, selected.host, aliases.releases["platform:" + platform]);
      if (hasRoute && requested.host === undefined) errors.push("This product link does not specify its Splunk platform release. Confirm the platform context below.");
    } else if (requested.host !== undefined) errors.push("This Platform link includes a host parameter that does not apply. Review the selections below.");
    if (hasRoute && (requested.from === undefined || requested.to === undefined)) errors.push("This link does not specify both comparison releases. Confirm the proposed selections below.");
    if (!migration && track.releases.indexOf(state.from) >= track.releases.indexOf(state.to)) {
      errors.push("The target must follow the source. This link cannot be treated as an upgrade comparison.");
      state.from = selected.from; state.to = selected.to;
    }
    if (requested.reviewed !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(requested.reviewed) || !Number.isFinite(Date.parse(requested.reviewed)) || new Date(requested.reviewed).toISOString().slice(0,10) !== requested.reviewed) errors.push("The report review date is not valid.");
      else if (requested.reviewed < data.guidance.reviewed) reasons.push({ code: "newer_guidance", text: "This link was shared against the " + requested.reviewed + " review. You are reading guidance reviewed " + data.guidance.reviewed + "; it is not a frozen copy of the original report.", source: "https://github.com/LeiterConsulting/splunk-version-value-explorer/blob/main/docs/releases/" + data.guidance.reviewed + ".md" });
      else if (requested.reviewed > data.guidance.reviewed) reasons.push({ code: "newer_link", text: "The link refers to a newer review than this page has loaded. Refresh or verify the latest release note before relying on the report." });
    }
    if (hasRoute && !errors.length) {
      if (targetTrack.releases.indexOf(state.to) < targetTrack.releases.indexOf(targetTrack.latest)) reasons.push({ code: "newer_target", text: "A newer " + (product === "observability" ? "service milestone" : "target release") + " is documented: " + targetTrack.latest + ". Your original target is preserved; newer does not automatically mean appropriate for your environment.", source: targetTrack.releasesData[targetTrack.latest].source, actionUrl: routeUrl(Object.assign({},state,{to:targetTrack.latest})), actionLabel: "Compare with " + targetTrack.latest });
      routeLifecycle(state).filter(function (row) { return ["end_of_support", "ending_soon"].includes(row.status); }).forEach(function (row) { reasons.push({ code: row.status, text: row.role + " " + row.release + ": " + (row.status === "end_of_support" ? "support ended or ends today on " : "support ends on ") + row.endOfSupport + ".", source: row.source }); });
      const assessment = window.VersionCompassComparison.create(data,state).compatibilityAssessment();
      if (assessment && assessment.status === "warning") reasons.push({ code:"compatibility", text:assessment.title + ". " + assessment.detail, source:assessment.source });
    }
    return { state: state, requested: requested, hasRoute: hasRoute, reasons: reasons, errors: errors, needsConfirmation: errors.length > 0 };
  }
  window.VersionCompassGuidance = { today: today, lifecycle: lifecycle, routeLifecycle: routeLifecycle, routeUrl: routeUrl, activationFor: activationFor, takeaway: takeaway, resolveUrl: resolveUrl };
}());
