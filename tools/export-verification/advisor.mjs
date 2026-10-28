import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
export async function verifyAdvisor(browser,output,base='http://127.0.0.1:4173'){
 fs.mkdirSync(output,{recursive:true});const receipt={outcome:'passed',cases:[]};
 for(const theme of ['default','cisco'])for(const width of [390,768,1220]){
  const id=theme+'-'+width,context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  if(base.includes('127.0.0.1'))await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  try{await page.goto(base+'/?'+(theme==='cisco'?'theme=cisco':''));await page.locator('.report-toolbar').waitFor();if(width<=760)await page.locator('.global-menu-toggle').click();
   const link=page.locator('[data-destination="advisor"]');assert.match(await link.innerText(),/Work in progress/);await link.click();await page.locator('#advisor-goal').waitFor({state:'attached'});assert(await page.locator('#advisor-goal').isVisible(),'Goal control is hidden');assert.equal(await page.locator('[data-destination="advisor"]').getAttribute('aria-current'),'page');
   const outcome=()=>page.locator('#advisor-result .advisor-result').getAttribute('data-outcome');assert.equal(await outcome(),'insufficient');await page.locator('#advisor-goal').selectOption('itsi-versions');
   for(const [field,value] of [['itsiVersion','5.0.0'],['saiaVersion','2.2.0'],['mcpVersion','1.2.1']])await page.locator('#advisor-'+field).fill(value);assert.equal(await outcome(),'no_change');
   assert.match(await page.locator('#advisor-result').innerText(),/does not establish a supported complete pairing/);await page.locator('#advisor-save').click();assert.match(await page.locator('#advisor-profile-status').innerText(),/saved/);
   assert.equal(new URL(page.url()).searchParams.get('itsiVersion'),null);assert.equal(new URL(page.url()).searchParams.get('platformVersion'),null);
   await page.locator('#advisor-goal').selectOption('ingest-pressure');assert.equal(await outcome(),'insufficient');await page.goBack();assert.equal(await outcome(),'no_change');await page.goForward();assert.equal(await outcome(),'insufficient');
   await page.locator('#advisor-load').click();assert.equal(await outcome(),'no_change');assert.equal(await page.locator('#advisor-mcpVersion').inputValue(),'1.2.1');
   const downloadPromise=page.waitForEvent('download');await page.locator('[data-save-snapshot]').click();const download=await downloadPromise;await download.saveAs(path.join(output,id+'-profile.html'));const html=fs.readFileSync(path.join(output,id+'-profile.html'),'utf8');assert(html.includes('5.0.0')&&html.includes('Self-reported context')&&html.includes('Source checked 2026-10-23'));
   await page.locator('#advisor-goal').selectOption('soc-workflow');await page.locator('#advisor-deployment').selectOption('enterprise');await page.locator('#advisor-compliance').selectOption('commercial');await page.locator('#advisor-region').selectOption('us-east-1');await page.locator('#advisor-edition').selectOption('premier');assert.equal(await outcome(),'conflicting');assert.match(await page.locator('#advisor-result').innerText(),/Unresolved source contradiction/);
   const fit=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));assert(fit.scroll<=fit.client+2,'Advisor page overflow '+JSON.stringify(fit));
   await page.locator('.report-navigator button[data-target="advisor-results"]').click();const offset=await page.evaluate(()=>({top:document.getElementById('advisor-results').getBoundingClientRect().top,edge:document.querySelector('.report-navigator').getBoundingClientRect().bottom}));assert(offset.top>=offset.edge-2,'Guidance hidden under sticky chrome '+JSON.stringify(offset));
   await page.locator('#advisor-title').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,id+'.png'),fullPage:true});
   await page.locator('#advisor-clear').click();assert.equal(await outcome(),'insufficient');assert.equal(await page.evaluate(()=>localStorage.getItem('versioncompass-advisor-profile-v1')),null);
   assert(!requests.some(url=>/[?&](?:itsiVersion|platformVersion|profile|saiaVersion|mcpVersion)=/.test(url)),'Profile transmitted in request');assert.deepEqual(errors,[]);receipt.cases.push({id,passed:true,profileLocal:true,history:true,snapshot:true,conflict:true});
  }catch(error){await page.screenshot({path:path.join(output,id+'-failure.png'),fullPage:true});console.error(JSON.stringify({id,url:page.url(),errors,warning:await page.locator('#advisor-warning').textContent(),hidden:await page.locator('#advisor-goal').evaluate(el=>{const rows=[];for(let p=el;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||p.hidden)rows.push({tag:p.tagName,id:p.id,display:s.display,hidden:p.hidden});}return rows;})}));throw error;}finally{await context.close();}
 }
 fs.writeFileSync(path.join(output,'advisor.json'),JSON.stringify(receipt,null,2)+'\n');return receipt;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const browser=await chromium.launch();try{console.log(JSON.stringify(await verifyAdvisor(browser,path.resolve(process.argv[3]||'advisor-artifacts'),process.argv[2])));}finally{await browser.close();}}
