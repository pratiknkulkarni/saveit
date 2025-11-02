# -------- BUILDER STAGE --------
FROM node:20-slim AS builder
WORKDIR /app

# Install build deps (for node-gyp / sqlite3)
RUN apt-get update -y && \
    apt-get install -y python3 make g++ openssl libssl-dev libsqlite3-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only package manager files first (better caching)
COPY package.json pnpm-lock.yaml ./

# Pre-fetch deps (store them in pnpm store)
RUN pnpm fetch

# Copy rest of the source code
COPY . .

# Install deps using offline cache
RUN pnpm install --offline --frozen-lockfile

# Generate Prisma client with correct binary targets
RUN pnpm prisma generate

# Build Next.js
RUN pnpm build

# -------- PRODUCTION STAGE --------
FROM node:20-slim AS production
WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y openssl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts

ENV NODE_ENV=production
ENV PORT=33449
EXPOSE 33449

# Default command
CMD ["pnpm", "start"]
