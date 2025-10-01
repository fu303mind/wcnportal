# syntax=docker/dockerfile:1
FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json

RUN npm install --workspaces --include-workspace-root

COPY frontend/tsconfig.json frontend/tsconfig.json
COPY frontend/tsconfig.node.json frontend/tsconfig.node.json
COPY frontend/vite.config.ts frontend/vite.config.ts
COPY frontend/src frontend/src
COPY frontend/index.html frontend/index.html

RUN npm run build --workspace frontend

FROM nginx:1.25-alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
