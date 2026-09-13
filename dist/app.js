(function () {
  "use strict";

  const data = window.SPLUNK_DATA;
  const platformInputs = Array.from(document.querySelectorAll('input[name="platform"]'));
  const fromSelect = document.getElementById("from-release");
  const toSelect = document.getElementById("to-release");
  const fromLabel = document.getElementById("from-label");
  const toLabel = document.getElementById("to-label");
  const note = document.getElementById("selection-note");
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
  const readinessKicker = document.getElementById("readiness-kicker");
  const readinessTitle = document.getElementById("readiness-title");
  const readinessIntro = document.getElementById("readiness-intro");
  const readinessList = document.getElementById("readiness-list");
  const sourceTitle = document.getElementById("source-title");
  const sourceActions = document.getElementById("source-actions");

  const defaults = {
    enterprise: { from: "9.4", to: "10.4" },
    cloud: { from: "9.3.2408", to: "10.5.2605" },
    migration: { from: "9.4", to: "10.5.2605" }
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
    const fromReleases = state.platform === "migration" ? data.enterprise.releases : data[state.platform].releases;
    const toReleases = state.platform === "migration" ? data.cloud.releases : data[state.platform].releases;
    const requestedFrom = params.get("from");
    const requestedTo = params.get("to");
    if (fromReleases.includes(requestedFrom)) state.from = requestedFrom;
    if (toReleases.includes(requestedTo)) state.to = requestedTo;
    const invalidOrder = state.platform !== "migration" && toReleases.indexOf(state.to) <= fromReleases.indexOf(state.from);
    if (!fromReleases.includes(state.from) || !toReleases.includes(state.to) || invalidOrder) {
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
    const releases = state.platform === "migration" ? data.enterprise.releases : data[state.platform].releases.slice(0, -1);
    fromSelect.innerHTML = releases.map(function (release) {
      return '<option value="' + escapeHtml(release) + '">' + escapeHtml(release) + '</option>';
    }).join("");
    fromSelect.value = state.from;
    fillTargetSelector();
  }

  function fillTargetSelector() {
    const releases = state.platform === "migration" ? data.cloud.releases : data[state.platform].releases;
    if (state.platform === "migration") {
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
    toSelect.innerHTML = validTargets.map(function (release) {
      const latest = release === data[state.platform].latest ? " · latest" : "";
      return '<option value="' + escapeHtml(release) + '">' + escapeHtml(release + latest) + '</option>';
    }).join("");
    toSelect.value = state.to;
  }

  function releasesBetween() {
    if (state.platform === "migration") return [];
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
    if (state.platform === "migration") {
      const nodes = [{ label: "IN PLACE", title: "Enterprise " + state.from, position: "start" }];
      if (data.enterprise.releases.indexOf(state.from) < data.enterprise.releases.indexOf(data.migration.scmaMinimum)) {
        nodes.push({ label: "READINESS STEP", title: "Enterprise 9.1+", position: "step" });
      }
      nodes.push(
        { label: "ASSESS", title: "SCMA", position: "step" },
        { label: "PREPARE", title: "Apps · data · access", position: "step" },
        { label: "PROVE", title: "SAT + UAT", position: "step" },
        { label: "DESTINATION", title: "Cloud " + state.to, position: "target" }
      );
      return nodes;
    }
    return [state.from].concat(releasesBetween());
  }

  function selectedFeatures() {
    if (state.platform === "migration") {
      const operatingBenefits = data.migration.operatingBenefits.map(function (feature) {
        return { title: feature[0], category: feature[1], outcome: feature[2], detail: feature[3], milestone: feature[4], source: feature[5] };
      });
      const targetHighlights = data.cloud.releasesData[state.to].features.map(function (feature) {
        return { title: feature[0], category: feature[1], outcome: feature[2], detail: feature[3], milestone: "Available by Cloud " + state.to, source: data.cloud.releasesData[state.to].source };
      });
      return operatingBenefits.concat(targetHighlights);
    }
    return releasesBetween().flatMap(function (release) {
      return data[state.platform].releasesData[release].features.map(function (feature) {
        return { title: feature[0], category: feature[1], outcome: feature[2], detail: feature[3], release: release, source: data[state.platform].releasesData[release].source };
      });
    });
  }

  function selectedRequirements() {
    if (state.platform === "migration") {
      const requirements = data.migration.steps.map(function (requirement) {
        return { title: requirement[0], detail: requirement[1], level: requirement[2], milestone: requirement[3], source: requirement[4] };
      });
      const sourceIndex = data.enterprise.releases.indexOf(state.from);
      const scmaIndex = data.enterprise.releases.indexOf(data.migration.scmaMinimum);
      if (sourceIndex < scmaIndex) {
        const path = shortestPath(state.from, data.migration.scmaMinimum, data.enterprise.edges).join(" → ");
        requirements.unshift({
          title: "Upgrade the source before using current SCMA",
          detail: "SCMA 5.4.11 lists Splunk Enterprise 9.1 and later as compatible. For " + state.from + ", the supported path to the minimum listed line is " + path + ". Splunk also recommends using the latest practical on-premises version for a smoother migration.",
          level: "Blocker",
          milestone: "Source readiness",
          source: data.migration.sources.scma
        });
      } else if (state.from !== data.enterprise.latest) {
        requirements.unshift({
          title: "Decide whether to modernize the source first",
          detail: "Splunk recommends using the latest practical on-premises version for a faster, easier migration. Balance that guidance against your change windows, migration motion, and target cutover plan.",
          level: "Decision",
          milestone: "Source readiness",
          source: data.migration.sources.prepare
        });
      }
      return requirements;
    }
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
    } else if (state.platform === "cloud") {
      pathIntro.textContent = "Splunk operates the platform upgrade; these are the capability milestones between your two selections.";
      pathCaption.textContent = "Cloud features can arrive progressively and availability can vary by environment, topology, region, and entitlement. Confirm timing with your Splunk team.";
    } else {
      pathIntro.textContent = "This is a migration program—not a direct version jump. Assess first, remove blockers, prove the target, and cut over only after acceptance.";
      pathCaption.innerHTML = "Splunk recommends a current source platform and supported forwarders, but the exact sequence depends on your apps, data history, connectivity, compliance, and migration motion. " + externalLink(data.migration.sources.overview, "Open the guided path");
    }

    if (state.platform === "migration") {
      pathLine.innerHTML = path.map(function (node, index) {
        const connector = index < path.length - 1 ? '<span class="path-connector" aria-hidden="true"></span>' : "";
        return '<div class="path-node migration-node ' + node.position + '"><span class="node-label">' + escapeHtml(node.label) + '</span><strong>' + escapeHtml(node.title) + '</strong></div>' + connector;
      }).join("");
      return;
    }

    pathLine.innerHTML = path.map(function (release, index) {
      const position = index === 0 ? "start" : index === path.length - 1 ? "target" : "step";
      const label = position === "start" ? "IN PLACE" : position === "target" ? "TARGET" : (state.platform === "enterprise" ? "STEP UPGRADE" : "MILESTONE");
      const connector = index < path.length - 1 ? '<span class="path-connector" aria-hidden="true"></span>' : "";
      return '<div class="path-node ' + position + '"><span class="node-label">' + label + '</span><strong>' + escapeHtml(release) + '</strong></div>' + connector;
    }).join("");
  }

  function renderApproaches() {
    const isMigration = state.platform === "migration";
    approachSection.hidden = !isMigration;
    if (!isMigration) {
      approachGrid.innerHTML = "";
      return;
    }
    approachGrid.innerHTML = data.migration.approaches.map(function (approach) {
      return '<article class="approach-card">' +
        '<div class="approach-top"><h3>' + escapeHtml(approach.title) + '</h3><span>' + escapeHtml(approach.signal) + '</span></div>' +
        '<p>' + escapeHtml(approach.fit) + '</p>' +
        '<ul>' + approach.strengths.map(function (strength) { return '<li>' + escapeHtml(strength) + '</li>'; }).join("") + '</ul>' +
        '<div class="tradeoff"><strong>Plan for</strong> ' + escapeHtml(approach.tradeoff) + '</div>' +
      '</article>';
    }).join("");
  }

  function renderValue() {
    const features = selectedFeatures();
    const requirements = selectedRequirements();
    const categories = Array.from(new Set(features.map(function (feature) { return feature.category; })));

    const metrics = state.platform === "migration" ? [
      [features.length, "destination advantages"],
      [data.migration.steps.length, "recommended actions"],
      [data.migration.approaches.length, "migration motions"]
    ] : [
      [features.length, "notable capabilities"],
      [categories.length, "value themes"],
      [releasesBetween().length, state.platform === "enterprise" ? "release lines gained" : "cloud milestones"]
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
    benefitGrid.innerHTML = visible.map(function (feature) {
      const category = data.categories[feature.category];
      const milestone = feature.milestone || "Introduced in " + feature.release;
      return '<article class="benefit-card">' +
        '<div class="benefit-top"><span class="benefit-icon" aria-hidden="true">' + category.icon + '</span><span>' + escapeHtml(feature.category) + '</span></div>' +
        '<p class="outcome">' + escapeHtml(feature.outcome) + '</p>' +
        '<h3>' + escapeHtml(feature.title) + '</h3>' +
        '<p class="detail">' + escapeHtml(feature.detail) + '</p>' +
        '<div class="benefit-foot"><span>' + escapeHtml(milestone) + '</span>' + externalLink(feature.source, "Source") + '</div>' +
      '</article>';
    }).join("");

    filters.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () {
        state.category = button.dataset.category;
        renderValue();
      });
    });

    note.textContent = state.platform === "migration"
      ? features.length + " destination advantages and " + requirements.length + " recommended actions for Enterprise " + state.from + " → Cloud " + state.to + "."
      : features.length + " notable capabilities and " + requirements.length + " readiness item" + (requirements.length === 1 ? "" : "s") + " across the selected change.";
  }

  function renderReadiness() {
    const requirements = selectedRequirements();
    if (state.platform === "enterprise") {
      readinessIntro.textContent = requirements.length ? "Release-specific checks to place into discovery, app testing, and change planning." : "No highlighted breaking-change checks in this summary; still complete Splunk's full pre-upgrade review.";
    } else if (state.platform === "cloud") {
      readinessIntro.textContent = requirements.length ? "Splunk manages the platform release. Your work centers on integrations, apps, access, and changed behaviors." : "Splunk manages the release; validate app, integration, and feature availability for your environment.";
    } else {
      readinessIntro.textContent = "A prioritized, source-backed sequence for discovery, remediation, migration, acceptance, and cutover. Treat blockers as gates—not late-stage checklist items.";
    }

    if (!requirements.length) {
      readinessList.innerHTML = '<div class="empty-state"><span>✓</span><div><h3>No special item highlighted here</h3><p>Use the official release notes and your environment inventory as the final source of truth.</p></div></div>';
      return;
    }

    readinessList.innerHTML = requirements.map(function (item, index) {
      const milestone = item.milestone || "Release " + item.release;
      return '<article class="readiness-item">' +
        '<div class="readiness-number">' + String(index + 1).padStart(2, "0") + '</div>' +
        '<div class="readiness-copy"><div class="readiness-meta"><span class="level ' + item.level.toLowerCase() + '">' + escapeHtml(item.level) + '</span><span>' + escapeHtml(milestone) + '</span></div>' +
        '<h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.detail) + '</p></div>' +
        externalLink(item.source, "Official guidance", "guidance-link") +
      '</article>';
    }).join("");
  }

  function renderSources() {
    if (state.platform === "migration") {
      sourceTitle.textContent = "Open the migration playbook.";
      sourceActions.innerHTML = externalLink(data.migration.sources.overview, "Migration guided path", "primary-link") +
        externalLink(data.migration.sources.scma, "SCMA assessment", "secondary-link") +
        externalLink(data.migration.sources.approaches, "Migration approaches", "secondary-link");
      return;
    }
    const platform = data[state.platform];
    const target = platform.releasesData[state.to];
    sourceTitle.textContent = "Go deeper in the release notes.";
    let actions = externalLink(target.source, state.to + " release notes", "primary-link");
    if (state.platform === "enterprise") actions += externalLink(platform.upgradeSource, "Upgrade paths", "secondary-link");
    sourceActions.innerHTML = actions;
  }

  function renderAll() {
    document.querySelector('input[name="platform"][value="' + state.platform + '"]').checked = true;
    const isMigration = state.platform === "migration";
    fromLabel.textContent = isMigration ? "Enterprise release in place" : "Release in place";
    toLabel.textContent = isMigration ? "Cloud destination line" : "Release under consideration";
    pathKicker.textContent = "01 / " + (isMigration ? "THE MIGRATION" : "THE ROUTE");
    valueKicker.textContent = (isMigration ? "03" : "02") + " / THE RETURN";
    valueTitle.textContent = isMigration ? "What the move unlocks" : "What becomes available";
    valueIntro.textContent = isMigration ? "Cloud operating-model advantages are combined with highlights from the selected destination release." : "Benefits are organized around the outcomes teams can use—not a wall of release-note changes.";
    readinessKicker.textContent = (isMigration ? "04" : "03") + " / " + (isMigration ? "NEXT STEPS" : "READINESS");
    readinessTitle.textContent = isMigration ? "Recommended next steps" : "Prepare with confidence";
    renderPath();
    renderApproaches();
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
