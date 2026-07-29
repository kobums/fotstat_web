FROM --platform=linux/amd64 node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --no-audit --prefer-offline

COPY . .

# vite build 시 .env.production의 VITE_API_BASE_URL이 주입된다
RUN npm run build

# Production stage — nginx로 정적 파일 서빙
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 9009

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:9009/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
