# Repository domain

- `web/` is the Git and npm workspace root; sibling folders represent subdomains.
- Root owns `node_modules`, `package-lock.json`, workspace registration, and orchestration scripts.
- Each app owns source, public assets, tooling config, deployment files, and `dist/`.
- Add a future app as a root workspace sibling, not inside `tactile/`.
- Use `npm run <command> --workspace <name>` or a documented root alias.