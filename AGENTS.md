# Web agent entrypoint

This repository hosts independent `dysfunction.in` subdomain apps in one npm workspace.

## Route first

1. Read `.agents/routing.md`.
2. Load one workflow and one domain file named there.
3. Inspect the owning source and nearest check before editing.

## Invariants

- Keep dependencies and `package-lock.json` at the repository root; do not create nested `node_modules`.
- Keep each subdomain's source, assets, config, and output inside its folder.
- Preserve unrelated worktree changes and avoid committing generated `dist/` output.
- Validate the touched workspace through root scripts before handoff.
- Keep secrets, payment logic, and webhook verification in server-side Worker/API code, never static clients.