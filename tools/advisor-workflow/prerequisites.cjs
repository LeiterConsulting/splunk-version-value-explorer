/* Closed typed prerequisite interpreter: data cannot supply code, field names or operators. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.VersionCompassPrerequisites=factory(root);})(typeof globalThis==='object'?globalThis:this,function(env){
'use strict';
const H=env.VersionCompassHash,T=env.WorkflowTyped,P=env.WorkflowPublic,clone=x=>JSON.parse(JSON.stringify(x));
const fields=new Set(['deployment','platformVersion','esVersion','cloudConnectVersion','itsiVersion','saiaVersion','mcpVersion','edition','runtimePolicy','region','modelRuntime']);
const ops=new Set(['all','any','case','minimum','exact-version','equals','contradiction','conflict','listed','unknown']);
const unknown=x=>x===undefined||x===null||x===''||x==='unknown';
function date(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;}
function version(v){return typeof v==='string'&&/^\d{1,3}\.\d{1,3}(?:\.\d{1,3}){0,2}$/.test(v)?v.split('.').map(Number):null;}
function compare(a,b){const x=version(a),y=version(b);if(!x||!y)return null;for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return Math.sign(d);}return 0;}
function validateNode(n,seen=new Set(),depth=0){
 if(!n||typeof n!=='object'||depth>12||typeof n.id!=='string'||!n.id||seen.has(n.id)||typeof n.label!=='string'||!ops.has(n.op))throw Error('Invalid typed node or identity.');seen.add(n.id);
 if(['minimum','exact-version','equals','contradiction','listed'].includes(n.op)&&!fields.has(n.field))throw Error('Missing typed predicate field.');
 if(n.field&&!fields.has(n.field))throw Error('Unrecognized typed context field.');
 if(['minimum','exact-version'].includes(n.op)&&!version(n.value))throw Error('Invalid typed version literal.');
 if(['all','any'].includes(n.op)){if(!Array.isArray(n.children)||!n.children.length)throw Error('Empty typed composition.');for(const c of n.children)validateNode(c,seen,depth+1);}
 if(n.op==='case'){if(n.field!=='deployment'||!n.branches||Object.keys(n.branches).some(k=>!['cloud','enterprise'].includes(k)))throw Error('Invalid typed deployment alternatives.');for(const c of Object.values(n.branches))validateNode(c,seen,depth+1);}
 if(n.op==='listed'&&(!Array.isArray(n.values)||!n.values.length||n.values.some(v=>typeof v!=='string'||!v)))throw Error('Invalid explicit location set.');
 if(n.op==='conflict'&&(!Array.isArray(n.alternatives)||n.alternatives.length<2||n.alternatives.some(v=>typeof v.label!=='string'||typeof v.statement!=='string'||!Array.isArray(v.sourceIds))))throw Error('Invalid scoped source conflict.');
 if(n.op==='contradiction'&&(!Array.isArray(n.alternatives)||n.alternatives.length<2||n.alternatives.some(x=>!version(x.minimum)||!Array.isArray(x.sourceIds))))throw Error('Invalid typed contradiction.');
 return true;
}
function admission(id){
 const rule=T.catalog.rules.find(r=>r.id===id);if(!rule)return {ok:false,status:'not-encoded',reason:'No typed prerequisite rule is encoded for this exact record.'};
 try{validateNode(rule.tree);if(rule.baseSourceIds&&(!Array.isArray(rule.baseSourceIds)||rule.baseSourceIds.some(id=>!rule.sourceIds.includes(id))))throw Error('Invalid scoped source subset.');}catch(e){return {ok:false,status:'changed',reason:e.message};}
 const record=P.guidance.aiAvailability.capabilities.find(r=>r.id===rule.recordId),sources=Object.fromEntries(rule.sourceIds.map(id=>[id,P.guidance.sources[id]]));
 if(H(JSON.stringify(T.catalog))!==T.admission.catalogHash||H(JSON.stringify(rule))!==T.admission.ruleHashes[id]||!record||record.id!==id||H(JSON.stringify({record,sources}))!==rule.canonicalDependencyHash)return {ok:false,status:'changed',reason:'The typed rule or its exact canonical claim/source dependencies differ from the reviewed admission.'};
 if(JSON.stringify(record.scope)!==JSON.stringify(rule.scope))return {ok:false,status:'changed',reason:'The stable record identity or exact scope changed.'};
 return {ok:true,status:'admitted-private-candidate',rule,record,sources};
}
function health(a,asOf){
 const day=new Date(asOf).toISOString().slice(0,10),sourceIds=a.rule.baseSourceIds||a.rule.sourceIds,sources=sourceIds.map(id=>a.sources[id]);
 if(sources.some(s=>!s?.url||s.withdrawn||s.outdatedAsOf||['withdrawn','outdated'].includes(s.status)))return {ok:false,status:'withdrawn',reason:'A required scoped source is missing, withdrawn or outdated.'};
 const clocks=[{value:a.record.verified,days:30},...sources.flatMap(s=>[{value:s.checked,days:14},{value:s.reviewed,days:30}])];
 if(clocks.some(c=>!date(c.value)||c.value>day))return {ok:false,status:'undated',reason:'A source or claim date is missing, invalid or future-dated.'};
 const due=clocks.map(c=>new Date(Date.parse(c.value+'T00:00:00Z')+c.days*86400000).toISOString().slice(0,10)).sort()[0];return {ok:day<=due,status:day<=due?'within-window':'stale',due,reason:day<=due?'Recorded review windows current; no live check occurred.':'A recorded source/assessment review window expired.'};
}
function aggregate(op,children){const states=children.map(x=>x.status).filter(x=>x!=='not-applicable');if(states.some(x=>['needs-review','withdrawn'].includes(x)))return 'needs-review';if(states.includes('conflict'))return 'conflict';if(op==='any'){if(states.includes('met'))return 'met';return states.includes('unknown')?'unknown':'gap';}if(states.includes('gap'))return 'gap';if(states.includes('unknown')||!states.length)return 'unknown';return 'met';}
function evaluateNode(n,context,active=true){
 const out={id:n.id,label:n.label,operator:n.op,field:n.field||null,status:'unknown',reported:n.field?context[n.field]??'unknown':null,expected:n.value??null,children:[]};
 if(!active){out.status='not-applicable';out.reason='This alternative is outside the selected deployment branch.';return out;}
 if(n.op==='unknown'){out.reason=n.label;return out;}
 if(n.op==='case'){
  const selected=context[n.field],known=Object.hasOwn(n.branches,selected);out.children=Object.entries(n.branches).map(([key,node])=>({...evaluateNode(node,context,known&&key===selected),branch:key}));out.status=known?out.children.find(x=>x.branch===selected).status:'unknown';out.reason=known?'Only the selected deployment alternative applies.':'Deployment is unknown; no alternative is silently selected.';return out;
 }
 if(['all','any'].includes(n.op)){out.children=n.children.map(x=>evaluateNode(x,context));out.status=aggregate(n.op,out.children);out.reason=n.op==='all'?'Every applicable prerequisite is retained, including mixed gaps and unknowns.':'Explicit alternatives are evaluated independently; no composite prose is guessed.';return out;}
 if(n.op==='conflict'){out.status='conflict';out.alternatives=clone(n.alternatives);out.reason='The scoped source statements remain inconsistent. A met numeric minimum does not settle current compatibility.';return out;}
 if(n.op==='contradiction'){out.status='conflict';out.alternatives=n.alternatives.map(x=>({...clone(x),reportedComparison:compare(context[n.field],x.minimum)===null?'unknown':compare(context[n.field],x.minimum)>=0?'meets':'below'}));out.reason=n.qualification;return out;}
 if(unknown(context[n.field])){out.reason='The relevant customer fact is missing.';return out;}
 if(n.op==='listed'){out.status=n.values.includes(context[n.field])?'met':'unknown';out.reason=out.status==='met'?'Listed for this exact feature; no tenant activation or data-residency guarantee.':'This reported location is not established by the feature list; absence is not universal unavailability.';return out;}
 if(n.op==='minimum'){const c=compare(context[n.field],n.value);out.status=c===null?'unknown':c<0?'gap':'met';out.reason=c===null?'Unrecognized numeric version.':'Numeric minimum only; no full pairing or recommended target.';return out;}
 if(n.op==='exact-version'){const c=compare(context[n.field],n.value);out.status=c===null?'unknown':c===0?'met':c<0?'gap':'unknown';out.reason=c===null?'Unrecognized numeric version.':c>0?'A newer package is not inherited from an exact version statement.':'Exact documented package comparison only; no overall compatibility.';return out;}
 if(n.op==='equals'){out.status=context[n.field]===n.value?'met':'gap';out.reason='Exact documented qualification; a reported match is not authenticated authorization.';return out;}
 return out;
}
function assess(id,context,scope,asOf=new Date().toISOString()){
 const a=admission(id),base={modelVersion:T.catalog.modelVersion,recordId:id,status:'unknown',sourceIds:[],trace:null,qualification:'Typed prerequisite projection of pinned public claims; self-reports are not verified environment facts.'};
 if(!a.ok)return {...base,status:a.status==='not-encoded'?'unknown':'needs-review',reason:a.reason,admission:a.status};
 if(scope.product!==a.rule.scope.product||scope.evidenceVersion!==a.rule.scope.evidenceVersion)return {...base,reason:'The product/evidence release does not match this typed rule.',admission:a.status};
 const h=health(a,asOf);if(!h.ok)return {...base,status:h.status==='withdrawn'?'withdrawn':'needs-review',reason:h.reason,health:h,admission:a.status};
 const trace=evaluateNode(a.rule.tree,context);return {...base,status:trace.status,trace,sourceIds:a.rule.baseSourceIds||a.rule.sourceIds,unresolvedSourceIds:a.rule.unresolvedSourceIdsByDeployment?.[context.deployment]||[],health:h,admission:a.status,claimAssessed:a.rule.claimAssessed,canonicalClaimAssessed:a.record.verified,originalRequirements:clone(a.rule.originalRequirements),reason:trace.reason};
}
function leaves(trace){return !trace?[]:trace.children?.length?trace.children.flatMap(leaves):[trace];}
return {admission,health,assess,evaluateNode,validateNode,compare,leaves,aggregate};
});
