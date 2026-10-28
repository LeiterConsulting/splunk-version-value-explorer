const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const nav=require('../dist/site-navigation.js');
test('one shared destination registry preserves existing URLs and separates planned Advisor from Ripple',()=>{
  assert.deepEqual(nav.destinations.filter(x=>x.group==='explore').map(x=>x.href),['/','/?view=es-editions','/?view=ai-availability','/?view=splunk-11']);
  assert.equal(nav.destinations.find(x=>x.id==='ripple').href,'/ripple');
  const advisor=nav.destinations.find(x=>x.id==='advisor');assert.equal(advisor.planned,true);assert.equal(advisor.href,undefined);
  for(const file of ['dist/index.html','tools/ripple/index.html']){const html=fs.readFileSync(file,'utf8');assert.match(html,/site-navigation\.js/);assert.match(html,/site-chrome\.css/);}
});
test('selection supports legacy editions and every Ripple route without changing comparison URLs',()=>{
  for(const [path,id] of [['/','release-guide'],['/?preview=es-editions','es-editions'],['/?view=ai-availability','ai-availability'],['/?view=splunk-11','splunk-11'],['/?view=about','about'],['/ripple?assessment=http2-iosxe','ripple'],['/ripple/updates','ripple']])assert.equal(nav.selected(new URL(path,'https://versioncompass.com')),id);
  const ripple=nav.destinations.find(x=>x.id==='ripple');assert.equal(nav.href(ripple,new URL('https://versioncompass.com/?theme=cisco&product=soar')),'/ripple?theme=cisco');
  assert.equal(nav.href(ripple,new URL('https://versioncompass.com/?theme=cisco&theme=cisco')),'/ripple');
});
