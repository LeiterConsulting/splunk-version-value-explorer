/* Candidate-bound browser checks for the shared navigation and Ripple workspace. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
export async function verifyNavigation(browser, output, base='http://127.0.0.1:4173') {
  fs.mkdirSync(output,{recursive:true});
  const result={outcome:'passed',cases:[],screenshots:[]};
  for(const theme of ['default','cisco']) for(const width of [390,768,1220]) {
    const id=theme+'-'+width, context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true,reducedMotion:'reduce'});
    const page=await context.newPage(), errors=[];page.on('pageerror',error=>errors.push(error.message));
    if(base.includes('127.0.0.1'))await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
    const themed=route=>base+route+(theme==='cisco'?(route.includes('?')?'&':'?')+'theme=cisco':'');
    async function ready(){await page.waitForFunction(()=>typeof window.VersionCompassBuildSnapshot==='function'&&document.querySelector('.report-toolbar'));await page.evaluate(()=>document.fonts.ready);}
    async function openExplore(){if(width<=760&&!await page.locator('.explore-trigger').isVisible())await page.locator('.global-menu-toggle').click();if(await page.locator('#explore-destinations').isHidden())await page.locator('.explore-trigger').click();}
    async function fit(label){const bounds=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,header:document.querySelector('.site-header').getBoundingClientRect().toJSON(),bodyPad:getComputedStyle(document.body).paddingTop}));assert(bounds.scroll<=bounds.width+2,label+' page overflow: '+JSON.stringify(bounds));assert.equal(bounds.header.top,0,label+' masthead offset');assert.equal(bounds.bodyPad,'0px',label+' stale header padding');}
    async function shot(name){const file=id+'-'+name+'.png';await page.screenshot({path:path.join(output,file)});result.screenshots.push(file);}
    try {
      await page.goto(themed('/?product=es&platform=enterprise&host=10.4&from=8.0&to=8.1'));await ready();await fit('VC');
      assert.equal(await page.locator('[data-destination="advisor"]').getAttribute('href'),'/?view=advisor'+(theme==='cisco'?'&theme=cisco':''));assert.equal(await page.locator('[data-destination="advisor"] .nav-status').innerText(),'Work in progress');
      for(let cycle=0;cycle<3;cycle++) {await openExplore();assert(await page.locator('#explore-destinations').isVisible());await page.keyboard.press('Escape');assert(await page.locator('#explore-destinations').isHidden());assert(await page.locator(width<=760?'.global-menu-toggle':'.explore-trigger').evaluate(el=>el===document.activeElement));}
      await openExplore();await page.locator('.explore-trigger').press('ArrowDown');assert(await page.locator('[data-destination="release-guide"]').evaluate(el=>el===document.activeElement));await page.keyboard.press('End');assert(await page.locator('[data-destination="splunk-11"]').evaluate(el=>el===document.activeElement));await shot('explore');
      await page.locator('[data-destination="ai-availability"]').click();await ready();assert.equal(new URL(page.url()).searchParams.get('view'),'ai-availability');assert.equal(await page.locator('.report-toolbar-title').innerText(),'AI Availability');
      assert.equal(await page.locator('[data-destination="ai-availability"]').getAttribute('aria-current'),'page');
      await page.goBack();await ready();assert.equal(new URL(page.url()).searchParams.get('product'),'es');await page.goForward();await ready();assert.equal(new URL(page.url()).searchParams.get('view'),'ai-availability');
      await openExplore();await page.locator('[data-destination="es-editions"]').click();await ready();assert(await page.locator('#edition-title').isVisible());
      await openExplore();await page.locator('[data-destination="splunk-11"]').click();await ready();assert(await page.locator('#prep11-title').isVisible());
      await openExplore();await page.locator('[data-destination="release-guide"]').click();await ready();
      // Focus leaving a nonmodal disclosure closes it, without stealing focus.
      await openExplore();await page.locator('#copy-link').focus();assert(await page.locator('#explore-destinations').isHidden());assert(await page.locator('#copy-link').evaluate(el=>el===document.activeElement));
      if(width<=760)await page.locator('.global-menu-toggle').click();
      await page.locator('[data-destination="about"]').click();await page.locator('#about-title').waitFor();await fit('About');
      if(width<=760)await page.locator('.global-menu-toggle').click();await page.locator('[data-destination="ripple"]').click();await page.locator('.ripple-tools').waitFor();
      assert.equal(new URL(page.url()).pathname,'/ripple');assert.equal(new URL(page.url()).searchParams.get('theme'),theme==='cisco'?'cisco':null);assert.equal(await page.locator('[data-destination="ripple"]').getAttribute('aria-current'),'page');await fit('Ripple');await shot('ripple');
      const tools=page.getByRole('navigation',{name:'Ripple workspace'});
      await tools.getByRole('button',{name:/Investigations/}).click();assert.equal(new URL(page.url()).searchParams.get('view'),'investigations');await page.goBack();assert.equal(new URL(page.url()).searchParams.has('view'),false);await page.goForward();await page.getByRole('heading',{name:'Signals need a trail.'}).waitFor();
      await tools.getByRole('button',{name:'Cisco portfolio'}).click();await page.locator('.coverage-table').waitFor();
      await tools.getByRole('button',{name:'Sources & method'}).click();await page.locator('.source-register').waitFor();
      await tools.getByRole('button',{name:/Assessments/}).click();
      const search=page.getByRole('textbox',{name:'Search CVE, component or Cisco product'});await search.fill('NO_NAV_TEST_MATCH');assert(await page.getByRole('heading',{name:'No assessed match yet.'}).isVisible());await search.fill('');
      const watch=page.locator('.watch-button').first();await watch.click();await fit('Scrolled Ripple ledger');await shot('ripple-ledger');if(theme==='cisco'&&width>850)assert.equal(await page.locator('.ledger-header').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(32, 60, 72)');await tools.getByRole('button',{name:/My watchlist/}).click();assert(await page.getByRole('heading',{name:'Your watchlist'}).isVisible());assert(await page.locator('.ledger-row').count()>0);
      await tools.getByRole('button',{name:/Assessments/}).click();const [research]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export research'}).click()]);await research.saveAs(path.join(output,id+'-ripple-research.json'));const exported=JSON.parse(fs.readFileSync(path.join(output,id+'-ripple-research.json')));assert(exported.records.length>0);assert(!Object.hasOwn(exported,'selections'));assert(!Object.hasOwn(exported,'watch'));
      await page.locator('a[href="/ripple/updates"]').click();await page.locator('#updates-title').waitFor();await fit('Ripple updates');await shot('ripple-updates');
      await page.goto(themed('/ripple?assessment=http2-iosxe'));await page.locator('.evidence-panel').waitFor();assert(await page.locator('.evidence-panel').innerText());
      const before=page.url();await page.emulateMedia({media:'print'});assert(await page.locator('.site-header').isHidden());assert(await page.locator('.ripple-tools').isHidden());await page.pdf({path:path.join(output,id+'-ripple.pdf'),format:'A4',printBackground:true});await page.emulateMedia({media:'screen'});assert.equal(page.url(),before);
      await page.goto(themed('/?platform=enterprise&from=9.4&to=10.6'));await ready();const save=page.locator('.report-toolbar [data-save-snapshot]');assert(await save.isEnabled(),'Valid snapshot action disabled');const [snapshot]=await Promise.all([page.waitForEvent('download'),save.click()]);await snapshot.saveAs(path.join(output,id+'-snapshot.html'));
      await page.locator('.report-navigator button[data-target="technical-title"]').click();await page.waitForFunction(()=>{const top=document.getElementById('technical-title').getBoundingClientRect().top,edge=document.querySelector('.report-navigator').getBoundingClientRect().bottom;return top>=edge-3&&top<=edge+45;});
      assert.deepEqual(errors,[]);result.cases.push({id,passed:true});
    } catch(error) {await page.screenshot({path:path.join(output,id+'-failure.png'),fullPage:true});throw new Error(id+': '+error.stack);}
    finally {await context.close();}
  }
  fs.writeFileSync(path.join(output,'navigation.json'),JSON.stringify(result,null,2)+'\n');return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const browser=await chromium.launch();try{console.log(JSON.stringify(await verifyNavigation(browser,path.resolve(process.argv[3]||'navigation-artifacts'),process.argv[2]||'http://127.0.0.1:4173')));}finally{await browser.close();}
}
