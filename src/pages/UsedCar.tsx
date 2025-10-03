import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Search, Table, Alert, Loader } from '../components/UI'
import { Modal } from '../components/Modal'

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
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Row | null>(null)

  useEffect(() => {
    setLoading(true)
    api<Row[]>(`/api/used-car/`).then(setRows).catch((e) => setError(String(e))).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="page-title">
        <h1>중고차 차량 상태 평가</h1>
        <span className="badge">중고차</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <Search value={q} onChange={setQ} placeholder="차량 ID 검색" />
      </div>
      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Loader />
      ) : (
        <Table headers={["차량 ID", "엔진", "배터리", "타이어", "브레이크", "연비 효율", "종합 등급"]}>
          {rows
            .filter((r) => (q ? r.vehicle_id.toLowerCase().includes(q.toLowerCase()) : true))
            .map((r) => (
              <tr key={r.vehicle_id}>
                <td><a className="link" href="#" onClick={(e) => { e.preventDefault(); setSelected(r) }}>{r.vehicle_id}</a></td>
                <td>{r.engine_score ?? '-'}</td>
                <td>{r.battery_score ?? '-'}</td>
                <td>{r.tire_score ?? '-'}</td>
                <td>{r.brake_score ?? '-'}</td>
                <td>{r.fuel_efficiency_score ?? '-'}</td>
                <td>{r.overall_grade ?? '-'}</td>
              </tr>
            ))}
        </Table>
      )}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `차량 ${selected.vehicle_id} 상태 상세` : ''}>
        {selected && (
          <div className="cards">
            <div className="card"><div className="stat-label">엔진</div><div className="stat-value">{selected.engine_score ?? '-'}</div></div>
            <div className="card"><div className="stat-label">배터리</div><div className="stat-value">{selected.battery_score ?? '-'}</div></div>
            <div className="card"><div className="stat-label">타이어</div><div className="stat-value">{selected.tire_score ?? '-'}</div></div>
            <div className="card"><div className="stat-label">브레이크</div><div className="stat-value">{selected.brake_score ?? '-'}</div></div>
            <div className="card"><div className="stat-label">연비 효율</div><div className="stat-value">{selected.fuel_efficiency_score ?? '-'}</div></div>
            <div className="card"><div className="stat-label">종합 등급</div><div className="stat-value">{selected.overall_grade ?? '-'}</div></div>
          </div>
        )}
      </Modal>
    </div>
  )
}


