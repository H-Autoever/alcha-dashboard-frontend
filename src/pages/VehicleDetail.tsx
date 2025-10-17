import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'

type VehicleDetail = {
  vehicle_id: string
  model: string
  year: number | null
  total_distance: number | null
  average_speed: number | null
  fuel_efficiency: number | null
  collision_events: string | null
  analysis_date: string | null
}

type UsedCar = {
  vehicle_id: string
  engine_score: number | null
  battery_score: number | null
  tire_score: number | null
  brake_score: number | null
  fuel_efficiency_score: number | null
  overall_grade: number | null
  analysis_date: string | null
}

type Insurance = {
  vehicle_id: string
  over_speed_risk: number | null
  sudden_accel_risk: number | null
  sudden_turn_risk: number | null
  night_drive_risk: number | null
  overall_grade: number | null
  analysis_date: string | null
}

// 점수에 따른 색상 반환 함수
const getScoreColor = (score: number | null) => {
  if (score === null) return '#6b7280'
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

// 위험도에 따른 색상 반환 함수
const getRiskColor = (risk: number | null) => {
  if (risk === null) return '#6b7280'
  if (risk <= 20) return '#22c55e'
  if (risk <= 60) return '#f59e0b'
  return '#ef4444'
}

// 점수 표시 컴포넌트
const ScoreDisplay = ({ score, label }: { score: number | null; label: string }) => (
  <div className="score-item">
    <div className="score-label">{label}</div>
    <div className="score-value" style={{ color: getScoreColor(score) }}>
      {score !== null ? `${score}점` : '-'}
    </div>
  </div>
)

// 위험도 표시 컴포넌트
const RiskDisplay = ({ risk, label }: { risk: number | null; label: string }) => (
  <div className="score-item">
    <div className="score-label">{label}</div>
    <div className="score-value" style={{ color: getRiskColor(risk) }}>
      {risk !== null ? `${risk}%` : '-'}
    </div>
  </div>
)

export default function VehicleDetailPage() {
  const { vehicleId } = useParams()
  const [detail, setDetail] = useState<VehicleDetail | null>(null)
  const [usedCar, setUsedCar] = useState<UsedCar | null>(null)
  const [insurance, setInsurance] = useState<Insurance | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vehicleId) return
    setLoading(true)
    Promise.all([
      api<VehicleDetail>(`/api/vehicles/${encodeURIComponent(vehicleId)}`),
      api<UsedCar>(`/api/used-car/${encodeURIComponent(vehicleId)}`).catch(() => null as any),
      api<Insurance>(`/api/insurance/${encodeURIComponent(vehicleId)}`).catch(() => null as any)
    ])
      .then(([d, u, i]) => {
        setDetail(d)
        setUsedCar(u)
        setInsurance(i)
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [vehicleId])

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>차량 정보를 불러오는 중...</p>
    </div>
  )

  if (error) return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <h3>오류가 발생했습니다</h3>
      <p>{error}</p>
      <Link className="link" to="/">← 대시보드로 돌아가기</Link>
    </div>
  )

  if (!detail) return null

  return (
    <div className="vehicle-detail-page">
      <div className="breadcrumb">
        <Link className="link" to="/">대시보드</Link>
        <span className="separator">›</span>
        <span>차량 상세</span>
      </div>

      <div className="vehicle-header">
        <div className="vehicle-title">
          <h1>🚗 {detail.model}</h1>
          <span className="vehicle-id">ID: {detail.vehicle_id}</span>
        </div>
        <div className="vehicle-status">
          <span className="status-badge">활성</span>
        </div>
      </div>

      {/* 기본 정보 카드 */}
      <div className="info-section">
        <h2 className="section-title">📊 기본 정보</h2>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon">📅</div>
            <div className="info-content">
              <div className="info-label">연식</div>
              <div className="info-value">{detail.year ?? '-'}</div>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">🛣️</div>
            <div className="info-content">
              <div className="info-label">총 주행거리</div>
              <div className="info-value">{detail.total_distance ? `${detail.total_distance.toLocaleString()}km` : '-'}</div>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">⚡</div>
            <div className="info-content">
              <div className="info-label">평균속도</div>
              <div className="info-value">{detail.average_speed ? `${detail.average_speed}km/h` : '-'}</div>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">⛽</div>
            <div className="info-content">
              <div className="info-label">연비</div>
              <div className="info-value">{detail.fuel_efficiency ? `${detail.fuel_efficiency}km/L` : '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 중고차 평가 섹션 */}
      <div className="info-section">
        <h2 className="section-title">🔍 중고차 평가</h2>
        {usedCar ? (
          <div className="evaluation-card">
            <div className="evaluation-grid">
              <ScoreDisplay score={usedCar.engine_score} label="엔진 상태" />
              <ScoreDisplay score={usedCar.battery_score} label="배터리 상태" />
              <ScoreDisplay score={usedCar.tire_score} label="타이어 상태" />
              <ScoreDisplay score={usedCar.brake_score} label="브레이크 상태" />
              <ScoreDisplay score={usedCar.fuel_efficiency_score} label="연비 효율" />
            </div>
            <div className="overall-score">
              <div className="overall-label">종합 등급</div>
              <div className="overall-value" style={{ color: getScoreColor(usedCar.overall_grade) }}>
                {usedCar.overall_grade !== null ? `${usedCar.overall_grade}점` : '-'}
              </div>
            </div>
          </div>
        ) : (
          <div className="no-data-card">
            <div className="no-data-icon">📊</div>
            <p>중고차 평가 데이터가 없습니다</p>
          </div>
        )}
      </div>

      {/* 보험 위험도 섹션 */}
      <div className="info-section">
        <h2 className="section-title">🛡️ 보험 위험도 분석</h2>
        {insurance ? (
          <div className="evaluation-card">
            <div className="evaluation-grid">
              <RiskDisplay risk={insurance.over_speed_risk} label="과속 위험도" />
              <RiskDisplay risk={insurance.sudden_accel_risk} label="급가속/급정지" />
              <RiskDisplay risk={insurance.sudden_turn_risk} label="급회전 위험도" />
              <RiskDisplay risk={insurance.night_drive_risk} label="야간 주행 위험도" />
            </div>
            <div className="overall-score">
              <div className="overall-label">종합 위험도</div>
              <div className="overall-value" style={{ color: getRiskColor(insurance.overall_grade) }}>
                {insurance.overall_grade !== null ? `${insurance.overall_grade}%` : '-'}
              </div>
            </div>
          </div>
        ) : (
          <div className="no-data-card">
            <div className="no-data-icon">🛡️</div>
            <p>보험 위험도 데이터가 없습니다</p>
          </div>
        )}
      </div>

      {/* 충돌 이벤트 정보 */}
      {detail.collision_events && (
        <div className="info-section">
          <h2 className="section-title">⚠️ 충돌 이벤트</h2>
          <div className="collision-card">
            <div className="collision-icon">💥</div>
            <div className="collision-content">
              <div className="collision-label">충돌 시점</div>
              <div className="collision-value">{detail.collision_events}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


