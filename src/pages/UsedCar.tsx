import { useEffect, useState } from 'react'
import { api } from '../api/client'

type Row = {
  vehicle_id: string
  engine_score: number | null
  battery_score: number | null
  tire_score: number | null
  brake_score: number | null
  fuel_efficiency_score: number | null
  overall_grade: number | null
}

export default function UsedCarPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Row[]>(`/api/used-car/`).then(setRows).catch((e) => setError(String(e)))
  }, [])

  return (
    <div>
      <div className="page-title">
        <h1>중고차 차량 상태 평가</h1>
        <span className="badge">중고차</span>
      </div>
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>차량 ID</th>
            <th>엔진</th>
            <th>배터리</th>
            <th>타이어</th>
            <th>브레이크</th>
            <th>연비 효율</th>
            <th>종합 등급</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.vehicle_id}>
              <td>{r.vehicle_id}</td>
              <td>{r.engine_score ?? '-'}</td>
              <td>{r.battery_score ?? '-'}</td>
              <td>{r.tire_score ?? '-'}</td>
              <td>{r.brake_score ?? '-'}</td>
              <td>{r.fuel_efficiency_score ?? '-'}</td>
              <td>{r.overall_grade ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


