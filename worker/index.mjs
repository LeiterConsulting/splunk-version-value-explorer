/* Read-only public API. No caller can submit or mutate content. */
export function createWorker(seed, assets) {
  const headers = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' };
  const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'Read-only content service' }, 405, { Allow: 'GET, HEAD' });
      if (url.pathname.startsWith('/api/content/')) {
        const routes = ['/api/content/manifest', '/api/content/bundle', '/api/content/records', '/api/content/health'];
        if (!routes.includes(url.pathname)) return json({ error: 'Unknown content route' }, 404);
        const params = url.searchParams;
        const allowed = url.pathname.endsWith('/records') ? ['revision', 'kind', 'dataset', 'offset', 'limit'] : ['revision'];
        if ([...params.keys()].some(k => !allowed.includes(k) || params.getAll(k).length !== 1)) return json({ error: 'Unknown or repeated content selection' }, 400);
        const revision = params.get('revision') || seed.manifest.revision;
        if (!/^content-[a-f0-9]{24}$/.test(revision)) return json({ error: 'Invalid content revision' }, 400);
        const kind = params.get('kind'), dataset = params.get('dataset');
        const offset = Number(params.get('offset') || '0'), limit = Number(params.get('limit') || '100');
        if (![offset, limit].every(Number.isSafeInteger) || offset < 0 || limit < 1 || limit > 200 || (kind && !/^[a-z-]{1,40}$/.test(kind)) || (dataset && !['platform','products','guidance','environment','editions','forwarders','soar','sources'].includes(dataset))) return json({ error: 'Invalid record filter or pagination' }, 400);
        try {
          await ensureRevision(env.DB, seed);
          const bundle = await readBundle(env.DB, revision);
          if (!bundle) return json({ error: 'Published revision not available', requestedRevision: revision }, 404);
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
      const asset = assets[pathname];
      if (!asset) return new Response('Not found', { status: 404, headers });
      return new Response(request.method === 'HEAD' ? null : asset.body, { status: 200, headers: { ...headers, 'Content-Type': asset.type, 'Cache-Control': 'no-store' } });
    },
  };
}
