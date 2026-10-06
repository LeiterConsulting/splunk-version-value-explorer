const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { checkRipple } = require('../scripts/check-ripple.cjs');
const assets = Object.fromEntries(['index.html', 'app.js', 'app.css', 'icon.svg'].map(file => ['/ripple/' + file, { body: fs.readFileSync('dist/ripple/' + file, 'utf8'), type: ({ html: 'text/html', js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml' })[file.split('.').at(-1)] }]));
assets['/index.html'] = { body: fs.readFileSync('dist/index.html', 'utf8'), type: 'text/html' };
const secret = 'fixture-private-service-token';
const snapshot = { schemaVersion: 1, records: [{ id: 'fixture-assessment' }], candidates: [], checks: [], lastRun: null, storage: 'persistent', updateStatus: 'complete', runs: 1 };
async function worker(fetcher = async () => Response.json(snapshot)) {
  const { createWorker } = await import(pathToFileURL(path.resolve('worker/index.mjs')));
  return createWorker({}, assets, { rippleFetch: fetcher });
}
const request = (route, options) => new Request('https://versioncompass.com' + route, options);
const env = { RIPPLE_READ_SERVICE_TOKEN: secret };
test('unlisted tool and trailing slash serve the independent app; main interface has no link', async () => {
  const app = await worker();
  for (const route of ['/ripple', '/ripple/', '/ripple?assessment=http2-iosxe', '/ripple/app.js', '/ripple/app.css', '/ripple/icon.svg']) {
    const response = await app.fetch(request(route), env);
    assert.equal(response.status, 200); assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal((await response.text()).includes(secret), false);
  }
  const root = await app.fetch(request('/'), env);
  assert.equal(await root.text(), assets['/index.html'].body);
  assert.equal(/href=["'][^"']*\/ripple(?:[\/\?"'])/i.test(assets['/index.html'].body), false);
  checkRipple();
});
test('only the two allowlisted read endpoints reach the fixed private service', async () => {
  const calls = [];
  const app = await worker(async (url, options) => { calls.push({ url, options }); return Response.json({ ...snapshot, privateExtra: 'never-return' }, { headers: { 'Set-Cookie': 'private-cookie', 'OAI-Sites-Authorization': secret } }); });
  const response = await app.fetch(request('/ripple/api/snapshot', { headers: { Cookie: 'visitor-cookie', Authorization: 'visitor-token', 'oai-authenticated-user-id': 'visitor-id' } }), env);
  assert.deepEqual(await response.json(), snapshot);
  assert.equal(response.headers.has('set-cookie'), false); assert.equal(response.headers.has('oai-sites-authorization'), false);
  assert.equal(calls.length, 1); assert.equal(calls[0].url, 'https://ripple-exposure.majorgeneralrabidzagnut.chatgpt.site/api/snapshot');
  assert.deepEqual(calls[0].options.headers, { Accept: 'application/json', 'OAI-Sites-Authorization': 'Bearer ' + secret });
  assert.equal(calls[0].options.method, 'GET'); assert.equal(calls[0].options.redirect, 'manual');
});
test('CVE query is validated, canonicalized and scoped to upstream public fields', async () => {
  let called;
  const app = await worker(async url => { called = url; return Response.json({ id: 'CVE-2023-44487', found: true, ciscoImpact: 'Unknown until assessed', privateExtra: secret }); });
  const response = await app.fetch(request('/ripple/api/cve?id=cve-2023-44487'), env);
  assert.equal(response.status, 200); assert.equal(called, 'https://ripple-exposure.majorgeneralrabidzagnut.chatgpt.site/api/cve?id=CVE-2023-44487');
  assert.deepEqual(await response.json(), { id: 'CVE-2023-44487', found: true, ciscoImpact: 'Unknown until assessed' });
});
test('writes, admin paths, unknown routes and injected targets never call the backend', async () => {
  let calls = 0; const app = await worker(async () => { calls++; throw Error('Must not reach upstream'); });
  for (const route of ['/ripple/api/refresh', '/ripple/api/admin', '/ripple/api/cve/extra', '/ripple/api/snapshot/extra', '/ripple/unknown']) assert.equal((await app.fetch(request(route), env)).status, 404);
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) assert.equal((await app.fetch(request('/ripple/api/snapshot', { method }), env)).status, 405);
  for (const route of ['/ripple/api/snapshot?url=https://example.com', '/ripple/api/cve?id=CVE-2023-44487&url=https://example.com', '/ripple/api/cve?id=CVE-2023-44487&id=CVE-2020-1', '/ripple/api/cve?id=bad', '/ripple/api/cve', '/ripple/api/cve?id=CVE-2023-' + '1'.repeat(100)]) assert.equal((await app.fetch(request(route), env)).status, 400);
  assert.equal(calls, 0);
});
test('missing credentials fail closed; HEAD returns only safe response headers', async () => {
  let calls = 0; const app = await worker(async () => { calls++; return Response.json(snapshot); });
  assert.equal((await app.fetch(request('/ripple/api/snapshot'), {})).status, 503); assert.equal(calls, 0);
  const head = await app.fetch(request('/ripple/api/snapshot', { method: 'HEAD' }), env);
  assert.equal(head.status, 200); assert.equal(await head.text(), ''); assert.equal(head.headers.get('content-type'), 'application/json; charset=utf-8');
});
test('redirects, HTML, malformed data, mismatched CVEs and oversized responses fail closed', async () => {
  const responses = [new Response(null, { status: 302, headers: { Location: 'https://example.com', 'Set-Cookie': secret } }), new Response('<html>Login</html>'), Response.json({ schemaVersion: 1 }), new Response('{bad-json', { headers: { 'Content-Type': 'application/json' } }), Response.json(snapshot, { headers: { 'Content-Length': '2000001' } }), new Response(' '.repeat(2000001), { headers: { 'Content-Type': 'application/json' } })];
  for (const response of responses) {
    const app = await worker(async () => response);
    const result = await app.fetch(request('/ripple/api/snapshot'), env);
    assert.equal(result.status, 502); assert.equal((await result.text()).includes(secret), false); assert.equal(result.headers.has('location'), false);
  }
  const app = await worker(async () => Response.json({ id: 'CVE-2023-38545', found: true }));
  assert.equal((await app.fetch(request('/ripple/api/cve?id=CVE-2023-44487'), env)).status, 502);
});
