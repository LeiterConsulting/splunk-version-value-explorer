(function () {
  "use strict";

  const data = window.SPLUNK_DATA;
  const productInputs = Array.from(document.querySelectorAll('input[name="product"]'));
  const platformInputs = Array.from(document.querySelectorAll('input[name="platform"]'));
  const platformOptionLabels = Array.from(document.querySelectorAll("[data-platform-option]"));
  const journeyLegend = document.getElementById("journey-legend");
  const releaseSelectors = document.getElementById("release-selectors");
  const hostReleaseField = document.getElementById("host-release-field");
  const hostSelect = document.getElementById("host-release");
  const hostLabel = document.getElementById("host-label");
  const fromSelect = document.getElementById("from-release");
  const toSelect = document.getElementById("to-release");
  const fromLabel = document.getElementById("from-label");
  const toLabel = document.getElementById("to-label");
  const note = document.getElementById("selection-note");
  const compatibilityGate = document.getElementById("compatibility-gate");
  const pathKicker = document.getElementById("path-kicker");
  const pathIntro = document.getElementById("path-intro");
  const pathLine = document.getElementById("path-line");
  const pathCaption = document.getElementById("path-caption");
  const approachSection = document.getElementById("migration-approaches");
  const approachGrid = document.getElementById("approach-grid");
  const valueKicker = document.getElementById("value-kicker");
  const valueTitle = document.getElementById("value-title");
  const valueIntro = document.getElementById("value-intro");
  const valueBand = document.getElementById("value-band");
  const filters = document.getElementById("category-filters");
  const benefitGrid = document.getElementById("benefit-grid");
  const technicalKicker = document.getElementById("technical-kicker");
  const technicalTitle = document.getElementById("technical-title");
  const technicalIntro = document.getElementById("technical-intro");
  const technicalPanel = document.getElementById("technical-panel");
  const technicalSummaryTitle = document.getElementById("technical-summary-title");
  const technicalSummaryMeta = document.getElementById("technical-summary-meta");
  const technicalContent = document.getElementById("technical-content");
  const breakingKicker = document.getElementById("breaking-kicker");
  const breakingTitle = document.getElementById("breaking-title");
  const breakingIntro = document.getElementById("breaking-intro");
  const breakingList = document.getElementById("breaking-list");
  const readinessKicker = document.getElementById("readiness-kicker");
  const readinessTitle = document.getElementById("readiness-title");
  const readinessIntro = document.getElementById("readiness-intro");
  const readinessList = document.getElementById("readiness-list");
  const sourceTitle = document.getElementById("source-title");
  const sourceActions = document.getElementById("source-actions");
  const copyLinkButton = document.getElementById("copy-link");
  const printButton = document.getElementById("print-report");
  const shareStatus = document.getElementById("share-status");
  const printTitle = document.getElementById("print-title");
  const printSubtitle = document.getElementById("print-subtitle");
  const printCompatibility = document.getElementById("print-compatibility");

  const defaults = {
    platform: {
      enterprise: { from: "9.4", to: "10.4" },
      cloud: { from: "9.3.2408", to: "10.5.2605" },
      migration: { from: "9.4", to: "10.5.2605" }
    },
    es: {
      enterprise: { host: "10.4", from: "7.3", to: "8.7" },
      cloud: { host: "10.5.2605", from: "8.2", to: "8.6" }
    },
    itsi: {
      enterprise: { host: "10.4", from: "4.20", to: "5.0.2" },
      cloud: { host: "10.5.2605", from: "4.20", to: "5.0" }
    },
    observability: {
      enterprise: { host: "9.4", from: "Nov 2024", to: "Sep 2026" },
      cloud: { host: "10.5.2605", from: "Nov 2024", to: "Sep 2026" }
    }
  };

  const state = { product: "platform", platform: "enterprise", host: "", from: "9.4", to: "10.4", category: "All" };

  const { isCore, isMigration, isObservability, activeTrack, trackReleases, targetReleases, hostReleases, releasesBetween, shortestPath, selectedPath, selectedFeatures, selectedTechnicalChanges, compatibilityAssessment, selectedRequirements, selectedBreakingChanges, baselineReadiness, selectedReadinessItems } = window.VersionCompassComparison.create(data, state);

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char];
    });
  }

  function externalLink(url, label, className) {
    return '<a class="' + (className || "source-link") + '" href="' + escapeHtml(url) + '" target="_blank" rel="noreferrer">' + escapeHtml(label) + ' <span aria-hidden="true">↗</span></a>';
  }

  function themedUrl(url) { return window.VersionCompassTheme ? window.VersionCompassTheme.href(url) : url; }

  function internalLink(url, label) {
    url = themedUrl(url);
    return '<a class="source-link" href="' + escapeHtml(url) + '">' + escapeHtml(label) + ' <span aria-hidden="true">→</span></a>';
  }

  function plural(count, singular, pluralForm) {
    return count + " " + (count === 1 ? singular : (pluralForm || singular + "s"));
  }

  function useDefaults() {
    if (!isCore() && state.platform === "migration") state.platform = "enterprise";
    const selected = defaults[state.product][state.platform];
    state.host = selected.host || "";
    state.from = selected.from;
    state.to = selected.to;
    state.category = "All";
  }

  const guidance = window.VersionCompassGuidance;
  let linkResolution = null;
  function readUrlState() {
    linkResolution = guidance.resolveUrl(window.location.search, defaults);
    Object.assign(state, linkResolution.state);
  }
  function writeUrlState() {
    if (linkResolution && linkResolution.needsConfirmation) return;
    window.history.replaceState(null, "", themedUrl(guidance.routeUrl(state)));
  }
  function clearLinkContext() { linkResolution = null; }
  function renderLinkNotice() {
    const box = document.getElementById("link-notice");
    const resolution = linkResolution;
    box.hidden = !resolution || (!resolution.errors.length && !resolution.reasons.length);
    if (box.hidden) { box.innerHTML = ""; document.getElementById("print-link-notice").innerHTML = ""; return; }
    const blocked = resolution.needsConfirmation;
    const items = resolution.errors.map(function (text) { return { text: text }; }).concat(resolution.reasons);
    box.innerHTML = '<strong>' + (blocked ? 'This report link needs your review' : 'Review this shared comparison') + '</strong><p>' + (blocked ? 'We could not restore the complete route. The controls below are proposed selections; no replacement report has been generated.' : 'Your selected releases are preserved. These details may affect how you use the report:') + '</p><ul>' + items.map(function (item) {
      return '<li>' + escapeHtml(item.text) + (item.source ? ' ' + externalLink(item.source, 'Source') : '') + (item.actionUrl ? ' ' + internalLink(item.actionUrl, item.actionLabel) : '') + '</li>';
    }).join('') + '</ul>' + (blocked ? '<button type="button" id="accept-link-selections">Use the selections below</button>' : '');
    document.getElementById("print-link-notice").innerHTML = blocked ? "" : "<strong>Shared-link context</strong><ul>" + items.map(function (item) { return "<li>" + escapeHtml(item.text) + "</li>"; }).join("") + "</ul>";
    if (blocked) document.getElementById("accept-link-selections").addEventListener("click", function () { clearLinkContext(); renderAll(); });
  }
  function renderRouteGuidance() {
    const summary = guidance.takeaway(state);
    const point = function (item) { return escapeHtml(item.text) + ' ' + externalLink(item.source, 'Source'); };
    document.getElementById("route-takeaway").innerHTML = '<h2 id="takeaway-title">This route at a glance</h2><div class="takeaway-grid"><div><h3>What you gain</h3>' + (summary.highlights.length ? '<ul>' + summary.highlights.map(function (item) { return '<li>' + point(item) + '</li>'; }).join('') + '</ul>' : '<p>No curated capability milestone in this interval.</p>') + '</div><div><h3>Before moving</h3><p>' + (summary.prerequisite ? point(summary.prerequisite) : 'Review the official upgrade guidance.') + '</p></div><div><h3>Watch for</h3><p>' + point(summary.risk) + '</p></div></div><p class="guidance-note">' + escapeHtml(summary.note) + '</p>';
    const rows = guidance.routeLifecycle(state);
    document.getElementById("lifecycle-summary").innerHTML = '<span>Support lifecycle</span>' + rows.map(function (row) { return '<span class="lifecycle-status ' + row.status + '">' + escapeHtml(row.role + ' · ' + row.label + (row.endOfSupport ? ' · ' + row.endOfSupport : '')) + '</span>'; }).join('');
    document.getElementById("lifecycle-content").innerHTML = '<p class="guidance-note">Evaluated ' + escapeHtml(rows[0].asOf) + ' (Eastern date). Policy dates verified ' + escapeHtml(data.guidance.lifecycle.reviewed) + '.</p><div class="lifecycle-grid">' + rows.map(function (row) { return '<div><h3>' + escapeHtml(row.role + ' · ' + row.release) + '</h3><p>' + escapeHtml(row.label + (row.endOfSupport ? ': ' + row.endOfSupport : '')) + '</p><p>' + escapeHtml(row.detail) + '</p>' + externalLink(row.source, 'Support guidance') + '</div>'; }).join('') + '</div>';
  }
  function fillJourneyOptions() {
    const copy = isCore()
      ? { legend: "Journey", enterprise: "Enterprise upgrades", cloud: "Cloud releases", migration: "Enterprise → Cloud" }
      : isObservability()
        ? { legend: "Connected Splunk", enterprise: "Enterprise context", cloud: "Cloud Platform context" }
        : { legend: "Platform home", enterprise: "Splunk Enterprise", cloud: "Splunk Cloud Platform" };
    journeyLegend.textContent = copy.legend;
    platformOptionLabels.forEach(function (label) {
      const value = label.dataset.platformOption;
      label.hidden = !isCore() && value === "migration";
      if (copy[value]) label.querySelector("span").textContent = copy[value];
    });
  }

  function fillSelectors() {
    fillJourneyOptions();
    const fromReleases = isMigration() ? trackReleases() : trackReleases().slice(0, -1);
    fromSelect.innerHTML = fromReleases.map(function (release) {
      return '<option value="' + escapeHtml(release) + '">' + escapeHtml(release) + '</option>';
    }).join("");
    fromSelect.value = state.from;

    hostReleaseField.hidden = isCore();
    releaseSelectors.classList.toggle("has-host", !isCore());
    if (!isCore()) {
      const hosts = hostReleases();
      if (!hosts.includes(state.host)) state.host = hosts[hosts.length - 1];
      hostSelect.innerHTML = hosts.map(function (release) {
        const prefix = state.platform === "cloud" ? "Cloud " : "Enterprise ";
        return '<option value="' + escapeHtml(release) + '">' + escapeHtml(prefix + release) + '</option>';
      }).join("");
      hostSelect.value = state.host;
    }
    fillTargetSelector();
  }

  function fillTargetSelector() {
    const releases = targetReleases();
    if (isMigration()) {
      if (!releases.includes(state.to)) state.to = data.cloud.latest;
      toSelect.innerHTML = releases.map(function (release) {
        const latest = release === data.cloud.latest ? " · latest documented" : "";
        return '<option value="' + escapeHtml(release) + '">' + escapeHtml(release + latest) + '</option>';
      }).join("");
      toSelect.value = state.to;
      return;
    }
    const fromIndex = releases.indexOf(state.from);
    const validTargets = releases.slice(fromIndex + 1);
    if (!validTargets.includes(state.to)) state.to = validTargets[validTargets.length - 1];
    const latestValue = activeTrack().latest;
    toSelect.innerHTML = validTargets.map(function (release) {
      const latest = release === latestValue ? (isObservability() ? " · latest milestone" : " · latest") : "";
      return '<option value="' + escapeHtml(release) + '">' + escapeHtml(release + latest) + '</option>';
    }).join("");
    toSelect.value = state.to;
  }

  function renderCompatibility() {
    const assessment = compatibilityAssessment();
    compatibilityGate.hidden = !assessment;
    if (!assessment) {
      compatibilityGate.innerHTML = "";
      printCompatibility.textContent = "";
      return;
    }
    compatibilityGate.className = "compatibility-gate " + assessment.status;
    compatibilityGate.innerHTML = '<span class="compatibility-icon" aria-hidden="true">' + escapeHtml(assessment.icon) + '</span><div class="compatibility-copy"><strong>' + escapeHtml(assessment.title) + '</strong><span>' + escapeHtml(assessment.detail) + '</span></div>' + (assessment.actionUrl ? internalLink(assessment.actionUrl, assessment.actionLabel) : externalLink(assessment.source, "Verify"));
    printCompatibility.innerHTML = '<strong>' + escapeHtml(assessment.title) + '</strong> ' + escapeHtml(assessment.detail);
  }

  function renderPath() {
    const path = selectedPath();
    if (isCore() && state.platform === "enterprise") {
      const steps = Math.max(0, path.length - 2);
      pathIntro.textContent = !path.length ? "No supported upgrade path is recorded for this selection. Verify the official upgrade guide before proceeding." : steps ? "This combination needs " + steps + " intermediate release" + (steps > 1 ? "s" : "") + " before the target." : "The selected releases support a direct upgrade route.";
      pathCaption.innerHTML = "Supported route based on the Enterprise upgrade-path table. Always move to the latest maintenance release in each version line. " + externalLink(data.enterprise.upgradeSource, "Verify the path");
    } else if (isCore() && state.platform === "cloud") {
      pathIntro.textContent = "Splunk operates the platform upgrade; these are the capability milestones between your two selections.";
      pathCaption.textContent = "Cloud features can arrive progressively and availability can vary by environment, topology, region, and entitlement. Confirm timing with your Splunk team.";
    } else if (isMigration()) {
      pathIntro.textContent = "This is a migration program—not a direct version jump. Assess first, remove blockers, prove the target, and cut over only after acceptance.";
      pathCaption.innerHTML = "Splunk recommends a current source platform and supported forwarders, but the exact sequence depends on your apps, data history, connectivity, compliance, and migration motion. " + externalLink(data.migration.sources.overview, "Open the guided path");
    } else if (isObservability()) {
      pathIntro.textContent = "Observability Cloud is a rolling SaaS service. The route shows dated capability milestones, while collectors and instrumentation remain separately versioned.";
      pathCaption.innerHTML = "Milestones are curated from Splunk's dated release notes; they are not a tenant build number or an exhaustive change log. " + externalLink(activeTrack().releaseOverview, "Release-note index");
    } else {
      pathIntro.textContent = "These product milestones sit on top of the selected Splunk platform context. The compatibility gate identifies whether the target pairing is listed or needs another step.";
      pathCaption.innerHTML = "Use the latest supported maintenance release in each line and review every intermediate upgrade note. " + externalLink(activeTrack().compatibilitySource, "Compatibility matrix");
    }

    if (isMigration()) {
      pathLine.innerHTML = path.map(function (node, index) {
        const connector = index < path.length - 1 ? '<span class="path-connector" aria-hidden="true"></span>' : "";
        return '<div class="path-node migration-node ' + node.position + '"><span class="node-label">' + escapeHtml(node.label) + '</span><strong>' + escapeHtml(node.title) + '</strong></div>' + connector;
      }).join("");
      return;
    }

    pathLine.innerHTML = path.map(function (release, index) {
      const position = index === 0 ? "start" : index === path.length - 1 ? "target" : "step";
      let label = position === "start" ? "IN PLACE" : position === "target" ? "TARGET" : "MILESTONE";
      if (position === "step" && isCore() && state.platform === "enterprise") label = "STEP UPGRADE";
      if (position === "step" && !isCore() && !isObservability()) label = "APP MILESTONE";
      if (position === "step" && isObservability()) label = "SERVICE MILESTONE";
      const connector = index < path.length - 1 ? '<span class="path-connector" aria-hidden="true"></span>' : "";
      return '<div class="path-node ' + position + '"><span class="node-label">' + escapeHtml(label) + '</span><strong>' + escapeHtml(release) + '</strong></div>' + connector;
    }).join("");
  }

  function renderApproaches() {
    approachSection.hidden = !isMigration();
    if (!isMigration()) {
      approachGrid.innerHTML = "";
      return;
    }
    approachGrid.innerHTML = data.migration.approaches.map(function (approach) {
      return '<article class="approach-card"><div class="approach-top"><h3>' + escapeHtml(approach.title) + '</h3><span>' + escapeHtml(approach.signal) + '</span></div><p>' + escapeHtml(approach.fit) + '</p><ul>' + approach.strengths.map(function (strength) { return '<li>' + escapeHtml(strength) + '</li>'; }).join("") + '</ul><div class="tradeoff"><strong>Plan for</strong> ' + escapeHtml(approach.tradeoff) + '</div></article>';
    }).join("");
  }

  function renderValue() {
    const features = selectedFeatures();
    const requirements = selectedReadinessItems();
    const breakingChanges = selectedBreakingChanges();
    const technicalChanges = selectedTechnicalChanges();
    const categories = Array.from(new Set(features.map(function (feature) { return feature.category; })));
    const metrics = isMigration() ? [
      [features.length, "destination advantages"],
      [data.migration.steps.length, "recommended actions"],
      [data.migration.approaches.length, "migration motions"]
    ] : [
      [features.length, "notable capabilities"],
      [categories.length, "value themes"],
      [releasesBetween().length, isObservability() ? "service milestones" : (!isCore() ? "product milestones" : state.platform === "enterprise" ? "release lines gained" : "cloud milestones")]
    ];
    valueBand.innerHTML = metrics.map(function (metric) {
      return '<div><strong>' + metric[0] + '</strong><span>' + escapeHtml(metric[1]) + '</span></div>';
    }).join("");

    const filterNames = ["All"].concat(categories);
    if (!filterNames.includes(state.category)) state.category = "All";
    filters.innerHTML = filterNames.map(function (category) {
      return '<button type="button" data-category="' + escapeHtml(category) + '" aria-pressed="' + (state.category === category) + '">' + escapeHtml(category) + '</button>';
    }).join("");

    const visible = state.category === "All" ? features : features.filter(function (feature) { return feature.category === state.category; });
    benefitGrid.innerHTML = visible.length ? visible.map(function (feature) {
      const category = data.categories[feature.category] || { icon: "•" };
      const milestone = feature.milestone || "Introduced in " + feature.release;
      return '<article class="benefit-card"><div class="benefit-top"><span class="benefit-icon" aria-hidden="true">' + category.icon + '</span><span>' + escapeHtml(feature.category) + '</span></div><p class="outcome">' + escapeHtml(feature.outcome) + '</p><h3>' + escapeHtml(feature.title) + '</h3><p class="detail">' + escapeHtml(feature.detail) + '</p>' + '<div class="benefit-foot"><span>' + escapeHtml(milestone) + '</span>' + externalLink(feature.source, "Source") + '</div></article>';
    }).join("") : '<div class="empty-state"><span>i</span><div><h3>No curated capability milestone in this interval</h3><p>The release remains in the route for compatibility context. Open the official source for maintenance-level detail.</p></div></div>';

    filters.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () {
        state.category = button.dataset.category;
        renderValue();
      });
    });

    if (isMigration()) {
      note.textContent = plural(features.length, "destination advantage") + ", " + plural(technicalChanges.length, "technical change") + ", " + plural(breakingChanges.length, "potential change") + ", and " + plural(requirements.length, "recommended action") + " for Enterprise " + state.from + " → Cloud " + state.to + ".";
    } else {
      const prefix = isCore() ? "" : data.products[state.product].short + " · ";
      note.textContent = prefix + plural(features.length, "notable capability", "notable capabilities") + ", " + plural(technicalChanges.length, "technical change") + ", " + plural(breakingChanges.length, "potential change") + ", and " + plural(requirements.length, "preparation action") + " across the selected route.";
    }
  }

  function renderTechnicalChanges() {
    const changes = selectedTechnicalChanges();
    const requiredCount = changes.filter(function (item) { return item.actionLevel === "Required"; }).length;
    const reviewCount = changes.filter(function (item) { return item.actionLevel === "Review"; }).length;

    if (isCore() && state.platform === "enterprise") {
      technicalTitle.textContent = "What changes underneath";
      technicalIntro.textContent = "Only technical transitions encountered across the selected route are shown. Component changes are kept separate from items Splunk explicitly identifies as potentially breaking.";
    } else if (isCore() && state.platform === "cloud") {
      technicalTitle.textContent = "Customer-visible platform changes";
      technicalIntro.textContent = "Splunk manages the underlying service. This view is limited to technical contracts customers may need to validate, including APIs, apps, certificates, permissions, and integrations.";
    } else if (isMigration()) {
      technicalTitle.textContent = "How the technical operating model changes";
      technicalIntro.textContent = "The migration view focuses on customer-actionable differences between a self-managed Enterprise deployment and Splunk Cloud Platform, plus technical contracts present at the selected destination.";
    } else if (isObservability()) {
      technicalTitle.textContent = "What changes in telemetry and workflow contracts";
      technicalIntro.textContent = "SaaS milestones are separated from versioned collectors, charts, detectors, data models, and instrumentation that customers still manage.";
    } else {
      technicalTitle.textContent = "What changes inside the product";
      technicalIntro.textContent = "A collapsed, route-specific view of application data models, runtimes, APIs, dependencies, configuration, and operating behavior.";
    }

    if (!changes.length) {
      technicalSummaryTitle.textContent = "No highlighted technical transition";
      technicalSummaryMeta.textContent = "Review the official release guidance for environment-specific changes";
      technicalContent.innerHTML = '<div class="technical-empty"><p>No technical baseline change is highlighted for this route. This curated view is not a software bill of materials or an exhaustive compatibility assessment.</p></div>';
      return;
    }

    technicalSummaryTitle.textContent = plural(changes.length, "technical change") + " across this route";
    const summaryParts = [];
    if (requiredCount) summaryParts.push(plural(requiredCount, "required action"));
    if (reviewCount) summaryParts.push(plural(reviewCount, "compatibility review"));
    summaryParts.push(plural(new Set(changes.map(function (item) { return item.domain; })).size, "technical area"));
    technicalSummaryMeta.textContent = summaryParts.join(" · ");

    const milestones = Array.from(new Set(changes.map(function (item) { return item.milestone; })));
    technicalContent.innerHTML = '<p class="technical-context"><strong>How to read this:</strong> “From” and “to” describe the documented state change—not necessarily an in-place conversion. Required actions and compatibility reviews should be reconciled with the readiness and potential-breaking-change sections.</p>' + milestones.map(function (milestone) {
      const items = changes.filter(function (item) { return item.milestone === milestone; });
      return '<section class="technical-group" aria-label="' + escapeHtml(milestone) + '"><div class="technical-group-head"><h3>' + escapeHtml(milestone) + '</h3><span>' + plural(items.length, "change") + '</span></div><div class="technical-items">' + items.map(function (item) {
        const actionClass = item.actionLevel.toLowerCase();
        return '<article class="technical-item"><div class="technical-item-head"><div><span class="technical-domain">' + escapeHtml(item.domain) + '</span><h4>' + escapeHtml(item.component) + '</h4></div><div class="technical-badges"><span class="change-type">' + escapeHtml(item.changeType) + '</span><span class="action-level ' + actionClass + '">' + escapeHtml(item.actionLevel) + '</span></div></div><div class="technical-transition"><div><span>From</span><strong>' + escapeHtml(item.from) + '</strong></div><span class="technical-arrow" aria-hidden="true">→</span><div><span>To</span><strong>' + escapeHtml(item.to) + '</strong></div></div><div class="technical-explanation"><p><strong>Why it matters</strong>' + escapeHtml(item.implication) + '</p><p><strong>Recommended action</strong>' + escapeHtml(item.action) + '</p></div><div class="technical-item-foot">' + externalLink(item.source, "Official source") + '</div></article>';
      }).join("") + '</div></section>';
    }).join("");
  }

  function renderBreakingChanges() {
    const changes = selectedBreakingChanges();
    if (isCore() && state.platform === "enterprise") {
      breakingTitle.textContent = "Changes Splunk says could break an upgrade";
      breakingIntro.textContent = "A concise view of high-priority items from Splunk's potential-breaking-change guidance for every release line on this route. It is not an exhaustive substitute for each READ THIS FIRST page.";
    } else if (isCore() && state.platform === "cloud") {
      breakingTitle.textContent = "Changes to validate before the release";
      breakingIntro.textContent = "Splunk manages the platform upgrade. These customer-facing behavior, compatibility, access, and integration changes can still require action before or after the release.";
    } else if (isMigration()) {
      breakingTitle.textContent = "Migration blockers and delay risks";
      breakingIntro.textContent = "Splunk separates showstoppers that must be resolved before migration execution from risks that can cause serious delays if they are not planned early.";
    } else if (isObservability()) {
      breakingTitle.textContent = "Telemetry and workflow changes to validate";
      breakingIntro.textContent = "Rolling SaaS delivery can still remove metrics, rename workflows, change defaults, or require newer customer-managed collectors and agents.";
    } else {
      breakingTitle.textContent = "Product and platform changes that can block the route";
      breakingIntro.textContent = "Compatibility gates, one-way transitions, data-model changes, runtimes, APIs, and dependency shifts called out in Splunk's product guidance.";
    }

    if (!changes.length) {
      breakingList.innerHTML = '<div class="empty-state breaking-empty"><span>✓</span><div><h3>No potential breaking change highlighted</h3><p>This summary is selective. Review the official guidance and validate apps, integrations, access, and critical workflows for your environment.</p></div></div>';
      return;
    }
    breakingList.innerHTML = changes.map(function (item, index) {
      const milestone = item.milestone || "Release " + item.release;
      return '<article class="breaking-item"><div class="breaking-marker" aria-hidden="true">' + String(index + 1).padStart(2, "0") + '</div><div class="breaking-copy"><div class="breaking-meta"><span class="impact ' + item.level.toLowerCase().replace(/\s+/g, "-") + '">' + escapeHtml(item.level) + '</span><span>' + escapeHtml(milestone) + '</span></div><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.detail) + '</p></div>' + externalLink(item.source, "Review official callout", "guidance-link") + '</article>';
    }).join("");
  }

  function renderReadiness() {
    const requirements = selectedReadinessItems();
    if (isCore() && state.platform === "enterprise") {
      readinessIntro.textContent = "Release-specific work to place into discovery, app testing, recovery, and change planning.";
    } else if (isCore() && state.platform === "cloud") {
      readinessIntro.textContent = "Splunk manages the platform release. Your work centers on integrations, apps, access, and changed behaviors.";
    } else if (isMigration()) {
      readinessIntro.textContent = "A prioritized, source-backed sequence for discovery, remediation, migration, acceptance, and cutover. Treat blockers as gates—not late-stage checklist items.";
    } else if (isObservability()) {
      readinessIntro.textContent = "Separate rolling-service availability from the collector, instrumentation, data-model, realm, and entitlement work your team still owns.";
    } else {
      readinessIntro.textContent = "Prepare the product, its dependencies, and the exact Splunk platform maintenance pairing as one coordinated change.";
    }

    if (!requirements.length) {
      readinessList.innerHTML = '<div class="empty-state"><span>✓</span><div><h3>No special item highlighted here</h3><p>Use the official release notes and your environment inventory as the final source of truth.</p></div></div>';
      return;
    }
    readinessList.innerHTML = requirements.map(function (item, index) {
      const milestone = item.milestone || "Release " + item.release;
      return '<article class="readiness-item"><div class="readiness-number">' + String(index + 1).padStart(2, "0") + '</div><div class="readiness-copy"><div class="readiness-meta"><span class="level ' + item.level.toLowerCase() + '">' + escapeHtml(item.level) + '</span><span>' + escapeHtml(milestone) + '</span></div><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.detail) + '</p></div>' + externalLink(item.source, "Official guidance", "guidance-link") + '</article>';
    }).join("");
  }

  function renderSources() {
    if (isMigration()) {
      sourceTitle.textContent = "Open the migration playbook.";
      sourceActions.innerHTML = externalLink(data.migration.sources.overview, "Migration guided path", "primary-link") + externalLink(data.migration.sources.scma, "SCMA assessment", "secondary-link") + externalLink(data.migration.sources.approaches, "Migration approaches", "secondary-link");
      return;
    }
    const track = activeTrack();
    const target = track.releasesData[state.to];
    if (isObservability()) {
      sourceTitle.textContent = "Follow the rolling service and component changes.";
      sourceActions.innerHTML = externalLink(target.source, state.to + " release notes", "primary-link") + externalLink(track.releaseOverview, "All release months", "secondary-link") + externalLink(track.collectorSource, "Collector guidance", "secondary-link");
      return;
    }
    if (!isCore()) {
      sourceTitle.textContent = "Verify the product and its platform pairing.";
      let actions = externalLink(target.source, state.to + " release notes", "primary-link") + externalLink(track.compatibilitySource, "Platform compatibility", "secondary-link");
      if (track.relatedAppsSource) actions += externalLink(track.relatedAppsSource, "Related apps", "secondary-link");
      if (state.platform === "cloud") actions += externalLink(track.cloudServiceSource, "Cloud service versions", "secondary-link");
      sourceActions.innerHTML = actions;
      return;
    }
    sourceTitle.textContent = "Go deeper in the release notes.";
    let actions = externalLink(target.source, state.to + " release notes", "primary-link");
    if (state.platform === "enterprise") actions += externalLink(track.upgradeSource, "Upgrade paths", "secondary-link");
    sourceActions.innerHTML = actions;
  }

  function updateReportSummary() {
    let journey;
    if (isMigration()) {
      journey = "Splunk Enterprise " + state.from + " → Splunk Cloud Platform " + state.to;
    } else if (isCore()) {
      journey = data[state.platform].label + " " + state.from + " → " + state.to;
    } else {
      const platformContext = state.platform === "cloud" ? "Cloud " : "Enterprise ";
      journey = activeTrack().label + " " + state.from + " → " + state.to + " · " + platformContext + state.host;
    }
    printTitle.textContent = journey;
    printSubtitle.textContent = "Source-backed guidance reviewed September 22, 2026 · versioncompass.com";
    document.title = "Version Compass | " + journey;
  }

  function syncControls() {
    const productInput = document.querySelector('input[name="product"][value="' + state.product + '"]');
    const platformInput = document.querySelector('input[name="platform"][value="' + state.platform + '"]');
    if (productInput) productInput.checked = true;
    if (platformInput) platformInput.checked = true;
    if (isCore()) {
      fromLabel.textContent = isMigration() ? "Enterprise release in place" : "Release in place";
      toLabel.textContent = isMigration() ? "Cloud destination line" : "Release under consideration";
    } else if (isObservability()) {
      hostLabel.textContent = "Splunk platform context";
      fromLabel.textContent = "Capability baseline";
      toLabel.textContent = "Milestone under consideration";
    } else {
      hostLabel.textContent = "Splunk release in place";
      fromLabel.textContent = "Product release in place";
      toLabel.textContent = "Product release under consideration";
    }
  }

  function renderAll() {
    syncControls();
    renderLinkNotice();
    const blocked = Boolean(linkResolution && linkResolution.needsConfirmation);
    document.getElementById("results").hidden = blocked;
    copyLinkButton.disabled = blocked;
    printButton.disabled = blocked;
    if (blocked) { note.textContent = "Choose or confirm the comparison releases to continue."; return; }
    renderRouteGuidance();
    const migration = isMigration();
    pathKicker.textContent = "01 / " + (migration ? "THE MIGRATION" : "THE ROUTE");
    valueKicker.textContent = (migration ? "03" : "02") + " / THE RETURN";
    valueTitle.textContent = migration ? "What the move unlocks" : "What becomes available";
    valueIntro.textContent = migration ? "Cloud operating-model advantages are combined with highlights from the selected destination release." : isObservability() ? "Dated SaaS milestones are grouped by the outcomes teams can use; availability can vary by realm, entitlement, and release stage." : "Benefits are organized around the outcomes teams can use—not a wall of release-note changes.";
    technicalKicker.textContent = (migration ? "04" : "03") + " / TECHNICAL CHANGES";
    breakingKicker.textContent = (migration ? "05" : "04") + " / POTENTIAL BREAKING CHANGES";
    readinessKicker.textContent = (migration ? "06" : "05") + " / " + (migration ? "NEXT STEPS" : "READINESS");
    readinessTitle.textContent = migration ? "Recommended next steps" : "Prepare with confidence";
    renderCompatibility();
    renderPath();
    renderApproaches();
    renderValue();
    renderTechnicalChanges();
    renderBreakingChanges();
    renderReadiness();
    renderSources();
    writeUrlState();
    updateReportSummary();
  }

  function showShareStatus(message) {
    shareStatus.textContent = message;
    window.setTimeout(function () {
      if (shareStatus.textContent === message) shareStatus.textContent = "";
    }, 2600);
  }

  function fallbackCopy(value) {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(input);
    return copied;
  }

  copyLinkButton.addEventListener("click", function () {
    if (linkResolution && linkResolution.needsConfirmation) return;
    writeUrlState();
    const url = window.location.href;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () {
        showShareStatus("Report link copied");
      }).catch(function () {
        showShareStatus(fallbackCopy(url) ? "Report link copied" : "Copy was blocked by the browser");
      });
      return;
    }
    showShareStatus(fallbackCopy(url) ? "Report link copied" : "Copy was blocked by the browser");
  });

  let printState = null;
  function preparePrintReport() {
    if (printState || (linkResolution && linkResolution.needsConfirmation)) return;
    printState = { category: state.category, technicalOpen: technicalPanel.open, lifecycleOpen: document.getElementById("lifecycle-panel").open };
    state.category = "All";
    renderValue();
    technicalPanel.open = true;
    document.getElementById("lifecycle-panel").open = true;
    document.getElementById("release-report").innerHTML = window.VersionCompassReleasePrint.build(document, window.location.href);
    document.documentElement.classList.add("printing-report");
  }

  function restorePrintReport() {
    if (!printState) return;
    document.documentElement.classList.remove("printing-report");
    technicalPanel.open = printState.technicalOpen;
    state.category = printState.category;
    document.getElementById("lifecycle-panel").open = printState.lifecycleOpen;
    printState = null;
    renderValue();
  }

  window.addEventListener("beforeprint", preparePrintReport);
  window.addEventListener("afterprint", restorePrintReport);
  printButton.addEventListener("click", function () {
    if (linkResolution && linkResolution.needsConfirmation) return;
    preparePrintReport();
    window.setTimeout(function () { window.print(); }, 40);
  });

  productInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      clearLinkContext();
      state.product = input.value;
      if (!isCore() && state.platform === "migration") state.platform = "enterprise";
      useDefaults();
      fillSelectors();
      renderAll();
    });
  });

  platformInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      clearLinkContext();
      state.platform = input.value;
      useDefaults();
      fillSelectors();
      renderAll();
    });
  });

  hostSelect.addEventListener("change", function () {
    clearLinkContext();
    state.host = hostSelect.value;
    state.category = "All";
    renderAll();
  });

  fromSelect.addEventListener("change", function () {
    clearLinkContext();
    state.from = fromSelect.value;
    state.category = "All";
    fillTargetSelector();
    renderAll();
  });

  toSelect.addEventListener("change", function () {
    clearLinkContext();
    state.to = toSelect.value;
    state.category = "All";
    renderAll();
  });

  window.VersionCompassPage = Object.freeze({ getSelection: function () { return Object.assign({}, state); }, getLinkContext: function () { return linkResolution ? JSON.parse(JSON.stringify(linkResolution)) : null; } });

  window.addEventListener("popstate", function () { readUrlState(); fillSelectors(); renderAll(); });
  readUrlState();
  fillSelectors();
  renderAll();
}());
