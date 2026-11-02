import assert from 'node:assert/strict';
export async function prepareExact(context,route){
 if(!route.id.startsWith('exact-'))return;
 await context.addInitScript(()=>{window.__exactTools={};Object.defineProperty(document,'modelContext',{value:{registerTool(tool,options){window.__exactTools[tool.name]=tool;options.signal.addEventListener('abort',()=>delete window.__exactTools[tool.name]);}}});});
}
export async function verifyExact(page,route,theme){
 if(!route.id.startsWith('exact-'))return;
 assert(await page.locator('#exact-title').isVisible());
 if(route.invalid){assert(await page.locator('#exact-warning').isVisible());assert(await page.locator('#exact-content').isHidden());assert.equal(await page.locator('.exact-report').count(),0);return;}
 const result=await page.evaluate(()=>{const a=window.VersionCompassExactReleases,d=window.SPLUNK_DATA.guidance,s=a.read(location.search,d.exactReleases).state;return a.compare(d.exactReleases,d.sources,a.input(s));});
 assert.equal(result.path.status,'unknown');assert.equal(result.path.events.length,0);
 const text=await page.locator('#exact-results').innerText();
 for(const r of result.rows){assert(text.includes(r.title));assert(text.includes(r.from.status));assert(text.includes(r.to.status));}
 for(const c of result.to.rows.flatMap(r=>r.claims))for(const source of c.assessment.src){const url=await page.evaluate(id=>window.SPLUNK_DATA.guidance.sources[id].url,source);assert(await page.locator('#exact-results a').filter({hasText:await page.evaluate(id=>window.SPLUNK_DATA.guidance.sources[id].title,source)}).count());assert(await page.locator('#exact-results a[href="'+url+'"]').count());}
 if(route.id==='exact-conflict')assert(text.includes('conflicting'));
 if(route.id==='exact-backport')assert.equal(result.rows.find(r=>r.entity==='CVE-2026-76288').to.status,'fixed');
 if(route.id==='exact-cross-line')assert.equal(result.rows.find(r=>r.entity==='CVE-2026-76288').to.status,'affected');
 if(route.id==='exact-uf')assert.equal(result.rows.find(r=>r.entity==='uf-useack').to.status,'fixed');
 if(route.id==='exact-stale')assert(text.includes('stale'));
 await page.emulateMedia({media:'print'});
 const contrast=await page.evaluate(()=>{
   const rgb=s=>s.match(/[\d.]+/g)?.slice(0,3).map(Number);
   const luminance=c=>c.map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
   return [...document.querySelectorAll('.exact-report h1,.exact-report h2,.exact-report h3,.exact-report h4,.exact-report a')].flatMap(el=>{
     let node=el,bg;while(node){const color=getComputedStyle(node).backgroundColor;if(!['rgba(0, 0, 0, 0)','transparent'].includes(color)){bg=rgb(color);break;}node=node.parentElement;}
     const fg=rgb(getComputedStyle(el).color),a=luminance(fg),b=luminance(bg||[255,255,255]),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
     return ratio<4.5?[{text:el.textContent.slice(0,60),ratio}]:[];
   });
 });
 await page.emulateMedia({media:null});assert.deepEqual(contrast,[],'Exact-release PDF has low-contrast headings or citations');
 const agent=await page.evaluate(()=>{const a=window.VersionCompassExactReleases,d=window.SPLUNK_DATA.guidance,s=a.read(location.search,d.exactReleases).state,t=window.__exactTools.versioncompass_compare_exact_releases;return {readOnly:t.annotations.readOnlyHint,report:t.execute(a.input(s)),bad:t.execute({...a.input(s),write:true})};});
 assert.equal(agent.readOnly,true);assert.equal(agent.report.ok,true);assert.deepEqual(agent.report.report,result);assert.equal(agent.bad.ok,false);
 assert.equal(await page.locator('[data-destination="exact-releases"]').getAttribute('aria-current'),'page');
 const before=page.url();await page.reload();await page.waitForFunction(()=>typeof window.VersionCompassBuildSnapshot==='function'&&window.__exactTools?.versioncompass_compare_exact_releases);assert.equal(page.url(),before);
 assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('theme-cisco')),theme==='cisco');
}
