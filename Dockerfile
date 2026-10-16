FROM node:24.19.0-bookworm-slim AS lexicon-build
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
COPY server ./server
COPY scripts/build-full-step.js scripts/normalize-step-brief.js scripts/import-step-lexicon.js scripts/build-deployment-lexicon.js ./scripts/
RUN git clone --depth 1 https://github.com/STEPBible/STEPBible-Data.git /tmp/step-data \
    && node scripts/build-deployment-lexicon.js /tmp/step-data /build/lexicon

FROM node:24.19.0-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0 DATA_DIR=/app/.data LEXICON_DIR=/app/lexicon
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && mkdir /app/.data && chown node:node /app/.data
COPY --chown=node:node server ./server
COPY --chown=node:node packages/kv-study-engine ./packages/kv-study-engine
COPY --chown=node:node public ./public
COPY --chown=node:node scripts/usage.js scripts/smoke.js ./scripts/
COPY --from=lexicon-build --chown=node:node /build/lexicon /app/lexicon
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "start"]
