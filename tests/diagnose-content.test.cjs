const { test } = require('node:test');
const assert = require('node:assert/strict');
const { diagnoseContent, LIMITS } = require('../scripts/diagnose-content.cjs');
const expected = require('../content/publication.json');
const bundle = require('../dist/content-bundle.json');
const fs = require('node:fs');
const clone = value => structuredClone(value);
function fixture(override = () => {}) {
  const calls = [];
  const fetchImpl = async (input, options) => {
    const url = new URL(input);
    calls.push({ url, options });
    assert.equal(url.origin, 'https://example.test');
    assert.equal(options.redirect, 'manual');
    assert(options.signal instanceof AbortSignal);
    const special = await override(url, options, calls.length);
    if (special) return special;
    if (url.pathname === '/content-manifest.json') return Response.json(expected);
    if (options.method === 'POST') return Response.json({}, { status: 405 });
    if (url.pathname.endsWith('/health')) return Response.json({status:'ready',storage:'d1',revision:expected.revision,engineRevision:expected.engineRevision,recordCount:expected.recordCount});
    if (url.pathname.endsWith('/manifest')) return Response.json(expected);
    if (url.pathname.endsWith('/bundle')) return Response.json(bundle);
    if (url.pathname.endsWith('/records')) {
      const offset = +(url.searchParams.get('offset') || 0), limit = +url.searchParams.get('limit');
      if (url.searchParams.get('engine') === 'invalid') return Response.json({}, {status:409});
      if (limit > 200 || offset < 0 || url.searchParams.get('dataset') === 'unknown' || url.searchParams.get('revision') === 'invalid' || url.searchParams.getAll('limit').length > 1 || url.searchParams.has('unknown')) return Response.json({}, {status:400});
      let rows = clone(bundle.catalog.records).sort((a,b)=>a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
      if (url.searchParams.has('dataset')) rows = rows.filter(r=>r.dataset===url.searchParams.get('dataset'));
      return Response.json({revision:expected.revision, offset, limit, records:rows.slice(offset,offset+limit)});
    }
    return new Response(fs.readFileSync('dist' + url.pathname));
  };
  return { calls, run: options => diagnoseContent({baseUrl:'https://example.test/', expected, fetchImpl, ...options}) };
}
test('all six evidence keys retained; complete expected records verified sequentially with bounded guard and seven adapters', async () => {
  const f = fixture(), progress = [];
  const result = await f.run({progress: x=>progress.push(x)});
  assert.equal(result.status, 'delivery-checks-passed');
  assert.equal(Object.keys(result.checks).length, 6);
  assert.equal(result.checks['bounded-record-query'].evidence.recordCount, expected.recordCount);
  assert.equal(result.checks['bounded-record-query'].evidence.pages, Math.ceil(expected.recordCount/200)+1);
  assert.equal(f.calls.length, 4 + Math.ceil(expected.recordCount/200)+1 + 8 + 1 + 7);
  assert.equal(progress.length,12);
  assert.match(result.limitations[0], /write D1/);
});
test('header deadline aborts and halts without overlap or retry even when fetch ignores abort', async () => {
  const f = fixture(()=>new Promise(()=>{}));
  const result = await f.run({requestMs:15});
  assert.equal(result.checks['database-health'].outcome,'blocked');
  assert.equal(result.checks['database-health'].errorName,'TimeoutError');
  assert.equal(result.checks['database-health'].request.phase,'response');
  assert.equal(f.calls.length,1);
  assert.equal(f.calls[0].options.signal.aborted,true);
  assert.equal(result.checks['live-manifest'].outcome,'skipped');
});
test('body deadline includes stream consumption and blocks all later requests', async () => {
  const f = fixture(()=>new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('{'));}})));
  const result = await f.run({requestMs:15});
  assert.equal(result.checks['database-health'].request.phase,'body');
  assert.equal(result.checks['database-health'].errorName,'TimeoutError');
  assert.equal(f.calls.length,1);
  assert(f.calls[0].options.signal.aborted);
});
test('transport errors and 503 stop immediately and never leak raw errors or bodies', async () => {
  for (const action of [()=>{throw Object.assign(new Error('SECRET exception'),{failureType:'fake'});},()=>new Response('SECRET body',{status:503})]) {
    const f = fixture(action), result = await f.run();
    assert.equal(result.checks['database-health'].outcome,'blocked');
    assert.equal(f.calls.length,1);
    assert.doesNotMatch(JSON.stringify(result),/SECRET/);
    assert.match(result.findings[0].recommendedChange,/do not automatically retry/);
  }
});
test('redirects rejected before consuming body, no cross-origin follow', async () => {
  const f = fixture(()=>new Response(null,{status:302,headers:{Location:'https://elsewhere.test/secret'}}));
  const result = await f.run();
  assert.equal(result.checks['database-health'].outcome,'failed');
  assert.equal(f.calls.length,1);
  assert.doesNotMatch(JSON.stringify(result),/elsewhere|secret/);
});
test('full health and manifest and bundle identities are required', async () => {
  for (const [route, check, change] of [
    ['health','database-health', value=>{value.engineRevision='engine-00000000000000000000';}],
    ['manifest','live-manifest', value=>{value.datasetHashes.soar='bad';}],
    ['bundle','bundle-integrity', value=>{value.manifest.engineRevision='engine-00000000000000000000';}],
    ['bundle','bundle-integrity', value=>{value.manifest.phase='bad';}],
    ['bundle','bundle-integrity', value=>{value.catalog.records[0].url='corrupt';}],
  ]) {
    const f = fixture(url=>{
      if (!url.pathname.endsWith('/'+route)) return;
      const value = clone(route==='bundle'?bundle:route==='manifest'?expected:{status:'ready',storage:'d1',revision:expected.revision,engineRevision:expected.engineRevision,recordCount:expected.recordCount});
      change(value); return Response.json(value);
    });
    const result = await f.run();
    assert.equal(result.checks[check].outcome,'failed');
    assert.equal(result.checks['bounded-record-query'].outcome,'skipped');
    assert.equal(f.calls.length,route==='health'?2:route==='manifest'?3:4);
  }
});
test('duplicate, missing, corrupt, wrong revision/offset/limit, and overflow pagination fail closed', async () => {
  for (const mode of ['duplicate','missing','corrupt','revision','offset','limit','overflow']) {
    const f = fixture(url=>{
      if (!url.pathname.endsWith('/records') || !url.searchParams.has('offset')) return;
      const offset = +url.searchParams.get('offset');
      if (mode==='overflow' && offset < expected.recordCount) return;
      if (mode!=='overflow' && offset!==200) return;
      const rows = clone(bundle.catalog.records).sort((a,b)=>a.id < b.id ? -1 : 1);
      const value = {revision:expected.revision,offset,limit:200,records:rows.slice(offset,offset+200)};
      if(mode==='duplicate')value.records[0]=rows[0];
      if(mode==='missing')value.records.pop();
      if(mode==='corrupt')value.records[0].extra='corrupt';
      if(mode==='revision')value.revision='bad';
      if(mode==='offset')value.offset++;
      if(mode==='limit')value.limit=199;
      if(mode==='overflow')value.records=[rows[0]];
      return Response.json(value);
    });
    const result = await f.run();
    assert.equal(result.checks['bounded-record-query'].outcome,'failed',mode);
    assert.equal(result.checks['read-only-api'].outcome,'skipped');
    assert.equal(f.calls.at(-1).url.pathname,'/api/content/records');
  }
});
test('invalid JSON is a verification failure, sanitized', async () => {
  const f = fixture(()=>new Response('SECRET invalid json'));
  const result = await f.run();
  assert.equal(result.checks['database-health'].failureType,'verification-failed');
  assert.doesNotMatch(JSON.stringify(result),/SECRET/);
  assert.equal(f.calls.length,1);
});
test('request and total time budgets cannot be expanded; caps prevent next request', async () => {
  let f = fixture(), result = await f.run({maxRequests:2});
  assert.equal(result.checks['live-manifest'].failureType,'budget-exhausted');
  assert.equal(f.calls.length,2);
  let elapsed=0;
  f=fixture(()=>{elapsed+=20;});
  result=await f.run({totalMs:10,now:()=>elapsed});
  assert.equal(result.checks['database-health'].failureType,'budget-exhausted');
  assert.equal(f.calls.length,1);
  for(const options of [{maxRequests:LIMITS.maxRequests+1},{totalMs:LIMITS.totalMs+1},{requestMs:LIMITS.requestMs+1}]) await assert.rejects(f.run(options),/Invalid diagnostic budget/);
});
test('method guard rejection and adapter mismatch both halt the run', async () => {
  for (const mode of ['method','adapter']) {
    const f = fixture((url,options)=> mode==='method' && options.method==='POST' ? new Response('accepted') : mode==='adapter' && url.pathname==='/data.js' ? new Response('missing') : undefined);
    const result = await f.run();
    assert.equal(result.checks[mode==='method'?'read-only-api':'bundled-fallback-assets'].outcome,'failed');
    assert.equal(f.calls.at(-1).url.pathname,mode==='method'?'/api/content/manifest':'/data.js');
  }
});
test('headers and body share one deadline rather than resetting the body timer', async () => {
  const f = fixture(async()=> {
    await new Promise(resolve=>setTimeout(resolve,20));
    return { status:200, body: { getReader: () => ({ read: () => new Promise(resolve => setTimeout(() => resolve({done:false,value:Buffer.from('{}')}),40)), cancel:()=>Promise.resolve(), releaseLock(){} }) } };
  });
  const result=await f.run({requestMs:35});
  assert.equal(result.checks['database-health'].errorName,'TimeoutError');
  assert.equal(result.checks['database-health'].request.phase,'body');
  assert.equal(f.calls.length,1);
});
test('request wall budget is enforced when synchronous fetch work advances time', async () => {
  let elapsed=0;
  const f=fixture(()=>{elapsed=15;});
  const result=await f.run({requestMs:10,now:()=>elapsed});
  assert.equal(result.checks['database-health'].errorName,'TimeoutError');
  assert.equal(f.calls.length,1);
});
test('body byte cap stops oversized responses without retaining response data', async () => {
  const f=fixture(()=>new Response(new Uint8Array(LIMITS.maxBodyBytes+1)));
  const result=await f.run();
  assert.equal(result.checks['database-health'].outcome,'failed');
  assert.match(result.checks['database-health'].evidence,/body exceeds/);
  assert.equal(f.calls.length,1);
});
test('static manifest mismatch halts before any content API can initialize D1', async () => {
  const f=fixture(url=>url.pathname==='/content-manifest.json'?Response.json({...expected,engineRevision:'engine-00000000000000000000'}):undefined);
  const result=await f.run();
  assert.equal(result.checks['database-health'].outcome,'failed');
  assert.equal(f.calls.length,1);
  assert.equal(f.calls[0].url.pathname,'/content-manifest.json');
});
test('redirected responses and excessive declared lengths reject without reading a body', async () => {
  for (const response of [
    {status:200, redirected:true, text:()=>{throw Error('body must not run');}},
    {status:200,headers:new Headers({'content-length':String(LIMITS.maxBodyBytes+1)}),text:()=>{throw Error('body must not run');}}
  ]) {
    const f=fixture(()=>response),result=await f.run();
    assert.equal(result.checks['database-health'].outcome,'failed');
    assert.equal(f.calls.length,1);
    assert.doesNotMatch(JSON.stringify(result),/body must not run/);
  }
});
test('generated marker alone cannot certify corrupt fallback bytes', async () => {
  const f=fixture(url=>url.pathname==='/data.js'?new Response('/* Generated from content/datasets/platform.json */'):undefined);
  const result=await f.run();
  assert.equal(result.checks['bundled-fallback-assets'].outcome,'failed');
  assert.match(result.checks['bundled-fallback-assets'].evidence,/byte digest mismatch/);
});
test('never-resolving cancellation cannot hold the timeout receipt open', async () => {
  let cancelled=0, released=0;
  const f=fixture(()=>({status:200,body:{getReader:()=>({read:()=>new Promise(()=>{}),cancel:()=>{cancelled++;return new Promise(()=>{});},releaseLock:()=>{released++;}})}}));
  const result=await f.run({requestMs:15});
  assert.equal(result.checks['database-health'].errorName,'TimeoutError');
  assert.equal(cancelled,1); assert.equal(released,1); assert.equal(f.calls.length,1);
});
test('late fetch is cancelled without acquiring or consuming its response reader', async () => {
  let finish, cancelled=0, acquired=0;
  const f=fixture(()=>new Promise(resolve=>{finish=resolve;}));
  const result=await f.run({requestMs:15});
  finish({status:200,body:{cancel:()=>{cancelled++;return new Promise(()=>{});},getReader:()=>{acquired++;throw Error('must not acquire');}}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(result.checks['database-health'].errorName,'TimeoutError');
  assert.equal(cancelled,1); assert.equal(acquired,0); assert.equal(f.calls.length,1);
});
test('late body chunk is never inspected after timeout and no new read is started', async () => {
  let finish, reads=0, cancelled=0, inspected=0;
  const f=fixture(()=>({status:200,body:{getReader:()=>({read:()=>{reads++;return new Promise(resolve=>{finish=resolve;});},cancel:()=>{cancelled++;return new Promise(()=>{});},releaseLock(){}})}}));
  const result=await f.run({requestMs:15});
  finish({done:false,get value(){inspected++;return Buffer.from('SECRET');}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(result.checks['database-health'].errorName,'TimeoutError');
  assert.equal(cancelled,1); assert.equal(reads,1); assert.equal(inspected,0); assert.equal(f.calls.length,1);
});
test('body cap cancels a reader without waiting for cancellation', async () => {
  let cancelled=0;
  const f=fixture(()=>({status:200,body:{getReader:()=>({read:async()=>({done:false,value:new Uint8Array(LIMITS.maxBodyBytes+1)}),cancel:()=>{cancelled++;return new Promise(()=>{});},releaseLock(){}})}}));
  const result=await f.run();
  assert.equal(result.checks['database-health'].outcome,'failed');
  assert.equal(cancelled,1); assert.equal(f.calls.length,1);
});
test('JSON rejects invalid UTF-8 instead of silently replacing bytes', async () => {
  const f=fixture(()=>new Response(Buffer.concat([Buffer.from('{"value":"'),Buffer.from([255]),Buffer.from('"}')])));
  const result=await f.run();
  assert.equal(result.checks['database-health'].evidence,'Invalid UTF-8 response');
  assert.equal(f.calls.length,1);
});
test('fallback digest uses raw bytes, not replacement-character text', async () => {
  const names=['data.js','product-data.js','guidance-data.js','environment-data.js','editions-data.js','forwarders-data.js','soar-data.js'];
  const expectedAdapters=Object.fromEntries(names.map(file=>[file,fs.readFileSync('dist/'+file)]));
  expectedAdapters['data.js']=Buffer.from('\ufffd');
  const f=fixture(url=>url.pathname==='/data.js'?new Response(Buffer.from([255])):undefined);
  const result=await f.run({expectedAdapters});
  assert.equal(result.checks['bundled-fallback-assets'].outcome,'failed');
});
test('nonstream text responses are rejected without unbounded text allocation', async () => {
  let invoked=false;
  const f=fixture(()=>({status:200,text:async()=>{invoked=true;return '{}';}}));
  const result=await f.run();
  assert.equal(result.checks['database-health'].evidence,'Streaming response body required');
  assert.equal(invoked,false);
});
test('immediately-resolved empty chunks cannot starve the monotonic deadline', async () => {
  let elapsed=0, reads=0, cancelled=0;
  const f=fixture(()=>({status:200,body:{getReader:()=>({read:async()=>{reads++;elapsed+=1;return {done:false,value:new Uint8Array(0)};},cancel:()=>{cancelled++;return Promise.resolve();},releaseLock(){}})}}));
  const result=await f.run({now:()=>elapsed,requestMs:10});
  assert.equal(result.checks['database-health'].errorName,'TimeoutError');
  assert.equal(reads,10); assert.equal(cancelled,1); assert.equal(f.calls.length,1);
});
test('synchronous header overrun is rejected before acquiring a stream reader', async () => {
  let elapsed=0, acquired=0, cancelled=0;
  const f=fixture(()=>{elapsed=11;return {status:200,body:{getReader(){acquired++;throw Error('must not acquire');},cancel(){cancelled++;return Promise.resolve();}}};});
  const result=await f.run({now:()=>elapsed,requestMs:10});
  assert.equal(result.checks['database-health'].errorName,'TimeoutError');
  assert.equal(acquired,0); assert.equal(cancelled,1); assert.equal(f.calls.length,1);
});
test('bundle requires its exact envelope even when digest-covered payload is valid', async () => {
  const f=fixture(url=>url.pathname.endsWith('/bundle')?Response.json({...bundle,unexpected:'extra'}):undefined);
  const result=await f.run();
  assert.equal(result.checks['bundle-integrity'].evidence,'Bundle envelope mismatch');
  assert.equal(result.checks['bounded-record-query'].outcome,'skipped');
});
test('terminal empty pagination probes exact expected count, including a partial final page', async () => {
  const f=fixture(),result=await f.run();
  assert.equal(result.status,'delivery-checks-passed');
  const pages=f.calls.filter(call=>call.url.searchParams.has('offset') && call.url.searchParams.get('limit')==='200');
  assert.equal(+pages.at(-1).url.searchParams.get('offset'),expected.recordCount);
  assert.equal(pages.length,Math.ceil(expected.recordCount/200)+1);
});
