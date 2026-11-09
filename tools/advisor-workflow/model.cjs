/* Private workflow adapter. Public facts and evaluators remain in their pinned snapshot. */
(function(root,factory){
 if(typeof module==="object"&&module.exports)module.exports=factory;
 else root.AdvisorWorkflow=factory(root);
})(typeof globalThis==="object"?globalThis:this,function(env){
"use strict";
const T=env.VersionCompassPrerequisites,B=env.WorkflowBuild;
const A=env.VersionCompassAdvisor,AI=env.VersionCompassAIAvailability,X=env.VersionCompassExactReleases,H=env.VersionCompassHash,P=env.WorkflowPublic;
const clone=x=>JSON.parse(JSON.stringify(x)), day=x=>new Date(x).toISOString().slice(0,10);
const now=()=>new Date().toISOString(), text=(x,n=10000)=>{if(x!==undefined&&x!==null&&typeof x!=="string")throw Error("Text fields must be strings.");if((x??"").length>n)throw Error("Text exceeds the supported field limit of "+n+" characters; split the original without silently changing it.");return x??"";};
const badKeys=new Set(["__proto__","constructor","prototype"]);
const choices={deployment:["unknown","cloud","enterprise"],compliance:["unknown","commercial","fr-m","fr-h"],edition:["unknown","essentials","premier"],access:["unknown","yes","no"],csp:["all","aws","azure","gcp"],runtimePolicy:["unknown","frontier","splunk-hosted","byo"],modelRuntime:["unknown","enabled","disabled"],entitlement:["unknown","reported","not-confirmed"]};
const contextKeys=[...Object.keys(A.defaults).filter(k=>k!=="goal"),"csp","runtimePolicy","modelRuntime","entitlement","customerNotes"];
function defaults(){return {...A.defaults,csp:"all",runtimePolicy:"unknown",modelRuntime:"unknown",entitlement:"unknown",customerNotes:""};}
function id(prefix){return prefix+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8);}
function validId(s){return typeof s==="string"&&/^[A-Za-z][A-Za-z0-9_-]{0,70}$/.test(s);}
function safeJSON(v){return JSON.stringify(v).replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");}
function walk(v,depth=0){
 if(depth>18)throw Error("Import nesting exceeds the supported limit.");
 if(typeof v==="string"&&v.length>30000)throw Error("An imported field exceeds 30,000 characters.");
 if(!v||typeof v!=="object")return;
 for(const [k,x]of Object.entries(v)){if(badKeys.has(k))throw Error("Prototype keys are not allowed.");walk(x,depth+1);}
}
function keys(v,allowed,label){if(!v||typeof v!=="object"||Array.isArray(v))throw Error(label+" must be an object.");for(const k of Object.keys(v))if(!allowed.includes(k))throw Error("Unsupported "+label+" field: "+k);}
function stringField(x,n,label,empty=true){if(typeof x!=="string"||x.length>n||(!empty&&!x.trim()))throw Error("Invalid "+label+" text.");}
function dateField(x){if(typeof x!=="string"||!/^\d{4}-\d{2}-\d{2}T/.test(x)||!Number.isFinite(Date.parse(x)))throw Error("Invalid record date.");}
function canonical(d){return {title:d.title,alias:d.alias,context:d.context,statements:d.statements,requirements:d.requirements,materials:d.materials,activeGoal:d.activeGoal};}
function inputHash(d){return H(JSON.stringify(canonical(d)));}
function publicIntegrity(){return H(JSON.stringify(env.VersionCompassWorkflowScope.project(env.SPLUNK_DATA?.guidance,env.VersionCompassEnvironmentData,P.scopeSourceIds)))===P.sha256;}
function event(d,action,target,before,after,at=now()){
 if(d.audit.length>=(action==="imported-for-review"?3000:2999))throw Error("This prototype has reached its audit capacity; this edit was not saved. Preserve this JSON and start a new brief.");
 const payload={seq:d.audit.length+1,at,action,target,before:clone(before??null),after:clone(after??null),previous:d.audit.at(-1)?.hash||"root"};
 const e={...payload,hash:H(JSON.stringify(payload))};d.audit.push(e);d.revision++;
 if(action!=="imported-for-review"&&new TextEncoder().encode(exportJSON(d)).length>2*1024*1024)throw Error("The complete private draft and history would exceed the 2 MiB round-trip limit. Start another brief for additional material; this edit was not saved.");
 return e;
}
function verifyAudit(audit){
 if(!Array.isArray(audit)||audit.length>3000)throw Error("Audit history exceeds the supported limit.");
 let previous="root";
 for(let i=0;i<audit.length;i++){
  const e=audit[i];keys(e,["seq","at","action","target","before","after","previous","hash"],"audit");
  stringField(e.action,80,"audit action",false);stringField(e.target,100,"audit target",false);dateField(e.at);
  if(e.seq!==i+1||e.previous!==previous||typeof e.hash!=="string"||!/^[a-f0-9]{64}$/.test(e.hash))throw Error("Audit sequence or date is invalid.");
  const {hash,...payload}=e;if(hash!==H(JSON.stringify(payload)))throw Error("Audit integrity check failed.");
  previous=hash;
 }
 return true;
}
function newBrief(title="Untitled requirement brief",at=now()){
 const d={schemaVersion:2,kind:"advisor-private-brief",id:id("B"),title:text(title,160),alias:"",context:defaults(),statements:[],requirements:[],materials:[],audit:[],revision:0,activeGoal:"unknown",theme:"light",built:null};
 event(d,"created",d.id,null,{title:d.title},at);return d;
}
function dirty(d){return !d.built||d.built.inputHash!==inputHash(d)||d.built.revision!==d.revision;}
function updateMeta(d,patch,at=now()){
 keys(patch,["title","alias","activeGoal"],"brief edit");const before={};
 for(const [k,v]of Object.entries(patch)){if(k==="title"&&!text(v,160).trim())throw Error("A brief title is required.");before[k]=d[k];if(k==="activeGoal"&&v!=="unknown"&&!Object.hasOwn(A.goals,v))throw Error("Unsupported decision path.");d[k]=text(v,k==="title"?160:120);}
 event(d,"brief-edited",d.id,before,patch,at);
}
function updateContext(d,patch,at=now()){
 keys(patch,contextKeys,"context");const before={};
 for(const[k,v]of Object.entries(patch)){
  if(choices[k]&&!choices[k].includes(v))throw Error("Unsupported context selection: "+k);
  before[k]=d.context[k];d.context[k]=text(v,k==="customerNotes"?10000:100);
 }
 event(d,"context-edited",d.id,before,patch,at);
}
function addStatement(d,input,at=now()){
 keys(input,["text","sourceTitle","locator","origin","supersedes"],"statement");
 if(!text(input.text).trim())throw Error("An original statement is required.");
 if(d.statements.length>=100)throw Error("This prototype supports at most 100 original statements.");
 if(input.supersedes&&!d.statements.some(s=>s.id===input.supersedes))throw Error("The earlier statement is missing.");
 if(input.sourceTitle&&!text(input.sourceTitle,200).trim())throw Error("A source title is required.");
 const s={id:id("S"),text:text(input.text),sourceTitle:text(input.sourceTitle||"User-authored brief",200),locator:text(input.locator,300),origin:["user-authored","vendor-claim","private-import"].includes(input.origin)?input.origin:"user-authored",supersedes:input.supersedes||null,createdAt:at};
 d.statements.push(s);event(d,"statement-added",s.id,null,s,at);return s;
}
function mapping(m={}){
 keys(m,["kind","ref","relation","checkField","releaseId","desiredState"],"mapping");
 const out={kind:m.kind||"none",ref:text(m.ref,100),relation:m.relation==="direct"?"direct":"related",checkField:text(m.checkField,40),releaseId:text(m.releaseId,100),desiredState:text(m.desiredState,100)};
 if(!["none","capability","decision","exact"].includes(out.kind))throw Error("Unsupported evidence mapping.");
 if(out.kind==="capability"&&!AI.data().capabilities.some(r=>r.id===out.ref))throw Error("Capability is not in the pinned public catalog.");
 if(out.kind==="decision"&&!Object.hasOwn(A.goals,out.ref))throw Error("Decision is not in the admitted public catalog.");
 if(out.checkField&&!["platformVersion","itsiVersion","saiaVersion","mcpVersion","esVersion","cloudConnectVersion"].includes(out.checkField))throw Error("Unsupported minimum comparison field.");
 if(out.kind==="exact"&&(!P.guidance.exactReleases.entities.some(e=>e.id===out.ref)||!P.guidance.exactReleases.releases.some(r=>r.id===out.releaseId)))throw Error("Exact identity is outside the bounded research pilot.");
 if(out.kind==="exact"&&out.desiredState&&!P.guidance.exactReleases.claims.some(c=>c.entity===out.ref&&c.state===out.desiredState))throw Error("Desired state is not represented by this bounded entity.");
 return out;
}
function scope(s={}){keys(s,["product","evidenceVersion","component"],"scope");return {product:text(s.product||"unknown",40),evidenceVersion:text(s.evidenceVersion,80),component:text(s.component,80)};}
function saveRequirement(d,input,at=now()){
 keys(input,["id","statementId","title","interpretation","criterion","classification","mapping","scope","review","reviewerNote","archived","acceptRevision","revision","updatedAt"],"requirement");
 const old=input.id?d.requirements.find(r=>r.id===input.id):null;
 if(input.id&&!old)throw Error("Requirement identity is missing.");
 if(!d.statements.some(s=>s.id===input.statementId))throw Error("Choose an existing original statement.");
 if(!text(input.title,200).trim()||!text(input.criterion).trim())throw Error("A title and one acceptance criterion are required.");
 if(!old&&d.requirements.length>=80)throw Error("This prototype supports at most 80 requirements.");
 const classification=input.classification==="composite"?"composite":"atomic";
 const review=["proposed","accepted","clarify","out-of-scope"].includes(input.review)?input.review:"proposed";
 if(classification==="composite"&&review==="accepted")throw Error("Split the composite requirement before accepting atomic criteria.");
 const r={id:old?.id||id("R"),statementId:input.statementId,title:text(input.title,200),interpretation:text(input.interpretation),criterion:text(input.criterion),classification,mapping:mapping(input.mapping||{}),scope:scope(input.scope||{}),review,reviewerNote:text(input.reviewerNote,5000),archived:!!input.archived,revision:(old?.revision||0)+1,updatedAt:at};
 if(old&&r.review==="accepted"&&!input.acceptRevision&&["title","interpretation","criterion","classification","statementId","mapping","scope"].some(k=>JSON.stringify(old[k])!==JSON.stringify(r[k])))r.review="proposed";
 if(old)d.requirements[d.requirements.indexOf(old)]=r;else d.requirements.push(r);
 event(d,old?"requirement-revised":"requirement-added",r.id,old,r,at);return r;
}
function addMaterial(d,input,at=now()){
 keys(input,["requirementId","title","url","quote","concern"],"private material");
 if(!d.requirements.some(r=>r.id===input.requirementId))throw Error("Choose the requirement this material relates to.");
 if(input.url&&!/^https:\/\/[^\s<>]+$/i.test(input.url))throw Error("Reference URLs must be HTTPS text. They are never fetched.");
 if(d.materials.length>=150)throw Error("Too many private evidence items.");
 const m={id:id("P"),requirementId:input.requirementId,title:text(input.title||"Private review material",200),url:text(input.url,2000),quote:text(input.quote),concern:["note","contradiction","withdrawal"].includes(input.concern)?input.concern:"note",status:"unassessed-private",createdAt:at};
 d.materials.push(m);event(d,"private-material-added",m.id,null,m,at);return m;
}
function verifyDocument(d){
 keys(d,["schemaVersion","kind","id","title","alias","context","statements","requirements","materials","audit","revision","activeGoal","theme","built"],"document");
 if(d.schemaVersion!==2||d.kind!=="advisor-private-brief"||!validId(d.id))throw Error("Unsupported brief identity.");
 stringField(d.title,160,"title",false);stringField(d.alias,120,"alias");
 if(!["light","dark","cisco"].includes(d.theme))throw Error("Invalid theme.");
 if(!Array.isArray(d.statements)||d.statements.length>100||!Array.isArray(d.requirements)||d.requirements.length>80||!Array.isArray(d.materials)||d.materials.length>150)throw Error("Import exceeds supported record counts.");
 verifyAudit(d.audit);if(!Number.isSafeInteger(d.revision)||d.revision!==d.audit.length)throw Error("Document revision does not match the audit index.");
 keys(d.context,["goal",...contextKeys],"context");
 if(Object.keys(defaults()).some(k=>k!=="modelRuntime"&&!Object.hasOwn(d.context,k)))throw Error("Missing context field.");
 for(const[k,v]of Object.entries(d.context)){stringField(v,k==="customerNotes"?10000:100,"context");if(choices[k]&&!choices[k].includes(v))throw Error("Invalid imported context choice.");}
 if(d.activeGoal!=="unknown"&&!Object.hasOwn(A.goals,d.activeGoal))throw Error("Unsupported imported decision path.");
 const identities=new Set([d.id]);
 function identity(x){if(!validId(x)||identities.has(x))throw Error("Duplicate or invalid record identity.");identities.add(x);}
 for(const s of d.statements){keys(s,["id","text","sourceTitle","locator","origin","supersedes","createdAt"],"statement");identity(s.id);stringField(s.text,10000,"original",false);stringField(s.sourceTitle,200,"source title",false);stringField(s.locator,300,"source locator");dateField(s.createdAt);if(!["user-authored","vendor-claim","private-import"].includes(s.origin)||s.supersedes!==null&&!d.statements.some(x=>x.id===s.supersedes))throw Error("Invalid original statement reference.");}
 for(const r of d.requirements){
  keys(r,["id","statementId","title","interpretation","criterion","classification","mapping","scope","review","reviewerNote","archived","revision","updatedAt"],"requirement");identity(r.id);
  for(const[k,n]of Object.entries({title:200,interpretation:10000,criterion:10000,reviewerNote:5000}))stringField(r[k],n,k,["interpretation","reviewerNote"].includes(k));
  if(!Number.isSafeInteger(r.revision)||r.revision<1||typeof r.archived!=="boolean")throw Error("Invalid requirement revision or archive state.");dateField(r.updatedAt);
  if(!d.statements.some(s=>s.id===r.statementId))throw Error("Dangling statement reference.");
  mapping(r.mapping);scope(r.scope);
  if(JSON.stringify(mapping(r.mapping))!==JSON.stringify(r.mapping)||JSON.stringify(scope(r.scope))!==JSON.stringify(r.scope))throw Error("Invalid mapping or scope scalar.");
  if(!["atomic","composite"].includes(r.classification)||!["proposed","accepted","clarify","out-of-scope"].includes(r.review)||r.classification==="composite"&&r.review==="accepted")throw Error("Invalid requirement review state.");
 }
 for(const m of d.materials){keys(m,["id","requirementId","title","url","quote","concern","status","createdAt"],"private material");identity(m.id);for(const[k,n]of Object.entries({title:200,url:2000,quote:10000}))stringField(m[k],n,"private material");dateField(m.createdAt);if(!d.requirements.some(r=>r.id===m.requirementId)||m.status!=="unassessed-private"||!["note","contradiction","withdrawal"].includes(m.concern)||m.url&&!/^https:\/\/[^\s<>]+$/i.test(m.url))throw Error("Invalid private material reference.");}
 const first=d.audit[0];if(first?.action!=="created"||first.target!==d.id)throw Error("Missing brief creation history.");
 const replay={title:first.after.title,alias:"",activeGoal:"unknown",context:defaults(),statements:[],requirements:[],materials:[]};
 if(!Object.hasOwn(d.context,"modelRuntime"))delete replay.context.modelRuntime;
 for(const e of d.audit.slice(1)){
  if(e.action==="brief-edited")Object.assign(replay,e.after);
  else if(e.action==="context-edited")Object.assign(replay.context,e.after);
  else if(e.action==="statement-added")replay.statements.push(e.after);
  else if(["requirement-added","requirement-revised"].includes(e.action)){const i=replay.requirements.findIndex(r=>r.id===e.target);if(i<0)replay.requirements.push(e.after);else replay.requirements[i]=e.after;}
  else if(e.action==="private-material-added")replay.materials.push(e.after);
  else if(e.action==="imported-for-review")replay.requirements=replay.requirements.map(r=>({...r,review:r.review==="accepted"?"clarify":r.review}));
  else if(!["brief-built","example-loaded","legacy-profile-imported"].includes(e.action))throw Error("Unsupported audit action.");
 }
 const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==="object"&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
 if(stable(canonical(replay))!==stable(canonical(d)))throw Error("Current state differs from its recorded audit history.");
 return true;
}
function normalizeImport(raw){
 if(typeof raw!=="string"||new TextEncoder().encode(raw).length>4*1024*1024)throw Error("Workflow JSON import must be under 4 MiB (2 MiB authoring budget plus import history reserve).");
 const x=JSON.parse(raw);walk(x);keys(x,["schemaVersion","kind","document","sourceBundle","report"],"file");
 if(x.schemaVersion!==2||x.kind!=="advisor-private-export")throw Error("Unsupported file format. Use a workflow v2 JSON export.");
 const d=x.document;verifyDocument(d);if(d.audit.length>=3000)throw Error("Audit history has no room for an import event.");
 const out=clone(d);out.built=null;out.theme=["dark","cisco"].includes(d.theme)?d.theme:"light";for(const r of out.requirements)if(r.review==="accepted")r.review="clarify";
 event(out,"imported-for-review",out.id,null,{sourceBundle:typeof x.sourceBundle?.commit==="string"?x.sourceBundle.commit.slice(0,80):"unknown",importedAuditEntries:d.audit.length});
 return out;
}
function importRequirementSet(raw){
 if(new TextEncoder().encode(raw).length>2*1024*1024)throw Error("Import must be under 2 MiB.");
 const x=JSON.parse(raw);walk(x);keys(x,["schemaVersion","kind","title","statements"],"requirement set");
 if(x.schemaVersion!==1||x.kind!=="advisor-requirement-set"||!Array.isArray(x.statements)||!x.statements.length||x.statements.length>80)throw Error("Unsupported requirement-set schema.");
 const d=newBrief(text(x.title||"Imported requirement set",160));
 for(const item of x.statements){keys(item,["text","sourceTitle","locator","requirements"],"requirement-set statement");if(!Array.isArray(item.requirements)||!item.requirements.length||item.requirements.length>80)throw Error("Each statement needs proposed requirements.");const original=addStatement(d,{text:item.text,sourceTitle:item.sourceTitle||"Private imported brief",locator:item.locator,origin:"private-import"});for(const r of item.requirements){keys(r,["title","interpretation","criterion","classification"],"proposed requirement");saveRequirement(d,{...r,statementId:original.id,review:"proposed",mapping:{kind:"none"},scope:{product:"unknown"}});}}
 return d;
}
function importAny(raw){const parsed=JSON.parse(raw);return parsed.kind==="advisor-requirement-set"?importRequirementSet(raw):normalizeImport(raw);}
function exportJSON(d){return JSON.stringify({schemaVersion:2,kind:"advisor-private-export",document:{...d,built:null},sourceBundle:{commit:P.metadata.commit,sha256:P.sha256},report:null},null,2);}
function importText(raw,name="Private text file"){
 if(new TextEncoder().encode(raw).length>200000)throw Error("Text import is limited to 200 kB.");
 const lines=raw.split(/\r?\n/).filter(s=>s.trim());if(!lines.length||lines.length>80)throw Error("Use one original statement per non-empty line, at most 80 lines.");
 const d=newBrief(name);
 for(const line of lines){const s=addStatement(d,{text:line,sourceTitle:name,origin:"private-import"});saveRequirement(d,{statementId:s.id,title:line.slice(0,140),interpretation:"",criterion:line,classification: /\b(and|or)\b|[;]/i.test(line)?"composite":"atomic",review:"proposed",mapping:{kind:"none"},scope:{product:"unknown"}});}
 return d;
}
function withdrawn(source){return !!(source?.withdrawn||source?.outdatedAsOf||["withdrawn","outdated"].includes(source?.status));}
function sourceHealth(record,ids,at){
 const sources=ids.map(id=>({id,...P.guidance.sources[id]}));
 if(sources.some(s=>s.retrievalStatus==="unavailable"))return {status:"unavailable",ok:false,due:null,reason:"A required current source section could not be reassessed. Retained dated evidence is not promoted into current support."};
 if(sources.some(s=>!s.url||withdrawn(s)))return {status:"withdrawn",ok:false,due:null,reason:"A required source is missing, withdrawn or explicitly outdated."};
 const dates=[{date:record.verified,days:A.registry.reviewPolicy.claimAssessmentDays},...sources.flatMap(s=>[{date:s.checked,days:A.registry.reviewPolicy.sourceCheckDays},{date:s.reviewed,days:A.registry.reviewPolicy.claimAssessmentDays}])];
 const today=day(at);
 if(dates.some(x=>!XDate(x.date)||x.date>today))return {status:"undated",ok:false,due:null,reason:"A source check or scoped assessment date is absent, invalid or future-dated."};
 const due=dates.map(x=>new Date(Date.parse(x.date+"T00:00:00Z")+x.days*86400000).toISOString().slice(0,10)).sort()[0];
 return {status:today>due?"stale":"within-window",ok:today<=due,due,reason:today>due?"The recorded source/claim review window has expired.":"Recorded review windows are current; this is not a live source check."};
}
function XDate(v){return typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+"T00:00:00Z"))&&new Date(v+"T00:00:00Z").toISOString().slice(0,10)===v;}
function baseRow(r,d){
 return {id:r.id,title:r.title,criterion:r.criterion,interpretation:r.interpretation,original:clone(d.statements.find(s=>s.id===r.statementId)),review:r.review,classification:r.classification,reviewerNote:r.reviewerNote,archived:r.archived,mapping:clone(r.mapping),scope:clone(r.scope),outcome:"unknown",summary:"No scoped assessed match is retained.",dimensions:{requirement:r.review,evidence:"unknown",functional:"not-established",applicability:"unknown",product:"not-established",prerequisites:"not-validated",entitlement:"not-established"},blockers:[],facts:[],qualifications:[],sourceIds:[],contextSourceIds:[],privateMaterials:clone(d.materials.filter(m=>m.requirementId===r.id)),health:{status:"unassessed",ok:false,due:null}};
}
function evaluateRequirement(r,d,at=now()){
 const row=baseRow(r,d),c=d.context;
 if(r.archived){row.outcome="archived";row.summary="Archived locally; original and audit history are retained.";return row;}
 if(r.classification==="composite"){row.outcome="decompose";row.summary="Composite requirement: create separate atomic criteria. AND/OR alternatives are not collapsed into a positive.";row.blockers.push("Decompose and review each criterion before accepting it.");return row;}
 if(!publicIntegrity()){row.outcome="needs-review";row.dimensions.evidence="changed";row.summary="The public snapshot changed. Unadmitted claim text is suppressed.";row.blockers.push("Restore or explicitly reassess the trusted public snapshot.");return row;}
 const m=r.mapping;
 if(m.kind==="none"){row.blockers.push("Choose a genuinely relevant assessed mapping, or retain this requirement as unknown.");return finish(row,r,d);}
 if(m.kind==="decision"){
  const scoped=AI.data().capabilities.find(x=>x.id===A.definition(m.ref)?.record);if(r.scope.product!==scoped?.product||r.scope.evidenceVersion!==scoped?.evidenceVersion){row.summary="The requirement product/evidence scope does not match this bounded decision. No product or version is inherited.";row.dimensions.applicability="product-or-version-mismatch";return finish(row,r,d);}
  const legacy=A.evaluate({...c,goal:m.ref},{now:at});row.legacy=legacy;
  row.health={status:legacy.review?.status||"unassessed",ok:!!legacy.review?.ok,due:legacy.review?.due||null};
  row.dimensions.evidence=legacy.status==="needs_review"?"needs-review":legacy.status==="conflicting"?"conflicting":row.health.status;
  row.dimensions.product="bounded-decision";row.dimensions.applicability=legacy.status==="not_established"?"not-established":"decision-scope-only";
  row.sourceIds=(legacy.sources||[]).map(s=>s.id);row.summary=legacy.summary;
  row.facts=(legacy.established||[]).map(x=>({text:x.text,sourceIds:x.sourceIds||[]}));
  row.qualifications=[...(legacy.missingEvidence||[]).map(x=>x.text+" "+x.impact),...(legacy.history||[]).map(x=>"Historical correction: "+x.text)];
  row.blockers=[...(legacy.missingFacts||[]).map(x=>x.text),...(legacy.conflicts||[]).filter(x=>x.affectsDecision).map(x=>x.title)];
  const check=m.checkField?legacy.checks.find(x=>x.field===m.checkField):null;
  if(m.checkField&&!check){row.outcome="unknown";row.summary="That minimum comparison does not apply to this selected decision branch.";row.dimensions.applicability="branch-mismatch";row.facts=[];}
  else if(legacy.status==="needs_review"&&!(check&&legacy.review?.ok&&legacy.unresolvedDependencies?.length)){row.outcome="needs-review";row.facts=[];row.sourceIds=[];}
  else if(legacy.status==="conflicting"){row.outcome="conflict";row.dimensions.functional="unresolved";}
  else if(legacy.status==="not_established"){row.outcome="unknown";row.facts=[];}
  else if(check?.outcome==="below"||!check&&legacy.status==="version_gap"){row.outcome="gap";row.dimensions.functional="documented-gap";row.blockers.push("A documented minimum is unmet; it is not a recommended target.");}
  else if(check?.outcome==="unknown"||!check&&legacy.status==="needs_facts"){row.outcome="unknown";}
  else if(["conditional","no_change"].includes(legacy.status)||check?.outcome==="meets"){row.outcome="conditional";row.dimensions.functional=check||legacy.status==="no_change"?"minimums-only":"conditional-evidence";if(check)row.summary="The reported "+check.label+" "+check.reported+" meets only the assessed minimum "+check.minimum+". Other dependencies and complete workflow readiness remain separate.";}
  else row.outcome="unknown";
  if(check&&legacy.review?.ok&&legacy.unresolvedDependencies?.length)row.dimensions.evidence=legacy.review.status;
  attachTyped(row,r,d,scoped.id,at);return finish(row,r,d);
 }
 if(m.kind==="capability"){
  const record=AI.data().capabilities.find(x=>x.id===m.ref);
  const state={aiProduct:record.product,aiVersion:record.evidenceVersion,deployment:c.deployment,compliance:c.compliance,csp:c.csp,region:c.region,edition:c.edition==="unknown"?"all":c.edition,mode:"environment",q:""};
  const assessed=AI.assess(record,state),dependencyIds=[...new Set([...record.src,...(assessed.src||[])])].filter(id=>!(c.deployment==="cloud"&&["ai-es-detection","ai-es-soc"].includes(record.id)&&id==="aiEsCloudConnectAgentic88"));
  row.health=sourceHealth(record,dependencyIds,at);
  const admitted=A.registry.goals.find(g=>g.record===record.id);
  if(admitted&&!A.review(admitted.id,at).ok){row.health={status:A.review(admitted.id,at).status,ok:false,due:A.review(admitted.id,at).due};}
  row.dimensions.evidence=row.health.status;row.dimensions.product=record.product+" / evidence "+record.evidenceVersion;
  if(!row.health.ok){attachTyped(row,r,d,record.id,at);row.outcome="needs-review";row.summary="The exact public claim/source scope needs review; stale or withdrawn statements are not used as current capability facts.";row.blockers.push(row.health.reason||"Admission or review-window check failed.");return finish(row,r,d);}
  row.sourceIds=dependencyIds;row.qualifications=[record.qualification,record.condition,"Release stage: "+record.stage,"Model scope: "+record.runtime];
  if(r.scope.product!==record.product||r.scope.evidenceVersion!==record.evidenceVersion){row.outcome="unknown";row.dimensions.applicability="product-or-version-mismatch";row.summary="The requested product and evidence release must match the assessed record exactly. A parent or newer release cannot inherit this evidence.";return finish(row,r,d);}
  attachTyped(row,r,d,record.id,at);if(["needs-review","withdrawn"].includes(row.prerequisiteEvaluation?.status))return finish(row,r,d);
  if(record.product==="platform"&&c.saiaVersion&&c.saiaVersion!==record.evidenceVersion){row.outcome="unknown";row.dimensions.applicability="target-app-release-unassessed";row.summary="The reported SAIA app release differs from the exact assessed app record. Platform minima do not establish this other app release or its model/runtime support.";return finish(row,r,d);}
  if(record.product==="es"&&c.esVersion&&!/^8\.8(?:\.\d+){0,2}$/.test(c.esVersion)){row.outcome="unknown";row.dimensions.applicability="target-release-unassessed";row.summary="This capability snapshot assesses ES 8.8. A different reported target is not automatically covered.";return finish(row,r,d);}
  if(c.deployment==="unknown"||c.compliance==="unknown"||!AI.regions().some(x=>x.id===c.region)||record.product==="es"&&c.edition==="unknown"){row.outcome="unknown";row.summary="Confirm deployment, service environment, exact AI service location and applicable edition before applying this capability evidence.";row.blockers.push("Missing customer scope is separate from missing product evidence.");return finish(row,r,d);}
  row.summary=assessed.detail;row.dimensions.applicability=assessed.availability;row.dimensions.functional=assessed.availability;
  row.contextSourceIds=record.src.filter(id=>!dependencyIds.includes(id));row.facts=[{text:record.description,sourceIds:record.src.filter(id=>dependencyIds.includes(id))}];row.qualifications.push(...record.requirements);
  if(record.id==="ai-es-soc"){
   const legacy=A.evaluate({...c,goal:"soc-workflow"},{now:at});row.legacy=legacy;
   if(legacy.status==="conflicting"){row.outcome="conflict";row.dimensions.evidence="conflicting";row.blockers.push(...legacy.conflicts.filter(x=>x.affectsDecision).map(x=>x.title));attachTyped(row,r,d,record.id,at);return finish(row,r,d);}
   if(c.runtimePolicy!=="frontier"){row.outcome=c.runtimePolicy==="splunk-hosted"?"gap":"unknown";row.summary="The assessed SOC task requires frontier models; generic assistant model availability is insufficient.";row.blockers.push("Confirm the exact documented model policy and tenant configuration.");attachTyped(row,r,d,record.id,at);return finish(row,r,d);}
  }
  row.outcome=assessed.availability==="unavailable"?"gap":assessed.availability==="conflicting"?"conflict":assessed.availability==="not_established"?"unknown":"conditional";
  attachTyped(row,r,d,record.id,at);return finish(row,r,d);
 }
 if(m.kind==="exact"){
  const graph=P.guidance.exactReleases;let snap;
  try{snap=X.snapshot(graph,P.guidance.sources,m.releaseId,day(at));}catch(e){row.summary=e.message;row.blockers.push("Exact product/component/release identity is required.");return finish(row,r,d);}
  const result=snap.rows.find(x=>x.entity===m.ref);
  row.dimensions.product=snap.release.product+" / "+snap.release.component+" / "+snap.release.branch+" / "+snap.release.version;
  if(r.scope.product!==snap.release.product||r.scope.component!==snap.release.component||r.scope.evidenceVersion!==snap.release.version){row.dimensions.applicability="component-or-version-mismatch";row.summary="The requirement’s product/component/version differs from the exact assessed release. No cross-component or branch inheritance is allowed.";return finish(row,r,d);}
  if(!result){row.summary="This entity has no assessed scope for the selected component.";return finish(row,r,d);}
  const latestWithdrawn=result.history.some(x=>x.assessment.status==="withdrawn");
  const ids=[...new Set(result.claims.flatMap(x=>x.assessment.src))];
  const oldest=result.claims.map(x=>x.assessment.verificationDate).sort()[0];
  row.health=ids.length?sourceHealth({verified:oldest},ids,at):{status:latestWithdrawn?"withdrawn":"unassessed",ok:false,due:null};
  if(result.freshness==="stale")row.health={...row.health,status:"stale",ok:false};
  row.dimensions.evidence=row.health.status;row.researchPilot=true;
  row.qualifications=["Separate bounded exact-release research pilot, not a deployed coverage promise.",graph.boundary,...result.claims.map(x=>x.qualification||"").filter(Boolean),"No supported exact upgrade route or overall compatibility is implied."];
  if(!row.health.ok){row.outcome=latestWithdrawn?"withdrawn":row.health.status==="unassessed"?"unknown":"needs-review";row.summary=latestWithdrawn?"The applicable assessment was withdrawn. Earlier support is retained as history and is not asserted.":"No current assessed exact-scope evidence is available.";return finish(row,r,d);}
  row.sourceIds=ids;row.exactHistory=result.history;
  if(result.status==="conflicting"||result.status==="uncertain"){row.outcome="conflict";row.summary="The exact scoped assessments are "+result.status+"; no state wins silently.";row.dimensions.functional="unresolved";return finish(row,r,d);}
  row.dimensions.applicability="exact-scope";row.dimensions.functional=result.status;
  row.facts=result.claims.map(x=>({text:x.text,sourceIds:x.assessment.src}));
  row.summary="Exact assessed state: "+result.status+". Desired criterion state: "+(m.desiredState||"not specified")+".";
  row.outcome=m.desiredState&&m.desiredState===result.status?"conditional":m.desiredState?"gap":"unknown";
  row.blockers.push("Retained qualifications and the actual customer environment still require validation.");
  return finish(row,r,d);
 }
 return finish(row,r,d);
}
function attachTyped(row,r,d,recordId,at){
 if(!T)return;
 const first=!row.prerequisiteEvaluation,assessed=row.prerequisiteEvaluation||T.assess(recordId,d.context,r.scope,at);row.prerequisiteEvaluation=assessed;row.dimensions.prerequisites=assessed.status;
 if(first&&r.mapping.kind==="decision"&&r.mapping.checkField){assessed.qualification+=" This trace describes the broader dependency chain; it does not change the selected independent minimum comparison.";row.dimensions.prerequisites="broader-chain-"+assessed.status;}
 if(first&&r.mapping.kind==="decision"&&r.mapping.checkField){
  const selected=T.leaves(assessed.trace).find(x=>x.field===r.mapping.checkField&&x.operator==="exact-version");
  if(selected){row.outcome=selected.status==="met"?"conditional":selected.status==="gap"?"gap":"unknown";row.dimensions.functional=selected.status==="met"?"exact-package-only":"exact-package-not-established";row.summary="Reported "+r.mapping.checkField+" "+(selected.reported||"unknown")+" compared with exact documented package "+selected.expected+": "+selected.status+". A newer package is not inherited from this exact version statement; the whole dependency chain remains separate.";}
 }
 if(["needs-review","withdrawn"].includes(assessed.status)){row.outcome="needs-review";row.facts=[];row.sourceIds=[];row.summary="The typed prerequisite claim/source admission requires review; factual comparison paths are suppressed.";}
 if(assessed.unresolvedSourceIds?.length&&!(r.mapping.kind==="decision"&&r.mapping.checkField)){
  row.outcome="needs-review";row.dimensions.evidence="needs-review";row.facts=[];
  row.summary="The complete current dependency chain needs review; an unavailable or unadmitted setup source cannot establish whole-workflow readiness. Independent numeric prerequisite comparisons remain separate.";
  for(const id of assessed.unresolvedSourceIds)row.blockers.push("Unresolved setup dependency "+id+": retained earlier evidence does not establish a current usable path.");
 }
 for(const leaf of first?T.leaves(assessed.trace):[]){if(["gap","unknown","conflict"].includes(leaf.status))row.blockers.push(leaf.label+": "+leaf.status+". "+(leaf.reason||""));}
 if(assessed.status==="gap"&&row.outcome==="conditional"&&!(r.mapping.kind==="decision"&&r.mapping.checkField)){row.outcome="gap";row.summary="A typed prerequisite comparison has a documented gap. Other scope, activation and pairing questions remain separate. "+row.summary;}
 if(assessed.status==="conflict"&&row.outcome==="conditional"&&!(r.mapping.kind==="decision"&&r.mapping.checkField)){row.outcome="conflict";row.dimensions.evidence="conflicting";}
}
function finish(row,r,d){
 row.dimensions.requirement=r.review;
 if(!row.prerequisiteEvaluation)row.dimensions.prerequisites=d.context.access==="yes"?"not-validated (access reported)":"not-validated";
 if(r.mapping.kind==="capability"&&!row.prerequisiteEvaluation?.trace){row.blockers.push("Deployment-specific prerequisite thresholds in the retained qualifications have not been mechanically compared for this capability. Confirm each against the reported versions; reported access does not satisfy them. Conditional availability is not criterion fit or compatibility.");}
 row.dimensions.entitlement="not-established"+(d.context.entitlement==="reported"?" (customer-reported)":"");
 if(r.mapping.relation!=="direct"&&["conditional","gap","conflict"].includes(row.outcome)){
  row.relatedAssessment={outcome:row.outcome,summary:row.summary,functional:row.dimensions.functional};row.qualifications.unshift("Related documentation assessment: "+row.outcome+". "+row.summary);
  row.outcome="related";row.dimensions.functional="not-established-related";row.summary="Related documentation only. Its scoped assessment does not establish or refute this criterion. "+row.summary;
  row.blockers.push("Review a direct criterion-to-evidence mapping before making a fit or gap conclusion.");
 }
 if(row.privateMaterials.some(m=>["contradiction","withdrawal"].includes(m.concern))){row.outcome="private-review";row.blockers.push("Unassessed private material raises a concern. It cannot amend public facts, and needs a separate review.");}
 if(r.review!=="accepted"&&r.review!=="out-of-scope")row.blockers.push("The interpretation and atomic acceptance criterion await customer review.");
 if(r.review==="out-of-scope"){row.outcome="out-of-scope";row.summary="Customer marked this requirement out of scope. Evidence history remains retained.";}
 return row;
}
function computeReport(d,at=now()){
 verifyDocument(d);
 const rows=d.requirements.map(r=>evaluateRequirement(r,d,at));
 let guided=null;if(d.activeGoal!=="unknown")guided=publicIntegrity()?A.evaluate({...d.context,goal:d.activeGoal},{now:at}):{status:"needs_review",title:"Public snapshot changed",summary:"Unadmitted factual paths are suppressed.",sources:[],established:[],checks:[],missingFacts:[],missingEvidence:[],conflicts:[],history:[],actions:[]};
 const ids=[...new Set([...rows.flatMap(r=>[...r.sourceIds,...(r.contextSourceIds||[]),...r.facts.flatMap(f=>f.sourceIds||[]),...(r.prerequisiteEvaluation?.sourceIds||[]),...(r.prerequisiteEvaluation?.unresolvedSourceIds||[])]),...(guided?.sources||[]).map(s=>s.id)])].sort();
 const sources=ids.map(id=>({id,...P.guidance.sources[id]}));
 const report={schemaVersion:2,title:d.title,alias:d.alias,createdAt:at,asOf:day(at),context:clone(d.context),rows,guided,sources,publicIntegrity:publicIntegrity(),sourceBundle:clone(P.metadata),auditIndex:d.audit.map(e=>({seq:e.seq,at:e.at,action:e.action,target:e.target,hash:e.hash,previous:e.previous})),auditQualification:"This local hash chain detects alteration relative to the file; it is not an authenticated signature. Full before/after history is retained in JSON and offline HTML.",boundaries:["Private local evaluation; customer inputs are not transmitted.","Public snapshot dates are unchanged. Building a brief does not check upstream pages.","Conditional and minimum-only outcomes do not establish complete fit, licensing, entitlement, pairing or customer authorization.","Exact-release evidence is a separate bounded research pilot; it is not deployed Advisor coverage."]};
 return report;
}
function buildReport(d,at=now()){
 if(!d.requirements.length&&d.activeGoal==="unknown")throw Error("Add a requirement or choose a guided decision first.");
 event(d,"brief-built",d.id,null,{sourceCommit:P.metadata.commit,engineHash:B?.hash||null,inputHash:inputHash(d),rowCount:d.requirements.length},at);
 const report=computeReport(d,at);d.built={revision:d.revision,inputHash:inputHash(d),report,healthKey:healthKey(d,at),sourceHash:P.sha256,engineHash:B?.hash||null};return report;
}
function restoreCaptured(d){
 verifyDocument(d);if(!d.built||d.built.revision!==d.revision||d.built.inputHash!==inputHash(d)||d.built.sourceHash!==P.sha256||d.built.engineHash!==(B?.hash||null)){d.built=null;return d;}
 const at=d.built.report?.createdAt;if(!Number.isFinite(Date.parse(at))){d.built=null;return d;}
 d.built.report=computeReport(d,at);d.built.healthKey=healthKey(d,at);return d;
}
function healthKey(d,at){return H(JSON.stringify(d.requirements.map(r=>{const x=evaluateRequirement(r,d,at);return {id:r.id,evidence:x.dimensions.evidence,outcome:x.outcome,health:x.health,prerequisites:x.prerequisiteEvaluation?{status:x.prerequisiteEvaluation.status,health:x.prerequisiteEvaluation.health,admission:x.prerequisiteEvaluation.admission}:null};}).concat(d.activeGoal==="unknown"?[]:[{guided:publicIntegrity()?A.review(d.activeGoal,at):"changed"}])));}
function exportGate(d,at=now()){
 if(!d.built)return {ok:false,reason:"Build a brief before exporting."};
 if(!d.built.report||d.built.report.schemaVersion!==2||!Array.isArray(d.built.report.rows)||d.built.report.rows.length!==d.requirements.length||!Array.isArray(d.built.report.sources)||!d.built.report.context||!d.built.report.sourceBundle||!Array.isArray(d.built.report.auditIndex))return {ok:false,reason:"The captured report is incomplete. Rebuild before exporting."};
 if(dirty(d))return {ok:false,reason:"The draft changed. Build a fresh brief before exporting."};
 if(d.built.sourceHash!==P.sha256||d.built.engineHash!==(B?.hash||null)||d.built.healthKey!==healthKey(d,at))return {ok:false,reason:"Evidence state or a review window changed. Rebuild to capture the current review-needed state."};
 return {ok:true,reason:"Captured brief and current local review gates match."};
}
const api={newBrief,updateMeta,updateContext,addStatement,saveRequirement,addMaterial,verifyAudit,verifyDocument,normalizeImport,importRequirementSet,importAny,exportJSON,importText,publicIntegrity,inputHash,dirty,evaluateRequirement,computeReport,buildReport,restoreCaptured,exportGate,safeJSON,choices,contextKeys,clone,event};
for(const name of ["updateMeta","updateContext","addStatement","saveRequirement","addMaterial","buildReport","event"]){const fn=api[name];api[name]=function(d,...args){const before=clone(d);try{return fn(d,...args);}catch(e){for(const k of Object.keys(d))delete d[k];Object.assign(d,before);throw e;}};}
return api;
});
