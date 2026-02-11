# ---------- DEV (hot reload) ----------
FROM node:23-alpine AS dev
WORKDIR /app

# Windows/WSL file watching stability
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
EXPOSE 3000
CMD ["npm", "start"]

# ---------- PROD skeleton (build + nginx) ----------
FROM node:23-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
