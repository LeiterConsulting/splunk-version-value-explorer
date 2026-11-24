/* JSON on stdin: {watch, outcome, at, summary, scope}. */
const fs = require('node:fs');
const vm = require('node:vm');

const file = 'dist/maintenance-status.js';
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
const data = context.window.VersionCompassMaintenance;
const privateIdentifiers = /\b(?:appg(?:prj|dep|ver)_[a-z0-9]+|Automation_[a-z0-9]+|[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}|[0-9a-f]{32})\b/i;
const privateExecutionNotes = /\b(?:scheduler (?:identity|identifier|attempt|id|run)|(?:task|run|attempt)[- ](?:id|identifier|identity)|(?:native|private) (?:current[- ]|recorded |final )?(?:invocation|identity|attempt|start|result)|(?:review|task|scheduler) invocation|notification policy|task[-/]result (?:reconciliation|integrity))\b/i;

function publicText(value) {
  if (typeof value !== 'string' || privateIdentifiers.test(value) || privateExecutionNotes.test(value)) {
    throw Error('Use a reader-facing review description. Keep execution identifiers and private run details out of public maintenance history.');
  }
}
function publicFields(row, fields) {
  for (const key of Object.keys(row)) if (!fields.includes(key)) throw Error('Unexpected public maintenance field: '+key);
}
function checkPublicHistory() {
  publicFields(data,['schemaVersion','trackingSince','scheduleSnapshot','watches']);
  for (const watch of data.watches) {
    publicFields(watch,['id','name','lastAttempt','lastSuccess','outcome','summary','scope','history']);
    for (const entry of watch.history) publicFields(entry,['at','outcome','summary','scope']);
    for (const row of [watch,...watch.history]) {
      if (row.summary !== undefined) publicText(row.summary);
      if (row.scope !== undefined) publicText(row.scope);
    }
  }
}
if (process.argv[2] === '--check') {
  checkPublicHistory();
} else {
  const input = JSON.parse(fs.readFileSync(0,'utf8'));
  const watch = data.watches.find(w=>w.id===input.watch);
  if (!watch) throw Error('Unknown watch');
  if (!['running','changed','no-change','blocked','failed'].includes(input.outcome)) throw Error('Unknown outcome');
  if (!input.at || !Number.isFinite(Date.parse(input.at))) throw Error('Explicit timestamp required');
  if (!input.summary || !input.scope) throw Error('Summary and reviewed/attempted scope required');
  publicText(input.summary);
  publicText(input.scope);
  if (Date.parse(input.at)<Date.parse(watch.history.at(-1)?.at||0)) throw Error('Cannot overwrite a newer run');
  if (input.outcome !== 'running' && watch.outcome!=='running') throw Error('Record a running attempt before its outcome');
  if (input.outcome==='running') watch.lastAttempt=input.at;
  watch.outcome=input.outcome;
  watch.summary=input.summary;
  watch.scope=input.scope;
  if (['changed','no-change'].includes(input.outcome)) watch.lastSuccess=input.at;
  watch.history.push({at:input.at,outcome:input.outcome,summary:input.summary,scope:input.scope});
  checkPublicHistory();
  fs.writeFileSync(file,'window.VersionCompassMaintenance = '+JSON.stringify(data,null,2)+';\n');
}
