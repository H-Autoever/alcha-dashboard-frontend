import { useParams, Link, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface VehicleDetail {
  vehicle_id: string
  model: string
  year?: number
}

interface ScoreData {
  vehicle_id: string
  analysis_date: string
  scores: {
    final_score: number
    engine_powertrain_score: number
    transmission_drivetrain_score: number
    brake_suspension_score: number
    adas_safety_score: number
    electrical_battery_score: number
    other_score: number
  }
  metrics: {
    engine_rpm_avg: number
    engine_coolant_temp_avg: number
    transmission_oil_temp_avg: number
    battery_voltage_avg: number
    alternator_output_avg: number
    temperature_ambient_avg: number
    dtc_count: number
    gear_change_count: number
    abs_activation_count: number
    suspension_shock_count: number
    adas_sensor_fault_count: number
    aeb_activation_count: number
    engine_start_count: number
    suddenacc_count: number
  }
}

export default function VehicleScorePage() {
  const { vehicleId } = useParams()
  const [detail, setDetail] = useState<VehicleDetail | null>(null)
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  // 어제 날짜를 기본값으로 설정
  const getYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0] // YYYY-MM-DD 형식
  }
  
  const [selectedDate, setSelectedDate] = useState(getYesterday())
  
  // 아코디언 상태 관리
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({})
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  // 점수 데이터 가져오기
  const fetchScoreData = async (date: string) => {
    if (!vehicleId) return
    
    try {
      const data = await api<ScoreData>(`/api/vehicles/${vehicleId}/score/${date}`)
      setScoreData(data)
    } catch (error) {
      console.error('Error fetching score data:', error)
      setScoreData(null)
    }
  }

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

  // 선택된 날짜가 변경될 때 점수 데이터 가져오기
  useEffect(() => {
    if (selectedDate) {
      fetchScoreData(selectedDate)
    }
  }, [selectedDate, vehicleId])

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
      
      {/* 차량 기본 정보와 최종 점수 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 8 
        }}>
          <h3 style={{ margin: 0 }}>기본 정보</h3>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '16px',
          marginBottom: 8
        }}>
          {/* 기본 정보 (왼쪽) */}
          <div style={{ 
            backgroundColor: 'rgba(17,24,39,0.5)', 
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            height:'12px'
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

          {/* 최종 점수 (오른쪽) */}
          <div style={{ position: 'relative' }}>
            <h3 style={{ 
              margin: 0, 
              position: 'absolute', 
              top: '-32px', 
              left: '0px',
              fontSize: '19px',
              color: '#e5e7eb'
            }}>최종 점수</h3>
            <div style={{ 
              backgroundColor: 'rgba(17,24,39,0.5)', 
              border: '1px solid #374151',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '12px'
            }}>
              {scoreData ? (
                <div style={{ color: '#60a5fa', fontSize: '28px', fontWeight: 'bold' }}>
                  {scoreData.scores.final_score}
                </div>
              ) : (
                <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                  점수 데이터 없음
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 날짜 선택기 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 8 
        }}>
        </div>
        
        <div style={{ marginBottom: 8 }}>
          <label style={{ color: '#e5e7eb', marginRight: 8, fontWeight: 'bold' }}>날짜 검색:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              backgroundColor: 'rgba(17,24,39,0.5)',
              border: '1px solid #374151',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#e5e7eb',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* 점수 데이터 표시 */}
      {scoreData ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ 
            backgroundColor: 'rgba(17,24,39,0.5)', 
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '16px',
            paddingTop: '0px',
            marginBottom: 8
          }}>
            <h4 style={{ color: '#e5e7eb', marginBottom: 12}}>
              📊 {scoreData.analysis_date} 점수
            </h4>
            
            {/* 7개 점수 카테고리 가로 표시 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '12px',
              marginBottom: 20
            }}>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '8px' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: 4 }}>종합</div>
                <div style={{ color: '#60a5fa', fontSize: '18px', fontWeight: 'bold' }}>
                  {scoreData.scores.final_score}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '8px' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: 4 }}>엔진</div>
                <div style={{ color: '#60a5fa', fontSize: '18px', fontWeight: 'bold' }}>
                  {scoreData.scores.engine_powertrain_score}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '8px' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: 4 }}>변속</div>
                <div style={{ color: '#60a5fa', fontSize: '18px', fontWeight: 'bold' }}>
                  {scoreData.scores.transmission_drivetrain_score}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '8px' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: 4 }}>브레이크</div>
                <div style={{ color: '#60a5fa', fontSize: '18px', fontWeight: 'bold' }}>
                  {scoreData.scores.brake_suspension_score}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '8px' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: 4 }}>ADAS</div>
                <div style={{ color: '#60a5fa', fontSize: '18px', fontWeight: 'bold' }}>
                  {scoreData.scores.adas_safety_score}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '8px' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: 4 }}>전기</div>
                <div style={{ color: '#60a5fa', fontSize: '18px', fontWeight: 'bold' }}>
                  {scoreData.scores.electrical_battery_score}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '8px' }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: 4 }}>기타</div>
                <div style={{ color: '#60a5fa', fontSize: '18px', fontWeight: 'bold' }}>
                  {scoreData.scores.other_score}
                </div>
              </div>
            </div>
            
            {/* 평가 지표 제목 */}
            <div style={{ marginTop: 16, marginBottom: 8 }}>
              <h4 style={{ color: '#e5e7eb', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                📊 평가 지표
              </h4>
            </div>
            
            {/* 측정 지표 아코디언 */}
            <div>
              {/* 엔진/파워트레인 */}
              <div style={{ marginBottom: 8 }}>
                <div 
                  style={{ 
                    backgroundColor: 'rgba(17,24,39,0.3)', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => toggleCategory('engine')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{expandedCategories.engine ? '▼' : '▶'}</span>
                    <span style={{ color: '#e5e7eb', fontSize: '14px' }}>
                      🔧 엔진/파워트레인 - {scoreData.scores.engine_powertrain_score}점
                    </span>
                  </div>
                </div>
                {expandedCategories.engine && (
                  <div style={{ 
                    backgroundColor: 'rgba(17,24,39,0.2)', 
                    border: '1px solid #374151',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    padding: '12px',
                    marginTop: '-1px'
                  }}>
                    <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.6' }}>
                      • 엔진 RPM 평균: {scoreData.metrics.engine_rpm_avg?.toLocaleString() || '-'} rpm<br/>
                      • 냉각수 온도: {scoreData.metrics.engine_coolant_temp_avg || '-'}°C<br/>
                      • DTC 오류 수: {scoreData.metrics.dtc_count || 0}개
                    </div>
                  </div>
                )}
              </div>

              {/* 변속/구동계 */}
              <div style={{ marginBottom: 8 }}>
                <div 
                  style={{ 
                    backgroundColor: 'rgba(17,24,39,0.3)', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => toggleCategory('transmission')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{expandedCategories.transmission ? '▼' : '▶'}</span>
                    <span style={{ color: '#e5e7eb', fontSize: '14px' }}>
                      ⚙️ 변속/구동계 -{scoreData.scores.transmission_drivetrain_score}점
                    </span>
                  </div>
                </div>
                {expandedCategories.transmission && (
                  <div style={{ 
                    backgroundColor: 'rgba(17,24,39,0.2)', 
                    border: '1px solid #374151',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    padding: '12px',
                    marginTop: '-1px'
                  }}>
                    <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.6' }}>
                      • 변속기 오일 온도: {scoreData.metrics.transmission_oil_temp_avg || '-'}°C<br/>
                      • 기어 변경 횟수: {scoreData.metrics.gear_change_count || 0}회
                    </div>
                  </div>
                )}
              </div>

              {/* 브레이크/서스펜션 */}
              <div style={{ marginBottom: 8 }}>
                <div 
                  style={{ 
                    backgroundColor: 'rgba(17,24,39,0.3)', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => toggleCategory('brake')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{expandedCategories.brake ? '▼' : '▶'}</span>
                    <span style={{ color: '#e5e7eb', fontSize: '14px' }}>
                      🛑 브레이크/서스펜션 - {scoreData.scores.brake_suspension_score}점
                    </span>
                  </div>
                </div>
                {expandedCategories.brake && (
                  <div style={{ 
                    backgroundColor: 'rgba(17,24,39,0.2)', 
                    border: '1px solid #374151',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    padding: '12px',
                    marginTop: '-1px'
                  }}>
                    <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.6' }}>
                      • ABS 작동 횟수: {scoreData.metrics.abs_activation_count || 0}회<br/>
                      • 서스펜션 충격 횟수: {scoreData.metrics.suspension_shock_count || 0}회
                    </div>
                  </div>
                )}
              </div>

              {/* ADAS/안전 */}
              <div style={{ marginBottom: 8 }}>
                <div 
                  style={{ 
                    backgroundColor: 'rgba(17,24,39,0.3)', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => toggleCategory('adas')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{expandedCategories.adas ? '▼' : '▶'}</span>
                    <span style={{ color: '#e5e7eb', fontSize: '14px'}}>
                      🛡️ ADAS/안전 - {scoreData.scores.adas_safety_score}점
                    </span>
                  </div>
                </div>
                {expandedCategories.adas && (
                  <div style={{ 
                    backgroundColor: 'rgba(17,24,39,0.2)', 
                    border: '1px solid #374151',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    padding: '12px',
                    marginTop: '-1px'
                  }}>
                    <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.6' }}>
                      • ADAS 센서 오류: {scoreData.metrics.adas_sensor_fault_count || 0}개<br/>
                      • AEB 작동 횟수: {scoreData.metrics.aeb_activation_count || 0}회
                    </div>
                  </div>
                )}
              </div>

              {/* 전기/배터리 */}
              <div style={{ marginBottom: 8 }}>
                <div 
                  style={{ 
                    backgroundColor: 'rgba(17,24,39,0.3)', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => toggleCategory('electrical')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{expandedCategories.electrical ? '▼' : '▶'}</span>
                    <span style={{ color: '#e5e7eb', fontSize: '14px' }}>
                      🔋 전기/배터리 - {scoreData.scores.electrical_battery_score}점
                    </span>
                  </div>
                </div>
                {expandedCategories.electrical && (
                  <div style={{ 
                    backgroundColor: 'rgba(17,24,39,0.2)', 
                    border: '1px solid #374151',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    padding: '12px',
                    marginTop: '-1px'
                  }}>
                    <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.6' }}>
                      • 배터리 전압: {scoreData.metrics.battery_voltage_avg || '-'}V<br/>
                      • 알터네이터 출력: {scoreData.metrics.alternator_output_avg || '-'}V<br/>
                      • 엔진 시동 횟수: {scoreData.metrics.engine_start_count || 0}회
                    </div>
                  </div>
                )}
              </div>

              {/* 기타 */}
              <div style={{ marginBottom: 8 }}>
                <div 
                  style={{ 
                    backgroundColor: 'rgba(17,24,39,0.3)', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => toggleCategory('other')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{expandedCategories.other ? '▼' : '▶'}</span>
                    <span style={{ color: '#e5e7eb', fontSize: '14px'}}>
                      📊 기타 - {scoreData.scores.other_score}점
                    </span>
                  </div>
                </div>
                {expandedCategories.other && (
                  <div style={{ 
                    backgroundColor: 'rgba(17,24,39,0.2)', 
                    border: '1px solid #374151',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    padding: '12px',
                    marginTop: '-1px'
                  }}>
                    <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.6' }}>
                      • 급가속 횟수: {scoreData.metrics.suddenacc_count || 0}회<br/>
                      • 주변 온도: {scoreData.metrics.temperature_ambient_avg || '-'}°C
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ 
          backgroundColor: 'rgba(17,24,39,0.5)', 
          border: '1px solid #374151',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          color: '#9ca3af'
        }}>
          선택한 날짜의 점수 데이터가 없습니다.
        </div>
      )}
    </div>
  )
}
