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
 const agent=await page.evaluate(()=>{const a=window.VersionCompassExactReleases,d=window.SPLUNK_DATA.guidance,s=a.read(location.search,d.exactReleases).state,t=window.__exactTools.versioncompass_compare_exact_releases;return {readOnly:t.annotations.readOnlyHint,report:t.execute(a.input(s)),bad:t.execute({...a.input(s),write:true})};});
 assert.equal(agent.readOnly,true);assert.equal(agent.report.ok,true);assert.deepEqual(agent.report.report,result);assert.equal(agent.bad.ok,false);
 assert.equal(await page.locator('[data-destination="exact-releases"]').getAttribute('aria-current'),'page');
 const before=page.url();await page.reload();await page.waitForFunction(()=>typeof window.VersionCompassBuildSnapshot==='function'&&window.__exactTools?.versioncompass_compare_exact_releases);assert.equal(page.url(),before);
 assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('theme-cisco')),theme==='cisco');
}
