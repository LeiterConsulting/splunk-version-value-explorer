const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function core(){const c={window:{},URLSearchParams};for(const f of ['soar-data.js','soar.js'])vm.runInNewContext(fs.readFileSync('dist/'+f,'utf8'),c);return c;}
test('SOAR paths retain Python bridge, OS bridge and privileged unknowns',()=>{const a=core().window.VersionCompassSOAR;
 assert.deepEqual(Array.from(a.assess({...a.defaults,from:'6.4.1'}).path),['6.4.1','8.5.0','8.7.0']);
 assert.deepEqual(Array.from(a.assess({...a.defaults,from:'6.1.0',os:'al2'}).path),['6.1.0','6.2.1','6.4.0','8.5.0','8.7.0']);
 assert.deepEqual(Array.from(a.assess({...a.defaults,from:'7.1.0'}).path),['7.1.0','8.7.0']);
 assert.equal(a.assess({...a.defaults,installation:'privileged'}).path.length,0);
 assert(a.assess({...a.defaults,from:'6.2.1'}).conditions.some(x=>x.includes('PostgreSQL')));
});
test('SOAR target requirements and exact issue scope survive comparison filtering',()=>{const a=core().window.VersionCompassSOAR,m=a.assess(a.defaults);
 assert(m.requirements.some(x=>x.id==='python87'));assert(m.issues.some(x=>x.id==='build243'&&x.detail.includes('232')));assert(m.technical.some(x=>x.id==='app87'&&x.detail.includes('/rest/audit')));
 const cloud=a.assess({...a.defaults,deployment:'cloud'});assert(!cloud.issues.some(x=>x.id==='build243'));assert.equal(cloud.routeStatus,'Managed service milestones');assert(!cloud.technical.some(x=>x.id==='os87'));
 const old=a.assess({...a.defaults,from:'8.5.0',to:'8.6.0'});assert(old.issues.some(x=>x.id==='credential86'));assert(old.issues.some(x=>x.id==='security86'&&x.detail.includes('Verify server certificate')));
});
test('SOAR restricted environments never inherit commercial features or Platform authorization',()=>{const a=core().window.VersionCompassSOAR;
 for(const compliance of ['fr-m','fr-h']){const r=a.assess({...a.defaults,deployment:'cloud',compliance});assert(r.features.every(x=>x.status==='Not established for selected environment'));assert(r.questions.length);}
 assert.equal(a.assess({...a.defaults,deployment:'cloud',compliance:'fr-h'}).availability.status,'Not established');
 assert.equal(a.assess({...a.defaults,deployment:'cloud',compliance:'fr-m',provider:'azure'}).availability.status,'Not supported by cited scope');
 assert.equal(a.assess({...a.defaults,deployment:'cloud',provider:'gcp',region:'Tokyo'}).availability.status,'Not established for this region');
 assert.equal(a.assess({...a.defaults,deployment:'cloud',provider:'gcp',region:'Iowa'}).availability.status,'Region listed; confirm rollout');
});
test('SOAR exact links round-trip and malformed, repeated, partial and descending routes are rejected',()=>{const c=core(),a=c.window.VersionCompassSOAR;
 for(const deployment of ['cmp','cloud'])for(const from of c.window.VersionCompassSOARData.releases[deployment])for(const to of c.window.VersionCompassSOARData.targets){const s={...a.defaults,deployment,from,to},r=a.assess(s);assert.equal(!!r.errors.length,Number(from.split('.')[0])*100+Number(from.split('.')[1])>=Number(to.split('.')[0])*100+Number(to.split('.')[1]));assert.equal(JSON.stringify(a.read(a.url(s)).state),JSON.stringify(s));}
 for(const q of ['?from=8.6.0','?from=8.6.0&from=8.5.0&to=8.7.0','?to=8.7.999&from=8.6.0','?deployment=alien','?product=soar&product=es'])assert(a.read(q).errors.length,q);
});
function ui(search='?product=soar'){
 const c=core(),elements=new Map(),selects=new Map(),wrappers=new Map(),events={},tools=new Map();
 const el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',open:false,hidden:false,disabled:false,addEventListener(){}});return elements.get(id);};
 for(const k of Object.keys(c.window.VersionCompassSOAR.defaults)){selects.set(k,{dataset:{soar:k},value:'',addEventListener(type,fn){this[type]=fn;}});wrappers.set(k,{hidden:false});}
 const document={title:'',documentElement:{classList:{add(){},remove(){}},style:{setProperty(){}}},body:{classList:{add(){}}},head:{appendChild(){}},createElement:()=>({}),getElementById:el,
 querySelector(s){if(s==='.product-switcher')return {outerHTML:'<div class="product-switcher"></div>'};if(s==='main')return el('main');if(s==='.site-header')return {getBoundingClientRect:()=>({height:70})};if(s==='.soar-summary')return el('summary');if(s==='a.reviewed')return {href:'https://github.com/LeiterConsulting/splunk-version-value-explorer/blob/main/docs/releases/2026-10-01.md'};return wrappers.get(s.match(/data-soar-field="(.*?)"/)?.[1])||null;},querySelectorAll:s=>s==='[data-soar]'?[...selects.values()]:[],modelContext:{registerTool(t){tools.set(t.name,t);}}};
 const location={search,href:'https://versioncompass.com/'+search};let href=location.href;
 Object.assign(c,{document,location,history:{replaceState(a,b,u){href=u;}},navigator:{clipboard:{writeText:async()=>{}}},ResizeObserver:class{observe(){}},AbortController,URL,console});
 Object.assign(c.window,{VersionCompassTheme:{href:u=>u+'&theme=cisco'},VersionCompassReports:{decorate:h=>'<p>revision</p>'+h},addEventListener:(n,f)=>events[n]=f,print(){},SPLUNK_DATA:{products:{}},VersionCompassEnvironment:{data:{providers:{aws:'AWS'},regions:[],regimes:{commercial:'Commercial','fr-m':'Moderate','fr-h':'High'},experiences:{}}}});
 vm.runInNewContext(fs.readFileSync('dist/soar-ui.js','utf8'),c);vm.runInNewContext(fs.readFileSync('dist/webmcp.js','utf8'),c);
 return {c,el,selects,wrappers,events,tools,url:()=>href};
}
test('SOAR screen updates in place, exports include all sections, print restores screen, and tools share evidence',async()=>{
 const r=ui();await new Promise(resolve=>setImmediate(resolve));
 assert.match(r.el('results').innerHTML,/build 243/);assert.equal(r.el('technical-panel').open,false);
 const before=r.el('results').innerHTML;r.events.beforeprint();assert.match(r.el('release-report').innerHTML,/details open/);assert.match(r.el('release-report').innerHTML,/System requirements|Target OS/);assert.match(r.el('release-report').innerHTML,/SVD-2026-0804/);r.events.afterprint();assert.equal(r.el('results').innerHTML,before);
 r.selects.get('deployment').value='cloud';r.selects.get('deployment').change();r.selects.get('compliance').value='fr-m';r.selects.get('compliance').change();
 assert.match(r.el('results').innerHTML,/native data|Native data/);assert.equal(r.wrappers.get('os').hidden,true);assert.equal(r.wrappers.get('compliance').hidden,false);assert.match(r.url(),/theme=cisco/);
 const html=r.c.window.VersionCompassBuildSnapshot();assert.match(html,/GovCloud/);assert.match(html,/playbook|Playbook/);assert.match(html,/Evidence coverage/);assert(!html.includes('build 243'));
 const current=r.tools.get('versioncompass_get_current_report').execute({});assert.equal(current.ok,true);assert.equal(current.report.selection.compliance,'fr-m');assert(current.report.features.every(x=>x.qualification));
 const catalog=r.tools.get('versioncompass_get_catalog').execute({products:['soar']});assert.equal(catalog.products[0].id,'soar');
 const compare=r.tools.get('versioncompass_compare_routes').execute({routes:[{product:'soar',platform:'enterprise',from:'6.4.1',to:'8.7.0'}]});assert.equal(compare.ok,true);assert.equal(compare.reports[0].path[1],'8.5.0');
 const bad=r.tools.get('versioncompass_compare_routes').execute({routes:[{product:'soar',platform:'enterprise',from:'8.7.0',to:'8.6.0'}]});assert.equal(bad.ok,false);
});
test('SOAR unresolved shared links block screen and every export until explicitly reset',async()=>{const r=ui('?product=soar&from=garbage&to=8.7.0');await new Promise(resolve=>setImmediate(resolve));assert.equal(r.el('results').hidden,true);assert.equal(r.el('print-report').disabled,true);assert.throws(()=>r.c.window.VersionCompassBuildSnapshot());assert.equal(r.tools.get('versioncompass_get_current_report').execute({}).ok,false);r.el('soar-reset').onclick();assert.equal(r.el('results').hidden,false);});
test('SOAR source register preserves claim sections and treats empty issue retrieval as unresolved',()=>{const c=core();vm.runInNewContext(fs.readFileSync('dist/source-register.js','utf8'),c);const data=c.window.VersionCompassSOARData;
 for(const claim of data.records)for(const id of claim.src){const source=data.sources[id];const row=c.window.VersionCompassSources.sources.find(x=>x.url===source.url);assert(row);assert(row.claimReferences.some(x=>x.section===source.section&&x.path.startsWith('soar:')));}
 for(const id of ['known','fixed','cloudKnown']){const row=c.window.VersionCompassSources.sources.find(x=>x.url===data.sources[id].url);assert.equal(row.status,'Needs reconciliation');assert.equal(row.reviewed,null);}
});
