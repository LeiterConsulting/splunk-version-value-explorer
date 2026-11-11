const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {transform}=require('../scripts/ci-ubuntu-transport.cjs');
test('list rewrites only official mirror transport, preserving options/suites/components/comments',()=>{
 const before='deb [arch=amd64 signed-by=/usr/share/keyrings/ubuntu.gpg] mirror+file:/etc/apt/apt-mirrors.txt noble main universe # note\n' +
 'deb-src http://azure.archive.ubuntu.com/ubuntu/ noble-security main\n'+
 'deb https://packages.microsoft.com/ubuntu/24.04/prod noble main\n# deb http://azure.archive.ubuntu.com/ubuntu noble main\n';
 const out=transform(before,'.list');
 assert.equal(out,before.replace('mirror+file:/etc/apt/apt-mirrors.txt','https://archive.ubuntu.com/ubuntu').replace('http://azure.archive.ubuntu.com/ubuntu/','https://security.ubuntu.com/ubuntu'));
 assert.equal(transform(out,'.list'),out);
});
test('deb822 preserves trust fields and suites, uses security for dedicated security stanza',()=>{
 const before='Types: deb\nURIs: mirror+file:/etc/apt/apt-mirrors.txt\nSuites: noble noble-updates noble-backports\nComponents: main universe\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n\nTypes: deb\nURIs: mirror+file:/etc/apt/apt-mirrors-security.txt\nSuites: noble-security\nComponents: main\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n';
 assert.equal(transform(before,'.sources'),before.replace('mirror+file:/etc/apt/apt-mirrors.txt','https://archive.ubuntu.com/ubuntu').replace('mirror+file:/etc/apt/apt-mirrors-security.txt','https://security.ubuntu.com/ubuntu'));
});
test('combined suites stay unchanged and use official archive hosting security pocket',()=>{
 const x='URIs: http://azure.archive.ubuntu.com/ubuntu\nSuites: noble noble-security\nSigned-By: key\n';
 assert.equal(transform(x,'.sources'),x.replace('http://azure.archive.ubuntu.com/ubuntu','https://archive.ubuntu.com/ubuntu'));
});
test('unrelated, mixed and multiline source fields are untouched',()=>{
 for(const x of [
 'URIs: https://packages.microsoft.com/ubuntu/24.04/prod\nSuites: noble\n',
 'URIs: mirror+file:/etc/apt/apt-mirrors.txt https://example.org\nSuites: noble\n',
 'URIs: mirror+file:/etc/apt/apt-mirrors.txt\n https://example.org\nSuites: noble\n',
 'URIs: mirror+file:/etc/apt/apt-mirrors.txt\nSuites: noble\n noble-security\n',
 'URIs: mirror+file:/unapproved/file\nSuites: noble\n',
 ]) assert.equal(transform(x,'.sources'),x);
});
test('workflow keeps full browser dependencies, renderer and export gates',()=>{
 const y=fs.readFileSync('.github/workflows/validate.yml','utf8');
 assert(y.includes('playwright install --with-deps chromium'));
 assert(y.includes('sudo apt-get update && sudo apt-get install -y poppler-utils'));
 assert(y.includes('node tools/export-verification/verify.mjs'));
 assert(y.includes('node scripts/check-soak.cjs'));
 assert(y.indexOf('ci-ubuntu-transport.cjs --apply')<y.indexOf('playwright install --with-deps'));
});
