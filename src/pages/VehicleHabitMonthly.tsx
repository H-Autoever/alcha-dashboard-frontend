import { useParams, Link, NavLink } from 'react-router-dom'

export default function VehicleHabitMonthlyPage() {
  const { vehicleId } = useParams()
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

      {/* TODO: 습관 분석 내용 추가 예정 */}
    </div>
  )
}