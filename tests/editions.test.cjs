const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const dataContext={window:{}};vm.runInNewContext(read('dist/editions-data.js'),dataContext);const data=dataContext.window.VersionCompassEditions;
function router(search){const loaded=[],head=[],main={innerHTML:''};const document={body:{classList:{add(){}},appendChild(el){loaded.push(el.src);el.onload();}},head:{appendChild(el){head.push(el);}},querySelector(){return main;},createElement(){return {};}};vm.runInNewContext(read('dist/site-router.js'),{window:{location:{search}},URLSearchParams,document});return {loaded,head,main};}
test('only the exact single preview switch loads editions; default and old routes retain normal scripts',()=>{
 for(const q of ['', '?product=es&platform=enterprise&host=10.4&from=8.6&to=8.7','?preview=no','?preview=es-editions&preview=es-editions']){const r=router(q);assert.deepEqual(r.loaded,['data.js','product-data.js','guidance-data.js','comparison.js','guidance.js','app.js','webmcp.js']);assert.equal(r.head.length,0);}
 const r=router('?preview=es-editions');assert.deepEqual(r.loaded,['editions-data.js','editions.js']);assert(r.head.some(x=>x.name==='robots'&&x.content==='noindex, nofollow'));
});
test('all evidence records have dated, official HTTPS citations and known edition statuses',()=>{
 assert.equal(data.capabilities.length,20);assert.equal(new Set(data.capabilities.map(x=>x.id)).size,20);
 for(const r of [...data.capabilities,...data.notes]){assert(r.src.length);for(const key of r.src){const s=data.sources[key];assert(s,key);const u=new URL(s.u);assert.equal(u.protocol,'https:');assert(['www.splunk.com','help.splunk.com'].includes(u.hostname));assert.match(s.reviewed,/^\d{4}-\d{2}-\d{2}$/);} }
 for(const c of data.capabilities)for(const cell of [c.ess,c.prem])assert(['yes','no','part','review'].includes(cell.v));
 for(const id of ['connector-builder','guided-response']){const c=data.capabilities.find(x=>x.id===id);assert.equal(c.ess.v,'review');assert(c.flag);assert(c.src.length>=2);}
 assert(data.capabilities.find(x=>x.id==='automation-builder').flag.includes('still requires'));
 assert(data.notes.find(x=>x.id==='assistants').text.includes('Cloud Connected'));
});
function runtime(search='?preview=es-editions'){
 const elements=new Map(),events={},details=[],rows=new Map(data.capabilities.map(c=>[c.id,{hidden:false}]));let copied='';let html='';
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',hidden:false,textContent:'',innerHTML:'',listeners:{},addEventListener(event,fn){this.listeners[event]=fn;}});return elements.get(id);};
 const main={set innerHTML(value){html=value;for(let i=0;i<(value.match(/<details/g)||[]).length;i++)details.push({open:false});}};
 const document={title:'',querySelector(selector){if(selector==='main')return main;if(selector.startsWith('[data-id='))return rows.get(selector.match(/"([^"]+)"/)[1]);return element(selector);},getElementById:element,querySelectorAll(selector){assert.equal(selector,'main details');return details;}};
 const location={search,pathname:'/'};const history={replaceState(_a,_b,url){location.search=url.slice(1);}};
 const window={VersionCompassEditions:data,addEventListener(name,fn){events[name]=fn;},print(){events.beforeprint();}};
 vm.runInNewContext(read('dist/editions.js'),{document,location,history,window,URLSearchParams,navigator:{clipboard:{async writeText(value){copied=value;}}}});
 return {elements,details,events,rows,location,html,get copied(){return copied;}};
}
test('search, filters, history URLs, copy links and print restoration work without leaking preview tools',async()=>{
 const r=runtime();assert.equal(r.elements.get('edition-count').textContent,'20 of 20 capabilities');assert(r.details.every(x=>!x.open));
 const filter=r.elements.get('edition-filter');filter.value='review';filter.listeners.change();assert.equal([...r.rows.values()].filter(x=>!x.hidden).length,2);
 const q=r.elements.get('edition-search');q.value='Connector';q.listeners.input();assert.equal([...r.rows.values()].filter(x=>!x.hidden).length,1);
 q.value='zzzzz';q.listeners.input();assert.equal(r.elements.get('edition-empty').hidden,false);
 q.value='';q.listeners.input();const release=r.elements.get('edition-history');release.value='8.4';release.listeners.change();assert(r.elements.get('edition-timeline').innerHTML.includes('Cisco Talos'));
 await r.elements.get('edition-copy').listeners.click();assert.match(r.copied,/preview=es-editions&filter=review&release=8.4/);
 const restored=runtime(r.location.search);assert.equal(restored.elements.get('edition-filter').value,'review');assert.equal(restored.elements.get('edition-history').value,'8.4');
 r.details[0].open=true;r.events.beforeprint();r.events.beforeprint();assert(r.details.every(x=>x.open));r.events.afterprint();assert(r.details[0].open);assert(r.details.slice(1).every(x=>!x.open));
 assert.equal(r.elements.get('.agent-note').hidden,true);
});
test('malformed preview fields fall back safely and query text is escaped',()=>{
 const r=runtime('?preview=es-editions&release=unknown&filter=unknown&q=%22%3E%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E');assert.equal(r.elements.get('edition-history').value,'8.7');assert.equal(r.elements.get('edition-filter').value,'all');assert(!r.html.includes('<img'));assert(r.html.includes('&lt;img'));
});
