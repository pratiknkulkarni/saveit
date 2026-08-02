# Migrate `saveit` to self-hosted Gitea + container registry + deploy

> Status: **proposal — nothing implemented yet.** Written 2026-08-01.

## Context

`saveit` currently lives on GitHub at `pratiknkulkarni/saveit`, is built by hand with a `docker build`, and has never had CI. The goal is to move the primary remote to the self-hosted Gitea (`https://gitea.15092021.xyz`), keep GitHub as a read-only push mirror, publish images to Gitea's container registry so a `docker compose pull && up -d` is the whole deploy, and confirm the Postgres migration actually works before going live. Dependabot cleanup comes last.

**The complication:** the repo is not currently deployable. Three independent blockers, all verified:

| # | Blocker | Evidence |
|---|---|---|
| B1 | **`next build` fails.** A "secure server actions" refactor removed `userId` params from server actions (session is now authoritative via `getCurrentUser()`), but only `createBookmark` was migrated on the frontend. ~14 call sites still pass `userId`. `strict: true`, no `ignoreBuildErrors`. | `hooks/use-delete-bookmark-mutation.ts:7` calls `deleteBookmarkByUserId(userId, bookmarkId)`; `app/actions/bookmark.ts:138` takes `(bookmarkId: number)` |
| B2 | **Zero migrations exist.** `.gitignore:49` is a blanket `*.sql`, which silently swallowed every `prisma/migrations/**/migration.sql`. `prisma/migrations/` holds only `migration_lock.toml`. `docker-compose.yml`'s `prisma migrate deploy` therefore applies nothing → empty DB, and `pg_trgm` is never created → `word_similarity()` in search fails. | `git check-ignore -v` on a migration path resolves to `.gitignore:49` |
| B3 | **`lib/auth.ts:13`** declares `prismaAdapter(prisma, { provider: "sqlite" })` over a `postgresql` datasource, and opens a second `PrismaClient` instead of the `lib/prisma.ts` singleton. | read directly |

**Yes, Postgres is fully implemented** — `provider = "postgresql"`, `extensions = [pg_trgm]`, and `app/actions/search.ts` uses `word_similarity()`/`ILIKE`/`STRING_AGG`/CTEs. SQLite is dead: `prisma/dev.db` is an **empty** file (0 rows in every table, verified), `sqlite3` and `minisearch` are unused deps, `python/insert.sql` is dead SQLite-syntax seed data.

**Also found — a latent data-loss bug:** editing a bookmark without touching its tags **deletes all of its tags**. `EditBookmarkForm` only calls `form.setValue("tags", …)` when TagInput changes (line 413), and `tags` is absent from `defaultValues` (lines 46–51). So a title-only edit sends no `tags` field → `app/actions/bookmark.ts:215` parses it to `[]` → `if (tags)` is truthy → `deleteMany` runs, `createMany` is skipped. The form already registers a `tagsModified` hidden flag (line 330, set at 414) that the server action never reads.

### Environment facts (verified live)

- **Gitea 1.27.0.** Repo `pratik/saveit` **already exists and is empty**, default branch `main`, `has_actions: true`, `has_packages: true`, `mirrors_disabled: false`. SSH is on **port 36151**.
- **Container registry is live** — `GET /v2/` returns `401` + `docker-distribution-api-version: registry/2.0`.
- **Everything is behind Cloudflare** (`server: cloudflare`, `via: Caddy`). ⚠️ Cloudflare caps request bodies at ~100 MB on free/pro; Docker pushes a layer as one `PUT`. This must be probed early.
- **`pratik` is `is_admin: false`** on Gitea — runner registration is repo/user-level, not site-level.
- **Dev machine:** Debian 13 trixie, no Docker/Podman/Postgres, no `node_modules`, no pnpm. Node v26.5.1 via `nvm.fish` at `/home/pratik/.local/share/nvm/v26.5.1`, npm 11.17.0, **no corepack** (Node 26 unbundled it), bun 1.3.x. `pratik` is in `sudo`.
- **History is clean for a public push:** no `.env` ever committed, no secrets, `dev.db` empty, `insert.sql` is synthetic faker data.
- **7 of 8 Dependabot alerts are already stale** — the lockfile has `axios@1.11.0`, `better-auth@1.3.7`, `undici@7.15.0`, `vite@5.4.19`, `tar-fs@2.1.3`, `@babel/{helpers,runtime}@7.28.3`. Only **`next` (pinned exactly `15.1.3`)** is genuinely outstanding.

### Decisions locked in

1. Gitea repo stays **public** (history verified clean).
2. **Install Docker Engine locally** for the test loop.
3. A Gitea Actions **runner is already registered** → go straight to the workflow.
4. Fix **the build + the tag-wipe bug**. Leave the search SQL-injection alone for now (flagged in Risks).

---

## Phase 1 — Git migration to Gitea *(independent, do first)*

The Gitea repo exists and is empty, so nothing to create. Generate a Gitea token first: **Settings → Applications → Generate New Token**, scopes `write:repository`, `write:package`.

**Branches to carry:** `main` only, plus `refactor/frontend` as reference history. Abandon `feature/postgres-migration` (it is literally `main`'s parent commit `724858e` — zero information) and all 8 `dependabot/*` branches (stale per the lockfile). Do **not** use `git push --mirror`, which would drag them all in.

```bash
cd /home/pratik/Documents/saveit
git fetch --all --prune
git remote add gitea https://gitea.15092021.xyz/pratik/saveit.git
git push gitea main
git push gitea refs/remotes/origin/refactor/frontend:refs/heads/refactor/frontend
git remote rename origin github
git remote rename gitea origin
git remote set-url --push github DISABLED     # guard against accidental direct pushes
git branch --set-upstream-to=origin/main main
```

**Push mirror Gitea → GitHub:** repo Settings → *Mirror Settings* → Add Push Mirror. URL `https://github.com/pratiknkulkarni/saveit.git`, username `pratiknkulkarni`, password = a GitHub fine-grained PAT scoped to that repo with **Contents: Read and write**. Enable *Sync when new commits are pushed*, interval `8h`. Click **Synchronize Now**.

⚠️ **Gitea's push mirror runs `git push --mirror`** — it deletes GitHub refs that don't exist on Gitea. The 8 dependabot branches will be deleted and their PRs auto-closed (fine — they're stale). To stop the churn loop, on GitHub → Settings → Code security: leave **Dependabot alerts ON** (free vulnerability feed), turn **Dependabot security updates OFF** (that's what opens PRs).

**Do not archive the GitHub repo and do not add branch protection to `main`** — either one makes the mirror push fail. "Read-only" here is convention + the `DISABLED` push URL above.

`refactor/frontend` also does not compile (it fixed the hooks but left `CreateFolderDialog.tsx:43`, `CreateTagDialog.tsx:44`, `TagInput.tsx:52`) — carry it as history, do not merge, delete after Phase 3.

---

## Phase 2 — Local toolchain

```bash
# pnpm (none on this machine; Node 26 has no corepack)
npm install -g pnpm@9 && pnpm --version   # record the exact version

# Docker Engine — official repo; fall back to `sudo apt install docker.io docker-compose-v2`
# if download.docker.com has no `trixie` dist yet
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER" && newgrp docker
docker run --rm hello-world
```

**Probe Cloudflare/registry immediately** — if this fails, it reshapes Phases 6–8:

```bash
echo "$GITEA_TOKEN" | docker login gitea.15092021.xyz -u pratik --password-stdin
docker pull alpine:3.20 && docker tag alpine:3.20 gitea.15092021.xyz/pratik/probe:test
docker push gitea.15092021.xyz/pratik/probe:test
```

Mitigations if a real (larger) push later returns `413` / `blob upload unknown`: a **DNS-only (grey-cloud)** `registry.15092021.xyz` hostname pointing at the same Caddy, or build on the Gitea host and push over `localhost`.

**New files:** `.env.example` (none exists; also add `!.env.example` next to `.gitignore:34`'s `.env*`) and `docker-compose.dev.yml` with just `postgres:16-alpine` + healthcheck + named volume, following the conventions already used in the `pratik/mewss` repo.

`.env.example` must cover every var actually read in code: `POSTGRES_{USER,PASSWORD,DB}`, `DATABASE_URL`, `TEST_DATABASE_URL` (**must be a different database** — `tests/setup.ts:34` TRUNCATEs everything in `beforeEach`), `BETTER_AUTH_SECRET` (`openssl rand -hex 32`), `BETTER_AUTH_TRUSTED_URLS`, `NEXT_PUBLIC_API_URL`, `APP_PORT=33449`, `LOG_LEVEL`.

**`package.json`:** add `"packageManager": "pnpm@9.x.y"` (exact), `"engines": {"node": ">=20.9"}`, and scripts `test:run` (`vitest run` — current `test` is watch mode, unusable in CI), `typecheck` (`tsc --noEmit`), `db:migrate` (`prisma migrate deploy`).

---

## Phase 3 — Make it build again (B1) + the tag-wipe fix

**Gate: `pnpm typecheck` exits 0.** Treat the list below as the known set; iterate on actual compiler output.

**Principle:** `userId` stays in every hook's signature — it feeds the react-query `queryKey` and `enabled` guard. Only the argument passed *to the server action* is dropped. That keeps all ~8 component call sites untouched. `hooks/use-search-results.ts:10` already carries a `//TODO: remove this, keeping for not breaking the UI` comment — same convention.

Hooks (`hooks/`):

| File | Change |
|---|---|
| `use-delete-bookmark-mutation.ts:7` | `deleteBookmarkByUserId(userId, bookmarkId)` → `(bookmarkId)` |
| `use-toggle-bookmark-mutation.ts:10` | `toggleBookmarkFavorite(userId, bookmarkId, isFavorite)` → `(bookmarkId, isFavorite)` |
| `use-get-user-folders-query.ts:8`, `use-get-user-folders-sidebar-query.ts:9` | `getUserFolders({userId})` → `getUserFolders()` |
| `use-get-user-tags-query.ts:9` | `getUserTags({userId})` → `getUserTags()` |
| `use-delete-tag-mutation.ts:6` | `deleteTag({tagId, userId})` → `({tagId})` |
| `use-delete-folder-mutation.ts:6` | `deleteFolder({folderId, userId})` → `({folderId})` |
| `use-update-{tag,folder}-bookmark-mutation.ts:9` | drop the `userId` property |

Components (`app/home/components/`):

| File | Change |
|---|---|
| `EditBookmarkForm.tsx:69` | `getUserFolders({userId: …})` → `getUserFolders()`; leave `queryKey`/`enabled` |
| `EditBookmarkForm.tsx:102-107` | call `updateBookmark(formData, bookmarkId)`; keep the mutation's variables type so `mutate({formData, userId, tags, bookmarkId})` at :153 still compiles |
| `EditBookmarkForm.tsx:216` | `createFolders({names, userId})` → `createFolders({names})` — matches the already-correct `CreateBookmarkForm.tsx:217` |
| `CreateFolderDialog.tsx:43` | drop `userId` from `createFolders` |
| `TagInput.tsx:52` | `createNewTags({tags, userId})` → `({tags})`; **keep the `userId` prop** on `TagInputProps` |
| `CreateTagDialog.tsx:44` | drop `userId` from `createNewTags` |

Where `userId` becomes fully unused, rename to `_userId` (`argsIgnorePattern: "^_"`) rather than deleting the param — deleting cascades into 8 call sites. The lint rule is `warn`, so the build passes either way.

**Tag-wipe fix** in `app/actions/bookmark.ts` (~lines 210–247): read `tagsModified: formData.get("tagsModified") === "true"` into `rawData`, add `tagsModified: z.boolean().optional()` to the server schema in `app/actions/schema/bookmark.ts`, and gate the `deleteMany`/`createMany` block on `tagsModified` instead of `if (tags)`. The client already writes the flag.

**Test coverage:** essentially none exists for these hooks. `hooks/__tests__/use-create-bookmark-mutation.test.ts` is the correct template (`vi.mock` the action, `renderHook` with `createQueryClientWrapper()` from `tests/wrapper.tsx`). `origin/refactor/frontend` has draft tests for three of the changed hooks worth cherry-picking as starting points (`git show origin/refactor/frontend:hooks/__tests__/use-delete-bookmark-mutation.test.ts`). The 5 files under `app/actions/__tests__/` already exercise the *new* server signatures.

---

## Phase 4 — Migrations, `pg_trgm`, auth provider (B2 + B3)

**`.gitignore`** — replace line 49's blanket `*.sql` with:
```gitignore
*.sql
!prisma/migrations/**/migration.sql
```
The negation is valid (no parent dir is excluded). Also `git rm --cached prisma/dev.db app/.next/trace` (empty SQLite file + a stray tracked build artifact).

**Generate the initial migration against a genuinely empty DB** (`migrate dev` demands a reset if it finds tables from a prior `db push`):

```bash
docker compose -f docker-compose.dev.yml up -d postgres
docker compose -f docker-compose.dev.yml exec postgres psql -U saveit -c 'CREATE DATABASE saveit_migrate;'
DATABASE_URL='postgresql://saveit:…@localhost:5432/saveit_migrate?schema=public' pnpm prisma migrate dev --name init --create-only
```

**Read the generated `migration.sql` and confirm it opens with `CREATE EXTENSION IF NOT EXISTS "pg_trgm"`** — Prisma emits this because of `schema.prisma:5` + the `postgresqlExtensions` preview feature. Hand-add it as the first statement if missing. Then `migrate deploy` and verify with `\dx`. Confirm `git add prisma/migrations/` actually stages the `.sql` — that is the whole point of the `.gitignore` change.

**Keep `migrate deploy` for containers** (never `db push --accept-data-loss` in prod). **Switch `tests/setup.ts:6` from `db push` to `migrate deploy`** so tests exercise the production path; the `beforeEach` TRUNCATE already excludes `_prisma_migrations`.

**`lib/auth.ts`:** `provider: "sqlite"` → `"postgresql"` (line 13), and replace the local `new PrismaClient()` (line 6) with `import { prisma } from "@/lib/prisma"`. ⚠️ better-auth branches on `provider` to decide whether to apply Prisma `mode: "insensitive"` — after this fix **email lookups become case-insensitive**. That is correct behavior but it *is* a change: re-test register + login with mixed-case emails.

⚠️ `app/page.tsx` imports `lib/auth`, which constructs a `PrismaClient` at module scope, and `next build` evaluates that during page-data collection — so **`DATABASE_URL` must be set during the Docker build** even though nothing connects. Pass a placeholder via `ARG`/`ENV` in the builder stage.

---

## Phase 5 — Local verification *(the gate before anything ships)*

```bash
cp .env.example .env    # fill BETTER_AUTH_SECRET
docker compose -f docker-compose.dev.yml up -d postgres
docker compose -f docker-compose.dev.yml exec postgres psql -U saveit -c 'CREATE DATABASE saveit_test;'
pnpm install --frozen-lockfile && pnpm prisma generate && pnpm prisma migrate deploy
pnpm typecheck && pnpm test:run && pnpm build && pnpm dev   # http://localhost:33449
```

Smoke list (each maps to an edit above):
1. Register → login → `/home`; confirm rows land in `user` **and** `settings` (`app/actions/auth.ts:35` calls `applyDefaultSettings`). Retest with a mixed-case email.
2. Sidebar folders render; create folder from the dialog **and** from inside the edit-bookmark form; rename; delete.
3. Tags render; create from dialog **and** from `TagInput`; rename; delete.
4. Add a bookmark with a real URL → metadata auto-fetches (`app/actions/metadatafetcher.ts`).
5. **Add a bookmark with tags → edit only its title → confirm the tags survive** (the Phase 3 fix).
6. Toggle favourite + delete, from both `/home` and `/filters`.
7. **Search** — the `pg_trgm` proof. ⚠️ `search.ts:169` catches and swallows errors into `[]`, so *"search returns nothing"* is the symptom of a missing extension, not an error. Cross-check with `\dx` and `LOG_LEVEL=debug`. Also avoid apostrophes in the query — see Risks.

---

## Phase 6 — Image + Gitea registry

**`next.config.ts`:** uncomment `output: "standalone"` (line 5) and **delete** the `env: { PORT }` and `publicRuntimeConfig` blocks (lines 6–11) — verified dead code (nothing reads `process.env.PORT` or calls `getConfig()`), and removing them kills the build-time/runtime PORT disagreement. Leave `headers()` alone.

**`Dockerfile` rewrite.** Current problems: `node:20-slim` (EOL 2026-04-30), `libsqlite3-dev` + node-gyp toolchain for the dead `sqlite3` dep, unpinned `corepack prepare pnpm@latest`, whole `node_modules` copied into production, no `USER`, no `HEALTHCHECK`. Target: `node:22-bookworm-slim`, `corepack enable` honouring `packageManager`, `ARG DATABASE_URL` placeholder in the builder, standalone COPY layout, non-root `nextjs` user, `HEALTHCHECK` hitting `/welcome` (a static page, no DB) via Node 22's global `fetch` (the slim image has no curl/wget).

Two standalone gotchas:
- **`CMD ["node","server.js"]`, not `pnpm start`** — standalone emits its own server and a stripped `package.json`; `next start` isn't available. The current compose `command:` cannot survive as-is.
- **The standalone bundle contains no Prisma CLI.** Explicitly copy `node_modules/{prisma,@prisma,.prisma}` and add a `docker-entrypoint.sh` that runs `node node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma` then `exec "$@"`.

`schema.prisma:11` is `binaryTargets = ["native"]` — fine while builder and runner share `node:22-bookworm-slim`. If you ever split base images, pin `["native","debian-openssl-3.0.x"]`.

**`.dockerignore`** is currently 11 bytes (`.env`, `.env.*`), so `node_modules`, `.git`, `.next`, `prisma/dev.db`, and the 440 KB `python/insert.sql` all enter the build context. Expand it to exclude those plus `tests/`, `**/__tests__/`, `scripts/`, `python/`, `.idea/`, compose files. **Never exclude `prisma/schema.prisma` or `prisma/migrations/`.**

**`docker-compose.yml` rewrite** — it currently has *only* an `app` service (no Postgres at all), `ports: "${PORT}:${PORT}"` which hard-fails when unset, and a redundant `./.env:/app/.env` bind mount. Replace with: `postgres:16-alpine` + named volume + `pg_isready` healthcheck; `app` using `image: gitea.15092021.xyz/pratik/saveit:${IMAGE_TAG:-latest}` (not `build:` — this is what makes the pull-and-restart flow work), `depends_on: {postgres: {condition: service_healthy}}`, explicit `environment:`, `ports: "${APP_PORT:-33449}:33449"`. `NEXT_PUBLIC_API_URL` is read at **runtime** by `next-runtime-env` (`lib/auth-client.ts:5`, injected by `<PublicEnvScript/>` in `app/layout.tsx:22`) — a container env var, never a build arg.

Registry naming is `{registry}/{owner}/{image}:{tag}`, image lowercase → `gitea.15092021.xyz/pratik/saveit:latest`. Packages land at `https://gitea.15092021.xyz/pratik/-/packages`.

---

## Phase 7 — Gitea Actions CI

Use **`.gitea/workflows/ci.yml`, not `.github/workflows/`**. Gitea reads both, but the push mirror copies these files to GitHub, where a `.github/workflows/` file would trigger GitHub-side runs you don't want.

Add repo secrets (Settings → Actions → Secrets): `REGISTRY_USER=pratik`, `REGISTRY_TOKEN` = a Gitea token with `write:package`. The auto-injected `${{ secrets.GITEA_TOKEN }}` has had inconsistent package-write permissions across versions — use a dedicated token.

Two jobs:
- **`verify`** — a `postgres:16-alpine` service container, then `pnpm install --frozen-lockfile` → `prisma generate` → `prisma migrate deploy` (validates the Phase 4 migration + `pg_trgm`) → `typecheck` → `lint` → `test:run` → `build`. Add `prisma migrate diff --from-migrations … --to-schema-datamodel … --exit-code` as a schema-drift guard, and a non-blocking `pnpm audit --prod --audit-level high`.
- **`publish`** (needs: verify; only on `main` pushes and `v*` tags) — `docker login` + `docker build` tagging **both `:<short-sha>` and `:latest`**, plus `:v1.2.3` on a tag, then `docker push --all-tags`. Use raw `docker` shell commands rather than `docker/build-push-action`; the buildx setup those need is a common act_runner failure mode.

Confirm the existing runner picks up this repo — an unlabelled or mislabelled runner leaves workflows queued forever with no error:
```bash
curl -s -H "Authorization: token $GITEA_TOKEN" https://gitea.15092021.xyz/api/v1/repos/pratik/saveit/actions/runners
```
The runner needs `/var/run/docker.sock` mounted to build images and start service containers. If `options:` health flags are ignored by an older runner, swap in `until pg_isready -h postgres -U saveit; do sleep 1; done`.

---

## Phase 8 — Deploy

On the target host — only `docker-compose.yml` + `.env` are needed, no source tree:

```bash
echo "$GITEA_TOKEN" | docker login gitea.15092021.xyz -u pratik --password-stdin
docker compose pull && docker compose up -d && docker compose logs -f app
```

The entrypoint runs `migrate deploy` before `node server.js`, and `depends_on: service_healthy` guarantees Postgres is up first. First boot creates `pg_trgm` and every table; later boots are no-ops. **Update loop:** `docker compose pull && docker compose up -d`. **Rollback:** `IMAGE_TAG=<previous-short-sha> docker compose up -d` — code only; Prisma migrations are forward-only, so `pg_dump` before any destructive migration. Add a `pg_dump | gzip` backup cron — nothing exists today.

---

## Phase 9 — Dependencies *(last)*

Once `main` reaches GitHub via the mirror, GitHub re-scans and **7 of the 8 alerts close themselves** — they were opened against an older lockfile that the Postgres-migration commits already superseded.

The one real action is **`next 15.1.3 → 15.2.4+`** (pinned exactly at `package.json:55`; bump `eslint-config-next:79` in lockstep), then re-run the Phase 5 loop. Note the headline advisory in that range (CVE-2025-29927) is a **middleware** auth bypass and this app has no `middleware.ts`, so real exposure is limited — but there are others in the window.

Worth doing alongside, all dead weight: drop **`sqlite3`** (its `prebuild-install → tar-fs` subtree is the sole source of that advisory, and removing it lets the Dockerfile drop `python3 make g++ libsqlite3-dev`), **`minisearch`** (superseded by `pg_trgm`; `lib/getMatchedTerms.ts` is a dead file — the live code is `lib/search-highlight.ts`), and **`fs@0.0.1-security`** (a placeholder squatter). Move `vitest`, `vite`, `vite-tsconfig-paths`, `@vitejs/plugin-react`, `@testing-library/*`, `@types/jest` from `dependencies` to `devDependencies` — that takes `@babel/core` out of the production graph and shrinks the image. `@babel/runtime` survives regardless (it comes from legacy `@radix-ui/*@1.0.x` pinned by `cmdk@1.0.0`); not worth chasing.

**Ongoing mechanism:** keep GitHub Dependabot **alerts** (free feed, works through the mirror) + `pnpm audit --prod` in CI as the enforcing gate. Defer self-hosted Renovate-on-Gitea until CI is proven.

---

## Ordering

```
Phase 1 (git+mirror)  ── independent, low risk, quick win
Phase 2 (docker+pnpm) ── unblocks everything below; run the Cloudflare probe here
Phase 3 (build fix) ─┬─ can run in parallel
Phase 4 (migrations) ┘
Phase 5 (verify) ◄──── the gate: nothing ships until this is green
Phase 6 (image) → Phase 7 (CI) → Phase 8 (deploy) → Phase 9 (deps)
```

Traps: don't attempt Phase 6 before 3+4 (the Docker build runs `pnpm build` and you'd debug Docker while the fault is TypeScript); don't attempt Phase 4 before 2 (`migrate dev` needs a live Postgres for the shadow DB); don't deploy before the `pg_trgm` check in Phase 5 step 7 (a missing extension makes search silently return `[]`).

---

## Verification

- **Phase 1:** `git log --oneline -1 origin/main` shows `4a80698`; Gitea branch list has `main` + `refactor/frontend` and no dependabot branches; `mirror_last_sync_at` advances after *Synchronize Now*; GitHub `main` matches.
- **Phase 2:** `docker run --rm hello-world`; the `probe:test` push succeeds.
- **Phases 3–4:** `pnpm typecheck` exits 0; `pnpm test:run` green (13 files, 5 hitting Postgres); `prisma/migrations/<ts>_init/migration.sql` is staged in git and contains `CREATE EXTENSION … pg_trgm`; `\dx` lists `pg_trgm`.
- **Phase 5:** `pnpm build` succeeds; the full smoke list passes, especially #5 (tags survive a title-only edit) and #7 (search returns results).
- **Phase 6:** image is materially smaller than the current one; `docker run` with a `DATABASE_URL` starts, applies migrations, and serves `/welcome`; `docker inspect` shows the healthcheck passing and `User: nextjs`.
- **Phase 7:** a push to `main` produces a green `verify` and a `publish` that lands `:latest` + `:<sha>` under `pratik/-/packages`.
- **Phase 8:** `docker compose pull && up -d` on the target host serves the app; a second push + pull swaps the running version.

## Risks

1. **Cloudflare 100 MB body cap on `docker push`** — probe in Phase 2. Fix is DNS/architecture-level (grey-cloud `registry.15092021.xyz`) and would reshape Phases 7–8, so find out early, not during the first deploy.
2. **better-auth `provider` change makes email lookups case-insensitive** — correct, but a behavior change on existing accounts. Explicitly re-test register + login.
3. **`app/actions/search.ts` interpolates the raw search term into `$queryRawUnsafe`** (lines 45–52, and `b."userId" = '${user.id}'` at 72). A search for `O'Brien` throws a syntax error that the `catch` swallows into `[]`, so it will *look* like a `pg_trgm` failure during smoke testing. Out of the agreed scope — recommend a follow-up ticket to parameterize.
4. **`prisma migrate deploy` on container start is forward-only.** Fine for a single container; take a `pg_dump` before any destructive migration.
5. **Gitea's push mirror is `--mirror`** — anything on GitHub that isn't on Gitea gets deleted. Turn Dependabot security-update PRs off (Phase 1) or they'll be wiped and recreated in a loop.
