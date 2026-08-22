# RotationTV kimi-cloud — production Node/Hono packaging
# Entity: Darrel-spell-living-trust
# Primary path remains Cloudflare Workers; this enables hybrid / self-hosted / k8s.

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache wget tini

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

FROM base AS build
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
# Build any TypeScript / Vite assets if scripts exist
RUN npm run build || true
# Ensure a server entry exists (we ship a thin Hono adapter)
RUN mkdir -p dist

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/workers ./workers
COPY --from=build /app/wrangler.jsonc* ./
COPY deploy/kimi-cloud/server.mjs ./server.mjs

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/kimi/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.mjs"]
