/* Durable local reference adapter. No workflow, network, credentials or D1 writes. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {replay}=require('./release-journal.cjs');
const {hash,canonical}=require('./release-receipts.cjs');
const helper=path.resolve(__dirname,'../../tools/release-coordination/sqlite-journal.py');
function call(filename,request){
 if(typeof filename!=='string'||!path.isAbsolute(filename))throw Error('absolute-store-path-required');
 // Private newly-created local file; never initialize over a nonregular object.
 try{const fd=fs.openSync(filename,'wx',0o600);fs.closeSync(fd);}catch(e){if(e.code!=='EEXIST')throw e;if(!fs.lstatSync(filename).isFile())throw Error('invalid-store');}
 const env={...process.env};delete env.PYTHONPATH;delete env.PYTHONHOME;
 try{return JSON.parse(execFileSync('python3',['-I',helper,filename],{input:JSON.stringify(request),encoding:'utf8',env,maxBuffer:2*1024*1024,timeout:15000,stdio:['pipe','pipe','pipe']}));}
 catch(e){throw Error('store-call-failed; outcome requires readback: '+String(e.stderr||e.message).trim());}
}
function readSqliteJournal(filename){const records=call(filename,{action:'read'});return {records,state:replay(records)};}
function appendSqliteJournal(filename,event,expectedTail){
 const {records,state}=readSqliteJournal(filename);
 if(state.tail!==expectedTail)throw Error('journal-tail-moved');
 const body={sequence:state.sequence+1,previousSha256:state.tail,event};
 const record={...body,sha256:hash(canonical(body))};
 // Reuse reviewed transitions, including sticky denied and uncertain holds.
 const next=replay([...records,record]);
 call(filename,{action:'append',expectedTail,record});
 const observed=readSqliteJournal(filename);
 // Concurrent later events are not silently attributed to this append.
 if(observed.records[record.sequence-1]?.sha256!==record.sha256)throw Error('committed-record-unverified');
 return {state:next,observedState:observed.state,recordSha256:record.sha256,storage:'local-sqlite-reference',remoteFencing:false,productionActionAllowed:false};
}
module.exports={readSqliteJournal,appendSqliteJournal};
