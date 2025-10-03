### 공통 네트워크 생성 (최초 1회)
```bash
docker network create alcha-net
```

### 프론트엔드 컨테이너 실행
이미지 빌드:
```bash
docker build -t alcha-git-frontend .
```
실행(백엔드가 8000에서 동작 중이어야 함):
```bash
docker run -d --name alcha-frontend --network alcha-net -p 5173:5173 \
  -e VITE_API_BASE_URL=http://localhost:8000 \
  alcha-git-frontend
```