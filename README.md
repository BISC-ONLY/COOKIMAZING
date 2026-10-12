# COOKIMAZING School Cookie Store

Cleaned VS Code project extracted from the original project archive.

## What is included

- `artifacts/COOKIMAZING/` — the React + Vite website
- `artifacts/api-server/` — the Express API used by the website
- `lib/` — shared API/database packages
- `scripts/` — project scripts
- `pnpm-workspace.yaml` — workspace configuration

The Replit metadata, Git history, build output, and temporary TypeScript build files were removed.

## Open in VS Code

1. Extract this folder.
2. Open the **COOKIMAZING-VSCode** folder in VS Code.
3. Install Node.js (LTS) and pnpm.
4. In the VS Code terminal, run:

```bash
pnpm install
```

5. The website can then be started with the frontend and API server.

### Frontend

```bash
pnpm --filter @workspace/COOKIMAZING dev
```

Open the address Vite prints (normally `http://localhost:5173`).

### API

The frontend is configured to proxy `/api` requests to `http://localhost:3001`.

```bash
pnpm --filter @workspace/api-server dev
```

The API uses the project's database package, so order-saving features require a PostgreSQL `DATABASE_URL`.

## Important

This is a TypeScript/React website, so its main entry point is:

`artifacts/COOKIMAZING/src/main.tsx`

It is not a plain static `index.js` website. Keeping the React/Vite structure preserves the existing pages, cart, checkout, images, and components.
