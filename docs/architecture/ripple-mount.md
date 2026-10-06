# Unlisted Ripple prototype

The public VersionCompass Worker serves Ripple at `https://versioncompass.com/ripple` and `/ripple/`. No link is added to the main interface. Ripple has its own HTML, React bundle, CSS and icon under `dist/ripple/`; its assessment links retain the `/ripple` path. The prototype page and assets send `noindex, nofollow`, which is an indexing preference rather than access control.

## Research reads and private updates

The mount reads the existing owner-private Ripple Site, `appgprj_6ac52b764ebc8191889f700f34ea17e3`, through two fixed endpoints: `GET /ripple/api/snapshot` and `GET /ripple/api/cve?id=CVE-YYYY-NNNN`. `HEAD` returns headers without a body. The Worker validates queries and upstream JSON, caps response size, rejects redirects and returns only the public research fields. It sends the server-only `RIPPLE_READ_SERVICE_TOKEN` only to `https://ripple-exposure.majorgeneralrabidzagnut.chatgpt.site` as `OAI-Sites-Authorization`. It forwards no visitor cookies, identity or authorization headers and returns no upstream cookies or credentials.

There is no public refresh or administrative endpoint. The existing private daily updater, `Automation_9e515257fc608191b6ed1f59aa9d26ef`, continues at 06:00 America/Los_Angeles. Ripple's D1 research and update history stay on its original Site. No VersionCompass schema, publisher settings or maintenance schedules change. If the service is unavailable, the client labels its fallback baseline; a baseline does not imply current comprehensive coverage. Changes to a source flag assessments for review rather than advancing their claim verification dates.

Product versions and watchlists use Ripple's own browser-local storage key. Assessment links and research JSON exports omit this local context. NVD lookup supplies upstream details and does not independently establish Cisco impact.

## Source and builds

`tools/ripple/provenance.json` records the original Ripple source commit and bounded mount adaptations. These sources and checked-in production assets are covered by `tools/ripple/build-manifest.json`. Every normal Worker build checks all source and asset hashes; it does not need to install a second app's dependencies or modify the main client.

To regenerate the isolated assets with the pinned build dependencies:

```sh
cd tools/ripple
npm install
npm run build
```

When using an already installed matching dependency checkout, `node scripts/build-ripple.cjs --dependencies-root /absolute/checkout --esbuild-module /absolute/path/to/esbuild/lib/main.js` uses it without changing VersionCompass's package manifest. React 19.2.6, React DOM 19.2.6, lucide-react 1.31.0 and esbuild 0.28.0 are the client build inputs. No third-party script or stylesheet is fetched by the browser.

Run the four ordered repository synchronization steps and check gates, the complete tests and the Worker build before publication. Live verification must independently check the custom-domain route, isolated assets, snapshot and CVE lookup, blocked writes and preserved original routes. Rendered browser, keyboard and export checks remain separate from HTTP and source verification. Removing the bounded Worker branch, the four isolated assets and its secret removes the mount without moving VersionCompass's domain or Ripple's data.
