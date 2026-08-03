# Repository guidance for coding agents

## Scope and current maturity

- This file applies to the entire repository.
- This is an early-stage Tekken Nicaragua web application. Authentication and a protected admin dashboard exist, but the root page, metadata, public assets, and `README.md` are still largely the Create Next App scaffold. Do not assume scaffold copy or UI represents settled product requirements.
- Preserve unrelated user changes and avoid broad cleanup unless the task calls for it.

## Toolchain

- Use **pnpm**. `pnpm-lock.yaml` is the authoritative lockfile; do not create `package-lock.json` or switch package managers.
- Use the Node version in `.nvmrc` (currently Node 22.16).
- Main stack: Next.js 15 App Router, React 19, strict TypeScript, Tailwind CSS 4, shadcn-style UI primitives, Better Auth, Drizzle ORM, and PostgreSQL.
- Imports may use the `@/*` alias for `src/*`.
- There is no formatter configuration. Follow the style of the file being edited and avoid formatting unrelated lines.

## Repository map

- `src/app/`: App Router pages, layouts, styles, and route handlers.
- `src/app/api/auth/[...all]/route.ts`: Better Auth catch-all GET/POST handler.
- `src/app/admin/dashboard/page.tsx`: server-rendered protected route; unauthenticated users are redirected to `/sign-in`.
- `src/components/`: application components. Interactive auth components are Client Components.
- `src/components/ui/`: reusable shadcn-style primitives. Use `cn` from `src/lib/utils.ts` to merge classes.
- `src/lib/auth.ts`: server-side Better Auth configuration and Drizzle adapter.
- `src/lib/auth-server.ts`: server-only session/user helpers. Prefer these from Server Components, Server Actions, and route handlers.
- `src/lib/auth-client.ts`: browser auth client. Its current base URL is hard-coded to `http://localhost:3000`; account for this before deployment work.
- `src/db/schema/`: Drizzle schema. The current tables are Better Auth's `user`, `session`, `account`, and `verification` tables.
- `migrations/`: committed Drizzle SQL migrations and metadata.

## Setup and commands

```bash
nvm use
pnpm install --frozen-lockfile
pnpm dev
```

Useful checks and database commands:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

- There is currently no `typecheck` package script; invoke `pnpm exec tsc --noEmit` directly.
- There is no automated test suite or test script yet. For behavior changes, add focused tests if introducing a test framework is within scope; otherwise report the manual verification performed.
- Do not run migrations or seeds against an unknown/shared database without confirming the target. They mutate data.

## Environment and database rules

- Local environment files are ignored by Git. `DATABASE_URL` is the only currently documented and referenced environment variable; see `env.md` for its shape. Never commit real credentials.
- Change the TypeScript schema first, then use `pnpm db:generate` and commit the generated SQL plus matching metadata. Do not hand-edit generated migration snapshots unless repairing a known migration problem.
- Keep Better Auth's schema and adapter mapping synchronized. Password credentials belong in the `account` table, not the `user` table.
- Create password users through Better Auth APIs so passwords are hashed correctly; `src/db/seed.ts` demonstrates this. Its `admin@example.com` and `user@example.com` credentials are development fixtures only and must not be treated as production accounts.

## Next.js and authentication conventions

- Prefer Server Components. Add `"use client"` only when browser APIs, React state/effects, or client-side Better Auth calls are required.
- Perform access control on the server using `getSession`/`getCurrentUser` and `redirect`; a client-side redirect alone is not an authorization boundary.
- Keep server-only database/auth imports out of Client Components. Client Components should use `authClient` instead.
- Reuse `src/components/ui` primitives and the CSS variables in `src/app/globals.css`. This project uses Tailwind v4's CSS-first setup and has no `tailwind.config.*` file.

## Known baseline issues

Verify these before attributing them to a new change:

- `pnpm exec tsc --noEmit` passes.
- `pnpm lint` currently fails because `src/db/seed.ts` uses an explicit `any`; it also reports unused variables in the dashboard and sign-in form.
- `pnpm build` compiles the application but currently fails during its lint phase for the same ESLint findings.
- `.github/workflows/typecheck.yml` is not a reliable description of the toolchain: it uses Node 20/npm, runs `npm ci` without a committed npm lockfile, and calls the nonexistent `typecheck` script. Treat pnpm and `.nvmrc` as authoritative until that workflow is repaired.

When finishing a change, always run the direct TypeScript check and run the most relevant additional checks. Clearly separate pre-existing failures from regressions introduced by the change.
