const fs=require('node:fs'),crypto=require('node:crypto');
const files=fs.readdirSync('dist').filter(f=>/\.(js|css|html)$/.test(f)&&f!=='content-revision.js').sort();
const hash=crypto.createHash('sha256');for(const f of files)hash.update(f+'\0').update(fs.readFileSync('dist/'+f)).update('\0');
const publication=fs.readdirSync('docs/releases').filter(f=>/^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort().at(-1).slice(0,10);
const output='window.VersionCompassRevision = '+JSON.stringify({id:'vc-'+hash.digest('hex').slice(0,16),publication})+';\n',file='dist/content-revision.js';
if(process.argv.includes('--check')){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==output)throw Error('Content revision is stale; run sync-content-revision.cjs');}else fs.writeFileSync(file,output);
console.log('Content revision synchronized');
