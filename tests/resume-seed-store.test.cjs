const{test,before}=require('node:test'),assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite'),fs=require('node:fs');let resumeSeedBatch;before(async()=>{({resumeSeedBatch}=await import('../worker/content-store.mjs'));});
const root=require('node:path').resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(root+'/dist/content-bundle.json'));
function db(t,count=600){
 const sql=new DatabaseSync(':memory:');t.after(()=>sql.close());
 for(const f of fs.readdirSync(root+'/drizzle').filter(x=>x.endsWith('.sql')).sort())sql.exec(fs.readFileSync(root+'/drizzle/'+f,'utf8'));
 const m=seed.manifest;sql.prepare('INSERT INTO content_revisions VALUES(?,?,?,?,?,?,?,0)').run(m.revision,m.engineRevision,m.schemaVersion,m.digest,JSON.stringify(m),JSON.stringify(seed),m.recordCount);
 for(const r of seed.catalog.records.slice(0,count))sql.prepare('INSERT INTO content_records VALUES(?,?,?,?,?)').run(m.revision,r.id,r.kind,r.dataset,JSON.stringify(r));
 const state={sql,batches:[],lose:false};
 state.prepare=q=>{const stmt=sql.prepare(q),bound=a=>({bind:(...v)=>bound(v),first:async()=>stmt.get(...a)||null,all:async()=>({results:stmt.all(...a)}),run:async()=>({meta:{changes:Number(stmt.run(...a).changes)}})});return bound([]);};
 state.batch=async statements=>{state.batches.push(statements.length);sql.exec('BEGIN');try{for(const s of statements)await s.run();sql.exec('COMMIT');}catch(e){sql.exec('ROLLBACK');throw e;}if(state.lose){state.lose=false;throw Error('Synthetic lost response');}return statements.map(()=>({success:true}));};
 return state;
}
test('600/956 resumes in eight bounded batches, never repeats existing rows or writes publisher state',async t=>{
 const d=db(t);const total=seed.manifest.recordCount,steps=Math.ceil((total-600)/50);let r;for(let i=0;i<steps;i++){r=await resumeSeedBatch(d,seed);assert.equal(r.attemptedRows,Math.min(50,total-600-i*50));assert.equal(r.present,Math.min(650+i*50,total));}
 assert.equal(r.status,'complete');assert.equal(r.integrity,'all-rows-exact');assert.equal(d.sql.prepare('SELECT completed FROM content_revisions').get().completed,1);
 for(const table of ['content_publication','content_publication_events','content_publication_provenance'])assert.equal(d.sql.prepare('SELECT count(*) n FROM '+table).get().n,0);
 r=await resumeSeedBatch(d,seed);assert.equal(r.status,'already-complete');assert.equal(d.batches.length,steps);
});
test('corruption and unknown rows fail before any write despite correct counts',async t=>{
 for(const change of ["UPDATE content_records SET payload_json='{}' WHERE rowid=1","UPDATE content_records SET record_id='unknown' WHERE rowid=1"]){
 const d=db(t);d.sql.exec(change);const before=d.sql.prepare('SELECT total_changes() n').get().n;await assert.rejects(resumeSeedBatch(d,seed),/mismatch/);assert.equal(d.sql.prepare('SELECT total_changes() n').get().n,before);assert.equal(d.batches.length,0);}
});
test('lost response is uncertain but explicit later read/reconcile skips already committed batch',async t=>{
 const d=db(t);d.lose=true;await assert.rejects(resumeSeedBatch(d,seed),/lost response/);assert.equal(d.sql.prepare('SELECT count(*) n FROM content_records').get().n,650);
 const r=await resumeSeedBatch(d,seed);assert.equal(r.present,700);assert.equal(r.status,'partial');assert.deepEqual(d.batches,[50,50]);
});
test('marked complete with missing rows and wrong immutable bundle fail closed',async t=>{
 const d=db(t);d.sql.exec('UPDATE content_revisions SET completed=1');await assert.rejects(resumeSeedBatch(d,seed),/incomplete/);assert.equal(d.batches.length,0);
 d.sql.exec("UPDATE content_revisions SET completed=0,bundle_json='{}'");await assert.rejects(resumeSeedBatch(d,seed),/Exact existing seed/);assert.equal(d.batches.length,0);
});

test('wrong schema and extra projection rows reject before inserts',async t=>{
 const wrong=db(t);wrong.sql.exec('UPDATE content_revisions SET schema_version=2');await assert.rejects(resumeSeedBatch(wrong,seed),/Exact existing seed/);assert.equal(wrong.batches.length,0);
 const extra=db(t,seed.manifest.recordCount);extra.sql.prepare('INSERT INTO content_records VALUES(?,?,?,?,?)').run(seed.manifest.revision,'extra','fixture','platform','{}');await assert.rejects(resumeSeedBatch(extra,seed),/Invalid stored projection/);assert.equal(extra.batches.length,0);
});

test('missing seed creates immutable incomplete row plus at most 50 rows; no head',async t=>{
 const d=db(t,0);d.sql.exec('DELETE FROM content_revisions');const r=await resumeSeedBatch(d,seed);
 assert.equal(r.status,'partial');assert.equal(r.present,50);assert.equal(r.attemptedRows,50);assert.equal(d.sql.prepare('SELECT completed FROM content_revisions').get().completed,0);
 assert.equal(d.sql.prepare('SELECT count(*) n FROM content_publication').get().n,0);
});
test('simultaneous exact seed calls preserve immutable rows and completion',async t=>{
 const d=db(t,seed.manifest.recordCount-6);
 // SQLite adapter transactions serialized here; production D1 provides atomic batches.
 const batch=d.batch;let queue=Promise.resolve();d.batch=s=>{const p=queue.then(()=>batch(s));queue=p.catch(()=>{});return p;};
 const r=await Promise.all([resumeSeedBatch(d,seed),resumeSeedBatch(d,seed)]);
 assert(r.every(v=>['complete','already-complete'].includes(v.status)));assert.equal(d.sql.prepare('SELECT count(*) n FROM content_records').get().n,seed.manifest.recordCount);
 assert.equal(d.sql.prepare('SELECT count(*) n FROM content_publication').get().n,0);
});

test('orphan records reject missing-seed initialization before writes',async t=>{
 const d=db(t,0);d.sql.exec('PRAGMA foreign_keys=OFF; DELETE FROM content_revisions');
 d.sql.prepare('INSERT INTO content_records VALUES(?,?,?,?,?)').run(seed.manifest.revision,'orphan','fixture','platform','{}');
 const before=d.sql.prepare('SELECT total_changes() n').get().n;await assert.rejects(resumeSeedBatch(d,seed),/Orphan/);
 assert.equal(d.sql.prepare('SELECT total_changes() n').get().n,before);assert.equal(d.batches.length,0);
});
