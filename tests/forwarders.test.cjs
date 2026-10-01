const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function api(){const c={window:{},URLSearchParams};for(const f of ['data.js','product-data.js','comparison.js','forwarders-data.js','forwarders.js'])vm.runInNewContext(fs.readFileSync('dist/'+f,'utf8'),c);return c.window.VersionCompassForwarders;}
test('UF bridges follow UF evidence, HF reuses Enterprise path',()=>{const a=api();assert.equal(a.assess(a.defaults).path.join(','),'9.4,10.0,10.4');assert.equal(a.assess({...a.defaults,to:'10.2'}).path.join(','),'9.4,10.0,10.2');assert.equal(a.assess({...a.defaults,type:'hf',to:'10.2'}).path.join(','),'9.4,10.2');});
test('10.6 keeps UF upgrade support distinct from HF and receiver evidence',()=>{const a=api();assert.equal(a.assess({...a.defaults,from:'10.0',to:'10.6'}).path.join(','),'10.0,10.6');assert.equal(a.assess({...a.defaults,from:'10.4',to:'10.6'}).path.join(','),'10.4,10.6');const hf=a.assess({...a.defaults,type:'hf',from:'10.4',to:'10.6'});assert.equal(hf.path.length,0);assert.equal(hf.claims[0].status,'not_established');assert.equal(a.assess({...a.defaults,from:'10.4',to:'10.6',receiver:'10.6'}).claims[1].status,'not_established');assert.equal(a.assess({...a.defaults,from:'10.4',to:'10.6',destination:'cloud',receiver:'10.6'}).claims[1].status,'not_established');});
test('compatibility never grants authorization or certificate renewal',()=>{const a=api();for(const destination of ['fr-m','fr-h']){const m=a.assess({...a.defaults,destination});assert.equal(m.claims[1].status,'not_established');assert.equal(m.claims[2].status,'not_established');assert.equal(m.features[0].status,'unavailable');}assert.equal(a.renewal({...a.defaults,destination:'cloud',provider:'aws',region:'us-east-1'}).status,'conditional');for(const v of [{region:'ap-south-1'},{topology:'intermediate'},{topology:'edge'},{provider:'azure'}])assert.equal(a.renewal({...a.defaults,destination:'cloud',provider:'aws',...v}).status,'unavailable');});
test('exact OS, missing evidence and app runtime scopes stay distinct',()=>{const a=api();assert.equal(a.assess({...a.defaults,type:'hf',os:'macOS 26',arch:'arm64'}).os.status,'unavailable');assert.equal(a.assess({...a.defaults,os:'macOS 26',arch:'arm64'}).os.status,'available');assert.equal(a.assess({...a.defaults,to:'10.0',os:'Ubuntu 24.04',arch:'x86_64'}).os.status,'not_established');assert.equal(a.assess(a.defaults).technical.length,0);assert(a.assess({...a.defaults,type:'hf'}).technical.some(t=>/Python/.test(t.component)));});
test('10.6 OS rows preserve exact package and conditional scope',()=>{const a=api();assert.equal(a.assess({...a.defaults,from:'10.4',to:'10.6',os:'Ubuntu 26.04',arch:'x86_64'}).os.status,'available');assert.equal(a.assess({...a.defaults,type:'hf',from:'10.4',to:'10.6',os:'RHEL 9',arch:'arm64'}).os.status,'unavailable');assert.equal(a.assess({...a.defaults,from:'10.4',to:'10.6',os:'Windows Server 2016',arch:'x86_64'}).os.status,'conditional');});
test('all selections round-trip, invalid and repeated inputs are explicit',()=>{const a=api(),s={...a.defaults,destination:'cloud',provider:'aws',region:'us-east-1',os:'Ubuntu 24.04',arch:'x86_64'};assert.equal(JSON.stringify(a.read(a.url(s)).state),JSON.stringify(s));assert(a.read('?type=alien&type=uf').errors.length);assert(a.assess({...s,from:'10.4',to:'9.4'}).errors.length);assert(a.assess({...s,to:'10.4.999'}).errors.length);});
test('Cloud receiver table preserves omitted 10.4 pairing for forwarder 10.0',()=>{const a=api();assert.equal(a.assess({...a.defaults,to:'10.0',destination:'cloud',receiver:'10.4'}).claims[1].status,'not_established');assert.equal(a.assess({...a.defaults,to:'10.0',destination:'cloud',receiver:'10.5'}).claims[1].status,'conditional');});
test('10.6 forwarders cannot inherit older receiver-table rows on either hybrid leg',()=>{
 const a=api();
 for(const type of ['uf','hf'])for(const receiver of ['9.4','10.0','10.2','10.4','10.5','10.6'])for(const destination of ['cmp','cloud','hybrid']){
  const report=a.assess({...a.defaults,type,from:'10.4',to:'10.6',destination,receiver,cloudReceiver:receiver});
  assert.equal(report.claims[1].status,'not_established',type+' / '+destination+' / '+receiver);
  if(destination==='hybrid')assert.equal(report.claims[2].status,'not_established');
 }
 assert.equal(a.assess(a.defaults).claims[1].status,'available');
 assert.equal(a.assess({...a.defaults,destination:'cloud',receiver:'10.5'}).claims[1].status,'conditional');
});
test('Enterprise is a first-class deployment and hybrid assesses each receiving leg',()=>{
 const a=api(),enterprise=a.assess(a.defaults);
 assert.equal(enterprise.claims[1].title,'Splunk Enterprise receiver');assert.equal(enterprise.claims[1].status,'available');assert.equal(enterprise.features.length,0);
 const hybrid=a.assess({...a.defaults,destination:'hybrid',cloudReceiver:'10.5'});
 assert.equal(hybrid.claims[1].title,'Splunk Enterprise receiver');assert.equal(hybrid.claims[1].status,'available');
 assert.equal(hybrid.claims[2].title,'Splunk Cloud stack');assert.equal(hybrid.claims[2].status,'conditional');
 assert.equal(hybrid.claims[3].status,'not_established');assert.equal(hybrid.claims[4].source,'routing');
 assert.equal(hybrid.features[0].status,'not_established');assert(hybrid.requiredChecks.some(x=>x.includes('output groups')));
 const intermediate=a.assess({...a.defaults,destination:'hybrid',topology:'intermediate'});
 assert.equal(intermediate.claims[2].status,'not_established');
 const restored=a.read(a.url({...a.defaults,destination:'hybrid',cloudReceiver:'10.4'}));
 assert.equal(restored.state.destination,'hybrid');assert.equal(restored.state.cloudReceiver,'10.4');
 assert.equal(a.read('?product=forwarders&destination=cmp').state.cloudReceiver,'10.5');
 assert(!a.url(a.defaults).includes('cloudReceiver='));
});
test('Forwarders screen reveals the right destination controls and carries hybrid into the snapshot',()=>{
 const elements=new Map(),fields=new Map(),wrappers=new Map(),events={};
 const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',hidden:false,open:false,disabled:false,addEventListener(){},classList:{add(){},remove(){}}});return elements.get(id);};
 for(const k of ['type','from','to','destination','receiver','cloudReceiver','os','arch','provider','topology','region'])fields.set(k,{dataset:{forwarder:k},tagName:k==='region'?'INPUT':'SELECT',value:'',addEventListener(type,fn){this[type]=fn}});
 for(const k of ['cloudReceiver','provider','region'])wrappers.set(k,{hidden:false});
 const receiverLabel={textContent:''};
 const document={documentElement:{classList:{add(){},remove(){}},style:{setProperty(){}}},body:{classList:{add(){}}},head:{appendChild(){}},title:'',createElement:()=>({}),getElementById:element,
  querySelector(s){if(s==='.product-switcher')return {outerHTML:'<div class="product-switcher"></div>'};if(s==='main')return element('main');if(s==='.site-header')return {getBoundingClientRect:()=>({height:50})};if(s==='[data-forwarder-field="receiver"] .forwarder-field-label')return receiverLabel;const k=s.match(/^\[data-forwarder-field="(.*)"\]$/)?.[1];return k?wrappers.get(k):null},
  querySelectorAll(s){if(s==='[data-forwarder]')return [...fields.values()];return []}};
 const window={VersionCompassEvidence:{html:()=>''},VersionCompassTheme:{href:u=>u},VersionCompassReports:{decorate:h=>h},addEventListener:(type,fn)=>events[type]=fn,print(){}};
 const location={search:'?product=forwarders',href:'https://versioncompass.com/?product=forwarders'};
 const context={window,document,location,history:{replaceState(){}},navigator:{clipboard:{writeText:async()=>{}}},URLSearchParams,ResizeObserver:class{observe(){}}};
 for(const f of ['data.js','product-data.js','comparison.js','forwarders-data.js','forwarders.js','forwarders-ui.js'])vm.runInNewContext(fs.readFileSync('dist/'+f,'utf8'),context);
 assert.match(element('results').innerHTML,/Splunk Enterprise receiver/);
 assert(!element('results').innerHTML.includes('Cloud certificate renewal'));
 assert.equal(wrappers.get('cloudReceiver').hidden,true);assert.equal(wrappers.get('provider').hidden,true);
 assert.equal(receiverLabel.textContent,'Enterprise receiver');
 fields.get('destination').value='hybrid';fields.get('destination').change();
 assert.equal(wrappers.get('cloudReceiver').hidden,false);assert.equal(wrappers.get('provider').hidden,false);
 assert.match(element('results').innerHTML,/Splunk Enterprise receiver/);assert.match(element('results').innerHTML,/Splunk Cloud stack/);
 assert.match(element('results').innerHTML,/Two destination routing/);assert.equal(receiverLabel.textContent,'Enterprise receiver');
 assert.match(window.VersionCompassBuildSnapshot(),/Cloud stack: 10.5/);
 fields.get('destination').value='cloud';fields.get('destination').change();
 assert.equal(receiverLabel.textContent,'Cloud stack');assert(!element('results').innerHTML.includes('Splunk Enterprise receiver'));
 assert.match(window.VersionCompassBuildSnapshot(),/Cloud stack: 10.4/);
});
