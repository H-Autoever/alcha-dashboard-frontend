import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Table, Alert, Loader } from '../components/UI'
import { api } from '../api/client'

type Vehicle = { vehicle_id: string; model: string }

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [summary, setSummary] = useState<{ total_vehicles: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  
  // API 연결 테스트 - 환경변수 확인용

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api<Vehicle[]>(`/api/vehicles/`),
      api<{ total_vehicles: number }>(`/api/vehicles/summary`)
    ])
      .then(([v, s]) => {
        setVehicles(v)
        setSummary(s)
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="page-title">
        <h1>전체 차량 현황 대시보드</h1>
        <span className="badge">기본정보</span>
      </div>
      {summary && (
        <div className="cards" style={{ marginBottom: 12 }}>
          <div className="card">
            <div className="stat-label">총 차량 수</div>
            <div className="stat-value">{summary.total_vehicles}</div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <Search value={q} onChange={setQ} placeholder="차량 ID 또는 모델 검색" />
      </div>
      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Loader />
      ) : (
        <Table headers={["차량 ID", "모델", "상태"]}>
          {vehicles
            .filter((v) => (q ? (v.vehicle_id + ' ' + v.model).toLowerCase().includes(q.toLowerCase()) : true))
            .map((v) => (
              <tr key={v.vehicle_id} className="vehicle-row">
                <td>
                  <Link className="vehicle-link" to={`/vehicle/${encodeURIComponent(v.vehicle_id)}`}>
                    🚗 {v.vehicle_id}
                  </Link>
                </td>
                <td>
                  <span className="vehicle-model">{v.model}</span>
                </td>
                <td>
                  <span className="vehicle-status-badge">활성</span>
                </td>
              </tr>
            ))}
        </Table>
      )}
    </div>
  )
}


