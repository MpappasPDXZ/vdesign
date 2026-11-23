# vdesign — production image (Next.js standalone)
# Build context: repository root (needs both app/ and src/)

FROM node:22-bookworm-slim AS base
RUN npm install -g pnpm@9.15.9
WORKDIR /app

# --- deps ---
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY app/package.json app/pnpm-lock.yaml ./app/
RUN pnpm install --frozen-lockfile
RUN pnpm --dir app install --frozen-lockfile

# --- build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/app/node_modules ./app/node_modules
COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY src ./src
COPY app ./app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --dir app build

# --- runner ---
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone output is rooted at the monorepo (outputFileTracingRoot = ..)
COPY --from=builder --chown=nextjs:nodejs /app/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/app/.next/static ./app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/app/public ./app/public

USER nextjs
EXPOSE 3000
CMD ["node", "app/server.js"]
