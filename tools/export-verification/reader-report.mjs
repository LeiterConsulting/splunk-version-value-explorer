import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {checkReaderSurface} from './reader-checks.mjs';
import {configureAdvisorRoute} from './advisor.mjs';

export async function checkReaderReport(browser, host, route, proofs, directory) {
  const context = await browser.newContext({acceptDownloads:true});
  const offline = await browser.newContext({offline:true});
  try {
    const page = await context.newPage();
    await page.goto(host+'/?'+route.query);
    await page.waitForFunction(() => window.VersionCompassContent?.status !== 'loading' && typeof window.VersionCompassBuildSnapshot === 'function');
    await configureAdvisorRoute(page,route);
    await checkReaderSurface(page,proofs);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('.report-toolbar [data-save-snapshot]').click();
    const download = await downloadPromise;
    const html = path.join(directory, route.id + '.html');
    await download.saveAs(html);
    const reopened = await offline.newPage();
    await reopened.goto(pathToFileURL(html).href);
    await checkReaderSurface(reopened,proofs,true);
    const pdf = path.join(directory, route.id + '.pdf');
    await page.bringToFront();
    await page.emulateMedia({media:'print'});
    await page.evaluate(() => document.fonts.ready.then(() => true));
    await page.pdf({path:pdf,printBackground:true,preferCSSPageSize:true});
    const compact = text => text.replace(/\s+/g,'').toLowerCase();
    const text = compact(execFileSync('pdftotext',['-raw',pdf,'-'],{encoding:'utf8'}));
    const urls = execFileSync('pdfinfo',['-url',pdf],{encoding:'utf8'}).split('\n')
      .map(line => line.trim().split(/\s+/)[2]);
    for (const proof of proofs) {
      assert(text.includes(compact(proof.reportAnswer || proof.answer)),'Printed answer missing for ' + proof.capabilityId + ' on ' + route.id + ': ' + (proof.reportAnswer || proof.answer));
      assert(urls.includes(proof.sourceUrl),'Printed citation missing for ' + proof.capabilityId + ' on ' + route.id + ': ' + proof.sourceUrl);
    }
    const sha256 = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    return {checkedAt:new Date().toISOString(), htmlSha256:sha256(html), pdfSha256:sha256(pdf)};
  } finally {
    await context.close();
    await offline.close();
  }
}
