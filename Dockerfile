# 빌드 환경 설정 및 alch-dashboard-frontend 빌드
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# production 환경을 위한 nginx 설정
FROM nginx:alpine

# 빌드된 정적 파일들을 nginx 웹 서버로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

