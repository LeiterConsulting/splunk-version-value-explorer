const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const navigation=require('../dist/site-navigation.js');

function runtime(theme='') {
  const listeners={};
  const node=()=>({children:[],classList:{add(){},remove(){}},append(...items){this.children.push(...items)},appendChild(item){this.children.push(item)},setAttribute(){},addEventListener(){},querySelector(){return node()},getBoundingClientRect(){return {height:100}}});
  const document={createElement:node,querySelector:node,head:node(),documentElement:{classList:{add(){}},style:{setProperty(){}}},addEventListener(type,listener){listeners[type]=listener}};
  const url=new URL('https://versioncompass.com/?product=es&platform=enterprise&host=10.4&from=8.6&to=8.7&csp=aws&perspective=security');
  if(theme)url.searchParams.set('theme',theme);
  const location={href:url.href,search:url.search,origin:url.origin};
  const history={replaceState(state,title,value){location.href=new URL(value,location.href).href},pushState(state,title,value){location.href=new URL(value,location.href).href}};
  let copied;
  const navigator={clipboard:{writeText(value){copied=value}}};
  const window={VersionCompassEnvironment:{body(){}},addEventListener(){},SPLUNK_DATA:{guidance:JSON.parse(fs.readFileSync('content/datasets/guidance.json'))}};
  const context={window,document,location,history,navigator,URL,URLSearchParams,ResizeObserver:class{observe(){}}};
  vm.runInNewContext(fs.readFileSync('dist/perspectives.js','utf8'),context);
  vm.runInNewContext(fs.readFileSync('dist/prep11.js','utf8'),context);
  return {location,history,prep:window.VersionCompassPrep11,
    click(href){const anchor={href:new URL(href,location.href).href};listeners.click({target:{closest:()=>anchor}});return new URL(anchor.href,location.href)},
    copy(href){navigator.clipboard.writeText(href);return copied}};
}

test('comparison Explore links open valid Prep11 with only the intended theme',()=>{
  for(const theme of ['','cisco']) {
    const r=runtime(theme),before=r.location.href;
    const destination=navigation.destinations.find(item=>item.id==='splunk-11');
    const href=navigation.href(destination,new URL(before));
    const target=r.click(href);
    assert.equal(target.search,'?view=splunk-11'+(theme?'&theme=cisco':''));
    assert.equal(target.searchParams.has('perspective'),false);
    assert.equal(r.prep.read(target.search).errors.length,0);
    assert.equal(r.location.href,before,'Destination navigation must not alter the source comparison');
  }
});

test('Prep11 shared links retain exact input through perspective click, history and clipboard hooks',()=>{
  for(const theme of ['','cisco']) {
    const r=runtime(theme);
    const query='?view=splunk-11&area=apps&updates=context&q=apps%20%26%20scripts'+(theme?'&theme=cisco':'');
    const target='https://versioncompass.com/'+query+'#prep11-prepare';
    assert.equal(r.click(target).href,target);
    assert.equal(r.copy(target),target);
    for(const method of ['replaceState','pushState']) {
      r.history[method](null,'',target);
      assert.equal(r.location.href,target,method);
    }
    const read=r.prep.read(query);
    assert.equal(read.errors.length,0);
    assert.equal(read.state.area,'apps');assert.equal(read.state.q,'apps & scripts');
  }
});

test('perspective preservation keeps comparison intent and never repairs invalid Prep11 input implicitly',()=>{
  const r=runtime('cisco');
  for(const query of ['?view=splunk-11&perspective=security','?view=splunk-11&from=9.4&to=11.0','?view=splunk-11&view=about','?view=splunk-11&lab=unknown']) {
    const target='https://versioncompass.com/'+query;
    assert.equal(r.click(target).href,target);
    assert.equal(r.copy(target),target);
    const read=r.prep.read(query);assert(read.errors.length);assert.equal(read.original,query);
  }
  const comparison=r.click('/?product=es&from=8.6&to=8.7&host=10.4#technical-title');
  assert.equal(comparison.searchParams.get('perspective'),'security');
  assert.equal(comparison.searchParams.get('from'),'8.6');assert.equal(comparison.hash,'#technical-title');
  for(const view of ['ai-availability','advisor'])assert.equal(r.click('/?view='+view).searchParams.has('perspective'),false);
  assert.equal(r.click('https://help.splunk.com/?view=splunk-11').href,'https://help.splunk.com/?view=splunk-11');
});
