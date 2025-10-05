// 런타임에 환경변수 읽기 (빌드 시점이 아닌 실행 시점)
const getApiBase = () => {
  // 브라우저 환경에서는 window.location.origin 사용
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  // 서버 사이드에서는 환경변수 사용
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const API_BASE = getApiBase()
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  return res.json()
}


