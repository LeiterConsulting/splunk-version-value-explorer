const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const dataContext={window:{}};vm.runInNewContext(read('dist/editions-data.js'),dataContext);const data=dataContext.window.VersionCompassEditions;
function router(search){const loaded=[],head=[],main={innerHTML:''};const document={body:{classList:{add(){}},appendChild(el){loaded.push(el.src);el.onload();}},head:{appendChild(el){head.push(el);}},querySelector(){return main;},createElement(){return {};}};vm.runInNewContext(read('dist/site-router.js'),{window:{location:{search}},URLSearchParams,document});return {loaded,head,main};}
test('public editions and legacy preview routes load editions; release routes stay isolated',()=>{
 for(const q of ['', '?product=es&platform=enterprise&host=10.4&from=8.6&to=8.7','?preview=no','?preview=es-editions&preview=es-editions']){const r=router(q);assert.deepEqual(r.loaded,['data.js','product-data.js','guidance-data.js','comparison.js','guidance.js','release-print.js','app.js','webmcp.js']);assert.equal(r.head.length,0);}
 const r=router('?preview=es-editions');assert.deepEqual(r.loaded,['editions-data.js','editions.js']);assert(!r.head.some(x=>x.name==='robots'));
 assert.deepEqual(router('?view=es-editions').loaded,['editions-data.js','editions.js']);
 assert.deepEqual(router('?view=es-editions&view=es-editions').loaded,router('').loaded);
});
test('all evidence records have dated, official HTTPS citations and known edition statuses',()=>{
 assert.equal(data.capabilities.length,20);assert.equal(new Set(data.capabilities.map(x=>x.id)).size,20);
 for(const r of [...data.capabilities,...data.notes,...data.workflows,...data.highlights,...data.conflicts.flatMap(c=>c.claims)]){assert(r.src.length);for(const key of r.src){const s=data.sources[key];assert(s,key);const u=new URL(s.u);assert.equal(u.protocol,'https:');assert(['www.splunk.com','help.splunk.com'].includes(u.hostname));assert.match(s.reviewed,/^\d{4}-\d{2}-\d{2}$/);} }
 for(const c of data.capabilities)for(const cell of [c.ess,c.prem])assert(['yes','no','part','review'].includes(cell.v));
 for(const id of ['connector-builder','guided-response']){const c=data.capabilities.find(x=>x.id===id);assert.equal(c.ess.v,'review');assert(c.flag);assert(c.src.length>=2);}
 assert(data.capabilities.find(x=>x.id==='automation-builder').flag.includes('still requires'));
 assert(data.notes.find(x=>x.id==='assistants').text.includes('Cloud Connected'));
});
test('task-level prerequisites and pricing uncertainty remain explicit without changing edition entitlement',()=>{
 const cap=id=>data.capabilities.find(c=>c.id===id);
 assert.match(cap('automation-builder').desc,/10\.1\+.*FedRAMP/);
 assert.match(cap('connector-builder').desc,/SOAR App: Edit and SOAR Asset: Edit/);
 assert.match(cap('ai-soc-analyst').desc,/8\.6\+.*8\.7\+/);
 assert.match(cap('malware-reversing').desc,/8\.5\+.*10\.2\+.*8\.6\+/);
 for(const id of ['ai-soc-analyst','malware-reversing']){assert.equal(cap(id).ess.v,'no');assert.match(cap(id).flag,/discrepancy/);}
 assert.equal(data.conflicts.length,5);
 for(const id of ['soc-version','malware-version','activity-pricing'])assert.equal(data.conflicts.find(c=>c.id===id).claims.length,2);
 assert.match(data.notes.find(n=>n.id==='pricing').text,/eligibility unclear/);
 assert(!cap('soar').desc.includes('offered with user-seat pricing'));
 assert(data.capabilities.some(c=>c.name==='Exposure Analytics'&&c.desc.includes('coming soon')));
});
function runtime(search='?preview=es-editions'){
 const elements=new Map(),events={},details=[],rows=new Map(data.capabilities.map(c=>[c.id,{hidden:false}]));let copied='';let html='';
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',hidden:false,textContent:'',innerHTML:'',listeners:{},addEventListener(event,fn){this.listeners[event]=fn;}});return elements.get(id);};
 const main={set innerHTML(value){html=value;for(let i=0;i<(value.match(/<details/g)||[]).length;i++)details.push({open:false});}};
 const document={title:'',querySelector(selector){if(selector==='main')return main;if(selector.startsWith('[data-id='))return rows.get(selector.match(/"([^"]+)"/)[1]);return element(selector);},getElementById:element,querySelectorAll(selector){assert.equal(selector,'main details');return details;}};
 const location={search,pathname:'/'};const history={replaceState(_a,_b,url){location.search=url.slice(1);}};
 const window={VersionCompassTheme:{href(value){if(new URLSearchParams(search).get('theme')!=='cisco')return value;const u=new URL(value,'https://versioncompass.com/');u.searchParams.set('theme','cisco');return u.pathname+u.search+u.hash;}},VersionCompassEditions:data,addEventListener(name,fn){events[name]=fn;},print(){events.beforeprint();}};
 vm.runInNewContext(read('dist/editions.js'),{document,location,history,window,URLSearchParams,navigator:{clipboard:{async writeText(value){copied=value;}}}});
 return {elements,details,events,rows,location,html,get copied(){return copied;}};
}
test('search, filters, history URLs, copy links and print restoration work without leaking preview tools',async()=>{
 const r=runtime();assert.equal(r.elements.get('edition-count').textContent,'20 of 20 capabilities');assert(r.details.every(x=>!x.open));
 const filter=r.elements.get('edition-filter');filter.value='review';filter.listeners.change();assert.equal([...r.rows.values()].filter(x=>!x.hidden).length,2);
 const q=r.elements.get('edition-search');q.value='Connector';q.listeners.input();assert.equal([...r.rows.values()].filter(x=>!x.hidden).length,1);
 q.value='zzzzz';q.listeners.input();assert.equal(r.elements.get('edition-empty').hidden,false);
 q.value='';q.listeners.input();const release=r.elements.get('edition-history');release.value='8.4';release.listeners.change();assert(r.elements.get('edition-timeline').innerHTML.includes('Cisco Talos'));
 await r.elements.get('edition-copy').listeners.click();assert.match(r.copied,/view=es-editions&filter=review&release=8.4/);
 const restored=runtime(r.location.search);assert.equal(restored.elements.get('edition-filter').value,'review');assert.equal(restored.elements.get('edition-history').value,'8.4');
 r.details[0].open=true;r.events.beforeprint();r.events.beforeprint();assert(r.details.every(x=>x.open));r.events.afterprint();assert(r.details[0].open);assert(r.details.slice(1).every(x=>!x.open));
 assert.equal(r.elements.get('.agent-note').hidden,true);
});
test('malformed preview fields fall back safely and query text is escaped',()=>{
 const r=runtime('?preview=es-editions&release=unknown&filter=unknown&q=%22%3E%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E');assert.equal(r.elements.get('edition-history').value,'8.7');assert.equal(r.elements.get('edition-filter').value,'all');assert(!r.html.includes('<img'));assert(r.html.includes('&lt;img'));
});

test('explanations and both sides of source questions remain visible without opening disclosures',()=>{
 const r=runtime();const visible=r.html.replace(/<details[\s\S]*?<\/details>/g,'');
 assert.equal((visible.match(/class="edition-description"/g)||[]).length,data.capabilities.length);
 for(const c of data.conflicts){assert(visible.includes(c.title));assert(visible.includes(c.meaning));for(const claim of c.claims)assert(visible.includes(data.sources[claim.src[0]].u));}
 assert(visible.includes('Direct edition conflict'));assert(visible.includes('Version and enhancement scope'));
 for(const w of data.workflows)for(const id of w.ids)assert(data.capabilities.some(c=>c.id===id));
 const changed=runtime('?preview=es-editions&filter=changed');assert.equal(changed.rows.get('detection-builder').hidden,false);
});
test('print report keeps all evidence and tracks selected history independently of filters',()=>{
 const r=runtime('?preview=es-editions&filter=review&release=8.4');
 const report=r.html.slice(r.html.indexOf('<article class="edition-report"'));
 assert.equal((report.match(/<tr>/g)||[]).length,21);
 for(const c of data.capabilities){assert(report.includes(c.name.replaceAll('&','&amp;')));if(c.flag)assert(report.includes(c.flag.replaceAll('&','&amp;')));}
 for(const key of Object.keys(data.sources))assert.equal((report.match(new RegExp('id="report-ref-'+key+'"','g'))||[]).length,1);
 assert(report.includes('<thead>'));assert(report.includes('Cisco Talos'));
 const release=r.elements.get('edition-history');release.value='8.7';release.listeners.change();
 assert(r.elements.get('edition-report-history').innerHTML.includes('Security MCP workflow tools'));
});

test('editions shares and navigation retain the optional theme',async()=>{
 const r=runtime('?view=es-editions&theme=cisco');
 assert(r.html.includes('href="/?theme=cisco"'));
 await r.elements.get('edition-copy').listeners.click();
 assert(r.copied.includes('view=es-editions'));assert(r.copied.includes('theme=cisco'));
 assert(r.html.includes('theme=cisco#edition-matrix-title'));
});
