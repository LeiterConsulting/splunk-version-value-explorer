/* Shared, DOM-free comparison logic used by the page and WebMCP. */
(function () {
  "use strict";
  window.VersionCompassComparison = {
    create: function (data, state) {
  function isCore() { return state.product === "platform"; }
  function isMigration() { return isCore() && state.platform === "migration"; }
  function isObservability() { return state.product === "observability"; }
  function activeTrack() { return isCore() ? data[state.platform] : data.productTracks[state.product]; }
  function trackReleases() { return isMigration() ? data.enterprise.releases : activeTrack().releases; }
  function targetReleases() { return isMigration() ? data.cloud.releases : activeTrack().releases; }
  function hostReleases() { return data[state.platform].releases; }

  function releasesBetween() {
    if (isMigration()) return [];
    const releases = activeTrack().releases;
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
    return [];
  }

  function selectedPath() {
    if (isCore() && state.platform === "enterprise") return shortestPath(state.from, state.to, data.enterprise.edges);
    if (isMigration()) {
      const nodes = [{ label: "IN PLACE", title: "Enterprise " + state.from, position: "start" }];
      if (data.enterprise.releases.indexOf(state.from) < data.enterprise.releases.indexOf(data.migration.scmaMinimum)) {
        nodes.push({ label: "READINESS STEP", title: "Enterprise " + data.migration.scmaMinimum + "+", position: "step" });
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
    if (isMigration()) {
      const operatingBenefits = data.migration.operatingBenefits.map(function (feature) {
        return { title: feature[0], category: feature[1], outcome: feature[2], detail: feature[3], milestone: feature[4], source: feature[5] };
      });
      const targetHighlights = data.cloud.releasesData[state.to].features.map(function (feature) {
        return { title: feature[0], category: feature[1], outcome: feature[2], detail: feature[3], milestone: "Available by Cloud " + state.to, activation: feature[4] || null, source: data.cloud.releasesData[state.to].source };
      });
      return operatingBenefits.concat(targetHighlights);
    }
    const track = activeTrack();
    return releasesBetween().flatMap(function (release) {
      return track.releasesData[release].features.map(function (feature) {
        return { title: feature[0], category: feature[1], outcome: feature[2], detail: feature[3], release: release, activation: feature[4] || null, source: track.releasesData[release].source };
      });
    });
  }

  function selectedTechnicalChanges() {
    if (isMigration()) {
      const migrationChanges = (data.migration.technicalChanges || []).map(function (item) {
        return Object.assign({ milestone: "Enterprise → Cloud" }, item);
      });
      const destinationIndex = data.cloud.releases.indexOf(state.to);
      const destinationChanges = data.cloud.releases.slice(0, destinationIndex + 1).flatMap(function (release) {
        return (data.cloud.releasesData[release].technicalChanges || []).map(function (item) {
          return Object.assign({ milestone: "Cloud " + release }, item);
        });
      });
      return migrationChanges.concat(destinationChanges);
    }
    const track = activeTrack();
    return releasesBetween().flatMap(function (release) {
      return (track.releasesData[release].technicalChanges || []).map(function (item) {
        const prefix = isCore() ? (state.platform === "cloud" ? "Cloud " : "Enterprise ") : "";
        return Object.assign({ milestone: prefix + release }, item);
      });
    });
  }

  function compatibilityAssessment() {
    if (isCore()) return null;
    const track = activeTrack();
    if (isObservability()) {
      const selectedPlatform = state.platform === "cloud" ? "Splunk Cloud Platform " : "Splunk Enterprise ";
      return {
        status: "info", icon: "i",
        title: "No Splunk platform upgrade is required for core Observability Cloud",
        detail: selectedPlatform + state.host + " remains relevant for Log Observer Connect, Related Content, Unified Identity, and other cross-product workflows. Validate those integrations separately because Splunk does not publish one universal platform-version floor for the rolling SaaS service.",
        source: track.releaseOverview
      };
    }

    if (state.platform === "cloud") {
      const cloudCurrent = track.cloudCurrent;
      const hostMajor = state.host.split(".").slice(0, 2).join(".");
      const targetIndex = track.releases.indexOf(state.to);
      const currentIndex = track.releases.indexOf(cloudCurrent.product);
      if (hostMajor === cloudCurrent.platform && state.to === cloudCurrent.product) {
        return {
          status: "ok", icon: "✓", title: "Current managed pairing is documented",
          detail: "The Cloud service description lists Splunk Cloud Platform " + cloudCurrent.platform + " with " + track.label + " " + cloudCurrent.product + ". Splunk schedules compatible premium-app service updates.",
          source: track.cloudServiceSource
        };
      }
      if (targetIndex > currentIndex) {
        return {
          status: "warning", icon: "!", title: "Confirm target availability with Splunk",
          detail: "The current Cloud service description lists platform " + cloudCurrent.platform + " and " + track.label + " " + cloudCurrent.product + ". The selected " + state.to + " line may be published but not yet the managed Cloud pairing for every stack, region, or maintenance schedule.",
          source: track.cloudServiceSource
        };
      }
      return {
        status: "info", icon: "i", title: "Splunk coordinates this Cloud pairing",
        detail: "Splunk supplies compatible platform and premium-app versions through service updates. Confirm the selected target, stack experience, region, and maintenance timing rather than treating Enterprise compatibility floors as Cloud rules.",
        source: track.cloudServiceSource
      };
    }

    const allowed = track.compatibility.enterprise[state.to] || [];
    if (allowed.includes(state.host)) {
      return {
        status: "ok", icon: "✓", title: "Compatible platform pairing is listed",
        detail: track.label + " " + state.to + " is listed with Splunk Enterprise " + state.host + ". The official matrix is patch-specific, so select a supported maintenance release—not only the major/minor line.",
        source: track.compatibilitySource
      };
    }

    const enterpriseOrder = data.enterprise.releases;
    const hostIndex = enterpriseOrder.indexOf(state.host);
    const laterHost = allowed.find(function (version) { return enterpriseOrder.indexOf(version) > hostIndex; });
    if (laterHost) {
      return {
        status: "warning", icon: "!", title: "Upgrade Splunk Enterprise first",
        detail: track.label + " " + state.to + " is not listed with Splunk Enterprise " + state.host + ". The first compatible platform line in this guide is " + laterHost + "; complete the supported platform route and app checks before the product upgrade.",
        source: track.compatibilitySource,
        actionUrl: "?product=platform&platform=enterprise&from=" + encodeURIComponent(state.host) + "&to=" + encodeURIComponent(laterHost),
        actionLabel: "Map " + state.host + " → " + laterHost
      };
    }

    const targetIndex = track.releases.indexOf(state.to);
    const newerProduct = track.releases.slice(targetIndex + 1).find(function (version) {
      return (track.compatibility.enterprise[version] || []).includes(state.host);
    });
    if (newerProduct) {
      return {
        status: "warning", icon: "!", title: "The selected product target is too old for this platform",
        detail: track.label + " " + state.to + " is not listed with Splunk Enterprise " + state.host + ". The first later product line in this guide that is listed is " + newerProduct + ". Confirm the exact maintenance release in the official matrix.",
        source: track.compatibilitySource
      };
    }

    return {
      status: "warning", icon: "!", title: "No supported pairing is listed",
      detail: "The official Enterprise compatibility matrix does not list " + track.label + " " + state.to + " with Splunk Enterprise " + state.host + ". Re-select one side of the pairing or confirm an exception with Splunk before planning the change.",
      source: track.compatibilitySource
    };
  }

  function selectedRequirements() {
    if (isMigration()) {
      const requirements = data.migration.steps.map(function (requirement) {
        return { title: requirement[0], detail: requirement[1], level: requirement[2], milestone: requirement[3], source: requirement[4], breaking: false };
      });
      const sourceIndex = data.enterprise.releases.indexOf(state.from);
      const scmaIndex = data.enterprise.releases.indexOf(data.migration.scmaMinimum);
      if (sourceIndex < scmaIndex) {
        const path = shortestPath(state.from, data.migration.scmaMinimum, data.enterprise.edges).join(" → ");
        requirements.unshift({
          title: "Upgrade the source before using current SCMA",
          detail: "SCMA 5.4.11 lists Splunk Enterprise 9.1 and later as compatible. For " + state.from + ", the supported path to the minimum listed line is " + path + ". Splunk also recommends using the latest practical on-premises version for a smoother migration.",
          level: "Blocker", milestone: "Source readiness", source: data.migration.sources.scma, breaking: false
        });
      } else if (state.from !== data.enterprise.latest) {
        requirements.unshift({
          title: "Decide whether to modernize the source first",
          detail: "Splunk recommends using the latest practical on-premises version for a faster, easier migration. Balance that guidance against your change windows, migration motion, and target cutover plan.",
          level: "Decision", milestone: "Source readiness", source: data.migration.sources.prepare, breaking: false
        });
      }
      return requirements;
    }

    const track = activeTrack();
    const requirements = releasesBetween().flatMap(function (release) {
      return (track.releasesData[release].requirements || []).map(function (requirement) {
        return { title: requirement[0], detail: requirement[1], level: requirement[2], source: requirement[3], breaking: Boolean(requirement[4]), release: release };
      });
    });
    const assessment = compatibilityAssessment();
    if (assessment && assessment.status === "warning") {
      requirements.unshift({
        title: assessment.title, detail: assessment.detail,
        level: state.platform === "enterprise" ? "Blocker" : "Validate",
        milestone: state.platform === "enterprise" ? "Platform prerequisite" : "Cloud availability",
        source: assessment.source, breaking: state.platform === "enterprise"
      });
    }
    return requirements;
  }

  function selectedBreakingChanges() {
    if (isMigration()) {
      const migrationChanges = data.migration.breakingChanges.map(function (item) {
        return { title: item[0], detail: item[1], level: item[2], milestone: item[3], source: item[4], breaking: true };
      });
      const destinationChanges = (data.cloud.releasesData[state.to].requirements || []).filter(function (item) {
        return Boolean(item[4]);
      }).map(function (item) {
        return { title: item[0], detail: item[1], level: item[2], milestone: "Cloud " + state.to, source: item[3], breaking: true };
      });
      return migrationChanges.concat(destinationChanges);
    }
    return selectedRequirements().filter(function (item) { return item.breaking; });
  }

  function baselineReadiness() {
    if (isCore()) {
      const targetSource = data[state.platform].releasesData[state.to].source;
      const operationalSource = state.platform === "cloud" ? data.migration.sources.overview : targetSource;
      return state.platform === "enterprise" ? [
        { title: "Confirm every app and add-on against the target", detail: "Check Splunk premium-product compatibility and each Splunkbase or private app before the change. Delay the upgrade when a required app does not support the target release.", level: "Test", milestone: "Before the upgrade", source: targetSource },
        { title: "Back up and rehearse recovery", detail: "Complete the backups called out by Splunk, including KV Store where applicable, and use your tested recovery plan. Splunk does not support rolling an Enterprise installation back to an earlier release.", level: "Plan", milestone: "Before the upgrade", source: targetSource }
      ] : [
        { title: "Review the release communication", detail: "Confirm the expected maintenance impact, notify users where needed, complete prescribed prechecks, and check app and forwarder compatibility.", level: "Plan", milestone: "Before the release", source: operationalSource },
        { title: "Validate critical work after the release", detail: "Confirm reports, alerts, dashboards, integrations, and data hygiene after the managed upgrade reaches your environment.", level: "Validate", milestone: "After the release", source: operationalSource }
      ];
    }
    const track = activeTrack();
    if (isObservability()) {
      return [
        { title: "Inventory collectors and instrumentation", detail: "Record the deployed Splunk OpenTelemetry Collector, Kubernetes chart, and language or RUM agent versions and owners. SaaS capability and telemetry availability are separate release surfaces.", level: "First", milestone: "Discovery", source: track.collectorSource },
        { title: "Confirm realm, entitlement, and release stage", detail: "Validate whether each planned capability is generally available, preview, or controlled availability in the organization's realm before writing it into a delivery plan.", level: "Validate", milestone: "Availability", source: track.releaseOverview },
        { title: "Canary telemetry changes", detail: "Rehearse collector, receiver, exporter, and instrumentation changes against representative services; compare signal volume, dimensions, routing, and alert behavior before broad rollout.", level: "Test", milestone: "Before rollout", source: track.collectorSource }
      ];
    }
    const isSecurity = state.product === "es";
    return [
      { title: "Run the product readiness checks", detail: "Review every intermediate release note, known issue, app dependency, integration, and product-provided readiness check for the selected route.", level: "First", milestone: "Discovery", source: track.releasesData[state.to].source },
      { title: isSecurity ? "Back up search-head and KV Store state" : "Create and validate a full ITSI backup", detail: isSecurity ? "Protect Enterprise Security configuration, KV Store collections, and required investigation history, then document the supported restoration path." : "Include dependent macros, searches, thresholds, services, entities, and external dependencies required by the documented backup workflow.", level: "Plan", milestone: "Before the upgrade", source: track.releasesData[state.to].source },
      { title: "Test the supported platform and maintenance pairing", detail: "Use the exact product patch, Splunk platform maintenance release, and related-app set intended for production; the compatibility matrix is more specific than the major/minor labels in this explorer.", level: "Test", milestone: "Compatibility", source: track.compatibilitySource }
    ];
  }

  function selectedReadinessItems() {
    const releaseItems = selectedRequirements().filter(function (item) { return !item.breaking; });
    if (isMigration()) return releaseItems;
    return baselineReadiness().concat(releaseItems);
  }

      return { isCore, isMigration, isObservability, activeTrack, trackReleases, targetReleases, hostReleases, releasesBetween, shortestPath, selectedPath, selectedFeatures, selectedTechnicalChanges, compatibilityAssessment, selectedRequirements, selectedBreakingChanges, baselineReadiness, selectedReadinessItems };
    }
  };
}());
