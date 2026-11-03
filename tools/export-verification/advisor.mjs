import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

export async function configureAdvisorRoute(page,route){
  if(!route.id.startsWith('advisor')||route.invalid||route.exportsBlocked)return;
  const fixtures={
    'advisor-prerequisites':{itsiVersion:'5.0.0',saiaVersion:'2.2.0',mcpVersion:'1.2.1'},
    'advisor-conflict':{deployment:'cloud',compliance:'commercial',edition:'premier',platformVersion:'10.4',esVersion:'8.8',access:'yes'},
    'advisor-agent-gap':{deployment:'enterprise',compliance:'commercial',platformVersion:'9.4',region:'unknown',access:'unknown'},
    'advisor-agent-known':{deployment:'enterprise',compliance:'commercial',platformVersion:'10.4',saiaVersion:'2.3.6',region:'us-east-1',access:'yes'},
    'advisor-agent-azure':{deployment:'enterprise',compliance:'commercial',platformVersion:'10.4',saiaVersion:'2.3.6',region:'azure-ai-us-east',access:'yes'},
    'advisor-agent-dubai':{deployment:'enterprise',compliance:'commercial',platformVersion:'10.4',saiaVersion:'2.3.6',region:'me-central-1',access:'yes'},
    'advisor-agent-dublin':{deployment:'cloud',compliance:'commercial',platformVersion:'10.4',saiaVersion:'2.3.6',region:'eu-west-1',access:'yes'},
    'advisor-agent-cloud-known':{deployment:'cloud',compliance:'commercial',platformVersion:'10.4',region:'us-east-1',access:'yes'},
    'advisor-agent-fallback':{deployment:'enterprise',compliance:'commercial',platformVersion:'10.4',saiaVersion:'2.1.1',region:'us-east-1',access:'yes'},
    'advisor-agent-app-gap':{deployment:'enterprise',compliance:'commercial',platformVersion:'10.4',saiaVersion:'2.0.0',region:'us-east-1',access:'yes'},
    'advisor-agent-cloud-gap':{deployment:'cloud',compliance:'commercial',platformVersion:'10.0',region:'us-east-1',access:'yes'},
    'advisor-agent-regulated':{deployment:'enterprise',compliance:'fr-h',platformVersion:'10.4',region:'us-east-1',access:'yes'},
    'advisor-es-cmp':{deployment:'enterprise',compliance:'commercial',edition:'premier',platformVersion:'10.4',esVersion:'8.8',cloudConnectVersion:'2.0',access:'yes'}
  };
  for(const [field,value]of Object.entries(fixtures[route.id]||{})){const control=page.locator('#advisor-'+field);if((await control.evaluate(el=>el.tagName))==='SELECT')await control.selectOption(value);else await control.fill(value);}
  if(route.id==='advisor-evidence-changed')await page.evaluate(()=>{window.SPLUNK_DATA.guidance.aiAvailability.capabilities.find(row=>row.id==='ai-itsi-subagent').requirements[0]='UNASSESSED_CI_CHANGE_DO_NOT_PUBLISH';});
  await page.locator('#advisor-build').click();
  const outcomes={'advisor-prerequisites':'no_change','advisor-conflict':'conflicting','advisor-agent-gap':'conflicting','advisor-agent-known':'conflicting','advisor-agent-azure':'not_established','advisor-agent-dubai':'not_established','advisor-agent-dublin':'conditional','advisor-agent-cloud-known':'conditional','advisor-agent-fallback':'conflicting','advisor-agent-app-gap':'version_gap','advisor-agent-cloud-gap':'version_gap','advisor-agent-regulated':'not_established','advisor-es-cmp':'conditional','advisor-unknown':'needs_facts','advisor-evidence-changed':'needs_review'};
  if(outcomes[route.id])assert.equal(await page.locator('#advisor-result .advisor-result').getAttribute('data-outcome'),outcomes[route.id]);
}

export async function verifyAdvisor(browser,output,base='http://127.0.0.1:4173'){
  fs.mkdirSync(output,{recursive:true});const receipt={outcome:'passed',cases:[]};
  for(const theme of ['default','cisco'])for(const width of [390,768,1220]){
    const id=theme+'-'+width,context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[],requests=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>requests.push({url:request.url(),navigation:request.isNavigationRequest()}));
    if(base.includes('127.0.0.1'))await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
    await context.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__advisorCopiedLink=text;}}});});
    const themed=route=>base+route+(theme==='cisco'?(route.includes('?')?'&':'?')+'theme=cisco':'');
    const result=()=>page.locator('#advisor-result .advisor-result');
    async function choose(goal){await page.locator('[data-advisor-goal="'+goal+'"]').click();}
    async function build(){await page.locator('#advisor-build').click();await result().waitFor();}
    async function fit(){const bounds=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));assert(bounds.scroll<=bounds.width+2,'Page overflow: '+JSON.stringify(bounds));}
    try{
      await page.goto(themed('/'));await page.locator('.report-toolbar').waitFor();
      if(width<=760)await page.locator('.global-menu-toggle').click();
      await page.locator('[data-destination="advisor"]').click();await page.locator('#advisor-decisions').waitFor();await page.locator('.report-toolbar').waitFor();
      assert.equal(await page.locator('[data-advisor-goal]').count(),3);
      assert.equal(await result().count(),0);assert(await page.locator('#print-report').isDisabled());assert(await page.locator('[data-save-snapshot]').isDisabled());
      assert.match(await page.locator('#advisor-brief-status').innerText(),/Choose a covered decision/);
      await fit();await page.screenshot({path:path.join(output,id+'-landing.png'),fullPage:true});
      const first=page.locator('[data-advisor-goal="agent-mode"]');await first.focus();await page.keyboard.press('Enter');
      assert.equal(await first.getAttribute('aria-pressed'),'true');
      for(const [field,value]of [['deployment','enterprise'],['compliance','commercial']])await page.locator('#advisor-'+field).selectOption(value);
      await page.locator('#advisor-platformVersion').fill('9.4');await build();
      assert.equal(await result().getAttribute('data-outcome'),'conflicting');
      assert.match(await result().innerText(),/Missing facts about your environment/);assert.match(await result().innerText(),/Missing or limited assessed evidence/);
      assert.match(await result().innerText(),/not a recommended target/);
      await page.locator('#copy-link').click();const copied=await page.evaluate(()=>window.__advisorCopiedLink);assert.equal(new URL(copied).searchParams.get('platformVersion'),null);assert.equal(new URL(copied).searchParams.get('goal'),'agent-mode');assert(!copied.includes('9.4'));
      await page.locator('#advisor-save').click();assert.match(await page.locator('#advisor-profile-status').innerText(),/saved/);
      const downloadPromise=page.waitForEvent('download');await page.locator('[data-save-snapshot]').click();const download=await downloadPromise;await download.saveAs(path.join(output,id+'-brief.html'));
      const html=fs.readFileSync(path.join(output,id+'-brief.html'),'utf8');assert(html.includes('9.4')&&html.includes('Self-reported context')&&html.includes('Source checked 2026-10-23'));assert(!/<script\b/i.test(html));
      await page.screenshot({path:path.join(output,id+'-gap.png')});
      await page.locator('#advisor-platformVersion').fill('10.4');assert(await page.locator('#print-report').isDisabled());assert(await page.locator('[data-save-snapshot]').isDisabled());assert.equal(await result().count(),0);
      await choose('itsi-versions');assert.equal(await page.locator('#advisor-context-fields input').count(),3);assert.equal(await page.locator('#advisor-region').count(),0);
      for(const [field,value]of [['itsiVersion','5.0.0'],['saiaVersion','2.2.0'],['mcpVersion','1.2.1']])await page.locator('#advisor-'+field).fill(value);
      await build();assert.equal(await result().getAttribute('data-outcome'),'no_change');assert.match(await result().innerText(),/regional rollout/);
      await choose('soc-workflow');for(const [field,value]of [['deployment','cloud'],['compliance','commercial'],['edition','premier']])await page.locator('#advisor-'+field).selectOption(value);
      await page.locator('#advisor-platformVersion').fill('10.4');await page.locator('#advisor-esVersion').fill('8.8');await page.locator('#advisor-access').selectOption('yes');await build();assert.equal(await result().getAttribute('data-outcome'),'conflicting');
      assert.match(await result().innerText(),/current ES 8.8 workflow task guide/);
      await page.locator('#advisor-result').getByText('Historical wording already corrected',{exact:true}).click();assert.match(await result().innerText(),/earlier Essentials wording is historical/);
      await page.locator('.report-navigator button[data-target="advisor-results"]').click();
      const offset=await page.evaluate(()=>({top:document.getElementById('advisor-results').getBoundingClientRect().top,edge:document.querySelector('.report-navigator').getBoundingClientRect().bottom}));assert(offset.top>=offset.edge-2,'Brief hidden under sticky chrome');
      await fit();await page.screenshot({path:path.join(output,id+'-conflict.png'),fullPage:true});
      await page.goBack();assert.equal(new URL(page.url()).searchParams.get('goal'),'itsi-versions');assert.equal(await result().count(),0);await page.goForward();assert.equal(new URL(page.url()).searchParams.get('goal'),'soc-workflow');
      await page.locator('#advisor-load').click();assert.equal(await page.locator('#advisor-platformVersion').inputValue(),'9.4');assert.equal(await result().count(),0);
      await build();const requestStart=requests.length;await page.locator('[data-advisor-guide]').click();await page.locator('.advisor-guide-context').waitFor();await page.locator('.report-toolbar').waitFor();
      const handoffRequest=requests.slice(requestStart).find(row=>row.navigation);assert(handoffRequest);assert.equal(new URL(handoffRequest.url).searchParams.get('from'),null);assert.equal(new URL(handoffRequest.url).searchParams.get('to'),null);assert.equal(new URL(handoffRequest.url).searchParams.get('platformVersion'),null);
      assert.match(await page.locator('.advisor-guide-context').innerText(),/Enterprise 9.4/);assert.match(await page.locator('.advisor-guide-context').innerText(),/not an Advisor recommendation/);
      assert.match(await page.locator('.advisor-guide-context').innerText(),/does not establish Agent Mode availability or resolve current Cloud Connected app restrictions/);
      assert.equal(await page.evaluate(()=>sessionStorage.getItem('versioncompass-advisor-handoff-v1')),null);
      await page.reload();assert.equal(await page.locator('.advisor-guide-context').count(),0);
      if(width===390){
        await page.evaluate(()=>{const now=Date.now();sessionStorage.setItem('versioncompass-advisor-handoff-v1',JSON.stringify({schemaVersion:1,goal:'agent-mode',reportedVersion:['9.4'],releaseLine:'9.4',documentedMinimum:'10.1.x+',createdAt:new Date(now).toISOString(),expiresAt:new Date(now+600000).toISOString()}));});await page.reload();await page.locator('.report-toolbar').waitFor();assert.equal(await page.locator('.advisor-guide-context').count(),0);
        await page.evaluate(()=>{const now=Date.now();sessionStorage.setItem('versioncompass-advisor-handoff-v1',JSON.stringify({schemaVersion:1,goal:'agent-mode',reportedVersion:'9.4',releaseLine:'9.4',documentedMinimum:'10.1.x+',createdAt:new Date(now-601000).toISOString(),expiresAt:new Date(now-1000).toISOString()}));});await page.reload();await page.locator('.report-toolbar').waitFor();assert.equal(await page.locator('.advisor-guide-context').count(),0);
      }
      for(const goal of ['itsi-assistant','ingest-pressure','stay']){await page.goto(themed('/?view=advisor&goal='+goal));await page.locator('#advisor-legacy').waitFor();assert.equal(await result().count(),0);assert(await page.locator('#print-report').isDisabled());}
      if(width===390){await page.evaluate(()=>localStorage.setItem('versioncompass-advisor-profile-v1',JSON.stringify({schemaVersion:1,profile:{goal:'itsi-assistant',itsiVersion:'5.0',saiaVersion:'2.2',mcpVersion:'1.2.1'}})));await page.goto(themed('/?view=advisor'));await page.locator('.advisor-resume').click();await page.locator('#advisor-legacy').waitFor();assert.equal(await result().count(),0);await page.locator('[data-advisor-replacement]').click();await build();assert.equal(await result().getAttribute('data-outcome'),'no_change');}
      await page.goto(themed('/?view=advisor&goal=itsi-versions'));await page.locator('#advisor-build').waitFor();await page.evaluate(()=>{window.SPLUNK_DATA.guidance.aiAvailability.capabilities.find(row=>row.id==='ai-itsi-subagent').requirements[0]='UNASSESSED_BROWSER_CHANGE';});await build();assert.equal(await result().getAttribute('data-outcome'),'needs_review');assert(!(await result().innerText()).includes('UNASSESSED_BROWSER_CHANGE'));
      await page.locator('#advisor-clear').click();assert.equal(await page.evaluate(()=>localStorage.getItem('versioncompass-advisor-profile-v1')),null);
      assert(!requests.some(row=>/[?&](?:platformVersion|itsiVersion|saiaVersion|mcpVersion|cloudConnectVersion|profile)=/.test(row.url)),'Private context appeared in a request URL');assert.deepEqual(errors,[]);
      receipt.cases.push({id,passed:true,invitation:true,keyboard:true,privacy:true,handoff:true,handoffMalformedExpired:width===390,legacyProfileMigration:width===390,localProfiles:true,history:true,legacy:true,snapshot:true,conflicts:true,evidenceChangeFailClosed:true,stickyOffsets:true});
    }catch(error){await page.screenshot({path:path.join(output,id+'-failure.png'),fullPage:true});console.error(JSON.stringify({id,url:page.url(),errors}));throw error;}finally{await context.close();}
  }
  fs.writeFileSync(path.join(output,'advisor.json'),JSON.stringify(receipt,null,2)+'\n');return receipt;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const browser=await chromium.launch();try{console.log(JSON.stringify(await verifyAdvisor(browser,path.resolve(process.argv[3]||'advisor-artifacts'),process.argv[2])));}finally{await browser.close();}}
