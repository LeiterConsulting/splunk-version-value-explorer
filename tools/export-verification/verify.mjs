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
async function productLabelFit(page) {
  return page.evaluate(() => [...document.querySelectorAll('.product-options label > span')]
    .filter(card => card.checkVisibility({visibilityProperty:true,opacityProperty:true}))
    .flatMap(card => {
      const box=card.getBoundingClientRect(), css=getComputedStyle(card);
      const left=box.left+parseFloat(css.paddingLeft)+parseFloat(css.borderLeftWidth);
      const right=box.right-parseFloat(css.paddingRight)-parseFloat(css.borderRightWidth);
      return [...card.querySelectorAll('strong,small')].flatMap(label => {
        const range=document.createRange();range.selectNodeContents(label);
        const rects=[...range.getClientRects()];
        return rects.some(r=>r.left<left-1||r.right>right+1)||label.scrollWidth>label.clientWidth+1
          ? [{text:label.textContent,left,right,rects:rects.map(r=>({left:r.left,right:r.right}))}] : [];
      });
    }));
}
async function keyboardReach(page, locator) {
  // Exercise actual browser Tab navigation, rather than DOM focus simulation.
  for (let tabs = 0; tabs < 180; tabs++) {
    if (await locator.evaluate(el => el === document.activeElement)) return tabs;
    await page.keyboard.press('Tab');
  }
  throw Error('Report action is unreachable with Tab');
}
async function visibleDecisionLabels(page) {
  return page.evaluate(() => [...document.querySelectorAll('.decision-details>summary .decision-expand-label,.decision-details>summary .decision-collapse-label')]
    .filter(el => el.checkVisibility({visibilityProperty:true,opacityProperty:true}))
    .map(el => el.textContent.trim()));
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
    const routeUrl = new URL('http://127.0.0.1:4173/?' + route.query);
    if (theme === 'cisco') routeUrl.searchParams.set('theme','cisco');
    const url = routeUrl.href;
    if(route.id==='ai-overview') {
      await page.goto('http://127.0.0.1:4173/'+(theme==='cisco'?'?theme=cisco':'')); await settled(page);
      await page.locator('.site-nav a').filter({hasText:'AI Availability'}).click(); await settled(page);
      assert.equal(new URL(page.url()).searchParams.has('perspective'),false,'Release perspective leaked into AI navigation');
      assert(await page.locator('#ai-selection').isVisible(),'Main-page AI navigation did not load a usable view');
      entry.mainNavigation={passed:true};
    }
    await page.goto(url); await settled(page);
    if(routeUrl.hash) {
      assert.equal(new URL(page.url()).hash,routeUrl.hash,'Shared section anchor was discarded: '+id);
      assert(await page.locator(routeUrl.hash).count()>0,'Shared section anchor has no target: '+id);
      entry.sharedAnchor={passed:true,hash:routeUrl.hash};
    }
    if(route.id.startsWith('ai-')) {
      assert(await page.locator('#ai-title').isVisible());
      assert.equal(await page.locator('.site-nav a[aria-current="page"]').getAttribute('href'),theme==='cisco'?'/?view=ai-availability&theme=cisco':'?view=ai-availability');
      if(route.invalid){
        assert(await page.locator('#ai-warning').isVisible());assert(await page.locator('#ai-content').isHidden());
        assert.equal(await page.locator('main>.ai-report').count(),0);
        assert.equal(await page.evaluate(()=>location.search),new URL(url).search);
      }else{
        const prior=await page.locator('#ai-search').inputValue();
        await page.locator('#ai-search').fill('NO_MATCH_SYNTHETIC_CI_QUERY');
        assert.equal(await page.locator('#ai-cards .ai-card').count(),0);
        await page.locator('#ai-search').fill(prior);
        assert(await page.locator('#ai-cards .ai-card').count()>0);
        if(route.id==='ai-compare')assert(await page.locator('#ai-comparison .ai-matrix').isVisible());
        if(route.id==='ai-itsi')assert((await page.locator('#ai-cards').innerText()).includes('MCP Server 1.2.1+'));
        const provider=await page.locator('#ai-provider').inputValue(),region=await page.locator('#ai-region').inputValue();
        if(region==='all'){
          await page.locator('#ai-provider').selectOption('aws');await page.locator('#ai-region').selectOption('us-east-1');
          await page.locator('#ai-provider').selectOption('azure');
          assert.equal(await page.locator('#ai-region').inputValue(),'all');assert((await page.locator('#ai-context-feedback').innerText()).includes('cleared'));
          await page.locator('#ai-provider').selectOption(provider);
        }
      }
    }
    if(route.id.startsWith('prep11')) {
      assert(await page.locator('#prep11-title').isVisible());
      assert.equal(await page.locator('.site-nav a[aria-current="page"]').getAttribute('href'),theme==='cisco'?'/?view=splunk-11&theme=cisco':'?view=splunk-11');
      if(route.invalid) {
        assert(await page.locator('#prep11-warning').isVisible());
        assert(await page.locator('#prep11-content').isHidden());
        assert.equal(await page.locator('main>.prep11-report').count(),0);
        assert.equal(await page.evaluate(()=>location.search),new URL(url).search);
      } else {
        assert((await page.locator('#prep11-title').innerText()).includes('Prep for Splunk 11.x'));
        assert.equal(await page.locator('.prep11-question-grid .prep11-question').count(),6);
        const prior=await page.locator('#prep11-update-type').inputValue();
        await page.locator('#prep11-update-type').selectOption('announcement');
        assert((await page.locator('#prep11-update-list').innerText()).includes('No version-specific 11.x announcement'));
        await page.locator('#prep11-update-type').selectOption(prior);
        if(route.id==='prep11-shared')assert.equal(await page.locator('#prep11-count').innerText(),'1 of 5 preparation areas');
      }
    }
    const print = page.locator('#print-report, #edition-print').first();
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('theme-cisco')), theme === 'cisco');
    entry.screen = relative(path.join(directory, 'desktop.png')); await page.screenshot({path:path.join(output,entry.screen)});
    await page.setViewportSize({width:390,height:844});
    // Check the expanded content too, then restore the user's disclosure state.
    const disclosureState = await page.evaluate(() => [...document.querySelectorAll('main details')].filter(d=>!d.closest('#release-report,.edition-report')).map(d=>{const open=d.open;d.open=true;return open;}));
    await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
    const labelFailures=await productLabelFit(page);
    assert.equal(labelFailures.length,0,'Product label escapes padded tile '+id+': '+JSON.stringify(labelFailures));
    entry.productLabels={passed:true,check:'All visible product title/subtitle text fits inside its padded tile; no hidden overflow.'};
    const decisionLabels=await visibleDecisionLabels(page);
    if(decisionLabels.length) {
      assert.deepEqual(decisionLabels,['Hide details'],'Expanded decision summary must expose exactly one state label: '+id);
      entry.decisionSummaryLabel={passed:true,visible:decisionLabels};
      if(route.id==='enterprise') {
        const legacyDecision=await page.addStyleTag({content:'.decision-details>summary .decision-expand-label,.decision-details>summary .decision-collapse-label{display:inline!important}'});
        const before=await visibleDecisionLabels(page);
        await legacyDecision.evaluate(el=>el.remove());
        assert.deepEqual(before,['Expand details','Hide details'],'Legacy decision-label fixture did not reproduce the adjacent-label defect');
        assert.deepEqual(await visibleDecisionLabels(page),['Hide details'],'Decision labels did not recover after legacy fixture');
        entry.decisionSummaryLabel.legacyReplay={outcome:'reproduced',visible:before};
      }
    }
    if(route.id==='enterprise-102-security-notice') {
      // Replay the exact pre-repair sizing/nowrap declarations in real Chromium.
      // This is a rendered negative fixture, not a source-code string assertion.
      const legacy=await page.addStyleTag({content:'.product-options strong,.product-options small{min-width:auto!important;max-width:none!important;overflow-wrap:normal!important}.product-options strong{white-space:normal!important}.product-options small{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}'});
      const before=await productLabelFit(page);
      await legacy.evaluate(el=>el.remove());
      assert(before.length>0,'Legacy label fixture did not reproduce the actual padded-tile defect');
      assert.equal((await productLabelFit(page)).length,0,'Label layout did not recover after fixture');
      entry.productLabels.legacyReplay={outcome:'reproduced',violations:before};
    }
    const narrow = await checkLayout(page);
    if(narrow.scroll > narrow.width + 3 || narrow.overflow.length) {
      const outside = await page.evaluate(()=>[...document.querySelectorAll('body *')].map(el=>({tag:el.tagName,classes:el.className,text:el.textContent.slice(0,120),right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width,scroll:el.scrollWidth,client:el.clientWidth,visible:el.checkVisibility({visibilityProperty:true,opacityProperty:true}),overflow:getComputedStyle(el).overflowX})).filter(el=>el.width&&(el.right>document.documentElement.clientWidth+3||el.scroll>el.client+3)).slice(0,80));
      fs.writeFileSync(path.join(directory,'narrow-overflow.json'),JSON.stringify(outside,null,2));
      await page.screenshot({path:path.join(directory,'narrow-overflow.png'),fullPage:true});
      console.error('Overflow elements '+id+': '+JSON.stringify(outside));
    }
    fs.writeFileSync(path.join(directory,'narrow-layout.json'),JSON.stringify(narrow,null,2));
    await page.screenshot({path:path.join(directory,'narrow.png')});
    assert(narrow.scroll <= narrow.width + 3 && !narrow.overflow.length, 'Narrow overflow ' + id + ': ' + JSON.stringify(narrow));
    entry.narrow = {passed:true,viewport:{width:390,height:844},file:relative(path.join(directory,'narrow.png'))};
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
        // Tooltip prose is hidden in print; verify the heading and its explicit
        // printable annotation separately instead of demanding both copies.
        const headings = [...doc.querySelectorAll('h1,h2,h3')].map(h => {
          const title = h.cloneNode(true); title.querySelectorAll('.content-change').forEach(el=>el.remove());
          return title.textContent.trim();
        }).filter(Boolean);
        const printAnnotations = [...doc.querySelectorAll('.content-change-print')].map(el=>el.textContent.trim()).filter(Boolean);
        return { html, text: doc.body.textContent, headings, printAnnotations, revision: window.VersionCompassRevision.id };
      });
      if(route.id==='enterprise') expected.paginationPairs=[{heading:'Recommended action',following:'Match the exact package identifier to its release'}];
      if(route.id==='observability-october') expected.paginationPairs=[
        {heading:'Kubernetes persistent-volume metric defaults',following:'Chart 0.162.1 does not explicitly enable these five metrics'},
        {heading:'Kubernetes histogram bucket merging',following:'Earlier chart pipelines do not add transform/limit_histogram_buckets'}
      ];
      if(route.id==='hf-inherited-runtime') expected.paginationPairs=[{heading:'Embedded Node.js runtime · 10.2',following:'Apps that assume Node.js is supplied by the platform will no longer run.'}];
      if(route.id==='soar-cloud-86-export-fips') expected.paginationPairs=[{heading:'Requirements and integrations',following:'Automation runtime'}];
      const printTabs = await keyboardReach(page, print);
      const save = page.locator('.site-header [data-save-snapshot]').first();
      const saveTabs = await keyboardReach(page, save);
      entry.keyboard = { passed: true, printTabs, saveTabs, downloadActivation: 'Enter' };
      const downloadPromise = page.waitForEvent('download');
      await page.keyboard.press('Enter');
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
      if(expected.paginationPairs) {
        // Replay the pre-repair fragmentation in native Chromium, not a string fixture.
        const legacy=await page.addStyleTag({content:'.soar-view #release-report .soar-target-requirements{display:contents!important;break-inside:auto!important}.forwarders-view #release-report .forwarder-technical{break-inside:auto!important}.forwarders-view #release-report .forwarder-technical h4{break-after:auto!important}.release-report .technical-item-head,.release-report .technical-item h4,.release-report .technical-explanation strong{break-after:auto!important;page-break-after:auto!important}.release-report .technical-explanation p{break-inside:auto!important;page-break-inside:auto!important}'});
        const priorPdf=path.join(directory,'pre-repair.pdf');
        await page.pdf({path:priorPdf,format:'A4',printBackground:true,preferCSSPageSize:true});
        let priorText=execFileSync('pdftotext',['-raw',priorPdf,'-'],{encoding:'utf8'});
        const normalize=s=>s.replace(/\s+/g,'').toLowerCase();
        let failures=expected.paginationPairs.filter(pair=>!priorText.split('\f').some(p=>normalize(p).includes(normalize(pair.heading))&&normalize(p).includes(normalize(pair.following))));
        let replayMode='prior-css-native-layout';
        if(!failures.length) {
          // Release-note and source-register growth can move the same card away
          // from a natural page boundary. Keep the negative fixture executable:
          // place the exact following prose on the next native Chromium page,
          // then prove that the normal candidate PDF above keeps the pair intact.
          const pair=expected.paginationPairs[0], escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
          const boundaryPage=await context.newPage();
          await boundaryPage.setContent(`<!doctype html><meta charset="utf-8"><style>@page{size:A4;margin:18mm}body{font:14px system-ui}h4{margin:0}.following{break-before:page;page-break-before:always}</style><h4>${escape(pair.heading)}</h4><p class="following">${escape(pair.following)}</p>`);
          await boundaryPage.pdf({path:priorPdf,format:'A4',printBackground:true,preferCSSPageSize:true});
          await boundaryPage.close();
          priorText=execFileSync('pdftotext',['-raw',priorPdf,'-'],{encoding:'utf8'});
          failures=expected.paginationPairs.filter(pair=>!priorText.split('\f').some(p=>normalize(p).includes(normalize(pair.heading))&&normalize(p).includes(normalize(pair.following))));
          replayMode='forced-native-page-boundary';
        }
        await legacy.evaluate(el=>el.remove());
        fs.writeFileSync(path.join(directory,'pre-repair.txt'),priorText);
        assert(failures.length>0,'Pre-repair native PDF did not reproduce the orphan heading: '+id);
        entry.paginationRegression={passed:true,replayMode,oldNativePdf:relative(priorPdf),reproduced:failures,corrected:inspected.pagination};
      }
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
