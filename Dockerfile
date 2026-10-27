FROM node:24-slim AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
ENV VITE_API_URL=/api
RUN pnpm build
RUN pnpm --filter @nexo/monolith --prod deploy --legacy /deploy/monolith

FROM node:24-slim AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    SERVE_WEB_DIR=/app/web
WORKDIR /app
COPY --from=build --chown=node:node /deploy/monolith ./
COPY --from=build --chown=node:node /repo/apps/web/dist ./web
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "dist/main.js"]
