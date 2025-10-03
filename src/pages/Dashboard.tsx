import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

type Vehicle = { vehicle_id: string; model: string }

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [summary, setSummary] = useState<{ total_vehicles: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api<Vehicle[]>(`/api/vehicles/`),
      api<{ total_vehicles: number }>(`/api/vehicles/summary`)
    ])
      .then(([v, s]) => {
        setVehicles(v)
        setSummary(s)
      })
      .catch((e) => setError(String(e)))
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
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>차량 ID</th>
            <th>모델</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.vehicle_id}>
              <td>
                <Link className="link" to={`/vehicle/${encodeURIComponent(v.vehicle_id)}`}>{v.vehicle_id}</Link>
              </td>
              <td>{v.model}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


