# dysfunction web

This repository is the root for websites hosted under `dysfunction.in`.

```text
web/
	node_modules/       shared npm installation
	package-lock.json   shared dependency lock
	tactile/            tactile.dysfunction.in
	something/          future subdomain application
```

Each subdomain owns its source, public assets, configuration, and build output. npm workspaces keep dependencies and the lockfile at the repository root without coupling the applications together.

## Tactile

```powershell
npm install
npm run dev:tactile
npm run lint:tactile
npm run build:tactile
```

The full build outputs the product website to `tactile/dist` and the real browser version of Tactile to `tactile/dist/app`. Locally, the browser build uses the sibling source repository at `../tactile`. Set `TACTILE_SOURCE_DIR` to override it. In CI, the script shallow-clones `dysfunctionin/tactile` when no local source exists; `TACTILE_REF` selects a branch or tag and defaults to `main`.

For Cloudflare Pages, use `npm run build:tactile` as the build command and `tactile/dist` as the output directory. Attach the custom domain `tactile.dysfunction.in` in Cloudflare Pages. `_redirects` preserves `/app` browser-app navigation and `_headers` supplies baseline static security headers.

A future payment integration should live behind a Cloudflare Worker route such as `/api/checkout` and `/api/webhooks`. Keep provider secrets, price validation, and webhook signatures out of every static subdomain application.