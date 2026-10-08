const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('fs'),vm=require('vm');
function theme(search){const styles=[],classes=[],links=[{href:'./'},{href:'?view=es-editions'}];links.forEach(l=>{l.getAttribute=k=>l[k];l.setAttribute=(k,v)=>l[k]=v;});const window={location:{search,href:'https://versioncompass.com/'+search,origin:'https://versioncompass.com'}};const document={documentElement:{classList:{add:c=>classes.push(c)}},createElement:()=>({}),head:{appendChild:l=>styles.push(l)},querySelectorAll:()=>links};vm.runInNewContext(fs.readFileSync('dist/theme.js','utf8'),{window,document,URL,URLSearchParams});return {theme:window.VersionCompassTheme,styles,classes,links};}
test('theme is exact opt-in, cosmetic, and retained in internal links only',()=>{
 for(const q of ['', '?theme=other','?theme=cisco&theme=cisco']){const r=theme(q);assert(!r.theme.active);assert.equal(r.styles.length,0);assert.equal(r.theme.href('?view=es-editions'),'?view=es-editions');}
 const r=theme('?view=es-editions&theme=cisco');assert(r.theme.active);assert.equal(r.styles[0].href,'theme-cisco.css');assert.equal(r.links[1]['aria-current'],'page');assert.equal(r.theme.href('?view=es-editions&q=SOAR#edition-matrix-title'),'/?view=es-editions&q=SOAR&theme=cisco#edition-matrix-title');assert.equal(r.theme.href('https://help.splunk.com/example'),'https://help.splunk.com/example');assert.equal(r.theme.href('/?product=es&from=8.6&to=8.7'),'/?product=es&from=8.6&to=8.7&theme=cisco');
});
test('saved SOAR reports retain the selected palette when printed',()=>{
 const report='<header class="report-title"><h1>SOAR 8.6.0 to 8.7.0</h1></header><table class="soar-requirements"><tr><td>Python 3.13</td></tr></table>';
 for(const cisco of [false,true]){
  const c={window:{VersionCompassRevision:{id:'test-revision'}},document:{documentElement:{classList:{contains:()=>cisco}},addEventListener(){}},URL,
   DOMParser:class{parseFromString(html){return {body:{innerHTML:html},querySelector:s=>s==='.soar-requirements'?{}:null,querySelectorAll:()=>[]};}}};
  vm.runInNewContext(fs.readFileSync('dist/report-tools.js','utf8'),c);
  const html=c.window.VersionCompassReports.snapshotDocument(report,'https://versioncompass.com/?product=soar'+(cisco?'&theme=cisco':''),'2026-10-08');
  assert(html.includes(report));
  if(cisco){assert.match(html,/background:#05070e!important;color:#e9edf6!important/);assert.match(html,/a\{color:#8ed9ff!important\}/);assert(!html.includes('background:white!important'));assert.match(html,/print-color-adjust:exact/);}
  else{assert.match(html,/background:white!important;color:#17243a!important/);assert.match(html,/a\{color:#165d3e!important\}/);assert(!html.includes('background:#05070e'));}
 }
});
