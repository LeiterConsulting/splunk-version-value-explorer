/* JSON on stdin: {watch, outcome, at, summary, scope}. Never equate an attempt with success. */
const fs=require('node:fs'),vm=require('node:vm');
const input=JSON.parse(fs.readFileSync(0,'utf8')),file='dist/maintenance-status.js';
const c={window:{}};vm.runInNewContext(fs.readFileSync(file,'utf8'),c);const data=c.window.VersionCompassMaintenance;
const watch=data.watches.find(w=>w.id===input.watch);
if(!watch)throw Error('Unknown watch');
if(!['running','changed','no-change','blocked','failed'].includes(input.outcome))throw Error('Unknown outcome');
if(!input.at||!Number.isFinite(Date.parse(input.at)))throw Error('Explicit timestamp required');
if(!input.summary||!input.scope)throw Error('Summary and reviewed/attempted scope required');
if(Date.parse(input.at)<Date.parse(watch.history.at(-1)?.at||0))throw Error('Cannot overwrite a newer run');
if(input.outcome!=='running'&&watch.outcome!=='running')throw Error('Record a running attempt before its outcome');
if(input.outcome==='running')watch.lastAttempt=input.at;
watch.outcome=input.outcome;watch.summary=input.summary;watch.scope=input.scope;
if(['changed','no-change'].includes(input.outcome))watch.lastSuccess=input.at;
watch.history.push({at:input.at,outcome:input.outcome,summary:input.summary,scope:input.scope});
fs.writeFileSync(file,'window.VersionCompassMaintenance = '+JSON.stringify(data,null,2)+';\n');
