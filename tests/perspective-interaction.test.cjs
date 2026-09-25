const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('perspective changes redraw in place, preserve route and scroll, and explain scope',()=>{
 const nodes=[];function el(tag='div'){const n={tagName:tag.toUpperCase(),children:[],attrs:{},events:{},classList:{add(){},remove(){}},append(...v){this.children.push(...v)},appendChild(v){this.children.push(v)},replaceWith(){},remove(){this.removed=true},prepend(v){this.children.unshift(v)},focus(){document.activeElement=this},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,fn){this.events[k]=fn},getBoundingClientRect(){return {height:100}},querySelector(s){if(s==='select')return this.select??=el('select');return null}};nodes.push(n);return n;}
 const header=el(),review=el();header.querySelector=()=>review;const box=el();box.hidden=false;box.querySelector=()=>null;
 const document={createElement:el,querySelector:()=>header,getElementById:()=>box,addEventListener(){},head:el(),documentElement:{classList:{add(){}},style:{setProperty(){}}}};
 const location={href:'https://versioncompass.com/?product=es&theme=cisco&csp=aws&perspective=overview',search:'?product=es&theme=cisco&csp=aws&perspective=overview',origin:'https://versioncompass.com',assign(){throw Error('Unexpected navigation')}};
 const history={state:null,replaceState(s,t,u){location.href=new URL(u,location.href).href},pushState(){}};
 let draws=0,scroll;const state={};const E={body(){return ''},enabled:()=>true,assess:()=>({active:true,errors:[],records:[{product:'es',regimes:['commercial']},{product:'platform',regimes:['commercial']}]})};
 const window={VersionCompassEnvironment:E,scrollX:0,scrollY:650,scrollTo(x){scroll=x},addEventListener(){}};
 vm.runInNewContext(fs.readFileSync('dist/perspectives.js','utf8'),{window,document,location,history,navigator:{},URL,URLSearchParams,ResizeObserver:class{observe(){}},requestAnimationFrame:f=>f(),matchMedia:()=>({matches:true})});
 window.VersionCompassPerspective.setRenderer(()=>{draws++;window.VersionCompassPerspective.describe(state)});
 const select=nodes.find(n=>n.tagName==='SELECT');select.events.change({target:{value:'security'}});
 assert.equal(draws,1);assert.equal(scroll.top,650);const u=new URL(location.href);assert.equal(u.searchParams.get('perspective'),'security');assert.equal(u.searchParams.get('theme'),'cisco');assert.equal(u.searchParams.get('csp'),'aws');assert.equal(u.searchParams.get('product'),'es');
 const status=nodes.find(n=>n.attrs.role==='status');assert.match(status.textContent,/1 of 2 records prioritized/);
 const controls=nodes.find(n=>n.className==='perspective-controls');
 assert.equal(controls.hidden,false);
 assert.ok(box.children.some(n=>n.className==='cloud-environment-heading'));
 assert.ok(!header.children.includes(controls));
 document.activeElement=select;
 select.events.change({target:{value:'application'}});
 assert.equal(document.activeElement,select);
 assert.match(status.textContent,/no matching priority records; full comparison retained/);
 box.hidden=true;window.VersionCompassPerspective.describe(state);
 assert.equal(box.hidden,true);assert.equal(controls.hidden,true);assert.equal(controls.removed,true);
 box.hidden=false;window.VersionCompassPerspective.describe(state);
 assert.equal(controls.hidden,false);assert.equal(select.value,'application');
 E.enabled=()=>false;window.VersionCompassPerspective.describe(state);assert.match(status.textContent,/not applicable/);
});
