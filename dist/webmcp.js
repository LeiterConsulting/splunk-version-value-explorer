/* Browser-scoped, read-only WebMCP tools. No server, credentials, or telemetry. */
(function () {
  "use strict";
  if (window.VersionCompassWebMCPInstalled) return;
  window.VersionCompassWebMCPInstalled = true;

  const data = window.SPLUNK_DATA;
  const sectionNames = ["features", "technicalChanges", "breakingChanges", "readiness", "migrationApproaches"];
  const productNames = Object.keys(data.products);
  const clone = function (value) { return JSON.parse(JSON.stringify(value)); };
  const has = function (object, key) { return Object.prototype.hasOwnProperty.call(object, key); };

  function objectInput(input, allowed) {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Expected an object.");
    const extra = Object.keys(input).filter(function (key) { return !allowed.includes(key); });
    if (extra.length) throw new Error("Unknown fields: " + extra.join(", "));
  }

  function listInput(value, allowed, name, max) {
    if (!Array.isArray(value) || value.length > max || value.some(function (item) { return !allowed.includes(item); }) || new Set(value).size !== value.length) {
      throw new Error(name + " must be a unique array drawn from: " + allowed.join(", "));
    }
    return value;
  }

  function metadata() {
    const badge = document.querySelector("a.reviewed");
    const releaseNotesUrl = badge ? badge.href : null;
    const date = releaseNotesUrl && releaseNotesUrl.match(/\/(\d{4}-\d{2}-\d{2})\.md$/);
    return {
      schemaVersion: "1.3",
      site: "https://versioncompass.com",
      reviewedDate: date ? date[1] : null,
      releaseNotesUrl: releaseNotesUrl,
      coverage: "Curated planning guidance, not an exhaustive change log or environment certification. Empty results do not establish that no risks exist.",
      versionScope: "Use exact identifiers from the catalog. Most platform entries are release lines; verify maintenance releases in the cited official documentation.",
      availability: "Published releases do not guarantee Cloud stack, region, edition, entitlement, or preview availability. Observability milestones are not tenant build versions."
    };
  }

  function validateRoute(input) {
    objectInput(input, ["product", "platform", "host", "from", "to", "environment"]);
    if (!productNames.includes(input.product)) throw new Error("Unknown product. Call versioncompass_get_catalog for supported identifiers.");
    const platforms = input.product === "platform" ? ["enterprise", "cloud", "migration"] : ["enterprise", "cloud"];
    if (!platforms.includes(input.platform)) throw new Error("Unsupported platform for " + input.product + ": " + input.platform);
    const core = input.product === "platform";
    const migration = core && input.platform === "migration";
    const track = core ? data[migration ? "enterprise" : input.platform] : data.productTracks[input.product];
    const targets = migration ? data.cloud.releases : track.releases;
    if (!track.releases.includes(input.from)) throw new Error("Unknown source release: " + input.from + ". Use the catalog's exact identifiers.");
    if (!targets.includes(input.to)) throw new Error("Unknown target release: " + input.to + ". Use the catalog's exact identifiers.");
    if (!migration && targets.indexOf(input.to) <= track.releases.indexOf(input.from)) throw new Error("Target must follow source; equal versions and downgrades are not comparisons.");
    if (core && has(input, "host")) throw new Error("host applies only to ES, ITSI, and Observability context.");
    if (!core && !data[input.platform].releases.includes(input.host)) throw new Error("A known host release is required for this product. Use the catalog's hostReleases.");
    const state = { product: input.product, platform: input.platform, from: input.from, to: input.to };
    if (!core) state.host = input.host;
    if(has(input,"environment")){if(!window.VersionCompassEnvironment.enabled(state))throw new Error("Cloud environment applies only to Cloud, migration, or Observability routes.");state.environment=window.VersionCompassEnvironment.validate(input.environment);}
    return state;
  }

  function report(state, include) {
    const engine = window.VersionCompassComparison.create(data, state);
    const track = engine.isMigration() ? data.cloud : engine.activeTrack();
    const guidance = window.VersionCompassGuidance;
    const features = engine.selectedFeatures();
    const technicalChanges = engine.selectedTechnicalChanges();
    const breakingChanges = engine.selectedBreakingChanges();
    const readiness = engine.selectedReadinessItems();
    const compatibility = engine.compatibilityAssessment();
    if (compatibility && compatibility.actionUrl) compatibility.actionUrl = new URL(compatibility.actionUrl, "https://versioncompass.com/").href;
    const enterprise = engine.isCore() && state.platform === "enterprise";
    const migration = engine.isMigration();
    const path = engine.selectedPath();

    const result = {
      selection: state,
      environment: window.VersionCompassEnvironment.assess(state),
      reportUrl: "https://versioncompass.com/" + guidance.routeUrl(state),
      takeaway: guidance.takeaway(state),
      lifecycle: guidance.routeLifecycle(state),
      path: {
        kind: enterprise ? "enterprise_upgrade" : migration ? "migration_program" : engine.isCore() ? "cloud_capability_milestones" : engine.isObservability() ? "observability_service_milestones" : "product_milestones",
        status: enterprise ? (path.length ? "documented_in_curated_graph" : "unknown") : "planning_milestones",
        nodes: path,
        source: enterprise ? data.enterprise.upgradeSource : migration ? data.migration.sources.overview : track.releaseOverview || track.releasesData[state.to].source,
        note: enterprise ? "Verify supported maintenance releases and deployment-specific upgrade order in the official guide." : "Milestones describe the comparison; they are not a certified sequence of supported installation hops."
      },
      compatibility: compatibility,
      compatibilityScope: compatibility ? "Target pairing with the selected host context. Source-app support during any platform-first move requires separate review." : "App, add-on, operating-system, topology, and patch compatibility require environment-specific review.",
      counts: { features: features.length, technicalChanges: technicalChanges.length, breakingChanges: breakingChanges.length, readiness: readiness.length },
      includedSections: include.slice()
    };
    if (enterprise) result.path.intermediateReleases = path.slice(1, -1);
    const sections = { features: features, technicalChanges: technicalChanges, breakingChanges: breakingChanges, readiness: readiness,
      migrationApproaches: migration ? data.migration.approaches.map(function (item) { return Object.assign({ source: data.migration.sources.approaches }, item); }) : [] };
    include.forEach(function (key) { result[key] = sections[key]; });
    const sources = new Set([result.path.source, track.releasesData[state.to].source]);
    if (compatibility) sources.add(compatibility.source);
    result.lifecycle.forEach(function (row) { sources.add(row.source); });
    result.takeaway.highlights.concat([result.takeaway.prerequisite, result.takeaway.risk]).forEach(function (item) { if (item) sources.add(item.source); });
    include.forEach(function (key) { sections[key].forEach(function (item) { if (item.source) sources.add(item.source); }); });
    result.environment.sources.forEach(s=>sources.add(s.url));
    if(result.features)result.features=result.features.map(f=>Object.assign({},f,{environment:window.VersionCompassEnvironment.featureRecords(state,f)}));
    result.sources = Array.from(sources).filter(Boolean);
    return result;
  }

  const includeSchema = { type: "array", items: { type: "string", enum: sectionNames }, uniqueItems: true, maxItems: sectionNames.length,
    description: "Sections to return. Omit for all details; [] returns takeaway, lifecycle, path, compatibility, counts, and core sources only." };
  const routeSchema = {
    type: "object", additionalProperties: false, required: ["product", "platform", "from", "to"],
    properties: {
      environment: {type:"object",additionalProperties:false,description:"Optional current hosting evidence; separate from historical release availability. FR-M and FR-H do not inherit each other.",properties:{csp:{type:"string",enum:Object.keys(window.VersionCompassEnvironment.data.providers)},region:{type:"string",enum:window.VersionCompassEnvironment.data.regions.map(r=>r.id)},compliance:{type:"string",enum:Object.keys(window.VersionCompassEnvironment.data.regimes)},experience:{type:"string",enum:Object.keys(window.VersionCompassEnvironment.data.experiences)}}},
      product: { type: "string", enum: productNames },
      platform: { type: "string", enum: ["enterprise", "cloud", "migration"], description: "migration is supported only for product=platform." },
      host: { type: "string", description: "Required for ES, ITSI, and Observability; omit for Splunk Platform. Exact identifier from hostReleases." },
      from: { type: "string", description: "Exact source identifier from the catalog, including dated Observability milestones." },
      to: { type: "string", description: "Exact later target identifier; migration targets use the Cloud release list." }
    }
  };

  function executeSafely(fn) {
    return function (input) {
      try { return clone(Object.assign({ ok: true }, fn(input))); }
      catch (error) { return { ok: false, error: { code: "INVALID_INPUT_OR_UNAVAILABLE_DATA", message: error.message } }; }
    };
  }

  const tools = [
    {
      name: "versioncompass_get_catalog", title: "List Version Compass products and releases",
      description: "Read supported products, deployment contexts, exact release identifiers, latest curated entries, host releases, and official release-note links. Call before comparing unknown versions. No page changes.",
      inputSchema: { type: "object", additionalProperties: false, properties: { products: { type: "array", items: { type: "string", enum: productNames }, uniqueItems: true, maxItems: productNames.length, minItems: 1 } } },
      execute: executeSafely(function (input) {
        objectInput(input, ["products"]);
        const products = has(input, "products") ? listInput(input.products, productNames, "products", productNames.length) : productNames;
        if (!products.length) throw new Error("products must not be empty.");
        return { metadata: metadata(), environments: {providers:window.VersionCompassEnvironment.data.providers,regions:window.VersionCompassEnvironment.data.regions,compliance:window.VersionCompassEnvironment.data.regimes,experiences:window.VersionCompassEnvironment.data.experiences,scope:"Hosting context; blank selections imply no assurance. Availability and authorization are distinct."}, products: products.map(function (product) {
          const platforms = product === "platform" ? ["enterprise", "cloud", "migration"] : ["enterprise", "cloud"];
          return { id: product, label: data.products[product].label, contexts: platforms.map(function (platform) {
            const migration = platform === "migration";
            const track = product === "platform" ? data[migration ? "enterprise" : platform] : data.productTracks[product];
            const targetTrack = migration ? data.cloud : track;
            const releases = function (sourceTrack) { return sourceTrack.releases.map(function (id) { const release = sourceTrack.releasesData[id]; return { id: id, date: release.date, source: release.source }; }); };
            return { platform: platform, sourceReleases: releases(track), targetReleases: releases(targetTrack), latest: targetTrack.latest,
              hostReleases: product === "platform" ? [] : data[platform].releases.slice(),
              ordering: migration ? "Enterprise source and Cloud target are independent lists." : "Target must follow source in the ordered release list." };
          }) };
        }) };
      })
    },
    {
      name: "versioncompass_compare_routes", title: "Compare Splunk upgrade and migration routes",
      description: "Read 1–5 comparisons using the same logic as the site: route takeaway, lifecycle, upgrade steps, compatibility gates, capabilities, technical changes, breaking risks, readiness actions, citations, and report links. Requires exact catalog versions. Does not change the displayed report or upgrade a system.",
      inputSchema: { type: "object", additionalProperties: false, required: ["routes"], properties: { routes: { type: "array", minItems: 1, maxItems: 5, items: routeSchema }, include: includeSchema } },
      execute: executeSafely(function (input) {
        objectInput(input, ["routes", "include"]);
        if (!Array.isArray(input.routes) || input.routes.length < 1 || input.routes.length > 5) throw new Error("Supply between 1 and 5 routes.");
        const include = has(input, "include") ? listInput(input.include, sectionNames, "include", sectionNames.length) : sectionNames;
        // Validate the entire batch before computing any results.
        const selections = input.routes.map(validateRoute);
        return { metadata: metadata(), reports: selections.map(function (state) { return report(state, include); }) };
      })
    },
    {
      name: "versioncompass_get_current_report", title: "Read the current Version Compass report",
      description: "Read the page's selected product, deployment context, host, and route as cited structured data. Includes all capability categories regardless of the visible filter. Does not change selections, expand panels, print, or copy anything.",
      inputSchema: { type: "object", additionalProperties: false, properties: { include: includeSchema } },
      execute: executeSafely(function (input) {
        objectInput(input, ["include"]);
        const include = has(input, "include") ? listInput(input.include, sectionNames, "include", sectionNames.length) : sectionNames;
        const linkContext = window.VersionCompassPage.getLinkContext();
        if (linkContext && linkContext.needsConfirmation) throw new Error("This page link could not be restored. The visitor must confirm the proposed route before reading a current report. Explicit compare_routes requests remain available.");
        const selected = window.VersionCompassPage.getSelection();
        if(selected.environmentErrors?.length)throw new Error("The environment link needs review before reading this report.");
        const route = { product: selected.product, platform: selected.platform, from: selected.from, to: selected.to };
        if (selected.product !== "platform") route.host = selected.host;
        if(window.VersionCompassEnvironment.enabled(selected)&&Object.keys(selected.environment||{}).length)route.environment=selected.environment;
        return { metadata: metadata(), linkContext: linkContext, report: report(validateRoute(route), include) };
      })
    }
  ];

  let lifecycle = null;
  function register() {
    if (lifecycle || !document.modelContext || typeof document.modelContext.registerTool !== "function") return;
    const controller = new AbortController();
    lifecycle = controller;
    Promise.all(tools.map(function (tool) {
      return Promise.resolve().then(function () {
        if (controller.signal.aborted) return;
        return document.modelContext.registerTool(Object.assign({ annotations: { readOnlyHint: true, untrustedContentHint: true } }, tool), { signal: controller.signal });
      });
    })).catch(function () {
      controller.abort();
      if (lifecycle === controller) lifecycle = null;
      console.warn("Version Compass WebMCP registration was unavailable; the comparison page remains usable.");
    });
  }
  window.addEventListener("pagehide", function () { if (lifecycle) lifecycle.abort(); lifecycle = null; });
  window.addEventListener("pageshow", register);
  register();
}());
