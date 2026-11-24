import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
import {checkReaderReport} from './reader-report.mjs';

const require = createRequire(import.meta.url);
const routes = require('./routes.json');
const registry = require('../../content/automation-coverage.json');
const manifest = require('../../content/publication.json');
const {coversRoute} = require('../../scripts/lib/reader-review.cjs');
const [target, inputFile] = process.argv.slice(2);
const section = id => {
  const cap = registry.capabilities.find(c => c.id === id);
  assert(cap,'Unknown registered section: ' + id);
  return cap;
};
if (target === '--list') {
  const cap = section(inputFile);
  console.log(JSON.stringify({section:cap.id, sources:cap.sources, routes:routes.filter(r => coversRoute(cap,r)).map(({id,query}) => ({id,query}))},null,2));
} else {
  assert(target && inputFile,'Supply --list SECTION or ORIGIN CHECKS.json');
  const url = new URL(target);
  assert(target === url.origin && (['https://versioncompass.com','https://www.versioncompass.com'].includes(target) ||
    url.protocol === 'http:' && ['127.0.0.1','localhost'].includes(url.hostname)), 'Use a public site or local preview origin');
  const checkManifest = async () => {
    const response = await fetch(target+'/api/content/manifest',{signal:AbortSignal.timeout(15000)});
    assert(response.ok,'Cannot read content manifest');
    assert.deepEqual(await response.json(),manifest,'Origin must serve the selected checkout');
  };
  const inputs = JSON.parse(fs.readFileSync(inputFile,'utf8'));
  assert(Array.isArray(inputs) && inputs.length,'Supply at least one scoped check');
  const groups = new Map();
  for (const proof of inputs) {
    const cap = section(proof.capabilityId), route = routes.find(r => r.id === proof.routeId);
    const source = cap.sources.find(s => s.id === proof.sourceId);
    assert(source && coversRoute(cap,route),'Choose a registered source and route for '+cap.id);
    assert(/^[#.][a-zA-Z][a-zA-Z0-9_-]*$/.test(proof.region),'Supply a scoped reader-visible region');
    assert(typeof proof.answer === 'string' && proof.answer.trim().length >= 12,'Supply the expected reader answer');
    if (proof.reportAnswer !== undefined) assert(typeof proof.reportAnswer === 'string' && proof.reportAnswer.trim().length >= 12,'Supply the expected report answer');
    if (!groups.has(route)) groups.set(route,[]);
    groups.get(route).push({...proof,sourceUrl:source.url});
  }
  await checkManifest();
  const browser = await chromium.launch(), directory = fs.mkdtempSync(path.join(os.tmpdir(),'versioncompass-owner-'));
  const checks = [];
  try {
    for (const [route,proofs] of groups) {
      const result = {routeId:route.id, sections:proofs.map(p => p.capabilityId), expectations:proofs};
      checks.push(result);
      try {
        Object.assign(result,await checkReaderReport(browser,target,route,proofs,directory));
        result.status = 'passed';
      } catch (error) {
        result.status = 'failed';
        result.error = error.message;
        process.exitCode = 1;
      }
    }
    await checkManifest();
    console.log(JSON.stringify({origin:target,revision:manifest.revision,checkedAt:new Date().toISOString(),checks},null,2));
  } finally {
    await browser.close();
    fs.rmSync(directory,{recursive:true,force:true});
  }
}
