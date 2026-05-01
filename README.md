# code-code-console-web

React console and showcase web workspace for Code Code.

This repository owns:

- `packages/console-web/app`: main console web application.
- `packages/console-web/showcase`: showcase web application.
- `packages/console-web/packages/*`: console feature packages and shared UI.
- `code-code-contracts`: generated TypeScript contracts as a Git submodule.

Useful checks:

```bash
cd packages/console-web && pnpm install && pnpm typecheck
cd packages/console-web && pnpm test
```
