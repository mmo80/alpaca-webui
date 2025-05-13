FROM node:22.14.0-alpine3.21 AS base
FROM base AS deps

RUN apk add --no-cache libc6-compat
# RUN apk add --no-cache --virtual .apk-build build-base libc-dev sqlite-dev

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove .env.local to ensure it's not used in production build
RUN if [ -f .env.local ]; then rm .env.local; fi

RUN npm run build

RUN mkdir -p /app/db
RUN npm run migrate && npm run push --force

# Check if local.db exists, and if not, initialize it
# RUN if [ ! -f /app/db/local.db ]; then npm run migrate && npm run push --force; fi

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next
RUN chown nextjs:nodejs .next
RUN mkdir uploads
RUN chown -R nextjs:nodejs uploads
RUN mkdir db
COPY --from=builder /app/db/local.db ./db
RUN chown -R nextjs:nodejs db

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]

# url: https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile