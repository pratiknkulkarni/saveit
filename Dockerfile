# syntax=docker.io/docker/dockerfile:1
FROM oven/bun:1 AS base

# Set working directory
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
# Install necessary packages for Prisma and Next.js
RUN apt-get update && apt-get install -y python3 g++ make openssl

# Copy package.json and lockfile
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

#COPY .env .env

# Generate Prisma client
RUN bunx prisma generate

# Disable Next.js telemetry during build (optional)
ENV NEXT_TELEMETRY_DISABLED=1

#ENV NEXT_PUBLIC_API_URL=http://127.0.0.1:33445

# Build the Next.js application
RUN bun run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Disable Next.js telemetry during runtime (optional)
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files for Prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy public directory
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# SQLite database should be in a volume to persist data
# Make sure the nextjs user has write access to the directory
RUN mkdir -p /app/prisma/data && chown -R nextjs:nodejs /app/prisma

# Switch to non-root user
USER nextjs

# Expose the port the app will run on
EXPOSE ${PORT}

# Start the application with Bun
CMD ["bun", "server.js", "--host", "0.0.0.0", "--port", "${PORT}"]