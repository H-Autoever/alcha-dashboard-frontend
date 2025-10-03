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

export default function VehicleDetailPage() {
  const { vehicleId } = useParams()
  const [detail, setDetail] = useState<VehicleDetail | null>(null)
  const [usedCar, setUsedCar] = useState<UsedCar | null>(null)
  const [insurance, setInsurance] = useState<Insurance | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!vehicleId) return
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
  }, [vehicleId])

  if (error) return <div style={{ color: '#ef4444' }}>{error}</div>
  if (!detail) return <div>Loading...</div>

  return (
    <div>
      <p><Link className="link" to="/">← 대시보드</Link></p>
      <div className="page-title"><h1>차량 상세</h1><span className="badge">기본정보</span></div>
      <ul>
        <li>차량 ID: {detail.vehicle_id}</li>
        <li>모델: {detail.model}</li>
        <li>연식: {detail.year ?? '-'}</li>
        <li>총거리: {detail.total_distance ?? '-'}</li>
        <li>평균속도: {detail.average_speed ?? '-'}</li>
        <li>연비: {detail.fuel_efficiency ?? '-'}</li>
        <li>이벤트(충돌 시점): {detail.collision_events ?? '-'}</li>
      </ul>

      <h3>중고차 평가</h3>
      {usedCar ? (
        <ul>
          <li>엔진 점수: {usedCar.engine_score ?? '-'}</li>
          <li>배터리 점수: {usedCar.battery_score ?? '-'}</li>
          <li>타이어 점수: {usedCar.tire_score ?? '-'}</li>
          <li>브레이크 점수: {usedCar.brake_score ?? '-'}</li>
          <li>연비 효율 점수: {usedCar.fuel_efficiency_score ?? '-'}</li>
          <li>종합 등급: {usedCar.overall_grade ?? '-'}</li>
        </ul>
      ) : (
        <p>데이터 없음</p>
      )}

      <h3>보험 위험도</h3>
      {insurance ? (
        <ul>
          <li>과속 위험도: {insurance.over_speed_risk ?? '-'}</li>
          <li>급가속/급정지 위험도: {insurance.sudden_accel_risk ?? '-'}</li>
          <li>급회전 위험도: {insurance.sudden_turn_risk ?? '-'}</li>
          <li>야간 주행 위험도: {insurance.night_drive_risk ?? '-'}</li>
          <li>종합 등급: {insurance.overall_grade ?? '-'}</li>
        </ul>
      ) : (
        <p>데이터 없음</p>
      )}
    </div>
  )
}


