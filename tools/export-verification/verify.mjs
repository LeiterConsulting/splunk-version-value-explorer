/* Dedicated application CI, independent of the managed interactive browser. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { verifyNavigation } from './navigation.mjs';
import { verifyRippleScroll } from './ripple-scroll.mjs';
import { verifyAdvisor, configureAdvisorRoute, setAdvisorFixtureTime } from './advisor.mjs';
import { prepareReadOnlyTools, soarReadOnlyRecord, esMaintenanceRoute, regulatedS3Route, verifyExact } from './exact-releases.mjs';
import { verifyPrep11Oversized } from './prep11-print.mjs';
import { verifyAdvisorOversized } from './advisor-print.mjs';
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
const marketplaceCases = {'es-hybrid-moderate':'es-fr-m-offering','itsi-fedramp-moderate':'itsi-fr-m-offering'};
const marketplaceScope = 'reports no certified services attested in the package JSON';
const cloudPatchCases = {
  'cloud-105-patch': { build: '10.5.2605.17', claimDate: '2026-11-13', details: ['SPL-313132','SPL-320054','one High and one Medium'] },
  'cloud-104-patch': { build: '10.4.2604.18', claimDate: '2026-11-12' },
  'cloud': { build: '10.6.2.4', claimDate: '2026-11-13', details: ['SPL-320966','SPL-320991','two High and one Medium'] },
  'cloud-107': { build: '10.7.0.6', claimDate: '2026-11-13', details: ['SPL-320989','SPL-320210','three Medium'] }
};
function paginationFailures(content,pairs) {
  const script='import sys,json\nsys.path.insert(0,"tools/export-verification")\nfrom pagination import inspect\ndata=json.load(sys.stdin)\nfailures=[]\nfor pair in data["pairs"]:\n try:\n  inspect(data["content"],[pair])\n except AssertionError:\n  failures.append(pair)\nprint(json.dumps(failures))\n';
  return JSON.parse(execFileSync('python3',['-B','-c',script],{input:JSON.stringify({content,pairs}),encoding:'utf8'}));
}
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
  receipt.navigation = await verifyNavigation(browser,path.join(output,'navigation'));
  receipt.rippleScroll = await verifyRippleScroll(browser,path.join(output,'ripple-scroll'));
  receipt.advisor = await verifyAdvisor(browser,path.join(output,'advisor'));
  const routes = JSON.parse(fs.readFileSync('tools/export-verification/routes.json'));
  for (const route of routes) for (const theme of ['default', 'cisco']) {
    const id = route.id + '-' + theme, directory = path.join(output, id); fs.mkdirSync(directory);
    const entry = { id, outcome: 'failed' }; receipt.cases.push(entry);
    const context = await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
    await prepareReadOnlyTools(context,route);
    try {
    const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
    if (route.id.startsWith('advisor')) await setAdvisorFixtureTime(page);
    // Restrict application CI to its own local Worker; no external source or customer requests.
    await context.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    const routeUrl = new URL('http://127.0.0.1:4173/?' + route.query);
    if (theme === 'cisco') routeUrl.searchParams.set('theme','cisco');
    const url = routeUrl.href;
    if(route.id==='ai-overview') {
      await page.goto('http://127.0.0.1:4173/'+(theme==='cisco'?'?theme=cisco':'')); await settled(page);
      await page.locator('.explore-trigger').click(); await page.locator('.site-nav a').filter({hasText:'AI Availability'}).click(); await settled(page);
      assert.equal(new URL(page.url()).searchParams.has('perspective'),false,'Release perspective leaked into AI navigation');
      assert(await page.locator('#ai-selection').isVisible(),'Main-page AI navigation did not load a usable view');
      entry.mainNavigation={passed:true};
    }
    await page.goto(url); await settled(page);
    await configureAdvisorRoute(page,route);
    await verifyExact(page,route,theme);
    if(route.id==='forwarder-invalid-enterprise-107'){
      assert.equal(new URL(page.url()).searchParams.get('receiver'),'10.7');
      assert(await page.locator('#forwarder-warnings').isVisible());
      assert(await page.locator('#results').isHidden());
      assert(await page.evaluate(()=>{try{window.VersionCompassBuildSnapshot();return false;}catch{return true;}}));
      entry.selectionRecovery={passed:true,originalInputRetained:true,noSubstituteReport:true};
    }
    if(route.id.startsWith('forwarder-cloud-107')){
      await page.waitForFunction(()=>window.__reportTools?.compare_forwarder_routes);
      const result=await page.evaluate(()=>{
        const tool=window.__reportTools.compare_forwarder_routes;
        const state=window.VersionCompassForwarders.read(location.search).state, url=location.href;
        const {reports:[report],sources}=tool.execute({routes:[state]});
        const claim=report.claims.find(item=>item.source==='cloud107');
        return {claim,section:sources.cloud107.section,stable:location.href===url,readOnly:tool.annotations.readOnlyHint};
      });
      assert(result.stable&&result.readOnly&&result.claim,'Missing stable Cloud 10.7 read-only report');
      assert.equal(result.claim.status,route.id.endsWith('intermediate')?'not_established':'conditional');
      assert.match(result.section,/direct connection/);
      assert((await page.locator('.forwarder-compatibility').textContent()).includes(result.claim.detail),'Cloud 10.7 screen and tool disagree');
      entry.readOnlyReport={passed:true,browserHarness:true,stableSelection:true};
    }
    if(route.id==='forwarder-windows-2012-r2'){
      await page.waitForFunction(()=>window.__reportTools?.compare_forwarder_routes);
      const result=await page.evaluate(()=>{
        const tool=window.__reportTools.compare_forwarder_routes;
        const url=location.href, selection=window.VersionCompassForwarders.read(location.search).state;
        const {reports:[report]}=tool.execute({routes:[selection]});
        return {os:report.os,stable:location.href===url,readOnly:tool.annotations.readOnlyHint};
      });
      assert(result.stable&&result.readOnly);
      assert.equal(result.os.status,'unavailable');
      assert.equal(result.os.source,'os106');
      assert(await page.locator('.forwarder-compatibility .forwarder-fact').filter({hasText:'OS and architecture'}).locator('.status-unavailable').isVisible());
      assert((await page.locator('.forwarder-compatibility').textContent()).includes(result.os.detail));
      entry.readOnlyReport={passed:true,browserHarness:true,stableSelection:true};
    }
    const israelRoute=route.id.startsWith('cloud-107-aws-israel');
    const israelMatched=route.id==='cloud-107-aws-israel';
    const israelText=israelMatched?'new Victoria stacks':'No supporting record is established for this combination';
    if(israelRoute){
      await page.waitForFunction(()=>window.__reportTools?.versioncompass_get_current_report);
      const result=await page.evaluate(()=>{
        const tool=window.__reportTools.versioncompass_get_current_report, url=location.href;
        const environment=tool.execute({}).report?.environment;
        return {ids:environment?.records.map(row=>row.id),readOnly:tool.annotations.readOnlyHint,stable:location.href===url};
      });
      assert(result.readOnly&&result.stable,'Cloud Environment read-only report must preserve the link');
      assert.deepEqual(result.ids,israelMatched?['victoria-aws-israel']:[]);
      assert((await page.locator(israelMatched?'.env-record':'.env-selection + p + p').first().textContent()).includes(israelText));
      entry.readOnlyReport={passed:true,browserHarness:true,stableSelection:true};
    }
    if (regulatedS3Route(route)) {
      await page.waitForFunction(() => window.__reportTools?.versioncompass_get_current_report);
      const expectedId = route.id === 'cloud-fedramp-moderate' ? 's3-moderate' : 's3-high';
      const result = await page.evaluate(id => {
        const tool = window.__reportTools.versioncompass_get_current_report;
        const url = location.href;
        const record = tool.execute({}).report?.environment?.records.find(row => row.id === id);
        return {record, readOnly:tool.annotations.readOnlyHint, stable:location.href === url};
      }, expectedId);
      assert(result.readOnly && result.stable && result.record, 'Missing read-only regulated S3 record');
      assert.equal(result.record.availability, 'conflicting');
      assert.equal(result.record.authorization, 'not_established');
      const expectedSources = ['s3Regional106', 's3Guide106', expectedId === 's3-moderate' ? 's3ThirdParty106' : 's3AprilChange'];
      assert.deepEqual(result.record.sources, expectedSources);
      const card = page.locator('.env-record').filter({hasText:result.record.feature}).first();
      assert((await card.textContent()).includes(result.record.detail));
      for (const {url} of result.record.citations) {
        assert(await card.locator('a[href="' + url + '"]').count(), 'Screen report lost regulated S3 citation');
      }
      entry.readOnlyReport = {passed:true, browserHarness:true, stableSelection:true};
    }
    const marketplaceRecord=marketplaceCases[route.id];
    if(marketplaceRecord){
      await page.waitForFunction(()=>window.__reportTools?.versioncompass_get_current_report);
      const result=await page.evaluate(id=>{
        const tool=window.__reportTools.versioncompass_get_current_report, url=location.href;
        const record=tool.execute({}).report?.environment?.records.find(row=>row.id===id);
        return {record,readOnly:tool.annotations.readOnlyHint,stable:location.href===url};
      },marketplaceRecord);
      assert(result.readOnly&&result.stable&&result.record,'Missing scoped read-only Marketplace record');
      assert.equal(result.record.authorization,'not_established');
      assert(result.record.detail.includes(marketplaceScope));
      const card=page.locator('.env-record').filter({hasText:result.record.feature});
      assert((await card.first().textContent()).includes(result.record.detail));
      entry.readOnlyReport={passed:true,browserHarness:true,stableSelection:true};
    }
    const cloudPatch=cloudPatchCases[route.id];
    if(cloudPatch){
      const {build,claimDate}=cloudPatch;
      await page.waitForFunction(()=>window.__reportTools?.versioncompass_get_current_report);
      const result=await page.evaluate(version=>{
        const {versioncompass_get_current_report:current,versioncompass_compare_routes:compare}=window.__reportTools;
        const {product,platform,from,to}=window.VersionCompassPage.getSelection(), url=location.href;
        const component='Cloud '+version+' maintenance patch';
        return {readOnly:current.annotations.readOnlyHint&&compare.annotations.readOnlyHint,
          current:current.execute({}).report?.technicalChanges.find(row=>row.component===component),
          explicit:compare.execute({routes:[{product,platform,from,to}]}).reports?.[0]?.technicalChanges.find(row=>row.component===component),
          stable:location.href===url};
      },build);
      assert(result.readOnly&&result.stable&&result.current,'Missing read-only Cloud maintenance row');
      assert.deepEqual(result.explicit,result.current);
      assert.equal(result.current.source.endsWith('#'+build+'-0'),true);
      assert.equal(result.current.verified,claimDate);
      const card=page.locator('#technical-content .technical-item').filter({has:page.locator('h4').filter({hasText:result.current.component})});
      const context=await card.locator('.evidence-context').textContent();
      assert(context.includes('Claim last verified: '+result.current.verified),'Screen evidence lost the canonical claim date');
      entry.readOnlyReport={passed:true,browserHarness:true,stableSelection:true};
    }
    if(esMaintenanceRoute(route)){
      await page.waitForFunction(()=>window.__reportTools?.versioncompass_get_current_report);
      const result=await page.evaluate(()=>{
        const {versioncompass_get_current_report:current,versioncompass_compare_routes:compare}=window.__reportTools;
        const {product,platform,host,from,to}=window.VersionCompassPage.getSelection(), url=location.href;
        const component='ES 8.8 Mission Control migration window';
        const get=report=>report?.technicalChanges.find(item=>item.component===component);
        return {current:get(current.execute({}).report),explicit:get(compare.execute({routes:[{product,platform,host,from,to}]}).reports?.[0]),
          readOnly:current.annotations.readOnlyHint&&compare.annotations.readOnlyHint,stable:location.href===url};
      });
      assert(result.readOnly&&result.stable&&result.current,'Missing read-only ES upgrade timing');
      assert.deepEqual(result.explicit,result.current);
      assert.equal(result.current.verified,'2026-11-13');
      const card=page.locator('#technical-content .technical-item').filter({has:page.locator('h4').filter({hasText:result.current.component})});
      assert((await card.textContent()).includes(result.current.implication));
      entry.readOnlyReport={passed:true,browserHarness:true,stableSelection:true};
    }
    const recordId=soarReadOnlyRecord(route);
    if(recordId){
      await page.waitForFunction(()=>window.__reportTools?.versioncompass_get_current_report);
      const toolResult=await page.evaluate(id=>{
        const {versioncompass_get_current_report:current,versioncompass_compare_routes:compare}=window.__reportTools;
        const selection=window.VersionCompassPage.getSelection(), url=location.href;
        const selected=current.execute({}), explicit=compare.execute({routes:[selection]});
        return {readOnly:current.annotations.readOnlyHint&&compare.annotations.readOnlyHint,
          selected:selected.report?.technical.find(row=>row.id===id),
          explicit:explicit.reports?.[0]?.technical.find(row=>row.id===id), stable:location.href===url};
      },recordId);
      assert(toolResult.readOnly&&toolResult.stable&&toolResult.selected,'SOAR read-only report unavailable or changed the URL: '+recordId);
      assert.deepEqual(toolResult.explicit,toolResult.selected);
      assert((await page.locator('#soar-'+recordId).textContent()).includes(toolResult.selected.detail),'SOAR tool and page disagree: '+recordId);
      entry.readOnlyReport={passed:true,browserHarness:true,stableSelection:true};
    }
    if(routeUrl.hash) {
      assert.equal(new URL(page.url()).hash,routeUrl.hash,'Shared section anchor was discarded: '+id);
      assert(await page.locator(routeUrl.hash).count()>0,'Shared section anchor has no target: '+id);
      entry.sharedAnchor={passed:true,hash:routeUrl.hash};
    }
    if(route.id.startsWith('ai-')) {
      assert(await page.locator('#ai-title').isVisible());
      assert.equal(await page.locator('.site-nav a[aria-current="page"]').getAttribute('href'),theme==='cisco'?'/?view=ai-availability&theme=cisco':'/?view=ai-availability');
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
      assert.equal(await page.locator('.site-nav a[aria-current="page"]').getAttribute('href'),theme==='cisco'?'/?view=splunk-11&theme=cisco':'/?view=splunk-11');
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
    if(route.id==='editions'){
      const taxii=page.locator('#edition-conflicts .edition-conflict').filter({hasText:'Which TAXII protocol versions are supported?'});
      assert(await taxii.isVisible());
      assert((await taxii.textContent()).includes('The duplicate version leaves the current exact protocol list uncertain.'));
    }
    if(route.id.startsWith('editions-') && route.invalid) {
      assert(await page.getByRole('heading',{name:'Choose the intended history release',exact:true}).isVisible());
      assert.equal(await page.evaluate(()=>location.search),new URL(url).search);
      assert.equal(await page.locator('main>.edition-report').count(),0);
      assert(await page.locator('#edition-copy').isDisabled());
      assert(await page.locator('#edition-recover-open').isDisabled());
      assert(await page.evaluate(()=>{try{window.VersionCompassBuildSnapshot();return false;}catch(error){return /selection/.test(error.message);}}));
      entry.selectionRecovery={passed:true,originalInputRetained:true,noSubstituteReport:true};
      const contrast=await page.evaluate(()=>[...document.querySelectorAll('.edition-hero .edition-caution,.edition-hero .edition-qualification')].map(el=>{
        const css=getComputedStyle(el),rgb=value=>value.match(/[\d.]+/g).slice(0,3).map(Number),lum=values=>values.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0),a=lum(rgb(css.color)),b=lum(rgb(css.backgroundColor));return{ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),foreground:css.color,background:css.backgroundColor};
      }));
      assert(contrast.length===2&&contrast.every(c=>c.ratio>=4.5),'Recovery warning/original-link text must be readable: '+JSON.stringify(contrast));
      entry.selectionRecovery.contrast=contrast;
      if(route.id==='editions-history-environment-recovery') {
        await page.locator('#edition-recover-history').selectOption('8.7');
        await page.locator('#edition-recover-open').click();await settled(page);
        const preserved=await page.evaluate(()=>{const p=new URLSearchParams(location.search);return{providers:p.getAll('csp'),region:p.get('region'),compliance:p.get('compliance'),release:p.get('release')};});
        assert.deepEqual(preserved,{providers:['aws','azure'],region:'us-gov-east-1',compliance:'fr-h',release:'8.7'});
        assert(await page.evaluate(()=>{try{window.VersionCompassBuildSnapshot();return false;}catch(error){return /environment/.test(error.message);}}));
        entry.selectionRecovery.ambiguousEnvironmentRetained=true;
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
    if (route.invalid || route.exportsBlocked) {
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
        const paginationPairs=[], prep=doc.querySelector('.prep11-report'),advisor=doc.querySelector('.advisor-report');
        const occurrences=new WeakMap(),normalize=value=>value.replace(/\s+/g,'').toLowerCase();
        const pair=(heading,following)=>{
          if(!heading||!following)throw Error('Missing pagination fragment');
          // Bind the DOM occurrence; repeated titles in the source register
          // must never rescue an earlier split heading or citation.
          if(!occurrences.has(heading)) {
            const range=doc.createRange();range.selectNodeContents(doc.body);range.setEndBefore(heading);
            const before=normalize(range.toString()),needle=normalize(heading.textContent);
            if(!needle)throw Error('Empty pagination heading');
            let offset=0,count=1,found;
            while((found=before.indexOf(needle,offset))!==-1){count++;offset=found+needle.length;}
            occurrences.set(heading,count);
          }
          paginationPairs.push({heading:heading.textContent.trim(),following:following.textContent.trim(),headingOccurrence:occurrences.get(heading)});
        };
        let paginationCoverage;
        if(prep) {
          const data=window.VersionCompassPrep11.data(), records=[...prep.querySelectorAll('.prep11-record')], questions=[...prep.querySelectorAll('.prep11-question')], sources=[...prep.querySelectorAll('.prep11-sources li')];
          if(records.length!==data.baseline.length+data.announcements.length+(data.contextUpdates||[]).length||questions.length!==data.questions.length||sources.length!==data.sourceIds.length)throw Error('Prep11 pagination coverage is missing canonical records');
          for(const card of [...records,...questions]) {
            const title=card.querySelector('h3'),label=card.querySelector('.prep11-label');
            if(label)pair(label,title);
            for(const paragraph of card.querySelectorAll('p'))if(paragraph!==label)pair(title,paragraph);
          }
          for(const source of sources) {
            const group=source.querySelector(':scope > .prep11-source-entry');
            if(!group)throw Error('Prep11 citation has no block containment group');
            pair(group.querySelector('strong'),group.querySelector('a'));
            pair(group.querySelector('strong'),group.querySelector('p'));
          }
          const sections=[...prep.querySelectorAll('.report-section')];
          for(const section of sections) {
            const lead=section.querySelector(':scope > .prep11-section-lead'),title=lead?.querySelector('h2');
            if(!title)throw Error('Prep11 section heading has no containment lead');
            const following=[...lead.querySelectorAll('h3,p,li')];
            if(!following.length)throw Error('Prep11 section heading has no following content');
            for(const fragment of following)pair(title,fragment);
          }
          paginationCoverage={records:records.length,questions:questions.length,sources:sources.length,sections:sections.length,pairs:paginationPairs.length};
        }
        let advisorPaginationCoverage;
        if(advisor) {
          const leads=[...advisor.querySelectorAll('.advisor-section-lead')],briefs=[...advisor.querySelectorAll('.advisor-brief-section')],sources=[...advisor.querySelectorAll('.advisor-source-list li')];
          if(leads.length!==4)throw Error('Advisor report lost a section containment lead');
          for(const lead of leads) {
            const title=lead.querySelector('h2');
            for(const fragment of lead.querySelectorAll('p,li'))pair(title,fragment);
          }
          for(const brief of briefs) {
            const title=brief.querySelector('h3'),first=brief.querySelector('p,li strong');
            pair(title,first);
            const table=brief.querySelector('table');
            if(table){
              const label=brief.querySelector('.advisor-table-caption');
              if(!label||doc.getElementById(table.getAttribute('aria-labelledby'))!==label)throw Error('Advisor printed table lost its accessible label');
              pair(title,label);pair(title,table.querySelector('tbody th'));
            }
          }
          for(const item of advisor.querySelectorAll('.advisor-result li')) {
            const title=item.querySelector('strong,h4');
            if(title)for(const paragraph of item.querySelectorAll('p'))pair(title,paragraph);
          }
          for(const source of sources) {
            const group=source.querySelector(':scope > .advisor-source-entry');
            if(!group)throw Error('Advisor source lost block containment');
            const title=group.querySelector('h3');pair(title,group.querySelector('a'));
            for(const paragraph of group.querySelectorAll('p'))pair(title,paragraph);
          }
          advisorPaginationCoverage={sections:leads.length,briefs:briefs.length,sources:sources.length,pairs:paginationPairs.length};
        }
        return { html, text: doc.body.textContent, headings, printAnnotations, revision: window.VersionCompassRevision.id,
          ...(prep?{paginationPairs,paginationKind:'prep11-containment',paginationCoverage}:{}),
          ...(advisor?{paginationPairs,paginationKind:'advisor-containment',advisorPaginationCoverage}:{}) };
      });
      if(cloudPatch){
        const {build,claimDate}=cloudPatch;
        for(const text of ['Cloud '+build+' maintenance patch','selected-stack rollout','preliminary'])
          assert(normalize(expected.text).includes(text),'Missing scoped Cloud maintenance export evidence');
        expected.requiredText=['Claim last verified: '+claimDate];
        if(cloudPatch.details) expected.requiredText.push(...cloudPatch.details,'customer-managed Enterprise or Forwarder package applicability remain unestablished');
        if(build==='10.4.2604.18') expected.requiredText.push('SPL-314840','SPL-316497','SPL-316559','customer-managed Enterprise or Forwarder package applicability unestablished');
      }
      if(israelRoute) {
        expected.requiredText=['Israel (Tel Aviv)',israelText];
        if(israelMatched) expected.requiredText.push('Victoria Experience > AWS > Middle East (Israel)','AWS Israel addition for relevant Cloud 10.7 versions','Service endpoints > Israel (Tel Aviv) and il-central-1');
      }
      if(regulatedS3Route(route)) {
        expected.requiredText=['Cloud 10.6 Amazon S3 federated search product restrictions','The Cloud 10.6 product guide excludes FedRAMP Moderate, FedRAMP High, and DoD IL5 deployments.'];
        if(route.id!=='cloud-fedramp-moderate') expected.requiredText.push('The April 8 change log lists High and IL5 in both GovCloud regions for relevant Cloud 10.3 versions.');
      }
      if(route.id==='cloud-107-fedramp-high') {
        for(const qualification of ['Cloud 10.7 Service Details lists Edge Processor for FedRAMP High','Cloud 10.7 Service Details lists Ingest Processor for FedRAMP High','The 10.6 table lists Moderate only','Essentials tier']) assert(normalize(expected.text).includes(qualification), 'High processor qualification missing: '+qualification);
      }
      if(marketplaceRecord) expected.requiredText=[marketplaceScope,'Current named component scope remains unresolved'];
      if(route.id==='soar-cloud-fedramp-moderate') {
        for(const qualification of ['November 6 Moderate Marketplace list named SOAR','Certified Services displayed N/A',marketplaceScope,'native-data migration limits']) assert(normalize(expected.text).includes(qualification), 'Moderate SOAR qualification missing: '+qualification);
      }
      if(route.id==='soar-cloud-88') {
        for(const qualification of ['SOAR Export 8.8.0 functionality-tested combinations','CIM 8.5.0-1681','for upgrade listing purposes']) assert(normalize(expected.text).includes(qualification), 'SOAR Export qualification missing: '+qualification);
      }
      if(['soar','soar-cloud','soar-legacy-cloud'].includes(route.id)){
        for(const qualification of ['Automation Broker 8.7.0.245 distribution','October 9, 2026 through Docker Hub only','no tested compatibility matrix or security remediation claim']) assert(normalize(expected.text).includes(qualification), 'SOAR Broker qualification missing: '+qualification);
      }
      if(route.id==='forwarder-windows-2012-r2') assert(normalize(expected.text).includes('The Splunk 10.6 Windows package matrix omits Windows Server 2012 R2.'),'Windows target-package qualification missing from export');
      if (route.id === 'editions' || route.id === 'ai-es-premier-triage-note') {
        assert(normalize(expected.text).includes('the Response agent cannot rerun or process findings added after it has already processed the investigation'), 'The exact ES 8.8 Response limitation is missing from export');
      }
      if(route.id==='editions'){
        for(const text of ['Which TAXII protocol versions are supported?','The duplicate version leaves the current exact protocol list uncertain.','TIM Cloud TAXII2 sources','same page names TAXII 1.0 and 1.1'])assert(normalize(expected.text).includes(text),'Missing scoped TAXII report evidence');
        expected.paginationPairs=[{heading:'Which TAXII protocol versions are supported?',following:'Decision affected: Native TAXII feed protocol versions',headingOccurrence:1}];
      }
      if(route.id==='hf-hybrid') assert(normalize(expected.text).includes('disabling it may break scheduled dashboard exports'),'Heavy Forwarder mitigation qualification missing');
      if(esMaintenanceRoute(route)) {
        expected.requiredText=['ES 8.8 Mission Control migration window','If Platform 10.6 or later is already installed','five additional minutes per GB','after ES 8.8, the guide says this migration runs in the background','on-premises search-head upgrade guide','Splunk coordinates managed Cloud upgrades.'];
        for(const phrase of expected.requiredText) assert(normalize(expected.text).includes(phrase),'Missing ES upgrade timing qualification: '+phrase);
      }
      if(route.id==='enterprise') expected.paginationPairs=[{heading:'Recommended action',following:'Match the exact package identifier to its release'}];
      if(route.id==='observability-october') expected.paginationPairs=[
        {heading:'Kubernetes persistent-volume metric defaults',following:'Chart 0.162.1 does not explicitly enable these five metrics'},
        {heading:'Kubernetes histogram bucket merging',following:'Earlier chart pipelines do not add transform/limit_histogram_buckets'}
      ];
      const tlsGuideSelector = 'a[href$="/configure-tls-protocol-version-support-for-secure-connections-between-splunk-platform-instances"]';
      if(route.id==='hf-inherited-runtime') {
        expected.paginationPairs=[{heading:'Embedded Node.js runtime · 10.2',following:'Apps that assume Node.js is supplied by the platform will no longer run.'}];
        expected.requiredText=['The versioned 10.6 TLS configuration guide still documents the earlier switch.','Validate TLS 1.2 or 1.3','Configuration guide'];
        assert.equal(await page.locator('.forwarder-technical '+tlsGuideSelector).count(),1);
      }
      if(route.id==='soar-cloud-86-export-fips') expected.paginationPairs=[{heading:'Requirements and integrations',following:'Automation runtime'}];
      const printTabs = await keyboardReach(page, print);
      const save = page.locator('.report-toolbar [data-save-snapshot]').first();
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
      if(route.id==='hf-inherited-runtime') assert.equal(await reopened.locator('.forwarder-technical '+tlsGuideSelector).count(),1);
      const citationFailures=await reopened.evaluate(()=>[...document.querySelectorAll('a[href^="#ai-ref-"]')].filter(a=>a.textContent.trim()==='[0]'||!document.getElementById(a.getAttribute('href').slice(1))).map(a=>({label:a.textContent,href:a.getAttribute('href')})));
      assert.deepEqual(citationFailures,[], 'Downloaded AI report has an unnumbered or missing source target');
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
      if(expected.paginationCoverage)entry.prep11PaginationCoverage={...expected.paginationCoverage,passed:true};
      if(expected.advisorPaginationCoverage)entry.advisorPaginationCoverage={...expected.advisorPaginationCoverage,passed:true};
      if(expected.paginationPairs) {
        // Prep11's negative is a controlled Chromium fragmentation fixture with
        // containment disabled. It is not a new Safari capture or a WebKit pass.
        const prep11=expected.paginationKind==='prep11-containment',advisor=expected.paginationKind==='advisor-containment';
        const legacy=await page.addStyleTag({content:'.soar-view #release-report .soar-target-requirements{display:contents!important;break-inside:auto!important}.forwarders-view #release-report .forwarder-technical{break-inside:auto!important}.forwarders-view #release-report .forwarder-technical h4{break-after:auto!important}.release-report .technical-item-head,.release-report .technical-item h4,.release-report .technical-explanation strong{break-after:auto!important;page-break-after:auto!important}.release-report .technical-explanation p{break-inside:auto!important;page-break-inside:auto!important}'+(prep11?'.prep11-report .prep11-record,.prep11-report .prep11-question,.prep11-report .prep11-sources li{break-inside:auto!important;page-break-inside:auto!important}.prep11-report .prep11-record-lead,.prep11-report .prep11-question-lead,.prep11-report .prep11-source-entry{display:contents!important;break-inside:auto!important;page-break-inside:auto!important}.prep11-report .prep11-label,.prep11-report h3{break-after:auto!important;page-break-after:auto!important}':'')});
        const advisorLegacy=advisor?await page.addStyleTag({content:'.advisor-report .advisor-section-lead,.advisor-report .advisor-source-entry{display:contents!important}.advisor-report .advisor-section-lead,.advisor-report .advisor-brief-section,.advisor-report .advisor-result li,.advisor-report .advisor-source-entry{break-inside:auto!important;page-break-inside:auto!important}.advisor-report .advisor-table-scroll{display:block!important}'}):null;
        const priorPdf=path.join(directory,'pre-repair.pdf');
        await page.pdf({path:priorPdf,format:'A4',printBackground:true,preferCSSPageSize:true});
        let priorText=execFileSync('pdftotext',['-raw',priorPdf,'-'],{encoding:'utf8'});
        let failures=paginationFailures(priorText,expected.paginationPairs);
        let replayMode='prior-css-native-layout';
        if(prep11)replayMode='controlled-no-containment-native-layout';
        if(advisor)replayMode='controlled-no-advisor-containment-native-layout';
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
          failures=paginationFailures(priorText,expected.paginationPairs);
          replayMode='forced-native-page-boundary';
        }
        await legacy.evaluate(el=>el.remove());
        if(advisorLegacy)await advisorLegacy.evaluate(el=>el.remove());
        fs.writeFileSync(path.join(directory,'pre-repair.txt'),priorText);
        assert(failures.length>0,'Pre-repair native PDF did not reproduce the orphan heading: '+id);
        entry.paginationRegression={passed:true,replayMode,
          ...(prep11?{negativeNativePdf:relative(priorPdf),qualification:'Controlled Chromium negative fixture; the retained Safari text is tested separately. Native Safari candidate capture remains unverified.'}:{oldNativePdf:relative(priorPdf)}),
          reproduced:failures,corrected:inspected.pagination};
      }
      const restored = await page.evaluate(() => ({url:location.href,details:[...document.querySelectorAll('main details')].filter(d=>!d.closest('#release-report,.edition-report')).map(d=>[d.id,d.open])}));
      assert.deepEqual(restored,baseline,'Print/export changed the selected report or disclosure state');
      if(route.id==='prep11')entry.prep11Oversized=await verifyPrep11Oversized(page,context,path.join(directory,'oversized'),theme,expected.revision,output);
      if(route.id==='advisor-agent-known')entry.advisorOversized=await verifyAdvisorOversized(page,context,path.join(directory,'oversized'),theme,expected.revision,output);
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
