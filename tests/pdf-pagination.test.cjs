const {test}=require('node:test'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
test('PDF pagination guard rejects complete text split across pages, not just missing text',()=>{
 const script=`import sys\nsys.path.insert(0,'tools/export-verification')\nfrom pagination import inspect\npairs=[{'heading':'Runtime heading','following':'First paragraph'}]\nassert inspect('Runtime heading First paragraph\\f',pairs)[0]['pages']==[1]\ntry:\n inspect('Runtime heading\\fFirst paragraph',pairs)\nexcept AssertionError as error:\n assert 'Orphaned PDF heading' in str(error)\nelse:\n raise AssertionError('Split-page negative fixture was not rejected')\n`;
 assert.doesNotThrow(()=>execFileSync(process.platform==='win32'?'py':'python3',[...(process.platform==='win32'?['-3']:[]),'-B','-c',script]));
});

test('native pagination replay labels deterministic page-boundary fallback separately',()=>{
 const source=require('node:fs').readFileSync('tools/export-verification/verify.mjs','utf8');
 assert.match(source,/replayMode='prior-css-native-layout'/);
 assert.match(source,/replayMode='forced-native-page-boundary'/);
 assert.match(source,/boundaryPage\.setContent/);
 assert.match(source,/page-break-before:always/);
});
