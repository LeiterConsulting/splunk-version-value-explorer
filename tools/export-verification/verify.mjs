/* Dedicated application CI, independent of the managed interactive browser. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url), { target, hash, verify } = require('../../scripts/export-evidence.cjs');
if (process.env.SITES_MANAGED_LINUX_CONTAINER === '1') throw Error('Run export verification in dedicated application CI, not managed Sites preview.');
const root = process.cwd(), output = path.resolve('export-artifacts');
fs.rmSync(output, { recursive: true, force: true }); fs.mkdirSync(output);
const receipt = { schemaVersion: 1, outcome: 'failed', target: target(),
  commit: execFileSync('git', ['rev-parse', 'HEAD'], {encoding:'utf8'}).trim(),
  tree: execFileSync('git', ['rev-parse', 'HEAD^{tree}'], {encoding:'utf8'}).trim(),
  runId: process.env.GITHUB_RUN_ID || null, startedAt: new Date().toISOString(), cases: [], artifacts: [] };
const server = spawn(process.execPath, ['scripts/preview.cjs', '--port', '4173'], { stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = ''; server.stdout.on('data', b => serverLog += b); server.stderr.on('data', b => serverLog += b);
let browser;
const relative = file => path.relative(output, file);
const normalize = s => s.replace(/\s+/g, ' ').trim();
async function checkLayout(page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return { width, scroll: document.documentElement.scrollWidth,
      overflow: [...document.querySelectorAll('h1,h2,h3,h4,p,button,select')].filter(el => {
        const r = el.getBoundingClientRect(), style = getComputedStyle(el);
        if (!el.checkVisibility({visibilityProperty:true,opacityProperty:true})) return false;
        // An intentional horizontally scrollable tab strip may have offscreen
        // buttons without overflowing the page. Check its container, not each tab.
        for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
          const css = getComputedStyle(parent);
          if (['auto','scroll'].includes(css.overflowX) && parent.scrollWidth > parent.clientWidth) return false;
        }
        return r.width && r.height && style.visibility !== 'hidden' && (r.right > width + 3 || r.left < -3);
      }).slice(0, 10).map(el => ({ tag: el.tagName, text: el.textContent.slice(0, 100) })) };
  });
}
async function settled(page) {
  await page.waitForFunction(() => window.VersionCompassContent?.status !== 'loading' && typeof window.VersionCompassBuildSnapshot === 'function');
  await page.evaluate(() => document.fonts.ready);
}
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Export server did not start: ' + serverLog)), 15000);
    server.once('error', reject); server.once('exit', code => reject(Error('Export server exited ' + code + ': ' + serverLog)));
    server.stdout.on('data', () => { if (serverLog.includes('Static preview ready')) { clearTimeout(timer); resolve(); } });
  });
  browser = await chromium.launch();
  const routes = JSON.parse(fs.readFileSync('tools/export-verification/routes.json'));
  for (const route of routes) for (const theme of ['default', 'cisco']) {
    const id = route.id + '-' + theme, directory = path.join(output, id); fs.mkdirSync(directory);
    const entry = { id, outcome: 'failed' }; receipt.cases.push(entry);
    const context = await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
    try {
    const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
    // Restrict application CI to its own local Worker; no external source or customer requests.
    await context.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    const url = 'http://127.0.0.1:4173/?' + route.query + (theme === 'cisco' ? '&theme=cisco' : '');
    await page.goto(url); await settled(page);
    const print = page.locator('#print-report, #edition-print').first();
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('theme-cisco')), theme === 'cisco');
    entry.screen = relative(path.join(directory, 'desktop.png')); await page.screenshot({path:path.join(output,entry.screen)});
    await page.setViewportSize({width:390,height:844});
    // Check the expanded content too, then restore the user's disclosure state.
    const disclosureState = await page.evaluate(() => [...document.querySelectorAll('main details')].filter(d=>!d.closest('#release-report,.edition-report')).map(d=>{const open=d.open;d.open=true;return open;}));
    const narrow = await checkLayout(page);
    assert(narrow.scroll <= narrow.width + 3 && !narrow.overflow.length, 'Narrow overflow ' + id + ': ' + JSON.stringify(narrow));
    entry.narrow = {passed:true,viewport:{width:390,height:844},file:relative(path.join(directory,'narrow.png'))};
    await page.screenshot({path:path.join(output,entry.narrow.file)});
    await page.evaluate(states=>[...document.querySelectorAll('main details')].filter(d=>!d.closest('#release-report,.edition-report')).forEach((d,i)=>{d.open=states[i];}),disclosureState);
    await page.setViewportSize({width:1440,height:1000});
    if (route.invalid) {
      assert(await print.isDisabled(), 'Invalid route must block print');
      assert(await page.locator('.header-actions [data-save-snapshot], .header-report-actions [data-save-snapshot], .site-header [data-save-snapshot]').first().isDisabled(), 'Invalid route must block saved HTML');
      entry.exportsBlocked = true;
    } else {
      assert(!await print.isDisabled(), 'Unexpected blocked route: ' + id);
      const baseline = await page.evaluate(() => ({ url: location.href, details: [...document.querySelectorAll('main details')].filter(d=>!d.closest('#release-report,.edition-report')).map(d=>[d.id,d.open]) }));
      const expected = await page.evaluate(() => {
        const html = window.VersionCompassBuildSnapshot(), doc = new DOMParser().parseFromString(html,'text/html');
        doc.querySelectorAll('script,iframe,object,embed,form,button,input,select,link,style,.technical-summary-action,.technical-summary-icon').forEach(el=>el.remove());
        return { html, text: doc.body.textContent, headings: [...doc.querySelectorAll('h1,h2,h3')].map(h=>h.textContent.trim()).filter(Boolean), revision: window.VersionCompassRevision.id };
      });
      const downloadPromise = page.waitForEvent('download');
      await page.locator('.site-header [data-save-snapshot]').first().click();
      const download = await downloadPromise, htmlFile = path.join(directory, 'report.html');
      assert.equal(await download.failure(), null); await download.saveAs(htmlFile);
      // Independent context, real downloaded bytes, no live assets or API available.
      const offline = await browser.newContext({offline:true,viewport:{width:1440,height:1000}}), reopened = await offline.newPage();
      const requests = []; await offline.route('**/*', r => {
        if (r.request().url().startsWith('file:')) return r.continue();
        requests.push(r.request().url()); return r.abort();
      });
      await reopened.goto(pathToFileURL(htmlFile).href);
      const reopenedText = normalize(await reopened.locator('body').textContent());
      assert(reopenedText.includes(normalize(expected.text)), 'Saved HTML lost report content');
      assert.equal(await reopened.locator('script,iframe,object,embed').count(), 0);
      assert.equal(requests.length, 0, 'Offline HTML attempted network requests');
      await reopened.screenshot({path:path.join(directory,'html-reopened.png')});
      entry.html = {file:relative(htmlFile),offlineReopened:true,complete:true,networkRequestsBlocked:true};
      await offline.close();
      fs.writeFileSync(path.join(directory,'expected.json'),JSON.stringify(expected));
      // page.pdf invokes Chromium's native beforeprint/afterprint and the production print CSS.
      const pdf = path.join(directory,'report.pdf');
      await page.pdf({path:pdf,format:'A4',printBackground:true,preferCSSPageSize:true});
      const inspected = JSON.parse(execFileSync('python3',['tools/export-verification/inspect-pdf.py',pdf,directory,path.join(directory,'expected.json')],{encoding:'utf8'}));
      entry.pdf = {...inspected,file:relative(pdf),inspection:relative(path.join(directory,'inspection.json')),pages:inspected.pages.map(p=>({...p,file:relative(p.file)}))};
      const restored = await page.evaluate(() => ({url:location.href,details:[...document.querySelectorAll('main details')].filter(d=>!d.closest('#release-report,.edition-report')).map(d=>[d.id,d.open])}));
      assert.deepEqual(restored,baseline,'Print/export changed the selected report or disclosure state');
    }
    assert.equal(errors.length,0,'Browser errors: '+errors.join('; '));
    entry.outcome='passed'; console.log('Export verification passed: '+id);
    } catch (error) { entry.error=error.stack; console.error(id+': '+error.stack); process.exitCode=1; }
    finally { await context.close(); }
  }
  receipt.outcome=receipt.cases.every(c=>c.outcome==='passed')?'passed':'failed';
} catch (error) { receipt.error = error.stack; console.error(error.stack); process.exitCode=1; }
finally {
  await browser?.close(); server.kill(); fs.writeFileSync(path.join(output,'server.log'),serverLog);
  const collect = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?collect(path.join(dir,e.name)):[path.join(dir,e.name)]);
  receipt.artifacts=collect(output).filter(f=>!f.endsWith('/evidence.json')).map(file=>({file:relative(file),sha256:hash(fs.readFileSync(file))}));
  receipt.completedAt=new Date().toISOString(); fs.writeFileSync(path.join(output,'evidence.json'),JSON.stringify(receipt,null,2)+'\n');
  if(receipt.outcome==='passed') { verify(output); console.log('Verified '+receipt.cases.length+' rendered export cases: '+receipt.target.fingerprint); }
}
