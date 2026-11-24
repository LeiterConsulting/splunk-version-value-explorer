// Record the exact source transport available to this runner. Owners assess the cited passages.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const registry = require('../../content/automation-coverage.json');
const [watchId] = process.argv.slice(2);
const sections = registry.capabilities.filter(cap => cap.mandatory && cap.primaryOwner === watchId);
assert(sections.length, 'Choose a registered primary owner');
const byUrl = new Map();
for (const cap of sections) {
  for (const source of cap.sources) {
    if (!byUrl.has(source.url)) byUrl.set(source.url, []);
    byUrl.get(source.url).push({capabilityId:cap.id, sourceId:source.id, section:source.section});
  }
}
async function retrieve(url) {
  const signal = AbortSignal.timeout(20000);
  let target = new URL(url);
  for (let redirect = 0; redirect <= 5; redirect++) {
    assert(target.protocol === 'https:' && !target.username && !target.password && registry.publicSourceHosts.includes(target.hostname), 'Outside registered public source hosts');
    const response = await fetch(target,{redirect:'manual',signal,headers:{'User-Agent':'VersionCompass public documentation review'}});
    if ([301,302,303,307,308].includes(response.status)) {
      await response.body?.cancel();
      assert(response.headers.has('location'), 'Redirect without a destination');
      target = new URL(response.headers.get('location'),target);
      continue;
    }
    const record = {http:response.status, finalUrl:target.href, contentType:response.headers.get('content-type')};
    if (!response.ok) { await response.body?.cancel(); return {...record,status:'blocked',reason:'HTTP '+response.status}; }
    const hash = createHash('sha256');
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      assert(size <= 16 * 1024 * 1024,'Source exceeds 16 MiB inspection limit');
      hash.update(chunk); chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString('utf8');
    const title = (body.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').trim();
    const blocked = !size || /site unavailable|access denied|just a moment|page not found|request rejected|attention required/i.test(title);
    return {...record,status:blocked ? 'blocked' : 'received',bytes:size,sha256:hash.digest('hex'),title};
  }
  throw Error('Too many source redirects');
}
const queue = [...byUrl.keys()];
const sources = [];
async function consume() {
  for (let url; (url=queue.shift());) {
    let record;
    try { record = await retrieve(url); }
    catch (error) { record = {status:'blocked',reason:error.message}; }
    sources.push({url,...record,checkedAt:new Date().toISOString(),requiredBy:byUrl.get(url)});
  }
}
await Promise.all([consume(),consume(),consume()]);
sources.sort((a,b) => a.url.localeCompare(b.url));
console.log(JSON.stringify({watchId,checkedAt:new Date().toISOString(),sources,
  qualification:'Transport evidence. Each owner must read the cited section and assess the mapped claims.'},null,2));
if (sources.some(source => source.status !== 'received')) process.exitCode = 2;
