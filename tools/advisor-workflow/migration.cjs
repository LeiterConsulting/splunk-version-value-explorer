(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.VersionCompassWorkflowMigration=factory(root);})(typeof globalThis==='object'?globalThis:this,function(env){
'use strict';
const A=env.VersionCompassAdvisor,M=env.AdvisorWorkflow;
function readIntent(search){return search?A.read(search):{state:A.normalize(),errors:[],legacy:null};}
function intentURL(goal,theme){return A.url({goal},theme==='cisco'?'cisco':'');}
function publicIntentLink(goal,theme){return 'https://versioncompass.com'+intentURL(goal,theme);}
function fragment(hash){
 const original=hash||'';let id;try{id=decodeURIComponent(original.replace(/^#/,''));}catch{return {original,error:'The section fragment has invalid encoding.'};}
 const views={draft:'draft',context:'context',review:'review',audit:'audit','workflow-main':'draft','advisor-title':'draft','advisor-decisions':'context','advisor-context':'context','advisor-results':'review','advisor-sources':'audit','advisor-scope':'audit'};
 if(!id)return {original,view:null};
 if(Object.hasOwn(views,id))return {original,view:views[id]};
 if(/^public-[a-zA-Z0-9_-]+$/.test(id)&&Object.hasOwn(env.WorkflowPublic.guidance.sources,id.slice(7)))return {original,view:'review',citation:id};
 return {original,error:'This section is not recognized. The original fragment remains in the address bar; choose a workflow section explicitly.'};
}
function importProfile(raw){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>50000)throw Error('Legacy profile must be JSON under 50 kB.');
 const x=JSON.parse(raw);if(!x||![1,2].includes(x.schemaVersion)||!x.profile||typeof x.profile!=="object"||Array.isArray(x.profile)||Object.keys(x).some(k=>!['schemaVersion','profile'].includes(k)))throw Error('Not an existing Advisor schema 1/2 context profile.');
 if(Object.keys(x.profile).some(k=>!Object.hasOwn(A.defaults,k))||Object.values(x.profile).some(v=>typeof v!=='string'||v.length>100))throw Error('Legacy profile has unsupported context fields or types.');
 const state=A.normalize(x.profile),d=M.newBrief('Imported Advisor context - review required');
 const warnings=Object.entries(x.profile).filter(([key,value])=>value!==state[key]).map(([field,original])=>({field,original,used:state[field],reason:'Unsupported or ambiguous legacy value; not treated as an assessed fact. Review and correct it explicitly.'}));
 const context={...state};delete context.goal;M.updateContext(d,context);
 if(A.definition(state.goal))M.updateMeta(d,{activeGoal:state.goal});
 M.event(d,'legacy-profile-imported',d.id,null,{schemaVersion:x.schemaVersion,originalProfile:x.profile,warnings,qualification:'Self-reported legacy context only; no requirement acceptance or assessment was imported.'});
 return {document:d,legacy:A.legacy[state.goal]||null,originalGoal:x.profile.goal||'unknown',warnings};
}
function prepareHandoff(doc,at=new Date().toISOString()){
 if(!M.exportGate(doc,at).ok||doc.activeGoal!=='agent-mode')return null;
 return A.handoff({...doc.context,goal:'agent-mode'},at);
}
function consumeHandoff(raw,at=new Date().toISOString()){
 try{const c=JSON.parse(raw),created=Date.parse(c.createdAt),expiry=Date.parse(c.expiresAt),now=Date.parse(at);
 if(c.schemaVersion!==1||c.goal!=='agent-mode'||!A.version(c.reportedVersion)||c.releaseLine!==c.reportedVersion.split('.').slice(0,2).join('.')||c.documentedMinimum!=='10.1.x+'||!Number.isFinite(created)||!Number.isFinite(expiry)||expiry-created!==600000||created>now||expiry<=now)return null;return c;}catch{return null;}
}
function handoffURL(theme){const useGuide=env.WorkflowBuild?.handoffMode==="release-guide"&&(!env.location||["http:","https:"].includes(env.location.protocol));return (useGuide?"/?product=platform&platform=enterprise":"advisor-workflow-guide-handoff.html?product=platform&platform=enterprise")+(theme==="cisco"?"&theme=cisco":"");}
return {handoffURL,readIntent,intentURL,publicIntentLink,fragment,importProfile,prepareHandoff,consumeHandoff};
});
