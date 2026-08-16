# RotationTV — kimi-cloud / Docker Deployment
# Multi-stage build: build frontend + worker in one image
# Entity: Darrel-spell-living-trust

FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build
RUN npx vite build --config vite.web.config.ts || true

FROM node:20-slim AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-web ./dist-web
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/wrangler.jsonc ./

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8787/api/health || exit 1

CMD ["npx", "wrangler", "dev", "--port", "8787", "--ip", "0.0.0.0"]
