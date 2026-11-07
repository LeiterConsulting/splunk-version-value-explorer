const test=require('node:test'),assert=require('node:assert/strict');
const e=require('../content/datasets/environment.json'),g=require('../content/datasets/guidance.json');
test('High processor availability requires the 10.7 service evidence and preserves tenant and AI qualifications',()=>{
 for(const id of ['edge-high-unknown','ingest-high-unknown','platform-ai-high-unknown']){
  const r=e.records.find(x=>x.id===id);
  const processor=id!=='platform-ai-high-unknown';
  assert.equal(r.availability,processor?'conditional':'not_established');
  assert.equal(r.authorization,'not_established');
  assert(r.sources.includes('highAnnouncement20261019'));assert.match(r.detail,/October 19/);
  if(processor){assert(r.sources.includes('service107'));assert(r.sources.includes('changes107'));assert.match(r.detail,/10\.7.+10\.6 table lists Moderate only/);}
 }
 assert.match(e.records.find(x=>x.id==='ingest-high-unknown').detail,/Essentials tier/);
 assert.match(g.aiAvailability.regulatedQualification,/IL2/);assert.match(g.aiAvailability.regulatedQualification,/Agent Mode/);assert.match(g.aiAvailability.regulatedQualification,/ITSI subagent/);
 assert(g.aiAvailability.sourceIds.includes('aiHighAnnouncement20261019'));
});
