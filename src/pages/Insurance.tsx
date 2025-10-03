import { useEffect, useState } from 'react'
import { api } from '../api/client'

type Row = {
  vehicle_id: string
  over_speed_risk: number | null
  sudden_accel_risk: number | null
  sudden_turn_risk: number | null
  night_drive_risk: number | null
  overall_grade: number | null
}

export default function InsurancePage() {
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Row[]>(`/api/insurance/`).then(setRows).catch((e) => setError(String(e)))
  }, [])

  return (
    <div>
      <div className="page-title">
        <h1>보험 위험도 평가</h1>
        <span className="badge">보험</span>
      </div>
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>차량 ID</th>
            <th>과속 위험도</th>
            <th>급가속/급정지</th>
            <th>급회전</th>
            <th>야간 주행</th>
            <th>종합 등급</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.vehicle_id}>
              <td>{r.vehicle_id}</td>
              <td>{r.over_speed_risk ?? '-'}</td>
              <td>{r.sudden_accel_risk ?? '-'}</td>
              <td>{r.sudden_turn_risk ?? '-'}</td>
              <td>{r.night_drive_risk ?? '-'}</td>
              <td>{r.overall_grade ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


