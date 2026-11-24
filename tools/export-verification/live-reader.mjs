// From a clean checkout of the steward-selected GitHub commit, read both public hosts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
import {checkReaderReport} from './reader-report.mjs';

const require = createRequire(import.meta.url);
const {inventory,dayOf} = require('../../scripts/lib/reader-review.cjs');
const [sha, date] = process.argv.slice(2);
assert(/^[a-f0-9]{40}$/.test(sha) && /^\d{4}-\d{2}-\d{2}$/.test(date), 'Usage: node tools/export-verification/live-reader.mjs SELECTED_MAIN_SHA YYYY-MM-DD');
const git = (...args) => execFileSync('git',args,{encoding:'utf8'}).trim();
assert.equal(git('rev-parse','HEAD'),sha,'Check out the exact steward-selected commit');
assert.equal(git('status','--porcelain'),'','Use a clean selected checkout');
const {sections,proofs,date:receiptDate} = inventory();
const manifest = require('../../content/publication.json'), routes = require('./routes.json');
const receipt = {sha,date,receiptDate,checkedAt:new Date().toISOString(),hosts:[],registered:sections.length};
const browser = await chromium.launch();
const directory = fs.mkdtempSync(path.join(os.tmpdir(),'vc-live-reader-'));
try {
  for (const host of ['https://versioncompass.com','https://www.versioncompass.com']) {
    const result = {host,checks:[],currentSections:0,issues:[]};
    receipt.hosts.push(result);
    try {
      const response = await fetch(host+'/api/content/manifest',{signal:AbortSignal.timeout(15000)});
      assert(response.ok);
      assert.deepEqual(await response.json(),manifest,'Published manifest differs from the selected commit');
      const about = await browser.newPage();
      try {
        await about.goto(host+'/?view=about');
        const details = about.locator('#daily-section-reviews');
        await details.locator('summary').click();
        assert((await details.locator('summary').innerText()).includes(receiptDate));
        assert.equal(await details.locator('li').count(),sections.length);
      } finally { await about.close(); }
    } catch (error) { result.issues.push(error.message); continue; }
    const current = new Set();
    if (receiptDate !== date) result.issues.push('Selected package has no matching review date');
    if (!proofs.length) result.issues.push('No source-backed reader checks in the selected package');
    for (const routeId of new Set(proofs.map(p => p.routeId))) {
      const selected = proofs.filter(proof => proof.routeId === routeId);
      const route = routes.find(r => r.id === routeId);
      const check = {routeId,sections:selected.map(({capabilityId,proofId,receipt,checkedAt}) => ({capabilityId,proofId,receipt,checkedAt})),status:'failed'};
      result.checks.push(check);
      try {
        await checkReaderReport(browser,host,route,selected,directory);
        check.screen = check.offlineHtml = check.pdf = 'passed';
        check.status = 'passed';
        for (const proof of selected) if (dayOf(proof.checkedAt) === date) current.add(proof.capabilityId);
      } catch (error) {check.error = error.message;}
    }
    result.currentSections = current.size;
    if (current.size !== sections.length) result.issues.push('Incomplete daily coverage');
  }
} finally {await browser.close();fs.rmSync(directory,{recursive:true,force:true});}
console.log(JSON.stringify(receipt,null,2));
if (receipt.hosts.some(host => host.issues.length || host.checks.some(check => check.status !== 'passed'))) process.exitCode = 1;
