# Migration status — handoff

> Written 2026-08-01, updated 2026-08-02. Companion to `MIGRATION_PLAN.md`.
> **Phases 1–7 are done. Phase 8 (deploy) is next.**

---

## TL;DR — where to pick up

You are on **`main`**, in sync with `origin/main`. The app builds, typechecks, lints
clean, and `pnpm test:run` is green (**112 passing, 20 files**) — on this machine and
on the CI runner.

**CI is live and the image is published.** A push to any branch runs `verify`; a push
to `main` (or a `v*` tag) runs `verify` then `publish`, which buildx-pushes
`latest` + `main-<shortsha>` + `buildcache` to `gitea.15092021.xyz/pratik/saveit`.

Next action is Phase 8 (deploy on the target host), then Phase 9 (bump `next`).

⚠️ **Images are `linux/arm64` only.** The sole runner is a Raspberry Pi 4
(label `pi-arm64`), so the deploy target must be arm64. An amd64 host cannot even
`docker compose pull` — it fails with `no matching manifest for linux/amd64`.

---

## Branch and commit state

| Ref | Commit | Meaning |
|---|---|---|
| `main` = `origin/main` | `49e9e77` | Phases 1–6. Current branch |
| `chore/phase6-image` | `49e9e77` | fast-forwarded into `main`; safe to delete |
| `chore/deployability` | `5f8b356` | merged into `main`; safe to delete |
| `refactor/frontend` | `ff26bb9` | history only. Do not merge |

`main`'s last four commits: `49e9e77` docs · `57580e1` Phase 6 image + compose ·
`1581610` dead deps · `5f8b356` Phase 5 tests.

Remotes: `origin` = Gitea (`https://gitea.15092021.xyz/pratik/saveit.git`),
`github` = GitHub with push URL deliberately set to the literal `DISABLED`.

---

## Resuming — exact commands

Two gotchas that are not obvious:

1. **`node`/`pnpm` are not on the default `PATH`** in a non-fish shell. nvm is
   fish-only (`nvm.fish`). Prefix with:
   ```bash
   export PATH="/home/pratik/.local/share/nvm/v26.5.1/bin:$PATH"
   ```
2. **The dev Postgres volume was renamed** when the compose project got an explicit
   name (`saveit_saveit-pgdata-dev` → `saveit-dev_saveit-pgdata-dev`). The old volume
   still exists but nothing points at it; the new one starts **empty**, so
   `saveit_test` has to be recreated or every DB-backed test fails at setup.

```bash
cd /home/pratik/Documents/saveit
export PATH="/home/pratik/.local/share/nvm/v26.5.1/bin:$PATH"

docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml exec -T postgres \
    psql -U saveit -d saveit -c 'CREATE DATABASE saveit_test;'

pnpm prisma generate && pnpm prisma migrate deploy
pnpm typecheck && pnpm lint && pnpm test:run && pnpm build
```

The **production** stack is a separate compose project and can run at the same time:

```bash
docker build -t gitea.15092021.xyz/pratik/saveit:latest .
docker compose up -d          # postgres + app, http://localhost:33449
docker compose logs -f app
docker compose down           # add -v to drop the database
```

`.env` **already exists** (gitignored) with a generated `BETTER_AUTH_SECRET`. Do not
regenerate the secret unless you want to invalidate existing sessions.

---

## What is verified, and what is not

### Verified by direct observation

| Claim | How it was checked |
|---|---|
| `pnpm typecheck` exits 0 | was 24 errors, now 0 |
| `pnpm lint` has 0 errors | 5 `exhaustive-deps` warnings remain, pre-existing |
| `pnpm build` succeeds | all 12 routes, with a real `BETTER_AUTH_SECRET` |
| Migration creates `pg_trgm` | `\dx` shows `pg_trgm 1.6` |
| Migration matches schema | `prisma migrate diff --exit-code` → "No difference detected" |
| Gitea registry accepts pushes | probe image pushed then deleted (`204`) |
| `pnpm test:run` is green | 112 passing / 20 files |
| Search is parameterized | `O'Brien` and a `DROP TABLE` payload both return safely |
| Mixed-case email login works | on the host in Phase 5, **and again inside the container** in Phase 6 |
| **Image builds** | `docker build` exits 0; 630 MB on disk / 151 MB compressed |
| **Image runs as non-root** | `id` inside the container → `uid=1001(nextjs) gid=1001(nodejs)` |
| **Entrypoint migrates an empty DB** | fresh volume → `Applying migration 20260801154352_init` → `pg_trgm 1.6` + all 9 tables |
| **Migration is idempotent** | `docker compose restart app` → "No pending migrations to apply." |
| **Healthcheck passes** | `docker inspect` → `healthy`, failing streak 0 |
| **App serves from the image** | `/welcome`, `/login`, `/register` all 200; `/app-icon.svg` 200 (proves the `public/` + `.next/static` copies) |
| **Prisma query engine works in the image** | `POST /api/auth/sign-up/email` → 200, row present in `user` |
| **No engine download at boot** | engine mtimes inside the running container match the image build time |
| **Build ARG does not leak** | `docker inspect` `.Config.Env` has no `DATABASE_URL` |
| **The two compose stacks coexist** | dev and prod postgres both `healthy` at once after the project-name fix |
| **CI runs on the Pi** | `verify` green on a branch push and on `main`; service-container Postgres, corepack/pnpm and all 112 tests work on arm64 |
| **CI publishes** | `latest`, `main-1e07bc0` and `buildcache` all landed in the registry |
| **A real image survives the registry round-trip** | pulled back down and inspected: `Arch: arm64`, `User: nextjs`. So the Cloudflare body-cap risk is moot on the LAN |
| **The published image runs** | pulled arm64 image under QEMU on this x86_64 box: healthy, `No pending migrations`, `/welcome`+`/login`+`/register` 200, sign-up 200 with the row landing, mixed-case sign-in 200, `uname -m` = `aarch64` as `nextjs` |
| **The Dockerfile builds on arm64** | full `buildx --platform linux/arm64` cross-build exits 0 |

### What is still browser-only

Unchanged from Phase 5. The rendered `/home` and `/filters` pages have never been
loaded in a browser, so **layout, styling and navigation are unverified**. Every data
path underneath them is covered by tests, and now also by a container that serves the
routes and writes to Postgres.

---

## Phase 7 — what the infrastructure actually looks like

The plan said "a runner is already registered → go straight to the workflow". True,
but three details it does not mention decided the whole design:

1. **The runner is registered site-level, not repo- or user-level.** Both
   `/repos/pratik/saveit/actions/runners` and `/user/actions/runners` return
   `total_count: 0`, and `/admin/...` is 403 because `pratik` is not an admin. It
   works regardless — do not go hunting for a missing runner.
2. **It is a Raspberry Pi 4, label `pi-arm64`.** Everything is `linux/arm64`.
3. **`secrets.GITEA_TOKEN` does not work against the package registry.** Gitea 1.27
   authenticates users and PATs there, not the ephemeral per-task Actions token, so
   `GET /v2/` returns `unauthorized` even with `permissions: packages: write`.
   `REGISTRY_TOKEN` (a user-level PAT with `write:package`) is what works — it is
   user-level, so saveit inherited it with nothing configured per-repository.

Two deviations from `MIGRATION_PLAN.md` worth knowing:

- **The plan says avoid `docker/build-push-action` because buildx setup is a common
  act_runner failure.** Not true on this runner — `pratik/lightcurve` uses
  `docker/setup-buildx-action@v3` across 31 green runs, so this workflow does too,
  with a registry-backed `buildcache`.
- **`verify` and `publish` live in one file**, unlike lightcurve's ci.yml/release.yml
  split. `main` has no branch protection, so a direct push to it must not be able to
  publish an unverified image; `publish` is gated on `needs: verify`. Split them once
  protection guarantees the PR path.

Measured on the Pi: **`verify` 10.5–13 min, `publish` 10.9 min.** `paths-ignore`
skips `**.md` so a docs commit does not burn 22 minutes republishing an identical image.

In CI, `DATABASE_URL` and `TEST_DATABASE_URL` deliberately point at the *same*
throwaway database. The rule that they must differ exists because `tests/setup.ts`
TRUNCATEs every table in `beforeEach` — which matters for local data, not for a
service container destroyed when the job ends.

## Phase 6 — things that were not in the plan

Four of these cost real time; none are guesses.

1. **The Prisma CLI cannot be `COPY`d out of a pnpm `node_modules`.** The plan says
   to copy `node_modules/{prisma,@prisma,.prisma}`. Under pnpm those are symlinks
   into `.pnpm`, so a plain `COPY` ships dangling links. `cp -RL` does not rescue it
   either — it dereferences the named directory but not its siblings, so
   `@prisma/config` dies with `MODULE_NOT_FOUND`, and the result is 292 MB. The
   Dockerfile now does a flat `npm install prisma@<version>` into `/opt/prisma-cli`,
   with the version read out of `package.json` so it cannot drift from the client.

2. **Deleting the CLI's query engine backfires.** `migrate deploy` only drives the
   schema engine, so removing `libquery_engine-*.so.node` looks like free savings —
   but the CLI silently re-downloads it from Prisma's CDN on the next container
   start. Measured: absent from the image, present and freshly dated in the running
   container. It is kept on purpose now. Booting must not require internet.
   The four wasm query engines for unused databases *are* still removed (~9 MB).

3. **Port 80 egress is blocked in this environment**, so `apt-get update` times out
   against `deb.debian.org` and the build fails with "Unable to locate package
   openssl". The Dockerfile rewrites the mirror to HTTPS. The slim image has no CA
   store at that point, so the bootstrap fetch runs with
   `Acquire::https::Verify-Peer=false` — which is not a weakening: apt authenticates
   packages against the archive GPG key named by `Signed-By` in `debian.sources`, the
   same guarantee Debian's default plain-HTTP transport relies on.
   **This is worth re-checking on the Gitea runner in Phase 7** — if port 80 works
   there, the HTTPS rewrite is harmless but no longer load-bearing.

4. **`node:22-bookworm-slim` ships no openssl, no libssl3 and no CA bundle at all.**
   Both Prisma engines have `libssl.so.3` and `libcrypto.so.3` in their `readelf -d`
   NEEDED list, so the apt step is required, not defensive. (Node's own `fetch` works
   regardless — it carries its own OpenSSL and CA store, which is why the base image
   can reach the network without ca-certificates.)

5. **Both compose files defaulted to the same project name.** Both take it from the
   directory (`saveit`) and both define a `postgres` service, so `docker compose up`
   on the production file **adopted and recreated the dev database container**. Both
   files now set an explicit top-level `name:` (`saveit` / `saveit-dev`). The cost was
   a renamed dev volume — see "Resuming".

Also worth knowing: the app logs `ExperimentalWarning: SQLite is an experimental
feature` on boot. Something in the dependency graph touches Node 22's built-in
`node:sqlite`. It is noise, not a regression — the datasource is Postgres and the
sign-up path works — but it will look alarming in deploy logs.

---

## Behaviour changes to watch for

**Email lookups are now case-insensitive.** `lib/auth.ts` said `provider: "sqlite"`
over a Postgres datasource; it now says `"postgresql"`. better-auth branches on that
value to decide whether to apply Prisma's `mode: "insensitive"`. Re-verified inside
the container: signed up as `Phase6.Test@Example.COM`, signed in all-lowercase → 200.

**`updateBookmark` has a new contract.** It only touches tags when the submitted
`FormData` carries `tagsModified=true`. Any caller that edits tags must set that flag
or the tags will be left alone. The edit form already sets it.

**`docker-compose.yml` ignores `DATABASE_URL` from `.env`** and builds its own from
the `POSTGRES_*` vars, pointing at the `postgres` service. The value in `.env` is
localhost-based and is for host-side tooling only; it would not resolve in-container.

---

## Open items and decisions waiting on you

### 1. Phase 8 — deploy

The image is published and the update loop is proven locally. What remains is running
it on the real host: `docker login`, then `docker compose pull && docker compose up -d`
with a filled-in `.env`. **`pull` alone changes nothing** — the `up` is what recreates
the container. Also still missing: a `pg_dump | gzip` backup cron. Nothing exists today.

### 2. Branch protection on `main`

Agreed for after Phase 5, in two stages:

- **Now-safe:** block force push, block branch deletion.
- **After Phase 7 only:** require the `verify` status check. Enabling it before the
  workflow exists means Gitea waits forever for a check that never reports.
- **Do not enable:** require approvals — Gitea won't let you approve your own PR and
  you are the only account.
- **Protect Gitea's `main`, never GitHub's.** The push mirror runs `git push
  --mirror`, which a protected GitHub branch rejects.

---

## Notes carried forward into Phases 7–9

- **Image tags follow the `lightcurve` convention** already used in this registry:
  `main-<shortsha>` + `latest` + `buildcache`. This overrides the bare `<short-sha>`
  in `MIGRATION_PLAN.md` line 217.
- **Cloudflare is not in the path on the LAN.** `gitea.15092021.xyz` resolves to
  `192.168.1.36` via split-horizon DNS and responses carry `via: Caddy` with no
  `cf-*` headers. `MIGRATION_PLAN.md` Risk #1 (the ~100 MB body cap on `docker push`)
  **does not apply** to local or on-host-runner pushes. Note the image is 151 MB
  compressed, so if an off-LAN push is ever attempted, that cap becomes real.
- **`next build` runs ESLint and fails on errors.** `lint` and `build` are not
  independent gates in CI.
- **`DATABASE_URL` must be set during `next build`.** Already handled — the Dockerfile
  passes a placeholder `ARG`, and it does not leak into the runtime env.
- **Phase 7 still needs** `npx` resolvable, or better, `tests/setup.ts` changed to
  resolve Prisma's CLI entry directly (`node_modules/prisma/build/index.js`).
- Phase 6 items from the plan that are now **done**: `output: "standalone"`, the dead
  `next.config.ts` blocks, the Dockerfile, `.dockerignore`, and `docker-compose.yml`.

---

## Environment facts worth not rediscovering

- **Do not run the tests with bun.** `bun run test:run` drops `node`/`npx` from
  `PATH`, does not apply `vi.mock`, and aborts after the first suite while still
  **exiting 0** — a false green. pnpm is the only supported runner.
- Gitea SSH does **not** work from this machine — `git@gitea.15092021.xyz:36151`
  returns `Permission denied (publickey)`. HTTPS + token via
  `credential.helper = store` is the working path. Verify with
  `git push --dry-run origin main` before trusting it.
- Fetching from the `github` remote prompts for credentials (none stored). Expected.
- Git identity is set **repo-locally** to `Pratik Kulkarni <pnkulkarni@proton.me>`.
- pnpm is `9.15.9`, pinned in `package.json` via `packageManager`.
- Scope constraint honoured throughout: nothing on the `voyager1` host was modified.
  The only containers created were local.
