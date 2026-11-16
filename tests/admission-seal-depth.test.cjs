const {test}=require('node:test');
const {execFileSync}=require('node:child_process');
test('seal conjunctions preserve predicates and operate at expression depth100',()=>{
 execFileSync('python3',['tests/admission-seal-depth.py'],{cwd:process.cwd(),stdio:'pipe',timeout:30000});
});
