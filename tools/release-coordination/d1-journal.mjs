/* Inactive D1-binding storage adapter. No route, migration, identity or authority. */
const MAX_EVENTS=500,MAX_BYTES=1048576,MAX_EVENT=16384;
const fail=reason=>{throw Object.assign(new Error(reason),{reason})};
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
function canonical(x){if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';if(plain(x))return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';return JSON.stringify(x)}
async function digest(x){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(x))))].map(v=>v.toString(16).padStart(2,'0')).join('')}
const bytes=x=>new TextEncoder().encode(x).byteLength;
const tag=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(x);
function context(db,project,validate){if(!tag(project)||!db||typeof db.withSession!=='function'||typeof validate!=='function')fail('invalid-context');return db.withSession('first-primary')}
async function read(session,project,validate){
 const r=await session.prepare('SELECT sequence,previous_hash,event_hash,record_json FROM release_journal_reference WHERE project_id=? ORDER BY sequence LIMIT 501').bind(project).all();
 if(r.success!==true||!Array.isArray(r.results)||r.results.length>MAX_EVENTS)fail('journal-read-unverified');
 let count=0,tail=null,size=0;const records=[];
 for(const row of r.results){
  if(typeof row.record_json!=='string'||(size+=bytes(row.record_json)+1)>MAX_BYTES||bytes(row.record_json)>MAX_EVENT)fail('journal-limit');
  const record=JSON.parse(row.record_json),{sha256,...body}=record;
  if(Object.keys(record).sort().join(',')!=='event,previousSha256,sequence,sha256'||record.sequence!==++count||record.previousSha256!==tail||row.sequence!==count||row.previous_hash!==tail||row.event_hash!==sha256||sha256!==await digest(body))fail('journal-chain-mismatch');
  if(record.event?.kind==='intent'&&record.event.target?.projectId!==project)fail('project-target-mismatch');
  records.push(record);tail=sha256;
 }
 // Trusted caller supplies the reviewed transition validator. Storage never
 // substitutes a flag in caller JSON for service authentication or admission.
 const state=await validate(structuredClone(records));
 if(!plain(state)||state.sequence!==count||state.tail!==tail||state.productionActionAllowed!==false)fail('transition-validation-required');
 return {records,state,size};
}
export async function readD1Journal({db,project,validate}){const s=context(db,project,validate);const r=await read(s,project,validate);return {...r,storage:'d1-binding-reference',productionActionAllowed:false,authenticationVerified:false,remoteFencing:false}}
export async function appendD1Journal({db,project,validate,event,expectedTail}){
 const session=context(db,project,validate),prior=await read(session,project,validate);
 if(prior.state.tail!==expectedTail)fail('journal-tail-moved');
 if(event?.kind==='intent'&&event.target?.projectId!==project)fail('project-target-mismatch');
 const body={sequence:prior.records.length+1,previousSha256:expectedTail,event:structuredClone(event)};
 const record={...body,sha256:await digest(body)},encoded=JSON.stringify(record);
 if(prior.records.length>=MAX_EVENTS||bytes(encoded)>MAX_EVENT||prior.size+bytes(encoded)+1>MAX_BYTES)fail('journal-limit');
 const next=await validate([...structuredClone(prior.records),structuredClone(record)]);
 if(!plain(next)||next.sequence!==record.sequence||next.tail!==record.sha256||next.productionActionAllowed!==false)fail('transition-validation-required');
 // All conditional predicates and append are one SQL statement. A stale read
 // cannot become an unconditional write, even with two independent sessions.
 let result;
 try{result=await session.prepare('INSERT INTO release_journal_reference(project_id,sequence,previous_hash,event_hash,record_json) SELECT ?,?,?,?,? WHERE ?=(SELECT COUNT(*)+1 FROM release_journal_reference WHERE project_id=?) AND ? IS (SELECT event_hash FROM release_journal_reference WHERE project_id=? ORDER BY sequence DESC LIMIT 1)').bind(project,record.sequence,expectedTail,record.sha256,encoded,record.sequence,project,expectedTail,project).run();}
 catch{fail('append-outcome-unknown-readback-required')}
 if(result?.success!==true||![0,1].includes(result.meta?.changes))fail('append-outcome-unknown-readback-required');
 if(result.meta.changes===0)fail('journal-tail-moved');
 let observed;try{observed=await read(session,project,validate)}catch{fail('append-readback-unverified')}
 if(observed.records[record.sequence-1]?.sha256!==record.sha256)fail('append-readback-unverified');
 return {recordSha256:record.sha256,state:next,observedState:observed.state,storage:'d1-binding-reference',authenticationVerified:false,remoteFencing:false,productionActionAllowed:false};
}
