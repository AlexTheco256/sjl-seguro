# syntax=docker/dockerfile:1
# Imagen de producción de SJL Seguro: frontend React compilado + API Express.

# ---------- 1) Compilación del frontend ----------
FROM node:22-alpine AS web
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---------- 2) Dependencias de producción de la API ----------
FROM node:22-alpine AS api
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---------- 3) Imagen final mínima ----------
FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=3000 \
    STATIC_DIR=/app/frontend/dist
WORKDIR /app
# Parches del sistema operativo y eliminación de npm/yarn/corepack (no se usan en
# ejecución y reducen la superficie de ataque detectada por Trivy).
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg
COPY --from=api --chown=node:node /app/backend/node_modules ./backend/node_modules
COPY --chown=node:node backend/package.json ./backend/package.json
COPY --chown=node:node backend/src ./backend/src
COPY --from=web --chown=node:node /app/frontend/dist ./frontend/dist
# Se ejecuta sin privilegios de root.
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1
CMD ["node", "backend/src/server.js"]
