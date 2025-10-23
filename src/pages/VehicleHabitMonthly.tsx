import { useParams, Link, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface VehicleDetail {
  vehicle_id: string
  model: string
  year?: number
}

export default function VehicleHabitMonthlyPage() {
  const { vehicleId } = useParams()
  const [detail, setDetail] = useState<VehicleDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vehicleId) return

    // 차량 기본 정보 가져오기
    api<VehicleDetail>(`/api/vehicles/${vehicleId}`)
      .then(data => {
        setDetail(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching vehicle detail:', error)
        setLoading(false)
      })
  }, [vehicleId])

  if (loading) {
    return <div>로딩 중...</div>
  }

  if (!detail) {
    return <div>차량 정보를 찾을 수 없습니다.</div>
  }

  return (
    <div>
      <p><Link className="link" to="/">← 차량 목록으로</Link></p>

      {/* 탭 네비게이션 */}
      <div className="tab-group tab-group--large" style={{ fontSize: '50px' }}>
        <NavLink 
          to={`/vehicle/${vehicleId}`} 
          end 
          className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
          style={{ textDecoration: 'none', fontSize: '50px !important' }}
        >
          차량 상세 정보
        </NavLink>
        <NavLink 
          to={`/vehicle/${vehicleId}/score`} 
          className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
          style={{ textDecoration: 'none', fontSize: '50px !important' }}
        >
          차량 평가 점수
        </NavLink>
        <NavLink 
          to={`/vehicle/${vehicleId}/habitmonthly`} 
          className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
          style={{ textDecoration: 'none', fontSize: '50px !important' }}
        >
          운전자 습관 분석
        </NavLink>
      </div>
      
      {/* 차량 기본 정보 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16 
        }}>
          <h3 style={{ margin: 0 }}>기본 정보</h3>
        </div>
        
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            backgroundColor: 'rgba(17,24,39,0.5)', 
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ color: '#e5e7eb', fontSize: '15px' }}>
              <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>차량 ID:</span> <span style={{ color: '#9ca3af' }}>{detail.vehicle_id}</span>
            </div>
            <div style={{ color: '#374151', fontSize: '20px' }}>|</div>
            <div style={{ color: '#e5e7eb', fontSize: '15px' }}>
              <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>모델:</span> <span style={{ color: '#9ca3af' }}>{detail.model}</span>
            </div>
            <div style={{ color: '#374151', fontSize: '20px' }}>|</div>
            <div style={{ color: '#e5e7eb', fontSize: '15px' }}>
              <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>연식:</span> <span style={{ color: '#9ca3af' }}>{detail.year ?? '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TODO: 습관 분석 내용 추가 예정 */}
    </div>
  )
}