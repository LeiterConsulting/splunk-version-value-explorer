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

test('the first citation occurrence cannot borrow a later repeated source title to hide an orphan',()=>{
 const script=`import sys\nsys.path.insert(0,'tools/export-verification')\nfrom pagination import inspect\npair={'heading':'Source title','following':'https://example.test/exact-source','headingOccurrence':1}\ntry:\n inspect('Source title\\fhttps://example.test/exact-source Source title https://example.test/exact-source', [pair])\nexcept AssertionError as error:\n assert 'Orphaned PDF heading' in str(error)\nelse:\n raise AssertionError('A repeated later source title concealed the first split citation')\nassert inspect('Source title https://example.test/exact-source\\fSource title', [pair])[0]['pages']==[1]\nassert inspect('Source title\\fSource title https://example.test/exact-source', [{**pair,'headingOccurrence':2}])[0]['pages']==[2]\n`;
 assert.doesNotThrow(()=>execFileSync('python3',['-B','-c',script]));
});

test('retained native Safari page text rejects the observed label and citation splits',()=>{
 const script=`import sys,json,hashlib,pathlib\nsys.path.insert(0,'tools/export-verification')\nfrom pagination import inspect\nroot=pathlib.Path('tests/fixtures')\nrecord=json.loads((root/'prep11-safari-pagination-before.json').read_text())\nraw=(root/record['textFile']).read_bytes()\nassert hashlib.sha256(raw).hexdigest()==record['textSha256']\ncontent=raw.decode()\nassert len(content.split('\\f'))==record['pageCount']\nfor pair in record['pairs']:\n try:\n  inspect(content,[pair])\n except AssertionError as error:\n  assert 'Orphaned PDF heading' in str(error)\n else:\n  raise AssertionError('Native Safari split was accepted: '+pair['heading'])\n`;
 assert.doesNotThrow(()=>execFileSync('python3',['-B','-c',script]));
});
