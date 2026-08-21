# Tactile website domain

- `tactile/` serves `tactile.dysfunction.in`; React/Vite source is in `tactile/src`.
- The marketing site reads GitHub releases and the production marketplace catalog with bundled failure states.
- Theme exports must remain compatible with `C:\Users\ranji\Dev\tactile\src\themes.js`; previews must not run or iframe the app.
- `tactile/scripts/build-tactile-app.mjs` builds the real app at `/app/` from `TACTILE_SOURCE_DIR`, the local sibling repository, or a CI clone.
- Treat `C:\Users\ranji\Dev\tactile` as read-only reference unless the task explicitly targets it.
- Validate with `npm run lint:tactile` and `npm run build:tactile` from the repository root.