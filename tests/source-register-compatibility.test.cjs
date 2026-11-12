const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const script=fs.readFileSync('scripts/sync-content.cjs','utf8');
const derivation=script.slice(script.indexOf('const engineFiles ='),script.indexOf('\n',script.indexOf('const engineRevision =')));
function engine(sourceRegister){return vm.runInNewContext(derivation+';({engineRevision,engineFiles});',{hash,fs:{readFileSync(file,encoding){return file==='dist/source-register.js'?sourceRegister:fs.readFileSync(file,encoding);}}});}
function decorate(sourceRegister){const context={window:{VersionCompassRevision:{id:'vc-static',publication:'2000-01-01'},VersionCompassContent:{revision:'content-'+'a'.repeat(24),engineRevision:'engine-'+'b'.repeat(20),status:'database'}},document:{addEventListener(){}}};vm.runInNewContext(sourceRegister,context);vm.runInNewContext(fs.readFileSync('dist/report-tools.js','utf8'),context);return context.window;}
test('source citation metadata participates in engine compatibility without changing canonical data or evidence',()=>{
 const original=fs.readFileSync('dist/source-register.js','utf8'),a=engine(original);
 assert(a.engineFiles.includes('dist/source-register.js'));
 const sources=decorate(original).VersionCompassSources;
 const chosen=sources.sources.find(s=>s.url&&s.verificationScope);assert(chosen);
 // Synthetic in-memory change only: no saved source date or fact is edited.
 chosen.reviewed='2000-01-02';chosen.verificationScope='Synthetic scope change for compatibility test only';
 const changed='window.VersionCompassSources = '+JSON.stringify(sources)+';';
 assert.notEqual(engine(changed).engineRevision,a.engineRevision,'Changed source date/scope must require a different runtime engine');
 const report=decorate(changed).VersionCompassReports.decorate('<p>Fixture report</p>',[chosen.url]);
 assert(report.includes('2000-01-02'));assert(report.includes('Synthetic scope change for compatibility test only'));
 assert(report.includes('Dataset content-'+'a'.repeat(24)));assert(report.includes('Delivery database'));
 assert.equal(fs.readFileSync('dist/source-register.js','utf8'),original,'No actual verification date changed');
});
