# RotationTV — kimi-cloud packaging
# Runs the worker logic in a Node container (Hono / fetch adapter style).
# Primary production remains Cloudflare Workers; this enables hybrid / self-hosted / k8s.

FROM node:20-alpine AS base
WORKDIR /app

# Install production deps only in final stage
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

FROM base AS build
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
# If a Node entry exists, build it; otherwise keep TS sources for runtime transpile
RUN npm run build || true

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

# Minimal health server if no full Node entrypoint is present.
# In production prefer wiring your Hono/CF adapter to listen on PORT.
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/kimi/health || exit 1

# Default: run a lightweight Node process that can be replaced by your real entry.
# Example: node dist/server.js  or  npx wrangler dev --local --port 8080
CMD ["node", "-e", "const http=require('http');http.createServer((req,res)=>{if(req.url==='/api/kimi/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({status:'packaged',models:['kimi-k2.7-code','kimi-k2.5','moonshot-v1-128k'],note:'Wire full Hono/worker entry for production'}))}else{res.writeHead(404);res.end()}}).listen(process.env.PORT||8080,()=>console.log('kimi-cloud package listening on',process.env.PORT||8080))"]
