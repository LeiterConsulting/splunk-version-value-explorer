const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setImmediate(resolve));
const routes = [
  { product: 'platform', platform: 'enterprise', from: '8.1', to: '10.4' },
  { product: 'platform', platform: 'cloud', from: '9.2.2406', to: '10.5.2605' },
  { product: 'platform', platform: 'migration', from: '8.1', to: '10.5.2605' },
  { product: 'es', platform: 'enterprise', host: '9.4', from: '7.3', to: '8.7' },
  { product: 'itsi', platform: 'cloud', host: '10.5.2605', from: '4.20', to: '5.0' },
  { product: 'observability', platform: 'enterprise', host: '9.4', from: 'Nov 2024', to: 'Sep 2026' }
];

async function runtime({ support = true, failure = false, selection = routes[0] } = {}) {
  const elements = new Map(), events = {}, registered = new Map();
  let registrations = 0;
  function element(id) {
    if (elements.has(id)) return elements.get(id);
    const classes = new Set();
    const el = { id, innerHTML: '', textContent: '', value: '', hidden: false, open: false, checked: false, dataset: {}, style: {}, listeners: {},
      classList: { add: x => classes.add(x), remove: x => classes.delete(x), toggle: (x, enabled) => enabled ? classes.add(x) : classes.delete(x) },
      addEventListener: (type, fn) => { el.listeners[type] = fn; }, querySelector: () => element(id + '-span'), querySelectorAll: () => [] };
    elements.set(id, el); return el;
  }
  const products = ['platform', 'es', 'itsi', 'observability'].map(value => Object.assign(element('product-' + value), { value }));
  const platforms = ['enterprise', 'cloud', 'migration'].map(value => Object.assign(element('platform-' + value), { value }));
  const labels = platforms.map(input => Object.assign(element('label-' + input.value), { dataset: { platformOption: input.value } }));
  const badgeUrl = read('dist/index.html').match(/class="reviewed" href="([^"]+)"/)[1];
  const badge = { href: badgeUrl };
  const document = {
    getElementById: element, documentElement: element('html'), title: '',
    querySelectorAll: selector => selector === 'input[name="product"]' ? products : selector === 'input[name="platform"]' ? platforms : selector === '[data-platform-option]' ? labels : [],
    querySelector: selector => {
      if (selector === 'a.reviewed') return badge;
      const match = selector.match(/input\[name="(product|platform)"\]\[value="([^"]+)"\]/);
      return match ? element(match[1] + '-' + match[2]) : null;
    }
  };
  if (support) document.modelContext = { registerTool: (tool, options) => {
    registrations++;
    if (failure && registrations === 2) throw new Error('Simulated unsupported registration');
    assert(!registered.has(tool.name), 'duplicate registration');
    registered.set(tool.name, tool);
    options.signal.addEventListener('abort', () => registered.delete(tool.name));
  } };
  const window = { location: { search: '?' + new URLSearchParams(selection), href: 'https://versioncompass.com/' }, history: { replaceState: (_a, _b, url) => { window.location.search = url; window.location.href = 'https://versioncompass.com/' + url; } },
    addEventListener: (type, fn) => { (events[type] ||= []).push(fn); }, setTimeout: fn => fn(), print: () => {} };
  const context = vm.createContext({ window, document, navigator: {}, URL, URLSearchParams, AbortController, console: { warn: () => {} } });
  for (const file of ['environment-data.js','environment.js','data.js', 'product-data.js', 'guidance-data.js', 'comparison.js', 'guidance.js', 'release-print.js', 'app.js', 'webmcp.js']) vm.runInContext(read('dist/' + file), context, { filename: file });
  await tick();
  return { window, document, elements, registered, context, badge, events, registrations: () => registrations,
    run: (name, input) => plain(registered.get('versioncompass_' + name).execute(input)),
    dispatch: async name => { for (const fn of events[name] || []) fn(); await tick(); } };
}

test('catalog and batches use current data, exact identifiers, citations, and isolated results', async () => {
  const rt = await runtime();
  assert.equal(rt.registered.size, 3);
  for (const tool of rt.registered.values()) assert.equal(tool.annotations.readOnlyHint, true);
  const catalog = rt.run('get_catalog', {});
  assert.equal(catalog.products.length, 4);
  assert.equal(catalog.metadata.reviewedDate, rt.badge.href.match(/(\d{4}-\d{2}-\d{2})\.md/)[1]);
  let comparisons = 0;
  for (const product of catalog.products) for (const context of product.contexts) {
    for (const from of context.sourceReleases) for (const to of context.targetReleases) {
      if (context.platform !== 'migration' && context.targetReleases.findIndex(x => x.id === to.id) <= context.sourceReleases.findIndex(x => x.id === from.id)) continue;
      const selection = { product: product.id, platform: context.platform, from: from.id, to: to.id };
      if (context.hostReleases.length) selection.host = context.hostReleases.at(-1);
      const result = rt.run('compare_routes', { routes: [selection] });
      assert.equal(result.ok, true, JSON.stringify(selection));
      const report = result.reports[0];
      for (const section of ['features', 'technicalChanges', 'breakingChanges', 'readiness']) {
        assert.equal(report.counts[section], report[section].length);
        report[section].forEach(item => assert.match(item.source, /^https:\/\//));
      }
      assert.deepEqual(Object.fromEntries(new URL(report.reportUrl).searchParams), { ...selection, reviewed: rt.window.SPLUNK_DATA.guidance.reviewed });
      if (report.path.kind === 'enterprise_upgrade') assert.notEqual(report.path.status, 'unknown');
      comparisons++;
    }
  }
  assert(comparisons > 200);
  const before = plain(rt.window.VersionCompassPage.getSelection()), beforeUrl = rt.window.location.href;
  const batch = rt.run('compare_routes', { routes: routes.slice(0, 5) });
  assert.equal(batch.reports.length, 5);
  assert.equal(batch.reports[3].compatibility.title, 'Upgrade Splunk Enterprise first');
  assert.match(batch.reports[3].compatibility.actionUrl, /^https:\/\/versioncompass.com\//);
  assert.equal(batch.reports[4].path.kind, 'product_milestones');
  assert.deepEqual(plain(rt.window.VersionCompassPage.getSelection()), before);
  assert.equal(rt.window.location.href, beforeUrl);
  batch.reports[0].technicalChanges[0].component = 'mutated';
  assert.notEqual(rt.run('compare_routes', { routes: [routes[0]] }).reports[0].technicalChanges[0].component, 'mutated');
  const summary = rt.run('compare_routes', { routes: [routes[0]], include: [] }).reports[0];
  assert(!Object.hasOwn(summary, 'features'));
  assert(summary.counts.features > 0);
});

test('invalid and ambiguous input is rejected without defaulting to a different route', async () => {
  const rt = await runtime();
  for (const input of [null, [], {}, { routes: [] }, { routes: Array(6).fill(routes[0]) },
    { routes: [{ ...routes[0], from: '9.4.9' }] }, { routes: [{ ...routes[0], to: '8.1' }] },
    { routes: [{ ...routes[0], from: '10.4', to: '9.4' }] }, { routes: [{ ...routes[0], product: '__proto__' }] },
    { routes: [{ ...routes[3], host: undefined }] }, { routes: [{ ...routes[3], platform: 'migration' }] },
    { routes: [{ ...routes[0], host: '9.4' }] }, { routes: [routes[0]], include: ['bogus'] },
    { routes: [routes[0]], include: ['features', 'features'] }, { routes: [routes[0]], extra: true },
    { routes: [routes[0], { ...routes[3], to: '999' }] }]) {
    const response = rt.run('compare_routes', input);
    assert.equal(response.ok, false, JSON.stringify(input));
    assert(!response.reports);
  }
  assert.equal(rt.run('get_catalog', { products: [] }).ok, false);
});

test('shared UI and tool reports agree across journeys, URL restoration, controls, and print', async () => {
  for (const selection of routes) {
    const rt = await runtime({ selection });
    const current = rt.run('get_current_report', {}).report;
    const compared = rt.run('compare_routes', { routes: [selection] }).reports[0];
    assert.deepEqual(current, compared);
    assert(rt.elements.get('selection-note').textContent.includes(String(current.counts.technicalChanges)));
    assert.equal(rt.elements.get('host-release-field').hidden, selection.product === 'platform');
    assert.equal(rt.elements.get('technical-panel').open, false);
    await rt.dispatch('beforeprint');
    assert.equal(rt.elements.get('technical-panel').open, true);
    await rt.dispatch('afterprint');
    assert.equal(rt.elements.get('technical-panel').open, false);
    rt.elements.get('technical-panel').open = true;
    await rt.dispatch('beforeprint'); await rt.dispatch('afterprint');
    assert.equal(rt.elements.get('technical-panel').open, true);
  }
  const rt = await runtime();
  rt.elements.get('product-itsi').listeners.change();
  assert.equal(rt.run('get_current_report', {}).report.selection.product, 'itsi');
  assert.equal(rt.elements.get('host-release-field').hidden, false);
  rt.elements.get('product-platform').listeners.change();
  rt.elements.get('platform-migration').listeners.change();
  assert.match(rt.elements.get('from-release').innerHTML, /value="10.4"/);
  rt.elements.get('from-release').value = '10.4'; rt.elements.get('from-release').listeners.change();
  assert.equal(rt.run('get_current_report', {}).report.selection.from, '10.4');
});

test('missing graph paths remain unknown; live data updates reach tools without a second dataset', async () => {
  const rt = await runtime();
  rt.window.SPLUNK_DATA.enterprise.edges = {};
  const report = rt.run('compare_routes', { routes: [routes[0]] }).reports[0];
  assert.equal(report.path.status, 'unknown'); assert.deepEqual(report.path.nodes, []);
  rt.elements.get('to-release').listeners.change();
  assert.match(rt.elements.get('path-intro').textContent, /No supported upgrade path/);
  rt.window.SPLUNK_DATA.enterprise.releasesData['10.4'].features.push(['Test new data', 'Platform operations', 'Outcome', 'Detail']);
  assert(rt.run('compare_routes', { routes: [routes[0]] }).reports[0].features.some(x => x.title === 'Test new data'));
  rt.badge.href = 'https://github.com/LeiterConsulting/splunk-version-value-explorer/blob/main/docs/releases/2026-09-20.md';
  assert.equal(rt.run('get_catalog', {}).metadata.reviewedDate, '2026-09-20');
});

test('unsupported browsers, registration failures, duplicate scripts, and page lifecycle are safe', async () => {
  const unsupported = await runtime({ support: false });
  assert.equal(unsupported.registered.size, 0);
  assert(unsupported.elements.get('selection-note').textContent);
  const failed = await runtime({ failure: true }); assert.equal(failed.registered.size, 0);
  const rt = await runtime();
  vm.runInContext(read('dist/webmcp.js'), rt.context); await tick();
  assert.equal(rt.registrations(), 3);
  await rt.dispatch('pageshow'); assert.equal(rt.registrations(), 3);
  await rt.dispatch('pagehide'); assert.equal(rt.registered.size, 0);
  await rt.dispatch('pageshow'); assert.equal(rt.registered.size, 3);
  assert.equal(rt.registrations(), 6);
});

test('historical links preserve routes, explain newer guidance, and offer optional newer targets', async () => {
  const selection = { platform: 'enterprise', from: '8.2', to: '9.4', reviewed: '2026-09-01' };
  const rt = await runtime({ selection });
  const context = plain(rt.window.VersionCompassPage.getLinkContext());
  assert.equal(context.needsConfirmation, false);
  assert.equal(rt.window.VersionCompassPage.getSelection().to, '9.4');
  assert(context.reasons.some(x => x.code === 'newer_guidance'));
  const newer = context.reasons.find(x => x.code === 'newer_target');
  assert.equal(new URLSearchParams(newer.actionUrl).get('to'), '10.4');
  assert.equal(new URLSearchParams(newer.actionUrl).get('from'), '8.2');
  assert.match(rt.elements.get('link-notice').innerHTML, /original target is preserved/);
  assert.match(rt.elements.get('print-link-notice').innerHTML, /2026-09-01/);
  assert.equal(rt.run('get_current_report', {}).report.selection.to, '9.4');
  rt.window.location.search = '?product=platform&platform=cloud&from=9.3.2408&to=10.4.2604';
  await rt.dispatch('popstate');
  assert.equal(rt.run('get_current_report', {}).report.selection.to, '10.4.2604');
});

test('unknown, incomplete, repeated, and reversed URL values never produce a replacement report', async () => {
  const bad = [
    { ...routes[0], from: '8.2.99' },
    { ...routes[0], to: '<img src=x onerror=alert(1)>' },
    { ...routes[0], product: '__proto__' },
    { ...routes[0], from: '10.4', to: '9.4' },
    { ...routes[0], from: '10.4' },
    { ...routes[0], to: undefined },
    { product: 'es', platform: 'enterprise', from: '7.3', to: '8.7' },
    { ...routes[0], reviewed: '2026-02-30' },
    { ...routes[0], host: '9.4' },
    [['from','9.4'],['from','9.3'],['to','10.4']]
  ];
  for (const selection of bad) {
    const rt = await runtime({ selection });
    assert.equal(rt.elements.get('results').hidden, true, JSON.stringify(selection));
    assert.equal(rt.elements.get('copy-link').disabled, true);
    assert.equal(rt.elements.get('print-report').disabled, true);
    assert.equal(rt.window.location.search, '?' + new URLSearchParams(selection));
    assert.equal(rt.run('get_current_report', {}).ok, false);
    assert(!rt.elements.get('link-notice').innerHTML.includes('<img'));
    assert.equal(rt.run('compare_routes', { routes: [routes[0]] }).ok, true);
    rt.elements.get('accept-link-selections').listeners.click();
    assert.equal(rt.elements.get('results').hidden, false);
    assert.equal(rt.run('get_current_report', {}).ok, true);
  }
  const rt = await runtime({ selection: { ...routes[0], from: 'missing' } });
  rt.elements.get('from-release').value = '9.3';
  rt.elements.get('from-release').listeners.change();
  assert.equal(rt.run('get_current_report', {}).report.selection.from, '9.3');
  const home = await runtime({ selection: {} });
  assert.equal(home.window.VersionCompassPage.getLinkContext().needsConfirmation, false);
  assert.equal(home.elements.get('link-notice').hidden, true);
});

test('every published report URL resolves exactly and only explicit aliases permit remapping', async () => {
  const rt = await runtime();
  const g = rt.window.VersionCompassGuidance;
  const defaults = { platform: { enterprise: {from:'9.4',to:'10.4'}, cloud: {from:'9.3.2408',to:'10.5.2605'}, migration: {from:'9.4',to:'10.5.2605'} } };
  const catalog = rt.run('get_catalog', {}).products;
  for (const product of catalog) {
    if (product.id !== 'platform') defaults[product.id] = {};
    for (const ctx of product.contexts) {
      if (product.id !== 'platform') defaults[product.id][ctx.platform] = {from:ctx.sourceReleases[0].id,to:ctx.latest,host:ctx.hostReleases.at(-1)};
      for (const from of ctx.sourceReleases) for (const to of ctx.targetReleases) {
        if (ctx.platform !== 'migration' && ctx.targetReleases.findIndex(x=>x.id===to.id) <= ctx.sourceReleases.findIndex(x=>x.id===from.id)) continue;
        const state = {product:product.id,platform:ctx.platform,from:from.id,to:to.id};
        if (product.id !== 'platform') state.host = ctx.hostReleases.at(-1);
        const resolved = g.resolveUrl(g.routeUrl(state),defaults);
        assert.equal(resolved.needsConfirmation,false);
        for (const [key,value] of Object.entries(state)) assert.equal(resolved.state[key],value);
      }
    }
  }
  rt.window.SPLUNK_DATA.guidance.urlAliases.releases['platform:enterprise'] = { 'legacy-9.4': {to:'9.4',reason:'Test documented identifier rename.',source:'https://example.com/mapping'} };
  const mapped = g.resolveUrl('?from=legacy-9.4&to=10.4',defaults);
  assert.equal(mapped.needsConfirmation,false);
  assert.equal(mapped.state.from,'9.4');
  assert.equal(mapped.reasons[0].code,'mapped_identifier');
  const future = g.resolveUrl('?from=9.4&to=10.4&reviewed=2099-01-01',defaults);
  assert(future.reasons.some(x=>x.code==='newer_link'));
});

test('support windows use explicit dates, maintenance lines, and distinct managed-service context', async () => {
  const rt = await runtime();
  const lifecycle = rt.window.VersionCompassGuidance.lifecycle;
  assert.equal(lifecycle('platform','enterprise','9.4','2026-09-19').status,'ending_soon');
  assert.equal(lifecycle('platform','enterprise','9.4','2026-12-15').daysRemaining,1);
  assert.equal(lifecycle('platform','enterprise','9.4','2026-12-16').status,'end_of_support');
  assert.equal(lifecycle('platform','enterprise','10.4','2026-09-19').status,'supported');
  assert.equal(lifecycle('platform','enterprise','8.1','2026-09-19').endOfSupport,'2023-04-19');
  assert.equal(lifecycle('itsi','enterprise','5.0.2','2026-09-19').endOfSupport,lifecycle('itsi','enterprise','5.0','2026-09-19').endOfSupport);
  assert.equal(lifecycle('platform','cloud','10.5.2605','2026-09-19').endOfSupport,null);
  assert.equal(lifecycle('observability','enterprise','Sep 2026','2026-09-19').status,'service_milestone');
  assert.equal(lifecycle('platform','enterprise','unknown','2026-09-19').status,'unverified');
});

test('September Observability additions preserve SaaS, private-runner, and Cloud-route boundaries', async () => {
  const rt = await runtime();
  const selection = { product: 'observability', platform: 'cloud', host: '10.5.2605', from: 'Jul 2026', to: 'Sep 2026' };
  const report = rt.run('compare_routes', { routes: [selection] }).reports[0];
  for (const title of ['Delegated APM rule management', 'RUM Business Journeys', 'Synthetics private runner updates', 'Observability Logs', 'Cloud 10.6 free-edition onboarding', '.NET instrumentation 1.16']) {
    assert(report.features.some(item => item.title === title), title);
  }
  assert(report.technicalChanges.some(item => item.component === 'Synthetics private runner' && item.to.includes('1.44.0') && item.to.includes('1.39.0')));
  assert(report.technicalChanges.some(item => item.component === 'Observability Logs operating boundary' && item.implication.includes('not a customer-managed log service')));
  assert(report.technicalChanges.some(item => item.component === '.NET instrumentation installer verification' && item.to.includes('requires GitHub CLI by default')));
  assert(report.breakingChanges.some(item => item.title === 'Provide GitHub CLI for .NET 1.16 installer verification' && item.breaking));
  assert(report.readiness.some(item => item.title === 'Treat Cloud 10.6 trial onboarding as stack-specific' && item.detail.includes('current 10.5 release route')));
  assert(report.breakingChanges.some(item => item.title === 'Reconcile Node.js semantic conventions' && item.detail.startsWith('Splunk OpenTelemetry Node.js 4.11.0') && !item.detail.includes('chart')));
  const platformCloud = rt.run('get_catalog', {}).products.find(item => item.id === 'platform').contexts.find(item => item.platform === 'cloud');
  assert(!platformCloud.targetReleases.some(item => item.id.startsWith('10.6')));
});

test('Cloud 10.5 guidance preserves release-stage, provider, role, and credential boundaries', async () => {
  const rt = await runtime();
  const selection = { product: 'platform', platform: 'cloud', from: '10.4.2604', to: '10.5.2605' };
  const report = rt.run('compare_routes', { routes: [selection] }).reports[0];
  assert(report.features.some(item => item.title === 'Targeted app installation on Victoria Experience' && !item.title.includes('GA')));
  assert(report.features.some(item => item.title === 'Cisco Cloud Control integration (Controlled Availability)' && item.detail.includes('enrolled customers')));
  assert(report.technicalChanges.some(item => item.component === 'Scheduled-search frequency' && item.changeType.includes('Controlled Availability') && item.to.includes('feature is enabled')));
  assert(report.readiness.some(item => item.title === 'Validate targeted-app prerequisites' && item.detail.includes('sc_admin') && item.detail.includes('AWS') && item.detail.includes('GCP or Azure')));
  assert(report.breakingChanges.some(item => item.title === 'Review password ACLs' && item.detail.includes('Credentials page') && !item.detail.includes('network')));
});

test('route guidance remains available and lifecycle disclosure restores after print', async () => {
  const rt = await runtime({selection:routes[3]});
  const report = rt.run('get_current_report',{}).report;
  assert.equal(report.takeaway.highlights.length,3);
  assert.equal(report.lifecycle.length,3);
  assert.match(rt.elements.get('route-takeaway').innerHTML,/Upgrade Splunk Enterprise first/);
  await rt.dispatch('beforeprint');
  assert.equal(rt.elements.get('lifecycle-panel').open,true);
  await rt.dispatch('afterprint');
  assert.equal(rt.elements.get('lifecycle-panel').open,false);
});

test('publication metadata and release index match the newest dated release note', () => {
  require('node:child_process').execFileSync(process.execPath, [path.join(root, 'scripts/sync-release-metadata.cjs'), '--check']);
});

test('release print report preserves every route section and deduplicates source URLs',async()=>{
 for(const selection of routes){
  const rt=await runtime({selection});await rt.dispatch('beforeprint');
  const report=rt.elements.get('release-report').innerHTML;
  assert(report.includes('Public sources'));assert(report.includes('Independent public-source report'));
  for(const id of ['benefit-grid','technical-content','breaking-list','readiness-list']){
   const source=rt.elements.get(id).innerHTML;
   for(const title of source.matchAll(/<h[34][^>]*>(.*?)<\/h[34]>/g))assert(report.includes(title[1]),title[1]);
  }
  const refs=[...report.matchAll(/<li id="release-source-(\d+)">/g)];assert(refs.length>0);
  assert.equal(new Set(refs.map(x=>x[1])).size,refs.length);
  assert(!report.includes('id="takeaway-title"'));
  await rt.dispatch('afterprint');
 }
 const blocked=await runtime({selection:{product:'unknown'}});await blocked.dispatch('beforeprint');assert.equal(blocked.elements.get('results').hidden,true);assert(!blocked.elements.get('release-report')?.innerHTML);
});

test('environment selection survives page, read-only report, share URL and print without broadening scope',async()=>{
 const selection={...routes[1],csp:'aws',region:'us-gov-east-1',compliance:'fr-h'};
 const rt=await runtime({selection});
 const current=rt.run('get_current_report',{});assert.equal(current.ok,true);
 const report=current.report;assert.equal(report.environment.selection.region,selection.region);
 assert.equal(report.environment.records.find(r=>r.id==='s3-high').availability,'conflicting');
 const link=new URL(report.reportUrl);for(const k of ['csp','region','compliance'])assert.equal(link.searchParams.get(k),selection[k]);
 const before=rt.window.location.href;
 const compact=rt.run('compare_routes',{routes:[{...routes[1],environment:{csp:'azure',compliance:'fr-h'}}],include:[]});
 assert.equal(compact.ok,true);assert.equal(compact.reports[0].environment.records.length,0);assert.match(compact.reports[0].environment.coverageNote,/not an unavailability/);assert.equal(rt.window.location.href,before);
 await rt.dispatch('beforeprint');const html=rt.elements.get('release-report').innerHTML;assert.match(html,/Cloud environment/);assert.match(html,/Conflicting guidance/);assert.match(html,/February 2026/);
 assert.equal(rt.run('compare_routes',{routes:[{...routes[1],environment:{csp:'aws',region:'gcp-oregon'}}]}).ok,false);
 const invalid=await runtime({selection:{...routes[1],csp:'invalid'}});assert.equal(invalid.run('get_current_report',{}).ok,false);assert.equal(invalid.elements.get('copy-link').disabled,true);
});
