/* Deterministic bounded evidence graph. Version order is never evidence. */
(function(root){
'use strict';
const types=['introduce','change','remove','fix','regression','backport','supersede','assessment','documentation-correction'];
const relations=['precedes','inherits','supersedes','backport-of','supported-upgrade'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function version(v){if(typeof v!=='string'||!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?$/.test(v))throw Error('An exact three or four component version is required');const n=v.split('.').map(Number);if(n.some(x=>!Number.isSafeInteger(x)))throw Error('Version component exceeds safe integer');return n;}
function order(a,b){const x=version(a),y=version(b);for(let i=0;i<Math.max(x.length,y.length);i++){if((x[i]||0)!==(y[i]||0))return (x[i]||0)>(y[i]||0)?1:-1;}return 0;}
const key=r=>r.product+':'+r.component+':'+r.version;
const validDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
function scopeMatches(scope,r){return scope.product===r.product&&scope.component===r.component&&scope.branch===r.branch&&(scope.versions?scope.versions.includes(r.version):order(r.version,scope.from)>=0&&order(r.version,scope.through)<=0);}
function validate(g,sources){
 if(g.schemaVersion!==1)throw Error('Unsupported exact-release schema');
 const all=[...g.branches,...g.releases,...g.entities,...g.claims,...g.events,...g.relationships];
 const ids=new Set();for(const n of all){if(!n.id||ids.has(n.id))throw Error('Duplicate graph identity');ids.add(n.id);}
 const releases=new Map(g.releases.map(r=>[r.id,r])),claims=new Map(g.claims.map(c=>[c.id,c])),events=new Map(g.events.map(e=>[e.id,e]));
 const ref=src=>{if(!src?.length||src.some(id=>!sources[id]||!/^https:\/\/(help|advisory)\.splunk\.com\//.test(sources[id].url)))throw Error('Missing public scoped evidence');};
 const date=validDate;
 for(const r of g.releases){version(r.version);const b=g.branches.find(b=>b.id===r.branch);if(!b||!r.version.startsWith(b.version+'.')||r.id!==key(r))throw Error('Invalid release identity or branch');ref(r.src);}
 for(const c of g.claims){if(!g.entities.some(e=>e.id===c.entity&&e.components.includes(c.scope.component))||!g.branches.some(b=>b.id===c.scope.branch)||!c.state)throw Error('Dangling claim scope');if(c.scope.versions){if(!c.scope.versions.length||new Set(c.scope.versions).size!==c.scope.versions.length)throw Error('Empty or repeated exact scope');c.scope.versions.forEach(version);}else{version(c.scope.from);version(c.scope.through);if(order(c.scope.from,c.scope.through)>0)throw Error('Inverted evidence scope');}if(!g.releases.some(r=>scopeMatches(c.scope,r)))throw Error('Unbounded or empty claim scope');if(!c.assessments?.length)throw Error('Missing assessment history');const dates=new Set();for(const a of c.assessments){if(!date(a.date)||dates.has(a.date)||!['supported','uncertain','withdrawn'].includes(a.status)||!a.section||!a.reason)throw Error('Invalid or ambiguous scoped assessment');dates.add(a.date);ref(a.src);} }
 for(const e of g.events){if(!types.includes(e.type)||!releases.has(e.release)||!e.claims.length||e.claims.some(id=>!claims.has(id)||!scopeMatches(claims.get(id).scope,releases.get(e.release))))throw Error('Invalid change event');}
 const used=g.events.flatMap(e=>e.claims);if(g.claims.some(c=>!used.includes(c.id)))throw Error('Claim has no event provenance');
 for(const e of g.relationships){if(!relations.includes(e.type))throw Error('Unknown relationship type');ref(e.src);const map=['precedes','supported-upgrade'].includes(e.type)?releases:e.type==='backport-of'?events:claims;if(!map.has(e.from)||!map.has(e.to)||e.from===e.to)throw Error('Dangling relationship');if(e.type==='precedes'){const a=releases.get(e.from),b=releases.get(e.to);if(a.branch!==b.branch||a.product!==b.product||a.component!==b.component||order(a.version,b.version)>=0)throw Error('Ambiguous release ordering');}if(['inherits','supersedes'].includes(e.type)){const a=claims.get(e.from),b=claims.get(e.to);if(a.entity!==b.entity||a.scope.product!==b.scope.product||a.scope.component!==b.scope.component)throw Error('Cross-scope evidence relationship');if(e.type==='inherits'&&(a.state!==b.state||!e.qualification))throw Error('Unsupported inheritance');} }
 for(const type of relations){const edges=g.relationships.filter(e=>e.type===type),done=new Set(),active=new Set();function visit(id){if(active.has(id))throw Error('Cycle in '+type);if(done.has(id))return;active.add(id);edges.filter(e=>e.from===id).forEach(e=>visit(e.to));active.delete(id);done.add(id);}edges.forEach(e=>visit(e.from));}
 for(const e of g.relationships){if(e.type!=='precedes'&&!validDate(e.assessed))throw Error('Relationship assessment date required');if(e.type==='inherits'&&g.relationships.filter(x=>x.type==='inherits'&&x.from===e.from).length>1)throw Error('Ambiguous inheritance');if(e.type==='supported-upgrade'){const a=releases.get(e.from),b=releases.get(e.to);if(a.product!==b.product||a.component!==b.component||order(a.version,b.version)>=0||!e.qualification)throw Error('Invalid supported upgrade scope');}}
 return true;
}
function assessment(c,asOf){return c.assessments.filter(a=>a.date<=asOf).sort((a,b)=>b.date.localeCompare(a.date))[0];}
function resolved(g,c,asOf){const own=assessment(c,asOf);if(!own)return null;const edge=g.relationships.find(e=>e.type==='inherits'&&e.from===c.id);if(!edge)return {...own,verificationDate:own.date,inheritedFrom:[]};const parent=edge.assessed<=asOf?resolved(g,g.claims.find(x=>x.id===edge.to),asOf):null;return {...own,status:parent?.status==='supported'?own.status:'uncertain',verificationDate:parent?.verificationDate&&parent.verificationDate<own.date?parent.verificationDate:own.date,inheritedFrom:[edge.to,...(parent?.inheritedFrom||[])],inheritanceQualification:edge.qualification};}
function snapshot(g,sources,releaseId,asOf){
 validate(g,sources);if(!validDate(asOf))throw Error('Assessment date required');
 const r=g.releases.find(r=>r.id===releaseId);if(!r)throw Error('Release is outside this pilot');
 const rows=g.entities.filter(e=>e.components.includes(r.component)).map(entity=>{
  const history=g.claims.filter(c=>c.entity===entity.id&&scopeMatches(c.scope,r)).map(c=>({...c,assessment:resolved(g,c,asOf)})).filter(c=>c.assessment);
  const matched=history.filter(c=>c.assessment.status!=='withdrawn');
  const superseded=g.relationships.filter(e=>e.type==='supersedes'&&e.assessed<=asOf&&matched.some(c=>c.id===e.from&&c.assessment.status==='supported')).map(e=>e.to);
  const active=matched.filter(c=>!superseded.includes(c.id)),states=[...new Set(active.map(c=>c.state))];
  const freshness=active.some(c=>(Date.parse(asOf)-Date.parse(c.assessment.verificationDate))/86400000>g.reviewWindowDays)?'stale':active.length?'within-review-window':'unassessed';
  const status=states.length>1?'conflicting':!active.length?'unknown':active.some(c=>c.assessment.status==='uncertain')?'uncertain':states[0];
  return {entity:entity.id,title:entity.title,status,freshness,claims:active,history,explanation:active.length?'Evidence matches '+r.product+' / '+r.component+' / '+r.branch+' / '+r.version+'. No applicability was inferred from release ordering.':'No assessed claim matches this exact component and bounded release scope. Absence of evidence is not absence of capability or risk.'};
 });return {release:r,asOf,rows};
}
function compare(g,sources,input){
 if(!input||Object.keys(input).some(k=>!['from','to','asOf','route'].includes(k)))throw Error('Unknown comparison field');
 const from=snapshot(g,sources,input.from,input.asOf),to=snapshot(g,sources,input.to,input.asOf);
 if(from.release.product!==to.release.product||from.release.component!==to.release.component)throw Error('Select the same product and component');
 if(order(from.release.version,to.release.version)>=0)throw Error('Select a later distinct target; identifiers are never rounded');
 const rows=to.rows.map(row=>{const before=from.rows.find(r=>r.entity===row.entity);return {entity:row.entity,title:row.title,from:before,to:row,net:before.status===row.status?'same assessed state':'different assessed state'};});
 const relevant=g.releases.filter(r=>r.product===to.release.product&&r.component===to.release.component&&[from.release.branch,to.release.branch].includes(r.branch));
 const eventAvailable=e=>e.claims.some(id=>assessment(g.claims.find(c=>c.id===id),input.asOf)?.status==='supported');
 const intervalEvents=g.events.filter(e=>eventAvailable(e)&&e.softwareChange!==false&&e.type!=='documentation-correction'&&relevant.some(r=>r.id===e.release&&order(r.version,from.release.version)>0&&order(r.version,to.release.version)<=0)).sort((a,b)=>order(g.releases.find(r=>r.id===a.release).version,g.releases.find(r=>r.id===b.release).version)||a.id.localeCompare(b.id));
 const route=input.route;
 let path={status:'unknown',nodes:[],events:[],reason:'No exact supported upgrade route has been assessed in this pilot. The timeline is a release catalog, not installation instructions.'};
 if(route){if(!Array.isArray(route)||route.length<2||route.length>30||route[0]!==input.from||route.at(-1)!==input.to||new Set(route).size!==route.length)throw Error('Invalid or cyclic route');for(let i=1;i<route.length;i++){if(!g.relationships.some(e=>e.type==='supported-upgrade'&&e.assessed<=input.asOf&&e.from===route[i-1]&&e.to===route[i]))throw Error('Unsupported exact upgrade edge');}path={status:'assessed-edges',nodes:route,events:g.events.filter(e=>eventAvailable(e)&&e.softwareChange!==false&&e.type!=='documentation-correction'&&route.slice(1).includes(e.release)).sort((a,b)=>route.indexOf(a.release)-route.indexOf(b.release)||a.id.localeCompare(b.id)),reason:'Only the explicitly evidenced edges are represented; environment prerequisites remain outside this pilot.'};}
 return {schemaVersion:1,from,to,rows,intervalEvents,path,boundary:g.boundary};
}
function read(search,g){const p=new URLSearchParams(search),errors=[],allowed=['view','from','to','component','theme','asOf'];for(const [k]of p){if(!allowed.includes(k))errors.push('Unknown parameter: '+k);if(p.getAll(k).length>1&&!errors.includes('Repeated parameter: '+k))errors.push('Repeated parameter: '+k);}for(const k of ['component','from','to','asOf'])if(p.has(k)&&p.get(k)==='')errors.push('Empty parameter: '+k);if(p.get('view')!=='exact-releases')errors.push('Exact release view required');const component=p.get('component')||'enterprise';if(!['enterprise','universal-forwarder'].includes(component))errors.push('Component is outside this pilot');if(p.has('theme')&&p.get('theme')!=='cisco')errors.push('Unknown theme');const state={component,from:p.get('from')||(component==='enterprise'?'9.4.15':'10.4.2'),to:p.get('to')||(component==='enterprise'?'10.4.4':'10.4.3'),asOf:p.get('asOf')||new Date().toISOString().slice(0,10),theme:p.get('theme')||''};for(const v of [state.from,state.to]){try{version(v);if(!g.releases.some(r=>r.component===component&&r.version===v))errors.push('Release outside pilot: '+v);}catch(e){errors.push(e.message);}}return {state,errors};}
function url(s){const p=new URLSearchParams({view:'exact-releases',component:s.component,from:s.from,to:s.to,asOf:s.asOf});if(s.theme)p.set('theme',s.theme);return '/?'+p;}
function input(s){return {from:'splunk:'+s.component+':'+s.from,to:'splunk:'+s.component+':'+s.to,asOf:s.asOf};}
const api={version,order,key,scopeMatches,validate,snapshot,compare,read,url,input,esc,types,relations};
if(typeof module==='object'&&module.exports)module.exports=api;
root.VersionCompassExactReleases=api;
}(typeof window==='object'?window:globalThis));
