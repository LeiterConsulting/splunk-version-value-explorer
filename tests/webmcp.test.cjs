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
  for (const file of ['data.js', 'product-data.js', 'comparison.js', 'app.js', 'webmcp.js']) vm.runInContext(read('dist/' + file), context, { filename: file });
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
      assert.deepEqual(Object.fromEntries(new URL(report.reportUrl).searchParams), selection);
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
