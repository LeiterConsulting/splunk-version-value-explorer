/* Pure deterministic compilation. Default is a blank reusable workflow only. */
const path=require('node:path'),fs=require('node:fs'),REPO=path.resolve(__dirname,'../..'),WORKFLOW_DIR=__dirname;
function compile({document=null,examples={}}={}){
 const prior=process.cwd();process.chdir(WORKFLOW_DIR);try{
 const {load,files}=require('./scripts/load-model.cjs'),{env,model:M}=load(),safe=M.safeJSON;
 const boot='window.WorkflowPublic=JSON.parse(document.getElementById("public-data").textContent);if(!window.WorkflowIntegratedRoute){window.SPLUNK_DATA={guidance:WorkflowPublic.guidance};window.VersionCompassEnvironmentData=WorkflowPublic.environment;}window.WorkflowTyped=WorkflowPublic.typed;window.WorkflowBuild=WorkflowPublic.build;';
 const vendor=files.map(f=>'<script>'+fs.readFileSync(path.join(REPO,'dist',f),'utf8')+'</script>').join('\n');
 const replacements={'/*STYLE*/':fs.readFileSync('styles.css','utf8'),'/*PUBLIC*/':safe(env.WorkflowPublic),'/*EXAMPLES*/':safe(examples),'/*STATE*/':safe({document,view:document?.built?'review':'draft'}),'/*BOOT*/':boot,'/*VENDOR*/':vendor,'/*MODEL*/':['scope.cjs','prerequisites.cjs','model.cjs','migration.cjs'].map(p=>fs.readFileSync(p,'utf8')).join('\n'),'/*APP*/':fs.readFileSync('app.js','utf8')};
 return fs.readFileSync('index.template.html','utf8').replace(/\/\*(?:STYLE|PUBLIC|EXAMPLES|STATE|BOOT|VENDOR|MODEL|APP)\*\//g,t=>replacements[t]);
 }finally{process.chdir(prior);}
}
function main(args=process.argv.slice(2)){
 if(args.some(x=>x!=='--check'))throw Error('The prospective public compiler accepts no customer document or example input.');
 const html=compile(),outputs={
  'advisor-workflow-candidate.html':html,
  'advisor-workflow.js':fs.readFileSync(path.join(WORKFLOW_DIR,'route-bootstrap.js'),'utf8').replace('/*STANDALONE_HTML*/',JSON.stringify(html)),
  // Explicit guided recovery/comparison entry. It shares the same current facts;
  // a release rollback restores the previous complete bundle, not this file alone.
  'advisor-guided.html':fs.readFileSync(path.join(REPO,'dist/index.html'),'utf8')
 };
 for(const [name,bytes]of Object.entries(outputs)){
  const output=path.join(REPO,'dist',name);
  if(args.includes('--check')){if(fs.readFileSync(output,'utf8')!==bytes)throw Error('Requirement workflow asset needs synchronization: '+name);}
  else fs.writeFileSync(output,bytes);
 }
 return path.join(REPO,'dist/advisor-workflow-candidate.html');
}
if(require.main===module)console.log(main());module.exports={compile,main};
