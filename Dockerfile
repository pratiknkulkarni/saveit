# syntax=docker/dockerfile:1
#
# Two stages: a builder that installs dev deps and runs `next build`, and a runner
# that carries only the standalone bundle plus a Prisma CLI for migrations.
#
#   docker build -t gitea.15092021.xyz/pratik/saveit:latest .
#
# The old image copied the entire dev node_modules and shelled `pnpm start`; this one
# runs the standalone server directly as a non-root user.

# ---------------------------------------------------------------- builder --------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Both Prisma engines link against libssl.so.3/libcrypto.so.3 (`readelf -d` on the
# query and schema engines), and node:22-bookworm-slim ships neither those nor a CA
# bundle — so this apt step is required, not belt-and-braces. No python3/make/g++ any
# more: the sqlite3 dep that forced the node-gyp toolchain is gone.
#
# The mirror is switched to HTTPS because port 80 egress is blocked in this project's
# build environment. The slim image has no CA store yet, so the bootstrap fetch cannot
# verify the TLS peer. That is not a weakening: apt authenticates packages against the
# archive GPG key named by Signed-By in debian.sources, which is the same guarantee
# Debian's default plain-HTTP transport relies on. ca-certificates lands in the same
# step, so everything after this has a real trust store.
RUN sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources && \
    apt-get -o Acquire::https::Verify-Peer=false update -y && \
    apt-get -o Acquire::https::Verify-Peer=false install -y --no-install-recommends \
        ca-certificates openssl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# corepack picks the version from package.json's "packageManager" field — do not
# `corepack prepare pnpm@latest`, which would silently ignore the pin.
RUN corepack enable

# Lockfile first so the dependency layer survives source-only changes.
COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch
RUN pnpm install --offline --frozen-lockfile

# Schema before the rest of the source: `prisma generate` only depends on this.
COPY prisma ./prisma
RUN pnpm prisma generate

COPY . .

# app/page.tsx imports lib/auth, which constructs a PrismaClient at module scope, and
# `next build` evaluates that during page-data collection. Nothing connects, so a
# syntactically valid placeholder is enough — this is never the runtime value.
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# The standalone bundle contains @prisma/client but not the Prisma CLI — nothing
# imports the CLI, so Next's file tracing never sees it, and the entrypoint needs it
# for `migrate deploy`. pnpm's node_modules is a tree of symlinks into .pnpm, so it
# cannot simply be COPYed out; npm gives us a flat, self-contained tree instead.
# The version is read from package.json so this can never drift from the client.
RUN mkdir -p /opt/prisma-cli && cd /opt/prisma-cli && \
    npm install --no-save --no-audit --no-fund --loglevel=error \
        prisma@"$(node -p "require('/app/package.json').devDependencies.prisma")"

# Drop the wasm query engines for databases this project does not use (~9 MB).
#
# Do NOT also delete node_modules/@prisma/engines/libquery_engine-*.so.node here, even
# though `migrate deploy` only drives the schema engine: if that file is missing, the
# CLI downloads a replacement from Prisma's CDN on every container start. Measured —
# the trimmed image had no such file, and the running container had a fresh 17 MB copy
# after the entrypoint ran. Keeping it costs 17 MB once; removing it makes booting
# depend on outbound internet access, which a self-hosted deploy should never need.
RUN cd /opt/prisma-cli && \
    rm -f node_modules/prisma/build/query_engine_bg.sqlite.wasm \
          node_modules/prisma/build/query_engine_bg.mysql.wasm \
          node_modules/prisma/build/query_engine_bg.sqlserver.wasm \
          node_modules/prisma/build/query_engine_bg.cockroachdb.wasm

# ----------------------------------------------------------------- runner --------
FROM node:22-bookworm-slim AS runner
WORKDIR /app

# Same reasoning as the builder stage: the engines need libssl, and the mirror has to
# be reached over HTTPS here.
RUN sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources && \
    apt-get -o Acquire::https::Verify-Peer=false update -y && \
    apt-get -o Acquire::https::Verify-Peer=false install -y --no-install-recommends \
        ca-certificates openssl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=33449 \
    HOSTNAME=0.0.0.0

# The image's own `node` user is uid 1000; use a distinct one so a bind-mounted
# volume's ownership cannot collide with it by accident.
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# standalone emits its own server.js and a minimal node_modules, but not public/ or
# .next/static — those have to come across separately or every asset 404s.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# schema.prisma + migrations/ are what `migrate deploy` reads at boot.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /opt/prisma-cli/node_modules ./prisma-cli/node_modules
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh

USER nextjs
EXPOSE 33449

# /welcome is a static page with no database access, so this reports on the web
# server alone. The slim image has no curl or wget; Node 22 has a global fetch.
# start-period covers `migrate deploy` plus first boot.
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||33449)+'/welcome').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
