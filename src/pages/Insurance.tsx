import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Search, Table, Alert, Loader } from '../components/UI'
import { Modal } from '../components/Modal'

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
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Row | null>(null)

  useEffect(() => {
    setLoading(true)
    api<Row[]>(`/api/insurance/`).then(setRows).catch((e) => setError(String(e))).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="page-title">
        <h1>보험 위험도 평가</h1>
        <span className="badge">보험</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <Search value={q} onChange={setQ} placeholder="차량 ID 검색" />
      </div>
      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Loader />
      ) : (
        <Table headers={["차량 ID", "과속 위험도", "급가속/급정지", "급회전", "야간 주행", "종합 등급"]}>
          {rows
            .filter((r) => (q ? r.vehicle_id.toLowerCase().includes(q.toLowerCase()) : true))
            .map((r) => (
              <tr key={r.vehicle_id}>
                <td><a className="link" href="#" onClick={(e) => { e.preventDefault(); setSelected(r) }}>{r.vehicle_id}</a></td>
                <td>{r.over_speed_risk ?? '-'}</td>
                <td>{r.sudden_accel_risk ?? '-'}</td>
                <td>{r.sudden_turn_risk ?? '-'}</td>
                <td>{r.night_drive_risk ?? '-'}</td>
                <td>{r.overall_grade ?? '-'}</td>
              </tr>
            ))}
        </Table>
      )}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `차량 ${selected.vehicle_id} 위험도 상세` : ''}>
        {selected && (
          <div className="cards">
            <div className="card"><div className="stat-label">과속</div><div className="stat-value">{selected.over_speed_risk ?? '-'}</div></div>
            <div className="card"><div className="stat-label">급가속/정지</div><div className="stat-value">{selected.sudden_accel_risk ?? '-'}</div></div>
            <div className="card"><div className="stat-label">급회전</div><div className="stat-value">{selected.sudden_turn_risk ?? '-'}</div></div>
            <div className="card"><div className="stat-label">야간 주행</div><div className="stat-value">{selected.night_drive_risk ?? '-'}</div></div>
            <div className="card"><div className="stat-label">종합 등급</div><div className="stat-value">{selected.overall_grade ?? '-'}</div></div>
          </div>
        )}
      </Modal>
    </div>
  )
}


