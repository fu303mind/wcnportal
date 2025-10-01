# syntax=docker/dockerfile:1
FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm install --workspaces --include-workspace-root

COPY backend/tsconfig.json backend/tsconfig.json
COPY backend/src backend/src

RUN npm run build --workspace backend

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist

EXPOSE 5000
CMD ["node", "dist/index.js"]
