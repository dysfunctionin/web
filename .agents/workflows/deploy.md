# Deploy workflow

1. Confirm the target app, host, build command, and output directory.
2. Keep hosting files in the owning app unless they coordinate the whole repository.
3. Verify direct entry URLs and static asset paths, including nested apps.
4. Document owner actions for DNS, credentials, secrets, and provider dashboards; never invent or commit them.

Cloudflare Pages currently builds Tactile with `npm run build:tactile` and publishes `tactile/dist`.