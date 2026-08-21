# Context router

Load the smallest matching workflow and domain.

| Task | Workflow | Domain |
| --- | --- | --- |
| Feature, fix, refactor, UI | `workflows/change.md` | Owning app, currently `domains/tactile.md` |
| Workspace, dependency, new subdomain | `workflows/change.md` | `domains/repository.md` |
| Build, Cloudflare, DNS, release | `workflows/deploy.md` | Owning app plus `domains/repository.md` only if root config changes |

For ambiguous work, search the named behavior, choose the code that controls it, and expand one dependency at a time.