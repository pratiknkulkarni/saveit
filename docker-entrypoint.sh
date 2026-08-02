#!/bin/sh
# Applies pending Prisma migrations, then hands off to the real command (node server.js).
#
# The Next.js standalone bundle contains @prisma/client but NOT the Prisma CLI —
# nothing imports it, so file tracing never picks it up. The Dockerfile installs a
# standalone, flat copy of the CLI at /app/prisma-cli and we invoke its bundled
# entrypoint directly rather than going through a `pnpm`/`npx` shim that is not in
# this image.
set -eu

PRISMA_CLI="/app/prisma-cli/node_modules/prisma/build/index.js"
SCHEMA="/app/prisma/schema.prisma"

if [ -z "${DATABASE_URL:-}" ]; then
    echo "entrypoint: DATABASE_URL is not set; refusing to start." >&2
    exit 1
fi

echo "entrypoint: applying migrations..."
node "$PRISMA_CLI" migrate deploy --schema="$SCHEMA"
echo "entrypoint: migrations up to date, starting app."

exec "$@"
