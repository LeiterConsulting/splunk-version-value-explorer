/* Public content is read-only; publisher requests have a separate secret boundary. */
export function createWorker(seed, assets) {
  const headers = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' };
  const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/publisher/')) return publisherRequest(request, env, seed, json);
      if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'Read-only content service' }, 405, { Allow: 'GET, HEAD' });
      if (url.pathname.startsWith('/api/content/')) {
        const routes = ['/api/content/manifest', '/api/content/bundle', '/api/content/records', '/api/content/health'];
        if (!routes.includes(url.pathname)) return json({ error: 'Unknown content route' }, 404);
        const params = url.searchParams;
        const allowed = url.pathname.endsWith('/records') ? ['revision', 'kind', 'dataset', 'offset', 'limit', 'engine'] : ['revision', 'engine'];
        if ([...params.keys()].some(k => !allowed.includes(k) || params.getAll(k).length !== 1)) return json({ error: 'Unknown or repeated content selection' }, 400);
        const engine = params.get('engine') || seed.manifest.engineRevision;
        if (engine !== seed.manifest.engineRevision) return json({ error: 'Unsupported deployed engine' }, 409);
        let revision = params.get('revision') || seed.manifest.revision;
        if (!/^content-[a-f0-9]{24}$/.test(revision)) return json({ error: 'Invalid content revision' }, 400);
        const kind = params.get('kind'), dataset = params.get('dataset');
        const offset = Number(params.get('offset') || '0'), limit = Number(params.get('limit') || '100');
        if (![offset, limit].every(Number.isSafeInteger) || offset < 0 || limit < 1 || limit > 200 || (kind && !/^[a-z-]{1,40}$/.test(kind)) || (dataset && !['platform','products','guidance','environment','editions','forwarders','soar','sources'].includes(dataset))) return json({ error: 'Invalid record filter or pagination' }, 400);
        try {
          await ensureRevision(env.DB, seed);
          // Opt in only after affected browser/export evidence is recorded. Explicit
          // revision reads remain compatible with existing deployment-pinned clients.
          if (!params.has('revision') && env.VC_ACTIVE_DELIVERY === '1') {
            const head = await readPublicationHead(env.DB, engine);
            const proof = await env.DB.prepare('SELECT revision_id FROM content_publication_provenance WHERE revision_id = ? AND repository = ?').bind(head.revision, REPOSITORY).first();
            if (head.generation < 1 || !proof) throw Error('Verified publisher head required');
            revision = head.revision;
          }
          const bundle = await readBundle(env.DB, revision);
          if (!bundle) return json({ error: 'Published revision not available', requestedRevision: revision }, 404);
          if (bundle.manifest.engineRevision !== engine) return json({ error: 'Revision belongs to another engine' }, 409);
          const extra = { 'X-VersionCompass-Content': revision, 'X-VersionCompass-Engine': bundle.manifest.engineRevision };
          if (request.method === 'HEAD') return new Response(null, { status: 200, headers: { ...headers, ...extra } });
          if (url.pathname.endsWith('/health')) return json({ status: 'ready', storage: 'd1', revision, engineRevision: bundle.manifest.engineRevision, recordCount: bundle.manifest.recordCount }, 200, extra);
          if (url.pathname.endsWith('/manifest')) return json(bundle.manifest, 200, extra);
          if (url.pathname.endsWith('/records')) return json({ revision, offset, limit, records: await readRecords(env.DB, revision, kind, dataset, offset, limit) }, 200, extra);
          return json(bundle, 200, extra);
        } catch {
          return json({ error: 'Content database unavailable; published bundled content remains available', revision: seed.manifest.revision }, 503);
        }
      }
      const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
      const asset = assets[pathname === '/content-client.js' && env.VC_ACTIVE_DELIVERY === '1' ? '/content-client-active.js' : pathname];
      if (!asset) return new Response('Not found', { status: 404, headers });
      const delivery = pathname === '/content-manifest.json' && env.VC_ACTIVE_DELIVERY === '1' ? { 'X-VersionCompass-Active-Delivery': '1' } : {};
      return new Response(request.method === 'HEAD' ? null : asset.body, { status: 200, headers: { ...headers, ...delivery, 'Content-Type': asset.type, 'Cache-Control': 'no-store' } });
    },
  };
}
