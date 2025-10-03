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
    <div style={{ padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1>전체 차량 현황 대시보드</h1>
      {summary && <p>총 차량 수: {summary.total_vehicles}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>차량 ID</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>모델</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.vehicle_id}>
              <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                <Link to={`/vehicle/${encodeURIComponent(v.vehicle_id)}`}>{v.vehicle_id}</Link>
              </td>
              <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{v.model}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


