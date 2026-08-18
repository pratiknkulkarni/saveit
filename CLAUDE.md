# CLAUDE.md

Self-hosted bookmark manager ("Save It"). Save a URL → metadata is auto-fetched → organize by folders/tags, favorite/archive, fuzzy search.

> **`origin` is Gitea, not GitHub** — `gitea.15092021.xyz/pratik/saveit`. The Gitea +
> registry + deploy migration is finished. `MIGRATION_PLAN.md` and
> `MIGRATION_STATUS.md` were deleted once it landed, so anything they used to carry
> lives in this file now.
>
> **CI is live** (`.gitea/workflows/ci.yml`): any branch push runs `verify`; a push to
> `main` or a `v*` tag also runs `publish`, which pushes `latest` + `main-<shortsha>`
> to `gitea.15092021.xyz/pratik/saveit`. `paths-ignore` skips `**.md`, so a docs-only
> commit publishes nothing. The only runner is a Raspberry Pi 4, so
> **every published image is `linux/arm64`** — an amd64 host cannot pull it at all.

## Stack

Next.js 15.1.3 App Router · React 19 · TypeScript (`strict`) · Tailwind + shadcn/ui (Radix) · TanStack Query v5 · **Prisma 6.14 + PostgreSQL (`pg_trgm`)** · better-auth 1.3 (declared `^1.1.10`, email+password only) · pino · zod. Single package, **pnpm** (lockfile v9). Path alias `@/*` → `./*`.

## Commands

```bash
pnpm dev          # next dev --turbopack --port 33449
pnpm build        # next build — also runs tsc AND eslint; lint errors fail the build
pnpm start        # next start
pnpm lint
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest in WATCH mode
pnpm test:run     # vitest run — use this one in CI
pnpm db:migrate   # prisma migrate deploy
```

pnpm is pinned to `9.15.9` via `packageManager`. **`node` is not on the default
`PATH` in a non-fish shell** (nvm is fish-only) — prefix with
`export PATH="$HOME/.local/share/nvm/v26.5.1/bin:$PATH"`. Use `$HOME`; the home
directory differs between the machines this repo gets cloned onto.

Two **separate** compose stacks, each with an explicit project `name:` so they do not
adopt each other's `postgres` container (they used to — both default to the directory
name):

```bash
# dev database only; the app runs on the host via `pnpm dev`.  project: saveit-dev
docker compose -f docker-compose.dev.yml up -d

# full production stack (postgres + the built image).          project: saveit
docker build -t gitea.15092021.xyz/pratik/saveit:latest .
docker compose up -d          # http://localhost:33449
```

Neither runs by default. Full bring-up from a cold clone, including the separate
`saveit_test` database the suites need:

```bash
cp .env.example .env          # then fill in BETTER_AUTH_SECRET: openssl rand -hex 32
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml exec postgres \
    psql -U saveit -d saveit -c 'CREATE DATABASE saveit_test;'
pnpm install && pnpm prisma generate && pnpm prisma migrate deploy
```

`.env.example`'s defaults already line up with `docker-compose.dev.yml`, so
`BETTER_AUTH_SECRET` is the only value that has to be filled in for a local run.

`docker-compose.yml` **pulls** the image rather than building it, and derives its own
`DATABASE_URL` from `POSTGRES_*` pointing at the `postgres` service — the one in
`.env` is localhost-based and for host tooling only.

There is no seed script. `scripts/seed-stress.ts` (100k faker bookmarks) has no runner entry and needs `tsx`, which isn't a dependency. It `deleteMany`s a hardcoded `TARGET_USER_ID` first.

## Architecture

- **Backend is Next.js Server Actions** — every file in `app/actions/*.ts` starts with `"use server"` and is called directly from client hooks/components. There is no tRPC and no REST layer. The **only** API route in the app is the better-auth catch-all at `app/api/auth/[...all]/route.ts`.
- **Auth is session-authoritative.** Server actions call `getCurrentUser()` from `lib/auth-server.ts` (throws `"Unauthorized"`), so **actions do not take a `userId` argument**. Client-side session comes from `authClient.useSession()` (`lib/auth-client.ts`). There is **no `middleware.ts`** — protection is per-action / per-page.
- **Hooks in `hooks/` still accept a `userId` param** — but only to build the react-query `queryKey` and the `enabled` guard. Never forward it to a server action. See `hooks/use-search-results.ts:10` for the established comment convention. Where it is otherwise unused it is named `_userId` (ESLint's `argsIgnorePattern: "^_"`), kept so the ~8 component call sites stay untouched. Same reason `TagInput` keeps `userId` on its props without destructuring it.
- `lib/prisma.ts` exports the `PrismaClient` singleton (globalThis-cached outside production). Use it — don't `new PrismaClient()`.
- Search (`app/actions/search.ts`) is raw Postgres via `$queryRawUnsafe`: `word_similarity()` (pg_trgm), `ILIKE`, `STRING_AGG`, CTEs, quoted PascalCase identifiers. The SQL is composed dynamically but **all user input is bound as `$n` parameters** — use the `bind()` helper from `createBinder()`, never interpolate a value into the SQL string.

## Environment

`.env.example` documents every var with the line that reads it; copy it to `.env`.
There is still no env-validation layer. Vars actually read in code:

| Var | Read at | Where |
|---|---|---|
| `DATABASE_URL` | runtime **and build** | `prisma/schema.prisma:4` |
| `BETTER_AUTH_SECRET` | runtime | `lib/auth.ts:9` |
| `BETTER_AUTH_TRUSTED_URLS` | runtime, comma-separated | `lib/auth.ts:8` — but see "Still open"; it is not currently enforced |
| `NEXT_PUBLIC_API_URL` | **runtime** via `next-runtime-env` | `lib/auth-client.ts:5`, injected by `<PublicEnvScript/>` in `app/layout.tsx:22` — never a build arg |
| `LOG_LEVEL` | runtime, default `info` | `lib/logger.ts:3` |
| `TEST_DATABASE_URL` | tests only | `vitest.config.mts` |

`app/page.tsx` imports `lib/auth`, which builds a Prisma client at module scope — so **`DATABASE_URL` must be set during `next build`** even though nothing connects.

## Tests

Vitest only, jsdom, `fileParallelism: false`, setup at `tests/setup.ts`.

Six suites under `app/actions/__tests__/` hit a **real Postgres** (`bookmark`, `filters`, `folder`, `search`, `settings`, `tags`): `tests/setup.ts` runs `prisma migrate deploy` at import (so tests exercise the same path containers take on boot) and `TRUNCATE`s every table in `beforeEach`. **`TEST_DATABASE_URL` must point at a throwaway database** — the fallback is `postgresql://admin:password@localhost:5432/saveit?schema=public`. The other two (`auth`, `metadatafetcher`) mock their dependencies, as do the components and `hooks/__tests__/` — but note `tests/setup.ts` runs for *every* suite, so **all** of them need a reachable Postgres.

`tests/setup.ts` resolves the Prisma CLI entry directly — `createRequire(import.meta.url).resolve('prisma/build/index.js')`, the same file the Docker entrypoint invokes. It used to shell `npx`, which is not on `PATH` under every runner; do not reintroduce that.

`tests/setup.ts` also polyfills `ResizeObserver`, `Element.prototype.scrollIntoView` and `window.matchMedia`, none of which jsdom implements. `cmdk` (the Command palette behind `TagInput`) and several Radix primitives throw on mount without them — if a new component test dies inside `node_modules/cmdk`, that is why.

`hooks/__tests__/use-create-bookmark-mutation.test.ts` is the template for hook tests: `vi.mock` the action, `renderHook` with `createQueryClientWrapper()` from `tests/wrapper.tsx`.

**Current: 117 passing, 0 failing (21 files)** — up from 48 passing / 14 failing.
The long-standing failures are fixed: `register-form` needed `next/navigation`
mocked, `Home` needed `useSettings` and `authClient` stubbed (and its `TagList`
mock corrected to a default export), and `app/home/layout`'s four cases asserted
the inverse of what `FolderSidebar` does (desktop expands, mobile collapses).

Suites added to cover things that otherwise needed a browser:

| Suite | Closes |
|---|---|
| `app/actions/__tests__/search.test.ts` | injection, quoting, match modes, `pg_trgm` |
| `app/actions/__tests__/auth.test.ts` | `registerUser` → `applyDefaultSettings` wiring |
| `app/actions/__tests__/metadatafetcher.test.ts` | metadata parsing + the SSRF guard |
| `app/home/__tests__/EditBookmarkForm.test.tsx` | `tagsModified` surviving into `FormData` |
| `app/home/__tests__/create-dialogs.test.tsx` | folder/tag creation from the dialogs |
| `app/home/__tests__/TagInput.test.tsx` | inline tag creation + selection |
| `app/settings/__tests__/AccountSettings.test.tsx` | change-password + delete-account |
| `hooks/__tests__/mutation-hooks.test.ts` | every mutation hook sends **no** `userId` |

## Known-broken state (updated 2026-08-18)

All of the below is fixed and pushed to `main`.

- ~~`next build` fails on ~14 `userId` call sites~~ → fixed; typecheck, lint and build are all clean. Note the build was *also* blocked by 9 ESLint errors.
- ~~`prisma/migrations/` is empty~~ → the blanket `*.sql` now has a `!prisma/migrations/**/migration.sql` negation, and `20260801154352_init` is committed. It opens with `CREATE EXTENSION IF NOT EXISTS "pg_trgm"`; verified applied (`pg_trgm 1.6` in `\dx`) with no schema drift.
- ~~`lib/auth.ts` says `provider: "sqlite"`~~ → now `"postgresql"`, using the `lib/prisma.ts` singleton. ⚠️ **This makes email lookups case-insensitive** — better-auth branches on `provider` to decide whether to apply Prisma's `mode: "insensitive"`. Verified: signed up as `Local.Smoke@Example.COM`, signed in all-lowercase → 200.
- ~~Tag-wipe bug~~ → `updateBookmark` now reads the `tagsModified` flag and gates the delete/create block on it. **New contract:** any caller editing tags must send `tagsModified=true` in the `FormData`, or tags are left untouched. Covered by a regression test.
- ~~`search.ts` SQL injection~~ → fixed. All three queries now bind the search term and `user.id` as `$n` parameters via a `createBinder()` helper; `escapeLikeWildcards()` also stops `%`/`_` in a query from acting as LIKE wildcards. `threshold` stays interpolated on purpose — it is a numeric literal, and binding it would force a cast against `word_similarity()`'s `real`. Covered by `app/actions/__tests__/search.test.ts`.
- ~~`tests/setup.ts` shells `npx`~~ → fixed; it resolves `prisma/build/index.js` directly.

**Still open:**

- **`BETTER_AUTH_TRUSTED_URLS` is not enforced.** `lib/auth.ts` passes `trustedOrigins` but never sets `baseURL`, so better-auth derives the base URL from each request and adds *that request's own origin* to the trusted list. Verified against the running container: `POST /api/auth/sign-in/email` with `Origin: http://evil.example.com` returns 200. Passing an explicit `baseURL` to `betterAuth()` is what makes the variable mean anything.
- **`next.config.ts` sends `Access-Control-Allow-Origin: *` together with `Access-Control-Allow-Credentials: true`** on `/api/:path*`. Browsers refuse to honour `*` with credentials, and every state-changing path is a Server Action that Next origin-checks separately, so this is not directly exploitable — but the pair should not be there.
- **`NEXT_PUBLIC_API_URL` is the browser's better-auth `baseURL`**, injected into the HTML at runtime. It must be the address the browser actually uses; `localhost` on a remote host makes the browser call itself and login fails with nothing useful in the logs. Leaving it unset falls back to `window.location.origin` (see `getBaseURL` in better-auth), which is more robust but has not been tested here.
- `search.ts` still swallows errors into `[]` (`catch` at the bottom, `logger.error` only). With the injection fixed this is far less ambiguous, but an empty result set still cannot be distinguished from a failure by the caller. Changing the return contract would ripple into `use-search-results.ts` and the results UI.
- **Do not run the tests with bun.** `bun run test:run` drops `node`/`npx` from `PATH`, does not apply `vi.mock` (so real server actions run and Next's `headers()` throws), and aborts after the first suite while still **exiting 0** — a false green. pnpm is the only supported runner; it is pinned via `packageManager`.
- **No browser verification.** The rendered `/home` and `/filters` pages have never been loaded in a real browser, so layout, styling and navigation are unverified. Everything below the UI is covered by tests, and the container serves `/welcome`, `/login`, `/register` and an authenticated `/home` (200, correct `<title>`, no error boundary) while writing to Postgres.
- **No backup job.** Migrations are forward-only and nothing takes a `pg_dump` on a schedule. Take one by hand before any destructive migration.
- The container logs `ExperimentalWarning: SQLite is an experimental feature` on boot — something in the dependency graph touches Node 22's built-in `node:sqlite`. Noise, not a regression, but it looks alarming in deploy logs.

## Registry

`gitea.15092021.xyz` resolves to `192.168.1.36` on the LAN via split-horizon DNS, but
to **Cloudflare** from anywhere else (`GET /v2/` → `401`, i.e. alive and requiring
auth). Pulls work either way. **Pushes must happen on the LAN** — the image is ~151 MB
compressed and Cloudflare's request-body cap would reject an off-LAN `docker push`.
The CI runner is on the LAN, so this only matters for a manual push.

The published `latest` is a single `linux/arm64` manifest plus an attestation manifest.
Testing the real artefact on amd64 needs QEMU; otherwise rebuild locally under the same
tag, which is what `docker build -t gitea.15092021.xyz/pratik/saveit:latest .` is for.

## Dead code — don't extend it

SQLite is gone (migrated in `b8d46d1`). The `sqlite3`, `minisearch` and `fs@0.0.1-security` deps and `lib/getMatchedTerms.ts` were dropped in `1581610`, along with the `libsqlite3-dev`/node-gyp toolchain they forced in the Dockerfile; the live search helper is `lib/search-highlight.ts`. `next.config.ts`'s dead `env: { PORT }` and `publicRuntimeConfig` blocks went with the Docker rewrite in `57580e1`.

Still present: `python/sql.py` + `python/insert.sql` (SQLite-syntax seed data — excluded from the Docker build context, not from the repo).

## Conventions

4-space indent, double quotes, no semicolon-free style. Server actions return `{success, data?, error?, validationErrors?}` — zod-validate with `safeParse` at the top, `logger.info`/`logger.error` on the outcome, `revalidatePath` after mutations. Zod schemas live in `app/actions/schema/`, response types in `app/actions/types/`, query keys in `lib/queryKeys.ts`.
