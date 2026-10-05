/* Local Worker API preview with SQLite and the same frontend assets. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const root = path.resolve(__dirname, '../dist');
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg'};
const db = require('./local-content-db.cjs')();
const worker = import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync('dist/server/index.js', 'utf8')).toString('base64'));
const server = http.createServer(async (req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  if (pathname === '/__qa/mobile') {
    const query = new URL(req.url, 'http://localhost').search.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    res.end('<!doctype html><html><head><meta charset="utf-8"><title>VersionCompass phone preview</title></head><body><iframe title="390px VersionCompass preview" src="/'+query+'" style="width:390px;height:844px;border:0"></iframe></body></html>'); return;
  }
  if (pathname.startsWith('/api/content/')) {
    const response = await (await worker).default.fetch(new Request('http://localhost' + req.url, { method: req.method }), { DB: db });
    res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer())); return;
  }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, content) => {
    if (error) { res.writeHead(404).end(); return; }
    res.writeHead(200, {'Content-Type':(types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8','Cache-Control':'no-store'});
    res.end(content);
  });
});
server.listen(Number(option('--port', 4173)), option('--host', '127.0.0.1'), () => console.log('Static preview ready'));
