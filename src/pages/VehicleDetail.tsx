import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import { Table, Alert, Loader } from '../components/UI'

type DailyData = {
  analysis_date: string | null
  total_distance: number | null
  average_speed: number | null
  fuel_efficiency: number | null
  collision_events: string | null
}

type VehicleDetail = {
  vehicle_id: string
  model: string
  year: number | null
  daily_data: DailyData[]
}

export default function VehicleDetailPage() {
  const { vehicleId } = useParams()
  const [detail, setDetail] = useState<VehicleDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vehicleId) return
    setLoading(true)
    api<VehicleDetail>(`/api/vehicles/${encodeURIComponent(vehicleId)}`)
      .then(setDetail)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [vehicleId])

  if (error) return <Alert>{error}</Alert>
  if (loading) return <Loader />
  if (!detail) return <Alert>차량 정보를 찾을 수 없습니다.</Alert>

  return (
    <div>
      <p><Link className="link" to="/">← 대시보드</Link></p>
      <div className="page-title">
        <h1>차량 상세 정보</h1>
        <span className="badge">기본정보</span>
      </div>
      
      {/* 차량 기본 정보 */}
      <div className="cards" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="stat-label">차량 ID</div>
          <div className="stat-value">{detail.vehicle_id}</div>
        </div>
        <div className="card">
          <div className="stat-label">모델</div>
          <div className="stat-value">{detail.model}</div>
        </div>
        <div className="card">
          <div className="stat-label">연식</div>
          <div className="stat-value">{detail.year ?? '-'}</div>
        </div>
      </div>

      {/* 날짜별 데이터 테이블 */}
      <h3>날짜별 상세 데이터</h3>
      <Table headers={["분석 날짜", "총 주행거리 (km)", "평균 속도 (km/h)", "연비 (km/L)", "충돌 이벤트"]}>
        {detail.daily_data.map((data, index) => (
          <tr key={index}>
            <td>{data.analysis_date ? new Date(data.analysis_date).toLocaleDateString('ko-KR') : '-'}</td>
            <td>{data.total_distance ? data.total_distance.toLocaleString() : '-'}</td>
            <td>{data.average_speed ? data.average_speed.toFixed(1) : '-'}</td>
            <td>{data.fuel_efficiency ? data.fuel_efficiency.toFixed(1) : '-'}</td>
            <td>{data.collision_events || '-'}</td>
          </tr>
        ))}
      </Table>
    </div>
  )
}


