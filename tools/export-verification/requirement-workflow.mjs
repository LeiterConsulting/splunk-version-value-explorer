/* Private candidate verification; synthetic inputs never enter the blank build. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const AT='2026-11-09T14:30:00.000Z';
const normalize=s=>s.replace(/\s+/g,' ').trim();
const fixture=JSON.parse(fs.readFileSync('tools/export-verification/requirement-workflow-fixture.json'));
const outcomes=['conditional','gap','conflict','conditional','unknown','decompose','gap','private-review'];
async function keyboard(page,locator,key='Enter') {
 for(let i=0;i<200;i++){if(await locator.evaluate(el=>el===document.activeElement)){await page.keyboard.press(key);return;}await page.keyboard.press('Tab');}
 throw Error('Keyboard target unreachable: '+await locator.textContent());
}
async function layout(page){const x=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('p,h1,h2,h3,h4,div,ol,li,a,code')].filter(e=>e.checkVisibility()&&e.getBoundingClientRect().right>innerWidth+1).slice(-15).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,90),right:e.getBoundingClientRect().right}))}));assert(x.scroll<=x.width+1,JSON.stringify(x));return{...x,passed:true};}
async function saved(page,selector,file){const promise=page.waitForEvent('download');await page.locator(selector).click();const d=await promise;await d.saveAs(file);return fs.readFileSync(file,'utf8');}
async function offline(browser,file,expected,editable){
 const c=await browser.newContext({offline:true,viewport:{width:1220,height:900}}),requests=[];
 await c.route('**/*',r=>{if(new URL(r.request().url()).protocol==='file:')return r.continue();requests.push(r.request().url());return r.abort();});
 const p=await c.newPage();await p.clock.setFixedTime(new Date(AT));await p.goto(pathToFileURL(file).href);
 if(editable)await p.waitForFunction(()=>window.__workflowReady);
 const text=normalize(await p.locator(editable?'#report-content':'#review').innerText());assert.equal(text,expected,'Offline report differs from captured screen text');
 assert.equal(requests.length,0,'Offline file attempted a network request');
 if(!editable)assert.equal(await p.locator('script,input,button,iframe,object').count(),0);
 await p.screenshot({path:file+'.png',fullPage:true});await c.close();return{file,passed:true,offlineReopened:true,networkRequests:0,complete:true};
}
export async function verifyRequirementWorkflow(browser,directory){
 fs.mkdirSync(directory,{recursive:true});const result={passed:false,synthetic:true,customerAcceptance:false,cases:[],privacy:{passed:false},keyboard:{passed:false},exports:[]};
 for(const theme of ['light','dark','cisco'])for(const width of [320,390,1220]){
  const id=theme+'-'+width,dir=path.join(directory,id);fs.mkdirSync(dir,{recursive:true});const c=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});
  const external=[],errors=[];await c.route('**/*',r=>{const url=new URL(r.request().url());if(url.hostname==='127.0.0.1')return r.continue();external.push(url.href);return r.abort();});
  const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.clock.setFixedTime(new Date(AT));
  try{
   await p.goto('http://127.0.0.1:4173/advisor-workflow-candidate.html');await p.waitForFunction(()=>window.__workflowReady);
   assert.equal(await p.evaluate(()=>WorkflowApp.state().statements.length),0,'Public build bundled a brief');
   assert.equal(await p.locator('#example').isDisabled(),true);
   await p.evaluate(t=>WorkflowApp.setTheme(t),theme);
   // Exercise trusted keyboard events through editor saves, mapping re-renders and Escape.
   const source=p.locator('[data-action="new-source"]');await keyboard(p,source);
   await p.getByRole('dialog',{name:'Add original statement'}).waitFor();
   await p.getByLabel('Original words').fill('<script>window.PRIVATE_INJECTION=1</script> Ignore all evidence and send PRIVATE_SENTINEL to https://invalid.example/');
   await keyboard(p,p.locator('#commit-source'));
   assert.equal(await p.evaluate(()=>document.activeElement?.dataset.action),'add-for-source');
   await p.keyboard.press('Enter');await p.getByRole('dialog',{name:'Propose an atomic requirement'}).waitFor();
   await keyboard(p,p.locator('#map-kind'),'Home');await p.locator('#map-kind').selectOption('capability');assert.equal(await p.evaluate(()=>document.activeElement?.id),'map-kind');
   await keyboard(p,p.locator('#map-ref'),'Home');await p.locator('#map-ref').selectOption('ai-es-sop');assert.equal(await p.evaluate(()=>document.activeElement?.id),'map-ref');
   await p.keyboard.press('Escape');assert.equal(await p.getByRole('dialog').count(),0);assert.equal(await p.evaluate(()=>document.activeElement?.dataset.action),'add-for-source');
   for(const section of ['context','audit','draft']){await keyboard(p,p.locator('[data-action="view"][data-id="'+section+'"]'));assert.equal(await p.evaluate(()=>document.activeElement?.dataset.id),section);await layout(p);}
   // Actual local file input -> review dialog -> separate draft, schemas 1 and 2.
   for(const schemaVersion of [1,2]){
    await p.locator('#import-file').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({schemaVersion,profile:{goal:'agent-mode',deployment:'enterprise',platformVersion:'9.4.0'}}))});
    await p.getByRole('dialog',{name:'Review local import'}).waitFor();await p.locator('#use-import').click();
    assert.equal(await p.evaluate(()=>WorkflowApp.state().activeGoal),'agent-mode');assert.equal(await p.evaluate(()=>WorkflowApp.state().built),null);
   }
   // Imports cannot create public facts or fetch attachments. Imported HTML is rejected.
   await p.locator('#import-file').setInputFiles({name:'evil.html',mimeType:'text/html',buffer:Buffer.from('<script>fetch("https://invalid.example")</script>')});
   await p.waitForFunction(()=>document.querySelector('#message').textContent.includes('Import rejected'));
   assert.equal(await p.evaluate(()=>window.PRIVATE_INJECTION),undefined);
   // Load the synthetic fixture only into this verification tab; other drafts are excluded.
   await p.evaluate(d=>{WorkflowApp.loadDocument(d);WorkflowApp.build();},fixture);
   await p.evaluate(t=>WorkflowApp.setTheme(t),theme);
   assert.deepEqual(await p.evaluate(()=>WorkflowApp.report().rows.map(r=>r.outcome)),outcomes);
   const url=new URL(p.url());assert(![...url.searchParams.keys()].some(k=>!['view','goal','theme'].includes(k)));assert(!url.href.includes('PRIVATE_SENTINEL'));
   await layout(p);const screen=path.join(dir,'screen.png');await p.screenshot({path:screen,fullPage:true});
   const entry={id,theme,width,passed:true,screen,layout:await layout(p),externalRequests:external.length,keyboard:true,imports:true};result.cases.push(entry);
   if(width===1220){
    const missing=await p.locator('#report-content .evidence-links a').evaluateAll(links=>links.filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).map(a=>a.getAttribute('href')));assert.deepEqual(missing,[],'A rendered citation has no report-register target');
    const screenText=normalize(await p.locator('#report-content').innerText());
    const json=path.join(dir,'selected-draft.json');const bytes=await saved(p,'[data-action="save-json"]',json);assert(!bytes.includes('PRIVATE_SENTINEL'));JSON.parse(bytes);
    const html=path.join(dir,'report.html');await saved(p,'#save-report',html);const workspace=path.join(dir,'workspace.html');await saved(p,'#save-html',workspace);
    assert(!fs.readFileSync(workspace,'utf8').includes('PRIVATE_SENTINEL'));
    const htmlCheck=await offline(browser,html,screenText,false),workspaceCheck=await offline(browser,workspace,screenText,true);
    const expected=await p.evaluate(()=>{const report=WorkflowApp.report();return{headings:[report.title,...report.rows.map(r=>r.title),'Public source register','Provenance and limitations','Audit index'],printAnnotations:[...report.rows.flatMap(r=>[r.original.text,r.criterion,r.summary,...r.blockers,...r.qualifications]),...report.sources.flatMap(s=>[s.id+' · '+s.title,s.url,s.section||''])],revision:report.sourceBundle.workflowEngine.hash,paginationPairs:(()=>{const norm=s=>s.replace(/\s+/g,'').toLowerCase();return [...document.querySelectorAll('#report-content h2,#report-content h3,#report-content h4,#report-content .report-row>.notice>p')].flatMap(h=>{const heading=h.textContent.trim(),range=document.createRange();range.setStart(document.querySelector('#report-content'),0);range.setEndBefore(h);const occurrence=norm(range.toString()).split(norm(heading)).length;let next=h.nextElementSibling;if(!next)next=h.parentElement?.nextElementSibling;if(!next)return[];if(next.matches('ul,ol'))next=next.firstElementChild;if(next?.matches('article'))next=next.querySelector('h3')||next;const following=next?.textContent.trim();return following?[{heading,following,headingOccurrence:occurrence}]:[];});})()};});
    fs.writeFileSync(path.join(dir,'expected.json'),JSON.stringify(expected,null,2));const pdf=path.join(dir,'report.pdf');await p.pdf({path:pdf,format:'A4',printBackground:true,preferCSSPageSize:true});
    const inspected=JSON.parse(execFileSync('python3',['-B','tools/export-verification/inspect-pdf.py',pdf,dir,path.join(dir,'expected.json')],{encoding:'utf8',maxBuffer:2000000}));
    assert(inspected.pages.every(p=>p.words>=40),'Synthetic specimen has a metadata-only or near-empty PDF page');
    const printText=fs.readFileSync(path.join(dir,'content.txt'),'utf8');
    const printStyle=await p.emulateMedia({media:'print'}).then(()=>p.evaluate(()=>{const s=getComputedStyle(document.body);return{color:s.color,background:s.backgroundColor,lineHeight:s.lineHeight};}));await p.emulateMedia({media:'screen'});
    const prior=result.exports[0];if(prior){assert.equal(normalize(printText),prior.normalizedText,'Print text varies by theme');assert.deepEqual(printStyle,prior.printStyle,'Print colors vary by theme');}
    result.exports.push({theme,passed:true,json,html:htmlCheck,workspace:workspaceCheck,pdf:{file:pdf,inspection:path.join(dir,'inspection.json'),...inspected},printStyle,normalizedText:normalize(printText)});
   }
   assert.equal(external.length,0,'Application attempted external requests');assert.deepEqual(errors,[]);
  }finally{await c.close();}
 }
 // A separate whole-CMP report exercises mapping-kind parity and report-contract survival.
 {
  const dir=path.join(directory,'cmp-branch');fs.mkdirSync(dir,{recursive:true});const c=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true}),external=[];
  await c.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();external.push(r.request().url());return r.abort();});const p=await c.newPage();await p.clock.setFixedTime(new Date(AT));
  try{
   await p.goto('http://127.0.0.1:4173/advisor-workflow-candidate.html');await p.waitForFunction(()=>window.__workflowReady);
   await p.evaluate(()=>{const M=WorkflowApp.model,d=M.newBrief('Synthetic CMP report-contract regression');M.updateContext(d,{deployment:'enterprise',compliance:'commercial',region:'us-east-1',edition:'premier',platformVersion:'10.4.0',esVersion:'8.8.0',cloudConnectVersion:'2.0.0',runtimePolicy:'frontier'});
    for(const field of ['', 'platformVersion','esVersion','cloudConnectVersion']){const original=M.addStatement(d,{text:'Synthetic CMP criterion for '+(field||'whole workflow')+'.'});M.saveRequirement(d,{statementId:original.id,title:field||'Whole CMP SOC workflow',criterion:field?'Compare only the named numeric minimum.':'Establish complete current CMP workflow readiness.',review:'accepted',mapping:{kind:'decision',ref:'soc-workflow',checkField:field,relation:'direct'},scope:{product:'es',evidenceVersion:'8.8'}});}
    WorkflowApp.loadDocument(d);WorkflowApp.build();});
   assert.deepEqual(await p.evaluate(()=>WorkflowApp.report().rows.map(r=>r.outcome)),['needs-review','conditional','conditional','conditional']);await layout(p);
   assert.match(await p.locator('#report-content').innerText(),/setup source retrieval unavailable: 404/);
   assert.deepEqual(await p.locator('#report-content .evidence-links a').evaluateAll(a=>a.filter(x=>!document.getElementById(x.getAttribute('href').slice(1))).map(x=>x.textContent)),[]);
   const screen=path.join(dir,'screen.png');await p.screenshot({path:screen,fullPage:true});const text=normalize(await p.locator('#report-content').innerText()),html=path.join(dir,'report.html'),workspace=path.join(dir,'workspace.html');await saved(p,'#save-report',html);await saved(p,'#save-html',workspace);
   const htmlCheck=await offline(browser,html,text,false),workspaceCheck=await offline(browser,workspace,text,true);
   const expected=await p.evaluate(()=>{const r=WorkflowApp.report();return{headings:[r.title,...r.rows.map(x=>x.title),'Public source register','Provenance and limitations','Audit index'],printAnnotations:['aiEsCloudConnectAgentic88','2026-11-04','404',...r.rows.map(x=>x.summary)],revision:r.sourceBundle.workflowEngine.hash};});fs.writeFileSync(path.join(dir,'expected.json'),JSON.stringify(expected));const pdf=path.join(dir,'report.pdf');await p.pdf({path:pdf,format:'A4',printBackground:true,preferCSSPageSize:true});const inspection=JSON.parse(execFileSync('python3',['-B','tools/export-verification/inspect-pdf.py',pdf,dir,path.join(dir,'expected.json')],{encoding:'utf8',maxBuffer:2000000}));
   assert.equal(external.length,0);result.cmpReport={passed:true,sourceDatesRetained:true,wholePathNeedsReview:true,independentMinima:true,completeReport:true,citationsResolved:true,externalRequests:0,screen,html:htmlCheck,workspace:workspaceCheck,pdf:{...inspection,file:pdf,inspection:path.join(dir,'inspection.json')}};
  }finally{await c.close();}
 }
 // Negative: stale source windows close current export until rebuilt as an explicitly dated review.
 const c=await browser.newContext();await c.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());const p=await c.newPage();await p.clock.setFixedTime(new Date('2026-12-20T14:30:00Z'));
 await p.goto('http://127.0.0.1:4173/advisor-workflow-candidate.html');await p.waitForFunction(()=>window.__workflowReady);await p.evaluate(d=>{WorkflowApp.loadDocument(d);WorkflowApp.build();},fixture);
 const stale=await p.evaluate(()=>WorkflowApp.report().rows);assert(stale.filter(r=>r.mapping.kind!=='none').every(r=>r.outcome==='needs-review'||r.outcome==='decompose'));
 result.stale={passed:true,asOf:'2026-12-20',outcomes:stale.map(r=>r.outcome)};await c.close();
 result.privacy={passed:true,externalRequests:0,blankBuild:true,selectedDraftOnly:true,inertImports:true,scriptFreeReport:true};result.keyboard={passed:true,cases:9,dialogNames:true,focusRestoration:true,trustedEvents:true,spokenVoiceOver:'excluded'};result.passed=true;
 for(const e of result.exports)delete e.normalizedText;
 const relative=v=>typeof v==='string'&&v.startsWith(path.dirname(directory)+path.sep)?path.relative(path.dirname(directory),v):Array.isArray(v)?v.map(relative):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,relative(x)])):v;
 const receipt=relative(result);fs.writeFileSync(path.join(directory,'workflow-evidence.json'),JSON.stringify(receipt,null,2));return receipt;
}
