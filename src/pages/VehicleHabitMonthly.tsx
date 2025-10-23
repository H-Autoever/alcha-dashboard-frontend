import { useParams, Link, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../api/client'
import alchaLogo from '../assets/alcha_logo.svg'

interface VehicleDetail {
  vehicle_id: string
  model: string
  year?: number
}

interface DrivingHabitData {
  vehicle_id: string
  analysis_month: string
  acceleration_events: number
  deceleration_events: number
  lane_departure_events: number
  night_drive_ratio: number
  avg_drive_duration_minutes: number
  avg_speed: number
  avg_distance: number
  driving_days: number
  created_at: string
}

interface HabitReport {
  current_month: DrivingHabitData
  previous_month: DrivingHabitData
  improvement_points: string[]
  overall_score: number
}

export default function VehicleHabitMonthlyPage() {
  const { vehicleId } = useParams()
  const [detail, setDetail] = useState<VehicleDetail | null>(null)
  const [habitData, setHabitData] = useState<HabitReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

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

  useEffect(() => {
    if (!vehicleId || !selectedMonth) return

    // 실제 운전 습관 데이터 가져오기
    const fetchHabitData = async () => {
      try {
        // 현재 월 데이터 가져오기
        const currentMonthResponse = await api<DrivingHabitData[]>(`/api/vehicles/${vehicleId}/habit-monthly?month=${selectedMonth}`)
        const currentMonthData = currentMonthResponse[0]

        // 이전 월 데이터 가져오기
        const previousMonth = selectedMonth === '2025-10' ? '2025-09' : '2025-10'
        const previousMonthResponse = await api<DrivingHabitData[]>(`/api/vehicles/${vehicleId}/habit-monthly?month=${previousMonth}`)
        const previousMonthData = previousMonthResponse[0]

        if (currentMonthData && previousMonthData) {
          // 종합 운전 점수 계산 함수 (DB 데이터 기반)
          const calculateOverallScore = (data: DrivingHabitData): number => {
            // 각 지표별 점수 계산 (0-100점)
            const safetyScore = Math.max(0, 100 - (data.acceleration_events * 0.5) - (data.deceleration_events * 0.5) - (data.lane_departure_events * 5))
            const speedScore = Math.min(100, Math.max(0, 100 - Math.abs(data.avg_speed - 60) * 2)) // 60km/h 기준
            const distanceScore = Math.min(100, (data.avg_distance / 50) * 100) // 50km를 100점으로 기준
            
            // 가중 평균 (안전 60%, 속도 25%, 거리 15%)
            const overallScore = Math.round(
              (safetyScore * 0.6) + 
              (speedScore * 0.25) + 
              (distanceScore * 0.15)
            )
            
            return Math.max(0, Math.min(100, overallScore))
          }

          const overallScore = calculateOverallScore(currentMonthData)

          // 개선 포인트 계산
          const improvementPoints = []
          if (currentMonthData.acceleration_events < previousMonthData.acceleration_events) {
            const decrease = ((previousMonthData.acceleration_events - currentMonthData.acceleration_events) / previousMonthData.acceleration_events * 100).toFixed(1)
            improvementPoints.push(`급가속 횟수가 전월 대비 ${decrease}% 감소했습니다`)
          }
          if (currentMonthData.deceleration_events < previousMonthData.deceleration_events) {
            const decrease = ((previousMonthData.deceleration_events - currentMonthData.deceleration_events) / previousMonthData.deceleration_events * 100).toFixed(1)
            improvementPoints.push(`급감속 횟수가 전월 대비 ${decrease}% 감소했습니다`)
          }
          if (currentMonthData.lane_departure_events < previousMonthData.lane_departure_events) {
            const decrease = ((previousMonthData.lane_departure_events - currentMonthData.lane_departure_events) / previousMonthData.lane_departure_events * 100).toFixed(1)
            improvementPoints.push(`차선 이탈 횟수가 전월 대비 ${decrease}% 감소했습니다`)
          }
          if (currentMonthData.driving_days > previousMonthData.driving_days) {
            const increase = ((currentMonthData.driving_days - previousMonthData.driving_days) / previousMonthData.driving_days * 100).toFixed(1)
            improvementPoints.push(`운전 일수가 전월 대비 ${increase}% 증가했습니다`)
          }
          if (currentMonthData.avg_speed > previousMonthData.avg_speed) {
            const increase = ((currentMonthData.avg_speed - previousMonthData.avg_speed) / previousMonthData.avg_speed * 100).toFixed(1)
            improvementPoints.push(`평균 속도가 전월 대비 ${increase}% 향상되었습니다`)
          }

          const habitReport: HabitReport = {
            current_month: currentMonthData,
            previous_month: previousMonthData,
            improvement_points: improvementPoints.length > 0 ? improvementPoints : ['이번 달에는 특별한 개선사항이 없습니다'],
            overall_score: overallScore
          }

          setHabitData(habitReport)
        }
      } catch (error) {
        console.error('Error fetching habit data:', error)
        setHabitData(null)
      }
    }

    fetchHabitData()
  }, [vehicleId, selectedMonth])

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
          차량 상태 평가 
        </NavLink>
        <NavLink 
          to={`/vehicle/${vehicleId}/habitmonthly`} 
          className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
          style={{ textDecoration: 'none', fontSize: '50px !important' }}
        >
          운전자 습관 분석
        </NavLink>
      </div>
      

      {/* 월 선택기 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16
        }}>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#e5e7eb', marginRight: 8, fontWeight: 'bold' }}>월 선택:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              backgroundColor: 'rgba(17,24,39,0.5)',
              border: '1px solid #374151',
              borderRadius: '6px',
              padding: '4px 8px',
              color: '#e5e7eb',
              fontSize: '14px',
              colorScheme: 'dark'
            }}
          />
        </div>
      </div>

      {/* 운전자 습관 분석 레포트 */}
      {habitData ? (
        <div style={{ marginBottom: 16 }}>
          {/* 레포트 헤더 + 종합 점수 통합 */}
          <div style={{
            backgroundColor: 'rgba(17,24,39,0.5)',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '0px 4px',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            {/* 헤더 부분 */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 0,
              gap: '0px',
              paddingTop: '8px',
              paddingBottom: '8px',
              height: '60px',
              overflow: 'hidden'
            }}>
              <img 
                src={alchaLogo} 
                alt="Alcha Logo" 
                style={{ 
                  width: '120px', 
                  height: '120px',
                  filter: 'brightness(0) invert(1)' // 로고를 흰색으로 변경
                }} 
              />
              <h2 style={{ color: '#e5e7eb', margin: 0 }}>
                {detail.vehicle_id}님의 {selectedMonth.split('-')[1]}월 운전 레포트
              </h2>
            </div>

            {/* 구분선 */}
            <div style={{
              borderTop: '1px solid #374151',
              margin: '5px 0'
            }}></div>

            {/* 종합 점수 부분 */}
            <div style={{
              padding: '0px 0'
            }}>
              <h3 style={{ color: '#e5e7eb', marginBottom: 5, fontSize: '18px' }}> 종합 운전 점수</h3>
              <div style={{ 
                fontSize: '35px', 
                fontWeight: 'bold', 
                color: habitData.overall_score >= 80 ? '#22c55e' : 
                       habitData.overall_score >= 60 ? '#f97316' : '#ef4444',
                marginBottom: 10
              }}>
                {habitData.overall_score}점
              </div>
              <p style={{ color: '#9ca3af', margin: '0 0 12px 0', fontSize: '14px' }}>
                {habitData.overall_score >= 80 ? '우수한 운전 습관을 보이고 있습니다' :
                 habitData.overall_score >= 60 ? '양호한 운전 습관입니다' : 
                 '운전 습관 개선이 필요합니다'}
              </p>
            </div>
          </div>


          {/* 상세 분석 섹션 */}
          <div style={{
            backgroundColor: 'rgba(17,24,39,0.5)',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: 24
          }}>
            
            {/* 안전 운전 지표 */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: '2px solid rgba(59,130,246,0.3)'
              }}>
                <div style={{ 
                  width: '4px', 
                  height: '24px', 
                  backgroundColor: '#ef4444', 
                  marginRight: 12,
                  borderRadius: '2px'
                }}></div>
                <h3 style={{ color: '#e5e7eb', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                  안전 운전 지표 분석
                </h3>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '20px' 
              }}>
                {[
                  { 
                    label: '급가속', 
      
                    value: habitData.current_month.acceleration_events, 
                    unit: '회',
                    score: Math.max(0, 100 - habitData.current_month.acceleration_events * 0.8),
                    color: habitData.current_month.acceleration_events > 50 ? '#ef4444' : habitData.current_month.acceleration_events > 30 ? '#f59e0b' : '#10b981'
                  },
                  { 
                    label: '급감속', 
                    value: habitData.current_month.deceleration_events, 
                    unit: '회',
                    score: Math.max(0, 100 - habitData.current_month.deceleration_events * 2),
                    color: habitData.current_month.deceleration_events > 10 ? '#ef4444' : habitData.current_month.deceleration_events > 5 ? '#f59e0b' : '#10b981'
                  },
                  { 
                    label: '차선 이탈', 
                    value: habitData.current_month.lane_departure_events, 
                    unit: '회',
                    score: Math.max(0, 100 - habitData.current_month.lane_departure_events * 5),
                    color: habitData.current_month.lane_departure_events > 10 ? '#ef4444' : habitData.current_month.lane_departure_events > 5 ? '#f59e0b' : '#10b981'
                  }
                ].map((item, index) => (
                  <div key={index} style={{ 
                    backgroundColor: 'rgba(31,41,55,0.8)', 
                    padding: '20px', 
                    borderRadius: '12px',
                    border: `1px solid ${item.color}20`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      backgroundColor: item.color
                    }}></div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: 12
                    }}>
                      <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
                        {item.label}
                      </div>
                      <div style={{ 
                        color: item.color, 
                        fontSize: '12px', 
                        fontWeight: '600',
                        backgroundColor: `${item.color}20`,
                        padding: '4px 8px',
                        borderRadius: '12px'
                      }}>
                        {item.score.toFixed(0)}점
                      </div>
                    </div>
                    
                    <div style={{ 
                      color: '#ffffff', 
                      fontSize: '28px', 
                      fontWeight: 'bold',
                      marginBottom: 8
                    }}>
                      {item.value}{item.unit}
                    </div>
                    
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6b7280',
                      lineHeight: '1.4'
                    }}>
                      {item.label === '급가속' && '급격한 가속으로 인한 연비 저하 및 안전 위험'}
                      {item.label === '급감속' && '급격한 감속으로 인한 브레이크 마모'}
                      {item.label === '차선 이탈' && '차선 이탈로 인한 교통사고 위험성 증가'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 주행 패턴 */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: '2px solid rgba(59,130,246,0.3)'
              }}>
                <div style={{ 
                  width: '4px', 
                  height: '24px', 
                  backgroundColor: '#3b82f6', 
                  marginRight: 12,
                  borderRadius: '2px'
                }}></div>
                <h3 style={{ color: '#e5e7eb', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                  주행 패턴 분석
                </h3>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '20px' 
              }}>
                {[
                  { 
                    label: '운전 일수', 
                    value: habitData.current_month.driving_days, 
                    unit: '일',
                    icon: '📅',
                    description: '이번 달 총 운전한 날짜 수',
                    color: '#10b981'
                  },
                  { 
                    label: '야간 주행 비율', 
                    value: (habitData.current_month.night_drive_ratio * 100).toFixed(1), 
                    unit: '%',
                    icon: '🌙',
                    description: '야간 시간대 운전 비율',
                    color: habitData.current_month.night_drive_ratio > 0.3 ? '#f59e0b' : '#10b981'
                  },
                  { 
                    label: '평균 주행 시간', 
                    value: habitData.current_month.avg_drive_duration_minutes.toFixed(1), 
                    unit: '분',
                    icon: '⏱️',
                    description: '1회 운전당 평균 시간',
                    color: '#3b82f6'
                  },
                  { 
                    label: '평균 속도', 
                    value: habitData.current_month.avg_speed.toFixed(1), 
                    unit: 'km/h',
                    icon: '🚗',
                    description: '평균 주행 속도',
                    color: '#8b5cf6'
                  },
                  { 
                    label: '평균 주행 거리', 
                    value: habitData.current_month.avg_distance.toFixed(1), 
                    unit: 'km',
                    icon: '🛣️',
                    description: '1회 운전당 평균 거리',
                    color: '#06b6d4'
                  },
                  { 
                    label: '연비 효율성', 
                    value: ((habitData.current_month.avg_speed / (habitData.current_month.acceleration_events + habitData.current_month.deceleration_events + 1)) * 10).toFixed(1), 
                    unit: '점',
                    icon: '🌱',
                    description: '안전한 운전으로 얻는 연비 효율 지수 (100점 만점)',
                    color: '#10b981'
                  }
                ].map((item, index) => (
                  <div key={index} style={{ 
                    backgroundColor: 'rgba(31,41,55,0.8)', 
                    padding: '14px', 
                    borderRadius: '12px',
                    border: `1px solid ${item.color}20`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      backgroundColor: item.color
                    }}></div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      marginBottom: 12
                    }}>
                      <div style={{ 
                        fontSize: '20px', 
                        marginRight: 10,
                        opacity: 0.8
                      }}>
                        {item.icon}
                      </div>
                      <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: '500' }}>
                        {item.label}
                      </div>
                    </div>
                    
                    <div style={{ 
                      color: '#ffffff', 
                      fontSize: '28px', 
                      fontWeight: 'bold',
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'baseline'
                    }}>
                      <span style={{ color: item.color }}>{item.value}</span>
                      <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: 4 }}>{item.unit}</span>
                    </div>
                    
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#ffffff',
                      lineHeight: '1.3'
                    }}>
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 월별 비교 분석 */}
          <div style={{
            backgroundColor: 'rgba(17,24,39,0.5)',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: 24
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: '2px solid rgba(59,130,246,0.3)'
            }}>
              <div style={{ 
                width: '4px', 
                height: '24px', 
                backgroundColor: '#8b5cf6', 
                marginRight: 12,
                borderRadius: '2px'
              }}></div>
              <h3 style={{ color: '#e5e7eb', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                전월 대비 변화 분석
              </h3>
            </div>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px' 
            }}>
              {[
                { 
                  label: '급가속 횟수', 
                  current: habitData.current_month.acceleration_events, 
                  previous: habitData.previous_month.acceleration_events,
                  unit: '회'
                },
                { 
                  label: '급감속 횟수', 
                  current: habitData.current_month.deceleration_events, 
                  previous: habitData.previous_month.deceleration_events,
                  unit: '회'
                },
                { 
                  label: '차선 이탈 횟수', 
                  current: habitData.current_month.lane_departure_events, 
                  previous: habitData.previous_month.lane_departure_events,
                  unit: '회'
                },
                { 
                  label: '운전 일수', 
                  current: habitData.current_month.driving_days, 
                  previous: habitData.previous_month.driving_days,
                  unit: '일'
                },
                { 
                  label: '야간 주행 비율', 
                  current: habitData.current_month.night_drive_ratio * 100, 
                  previous: habitData.previous_month.night_drive_ratio * 100,
                  unit: '%'
                },
                { 
                  label: '평균 주행 시간', 
                  current: habitData.current_month.avg_drive_duration_minutes, 
                  previous: habitData.previous_month.avg_drive_duration_minutes,
                  unit: '분'
                },
                { 
                  label: '평균 속도', 
                  current: habitData.current_month.avg_speed, 
                  previous: habitData.previous_month.avg_speed,
                  unit: 'km/h'
                },
                { 
                  label: '평균 주행 거리', 
                  current: habitData.current_month.avg_distance, 
                  previous: habitData.previous_month.avg_distance,
                  unit: 'km'
                },
                { 
                  label: '연비 효율성', 
                  current: (habitData.current_month.avg_speed / (habitData.current_month.acceleration_events + habitData.current_month.deceleration_events + 1)) * 10, 
                  previous: (habitData.previous_month.avg_speed / (habitData.previous_month.acceleration_events + habitData.previous_month.deceleration_events + 1)) * 10,
                  unit: '점'
                }
              ].map((item, index) => {
                const change = item.current - item.previous
                const changePercent = ((item.current - item.previous) / item.previous * 100)
                const isImprovement = item.label.includes('급') || item.label.includes('차선') ? 
                  change < 0 : change > 0
                
                const changeColor = isImprovement ? '#10b981' : '#ef4444'
                const changeText = change > 0 ? '증가' : change < 0 ? '감소' : '변화없음'
                const improvementText = isImprovement ? '개선' : '악화'
                
                return (
                  <div key={index} style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(31,41,55,0.6)',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${changeColor}`
                  }}>
                    <div style={{ 
                      color: '#e5e7eb', 
                      fontSize: '16px',
                      lineHeight: '1.5',
                      flex: 1
                    }}>
                      <strong>{item.label}</strong>{item.label.includes('야간', '연비') ? '이' : '가'} 저번달 <strong>{item.previous.toFixed(2)}{item.unit}</strong>보다 <strong style={{ color: changeColor }}>{Math.abs(change).toFixed(2)}{item.label.includes('야간') ? '%' : item.unit} {changeText}</strong>하여 <strong style={{ color: changeColor }}>{improvementText}</strong>되었습니다.
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 개선 권장사항 */}
          <div style={{
            backgroundColor: 'rgba(17,24,39,0.5)',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ color: '#e5e7eb', marginBottom: 16 }}>💡 개선 권장사항</h3>
            <div style={{ color: '#e5e7eb', lineHeight: '1.6' }}>
              <p style={{ marginBottom: 12 }}>
                • <strong>안전 운전:</strong> 급가속과 급감속을 줄이고 차선 유지를 더욱 신경 쓰세요.
              </p>
              <p style={{ marginBottom: 12 }}>
                • <strong>주행 패턴:</strong> 야간 주행을 줄이고 충분한 휴식을 취하세요.
              </p>
              <p style={{ marginBottom: 12 }}>
                • <strong>속도 관리:</strong> 적절한 속도를 유지하여 안전하고 효율적인 운전을 하세요.
              </p>
              <p style={{ margin: 0 }}>
                • <strong>정기 점검:</strong> 차량 상태를 정기적으로 점검하여 안전한 운전을 유지하세요.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'rgba(17,24,39,0.5)',
          border: '1px solid #374151',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          color: '#9ca3af'
        }}>
          선택한 월의 운전 습관 데이터가 없습니다.
        </div>
      )}
    </div>
  )
}