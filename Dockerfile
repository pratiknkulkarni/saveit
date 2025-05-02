FROM oven/bun:1 AS builder

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl libssl-dev

COPY package.json bun.lockb ./

RUN bun install

COPY . .

RUN bunx prisma generate

RUN bun run build

FROM oven/bun:1 AS production

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y openssl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lockb ./bun.lockb
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts

ENV NODE_ENV=production
ENV PORT=33445

EXPOSE 33445