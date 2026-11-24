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
const [mode, argument, overrideFile] = process.argv.slice(2);
const questions = require('./owner-questions.json');
const hosts = ['https://versioncompass.com','https://www.versioncompass.com'];
const section = id => {
  const cap = registry.capabilities.find(c => c.id === id);
  assert(cap,'Unknown registered section: ' + id);
  return cap;
};
function ownerQuestions(watchId, file) {
  const caps = registry.capabilities.filter(cap => cap.mandatory && cap.primaryOwner === watchId);
  assert(caps.length, 'Unknown primary daily owner: ' + watchId);
  const inputs = file ? JSON.parse(fs.readFileSync(file,'utf8')) : questions.filter(q => caps.some(c => c.id === q.capabilityId));
  assert(Array.isArray(inputs) && inputs.length, 'Supply the owner questions');
  for (const q of inputs) {
    const cap = section(q.capabilityId);
    assert(cap.primaryOwner === watchId, 'Question belongs to another owner: ' + cap.id);
    assert(q.question?.trim().length >= 12 && q.claimIds?.length &&
      q.claimIds.every(id => cap.claimFamilies.some(f => f.id === id && f.sourceIds.includes(q.sourceId))),
      'Question needs its mapped claim and source: ' + cap.id);
  }
  assert(caps.every(cap => inputs.some(q => q.capabilityId === cap.id)), 'Missing primary section questions');
  return {caps, inputs};
}
if (mode === '--list') {
  const cap = section(argument);
  console.log(JSON.stringify({section:cap.id, sources:cap.sources, routes:routes.filter(r => coversRoute(cap,r)).map(({id,query}) => ({id,query}))},null,2));
} else if (mode === '--owner' || mode === '--live') {
  const {caps,inputs} = ownerQuestions(argument, overrideFile);
  if (mode === '--owner') {
    console.log(JSON.stringify({watchId:argument, sections:caps.map(({id,sources,claimFamilies}) => ({id,sources,claimFamilies})), questions:inputs}, null, 2));
  } else {
    const reports = [];
    for (const host of hosts) {
      try { reports.push(await checkOrigin(host,inputs,null)); }
      catch (error) { reports.push({origin:host,status:'failed',error:error.message,checks:[]}); process.exitCode=1; }
    }
    const samePublication = reports.length === 2 && reports[0].digest && reports[0].digest === reports[1].digest;
    if (!samePublication) process.exitCode = 1;
    console.log(JSON.stringify({watchId:argument, registered:caps.length, expectedRevision:manifest.revision, samePublication:!!samePublication, hosts:reports},null,2));
  }
} else {
  assert(mode && argument,'Supply --owner WATCH, --live WATCH [QUESTIONS.json], --list SECTION or ORIGIN CHECKS.json');
  console.log(JSON.stringify(await checkOrigin(mode,JSON.parse(fs.readFileSync(argument,'utf8'))),null,2));
}

async function checkOrigin(target, inputs, expected = manifest) {
  const url = new URL(target);
  assert(target === url.origin && (hosts.includes(target) ||
    url.protocol === 'http:' && ['127.0.0.1','localhost'].includes(url.hostname)), 'Use a public site or local preview origin');
  const checkManifest = async () => {
    const response = await fetch(target+'/api/content/manifest',{signal:AbortSignal.timeout(15000)});
    assert(response.ok,'Cannot read content manifest');
    const current = await response.json();
    assert(/^content-[0-9a-f]+$/.test(current.revision) && /^[0-9a-f]{64}$/.test(current.digest), 'Invalid public manifest');
    return current;
  };
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
  const before = await checkManifest();
  if (expected) assert.deepEqual(before, expected, 'Origin must serve the selected checkout');
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
    assert.deepEqual(await checkManifest(), before, 'Publication changed during verification');
    return {origin:target,revision:before.revision,digest:before.digest,checkedAt:new Date().toISOString(),checks};
  } finally {
    await browser.close();
    fs.rmSync(directory,{recursive:true,force:true});
  }
}
