(function () {
  "use strict";

  const data = window.SPLUNK_DATA;
  const platformInputs = Array.from(document.querySelectorAll('input[name="platform"]'));
  const fromSelect = document.getElementById("from-release");
  const toSelect = document.getElementById("to-release");
  const note = document.getElementById("selection-note");
  const pathIntro = document.getElementById("path-intro");
  const pathLine = document.getElementById("path-line");
  const pathCaption = document.getElementById("path-caption");
  const valueBand = document.getElementById("value-band");
  const filters = document.getElementById("category-filters");
  const benefitGrid = document.getElementById("benefit-grid");
  const readinessIntro = document.getElementById("readiness-intro");
  const readinessList = document.getElementById("readiness-list");
  const sourceActions = document.getElementById("source-actions");

  const defaults = {
    enterprise: { from: "9.4", to: "10.4" },
    cloud: { from: "9.3.2408", to: "10.5.2605" }
  };

  const state = { platform: "enterprise", from: "9.4", to: "10.4", category: "All" };

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char];
    });
  }

  function externalLink(url, label, className) {
    return '<a class="' + (className || "source-link") + '" href="' + escapeHtml(url) + '" target="_blank" rel="noreferrer">' + escapeHtml(label) + ' <span aria-hidden="true">↗</span></a>';
  }

  function readUrlState() {
    const params = new URLSearchParams(window.location.search);
    const requestedPlatform = params.get("platform");
    if (requestedPlatform && data[requestedPlatform]) state.platform = requestedPlatform;
    const releases = data[state.platform].releases;
    const requestedFrom = params.get("from");
    const requestedTo = params.get("to");
    if (releases.includes(requestedFrom)) state.from = requestedFrom;
    if (releases.includes(requestedTo)) state.to = requestedTo;
    if (!releases.includes(state.from) || !releases.includes(state.to) || releases.indexOf(state.to) <= releases.indexOf(state.from)) {
      state.from = defaults[state.platform].from;
      state.to = defaults[state.platform].to;
    }
  }

  function writeUrlState() {
    const params = new URLSearchParams();
    params.set("platform", state.platform);
    params.set("from", state.from);
    params.set("to", state.to);
    window.history.replaceState(null, "", "?" + params.toString());
  }

  function fillSelectors() {
    const releases = data[state.platform].releases;
    fromSelect.innerHTML = releases.slice(0, -1).map(function (release) {
      return '<option value="' + escapeHtml(release) + '">' + escapeHtml(release) + '</option>';
    }).join("");
    fromSelect.value = state.from;
    fillTargetSelector();
  }

  function fillTargetSelector() {
    const releases = data[state.platform].releases;
    const fromIndex = releases.indexOf(state.from);
    const validTargets = releases.slice(fromIndex + 1);
    if (!validTargets.includes(state.to)) state.to = validTargets[validTargets.length - 1];
    toSelect.innerHTML = validTargets.map(function (release) {
      const latest = release === data[state.platform].latest ? " · latest" : "";
      return '<option value="' + escapeHtml(release) + '">' + escapeHtml(release + latest) + '</option>';
    }).join("");
    toSelect.value = state.to;
  }

  function releasesBetween() {
    const releases = data[state.platform].releases;
    return releases.slice(releases.indexOf(state.from) + 1, releases.indexOf(state.to) + 1);
  }

  function shortestPath(start, end, edges) {
    const queue = [[start]];
    const visited = new Set([start]);
    while (queue.length) {
      const path = queue.shift();
      const last = path[path.length - 1];
      if (last === end) return path;
      (edges[last] || []).forEach(function (next) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(path.concat(next));
        }
      });
    }
    return [start, end];
  }

  function selectedPath() {
    if (state.platform === "enterprise") {
      return shortestPath(state.from, state.to, data.enterprise.edges);
    }
    return [state.from].concat(releasesBetween());
  }

  function selectedFeatures() {
    return releasesBetween().flatMap(function (release) {
      return data[state.platform].releasesData[release].features.map(function (feature) {
        return { title: feature[0], category: feature[1], outcome: feature[2], detail: feature[3], release: release, source: data[state.platform].releasesData[release].source };
      });
    });
  }

  function selectedRequirements() {
    return releasesBetween().flatMap(function (release) {
      return (data[state.platform].releasesData[release].requirements || []).map(function (requirement) {
        return { title: requirement[0], detail: requirement[1], level: requirement[2], source: requirement[3], release: release };
      });
    });
  }

  function renderPath() {
    const platform = data[state.platform];
    const path = selectedPath();
    if (state.platform === "enterprise") {
      const steps = Math.max(0, path.length - 2);
      pathIntro.textContent = steps ? "This combination needs " + steps + " intermediate release" + (steps > 1 ? "s" : "") + " before the target." : "The selected releases support a direct upgrade route.";
      pathCaption.innerHTML = "Supported route based on the Enterprise upgrade-path table. Always move to the latest maintenance release in each version line. " + externalLink(platform.upgradeSource, "Verify the path");
    } else {
      pathIntro.textContent = "Splunk operates the platform upgrade; these are the capability milestones between your two selections.";
      pathCaption.textContent = "Cloud features can arrive progressively and availability can vary by environment, topology, region, and entitlement. Confirm timing with your Splunk team.";
    }

    pathLine.innerHTML = path.map(function (release, index) {
      const position = index === 0 ? "start" : index === path.length - 1 ? "target" : "step";
      const label = position === "start" ? "IN PLACE" : position === "target" ? "TARGET" : (state.platform === "enterprise" ? "STEP UPGRADE" : "MILESTONE");
      const connector = index < path.length - 1 ? '<span class="path-connector" aria-hidden="true"></span>' : "";
      return '<div class="path-node ' + position + '"><span class="node-label">' + label + '</span><strong>' + escapeHtml(release) + '</strong></div>' + connector;
    }).join("");
  }

  function renderValue() {
    const features = selectedFeatures();
    const requirements = selectedRequirements();
    const categories = Array.from(new Set(features.map(function (feature) { return feature.category; })));

    valueBand.innerHTML = [
      [features.length, "notable capabilities"],
      [categories.length, "value themes"],
      [releasesBetween().length, state.platform === "enterprise" ? "release lines gained" : "cloud milestones"]
    ].map(function (metric) {
      return '<div><strong>' + metric[0] + '</strong><span>' + escapeHtml(metric[1]) + '</span></div>';
    }).join("");

    const filterNames = ["All"].concat(categories);
    if (!filterNames.includes(state.category)) state.category = "All";
    filters.innerHTML = filterNames.map(function (category) {
      return '<button type="button" data-category="' + escapeHtml(category) + '" aria-pressed="' + (state.category === category) + '">' + escapeHtml(category) + '</button>';
    }).join("");

    const visible = state.category === "All" ? features : features.filter(function (feature) { return feature.category === state.category; });
    benefitGrid.innerHTML = visible.map(function (feature) {
      const category = data.categories[feature.category];
      return '<article class="benefit-card">' +
        '<div class="benefit-top"><span class="benefit-icon" aria-hidden="true">' + category.icon + '</span><span>' + escapeHtml(feature.category) + '</span></div>' +
        '<p class="outcome">' + escapeHtml(feature.outcome) + '</p>' +
        '<h3>' + escapeHtml(feature.title) + '</h3>' +
        '<p class="detail">' + escapeHtml(feature.detail) + '</p>' +
        '<div class="benefit-foot"><span>Introduced in ' + escapeHtml(feature.release) + '</span>' + externalLink(feature.source, "Source") + '</div>' +
      '</article>';
    }).join("");

    filters.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () {
        state.category = button.dataset.category;
        renderValue();
      });
    });

    note.textContent = features.length + " notable capabilities and " + requirements.length + " readiness item" + (requirements.length === 1 ? "" : "s") + " across the selected change.";
  }

  function renderReadiness() {
    const requirements = selectedRequirements();
    if (state.platform === "enterprise") {
      readinessIntro.textContent = requirements.length ? "Release-specific checks to place into discovery, app testing, and change planning." : "No highlighted breaking-change checks in this summary; still complete Splunk's full pre-upgrade review.";
    } else {
      readinessIntro.textContent = requirements.length ? "Splunk manages the platform release. Your work centers on integrations, apps, access, and changed behaviors." : "Splunk manages the release; validate app, integration, and feature availability for your environment.";
    }

    if (!requirements.length) {
      readinessList.innerHTML = '<div class="empty-state"><span>✓</span><div><h3>No special item highlighted here</h3><p>Use the official release notes and your environment inventory as the final source of truth.</p></div></div>';
      return;
    }

    readinessList.innerHTML = requirements.map(function (item, index) {
      return '<article class="readiness-item">' +
        '<div class="readiness-number">' + String(index + 1).padStart(2, "0") + '</div>' +
        '<div class="readiness-copy"><div class="readiness-meta"><span class="level ' + item.level.toLowerCase() + '">' + escapeHtml(item.level) + '</span><span>Release ' + escapeHtml(item.release) + '</span></div>' +
        '<h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.detail) + '</p></div>' +
        externalLink(item.source, "Official guidance", "guidance-link") +
      '</article>';
    }).join("");
  }

  function renderSources() {
    const platform = data[state.platform];
    const target = platform.releasesData[state.to];
    let actions = externalLink(target.source, state.to + " release notes", "primary-link");
    if (state.platform === "enterprise") actions += externalLink(platform.upgradeSource, "Upgrade paths", "secondary-link");
    sourceActions.innerHTML = actions;
  }

  function renderAll() {
    document.querySelector('input[name="platform"][value="' + state.platform + '"]').checked = true;
    renderPath();
    renderValue();
    renderReadiness();
    renderSources();
    writeUrlState();
  }

  platformInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      state.platform = input.value;
      state.from = defaults[state.platform].from;
      state.to = defaults[state.platform].to;
      state.category = "All";
      fillSelectors();
      renderAll();
    });
  });

  fromSelect.addEventListener("change", function () {
    state.from = fromSelect.value;
    state.category = "All";
    fillTargetSelector();
    renderAll();
  });

  toSelect.addEventListener("change", function () {
    state.to = toSelect.value;
    state.category = "All";
    renderAll();
  });

  readUrlState();
  fillSelectors();
  renderAll();
}());
