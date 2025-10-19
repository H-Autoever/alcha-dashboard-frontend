import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import { Table, Alert, Loader } from '../components/UI'

type DailyData = {
  analysis_date: string | null
  total_distance: number | null
  average_speed: number | null
  fuel_efficiency: number | null
}

type VehicleDetail = {
  vehicle_id: string
  model: string
  year: number | null
  daily_data: DailyData[]
}

type EngineOffEvent = {
  vehicle_id: string
  speed: number
  gear_status: string
  gyro: number
  side: string
  ignition: boolean
  timestamp: string
}

type CollisionEvent = {
  vehicle_id: string
  damage: number
  timestamp: string
}

type EventData = {
  engine_off_events: EngineOffEvent[]
  collision_events: CollisionEvent[]
}

export default function VehicleDetailPage() {
  const { vehicleId } = useParams()
  const [detail, setDetail] = useState<VehicleDetail | null>(null)
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vehicleId) return
    setLoading(true)
    
    // 차량 상세 정보와 이벤트 데이터를 병렬로 로드
    Promise.all([
      api<VehicleDetail>(`/api/vehicles/${encodeURIComponent(vehicleId)}`),
      api<EventData>(`/api/events/${encodeURIComponent(vehicleId)}`)
    ])
      .then(([vehicleDetail, events]) => {
        setDetail(vehicleDetail)
        setEventData(events)
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [vehicleId])

  if (error) return <Alert>{error}</Alert>
  if (loading) return <Loader />
  if (!detail) return <Alert>차량 정보를 찾을 수 없습니다.</Alert>

  return (
    <div>
      <p><Link className="link" to="/">← 대시보드</Link></p>
      <div className="page-title">
        <h1>차량 상세 정보</h1>
        <span className="badge">기본정보</span>
      </div>
      
      {/* 차량 기본 정보 */}
      <div className="cards" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="stat-label">차량 ID</div>
          <div className="stat-value">{detail.vehicle_id}</div>
        </div>
        <div className="card">
          <div className="stat-label">모델</div>
          <div className="stat-value">{detail.model}</div>
        </div>
        <div className="card">
          <div className="stat-label">연식</div>
          <div className="stat-value">{detail.year ?? '-'}</div>
        </div>
      </div>

      {/* 날짜별 데이터 테이블 */}
      <h3>날짜별 상세 데이터</h3>
      <Table headers={["분석 날짜", "총 주행거리 (km)", "평균 속도 (km/h)", "연비 (km/L)"]}>
        {detail.daily_data.map((data, index) => (
          <tr key={index}>
            <td>{data.analysis_date ? new Date(data.analysis_date).toLocaleDateString('ko-KR') : '-'}</td>
            <td>{data.total_distance ? data.total_distance.toLocaleString() : '-'}</td>
            <td>{data.average_speed ? data.average_speed.toFixed(1) : '-'}</td>
            <td>{data.fuel_efficiency ? data.fuel_efficiency.toFixed(1) : '-'}</td>
          </tr>
        ))}
      </Table>

      {/* 이벤트 그래프 섹션 */}
      <h3>이벤트 타임라인</h3>
      {eventData && (
        <div style={{ marginTop: 16 }}>
          <EventTimeline 
            dailyData={detail.daily_data}
            engineOffEvents={eventData.engine_off_events}
            collisionEvents={eventData.collision_events}
          />
        </div>
      )}
    </div>
  )
}

// 이벤트 타임라인 컴포넌트 (개선된 막대 그래프)
function EventTimeline({ 
  dailyData, 
  engineOffEvents, 
  collisionEvents 
}: { 
  dailyData: DailyData[]
  engineOffEvents: EngineOffEvent[]
  collisionEvents: CollisionEvent[]
}) {
  // 날짜 범위 계산
  const dates = dailyData.map(d => new Date(d.analysis_date!)).sort((a, b) => a.getTime() - b.getTime())
  const startDate = dates[0]
  const endDate = dates[dates.length - 1]
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // 날짜별 이벤트 개수 계산
  const eventsByDate: { [key: string]: { collision: number, engineOff: number } } = {}
  
  // 초기화
  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    const dateStr = currentDate.toISOString().split('T')[0]
    eventsByDate[dateStr] = { collision: 0, engineOff: 0 }
  }
  
  // 충돌 이벤트 카운트
  collisionEvents.forEach(event => {
    const date = new Date(event.timestamp).toISOString().split('T')[0]
    if (eventsByDate[date]) {
      eventsByDate[date].collision++
    }
  })
  
  // 엔진 오프 이벤트 카운트
  engineOffEvents.forEach(event => {
    const date = new Date(event.timestamp).toISOString().split('T')[0]
    if (eventsByDate[date]) {
      eventsByDate[date].engineOff++
    }
  })

  // 차트 설정
  const chartHeight = 280
  const chartWidth = Math.max(800, totalDays * 100)
  const margin = { top: 30, right: 40, bottom: 60, left: 80 }
  const maxEvents = Math.max(
    ...Object.values(eventsByDate).map(d => d.collision + d.engineOff),
    1
  )

  // 스케일 함수
  const xScale = (dayIndex: number) => margin.left + (dayIndex * (chartWidth - margin.left - margin.right) / (totalDays - 1))
  const yScale = (count: number) => chartHeight - margin.bottom - (count * (chartHeight - margin.top - margin.bottom) / maxEvents)
  const barWidth = (chartWidth - margin.left - margin.right) / totalDays * 0.6

  return (
    <div style={{ 
      border: '1px solid #374151', 
      borderRadius: 12, 
      padding: 24, 
      backgroundColor: '#1f2937',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }}>
      {/* 제목과 범례 */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ 
          color: '#f9fafb', 
          fontSize: 18, 
          fontWeight: 600, 
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          📊 이벤트 타임라인
          <span style={{ 
            fontSize: 12, 
            backgroundColor: '#374151', 
            color: '#9ca3af', 
            padding: '4px 8px', 
            borderRadius: 6 
          }}>
            {collisionEvents.length + engineOffEvents.length}개 이벤트
          </span>
        </h3>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ 
              width: 16, 
              height: 16, 
              backgroundColor: '#ef4444', 
              borderRadius: 4,
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
            }}></div>
            <span style={{ color: '#f9fafb', fontSize: 14, fontWeight: 500 }}>
              충돌 이벤트 ({collisionEvents.length}개)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ 
              width: 16, 
              height: 16, 
              backgroundColor: '#f59e0b', 
              borderRadius: 4,
              boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
            }}></div>
            <span style={{ color: '#f9fafb', fontSize: 14, fontWeight: 500 }}>
              엔진 오프 이벤트 ({engineOffEvents.length}개)
            </span>
          </div>
        </div>
      </div>
      
      {/* 막대 그래프 차트 */}
      <div style={{ 
        border: '1px solid #374151',
        borderRadius: 8,
        backgroundColor: '#111827',
        padding: 20,
        overflow: 'auto',
        position: 'relative'
      }}>
        <svg width={chartWidth} height={chartHeight} style={{ minWidth: '100%' }}>
          {/* 그리드 배경 */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Y축 라벨 */}
          <text x={margin.left - 10} y={chartHeight - margin.bottom + 5} fontSize="12" fill="#9ca3af" textAnchor="end">
            이벤트 수
          </text>
          
          {/* Y축 눈금과 라벨 */}
          {Array.from({ length: maxEvents + 1 }, (_, i) => {
            const y = yScale(i)
            return (
              <g key={i}>
                <line 
                  x1={margin.left - 5} 
                  y1={y} 
                  x2={margin.left} 
                  y2={y} 
                  stroke="#4b5563" 
                  strokeWidth="1"
                />
                <text 
                  x={margin.left - 10} 
                  y={y + 4} 
                  fontSize="11" 
                  fill="#6b7280" 
                  textAnchor="end"
                >
                  {i}
                </text>
                <line 
                  x1={margin.left} 
                  y1={y} 
                  x2={chartWidth - margin.right} 
                  y2={y} 
                  stroke="#374151" 
                  strokeWidth="0.5"
                  opacity="0.5"
                />
              </g>
            )
          })}
          
          {/* X축 라인 */}
          <line 
            x1={margin.left} 
            y1={chartHeight - margin.bottom} 
            x2={chartWidth - margin.right} 
            y2={chartHeight - margin.bottom} 
            stroke="#4b5563" 
            strokeWidth="2"
          />
          
          {/* Y축 라인 */}
          <line 
            x1={margin.left} 
            y1={margin.top} 
            x2={margin.left} 
            y2={chartHeight - margin.bottom} 
            stroke="#4b5563" 
            strokeWidth="2"
          />
          
          {/* 막대 그래프 */}
          {Array.from({ length: totalDays }, (_, i) => {
            const currentDate = new Date(startDate)
            currentDate.setDate(startDate.getDate() + i)
            const dateStr = currentDate.toISOString().split('T')[0]
            const dayEvents = eventsByDate[dateStr] || { collision: 0, engineOff: 0 }
            const x = xScale(i) - barWidth / 2
            
            return (
              <g key={i}>
                {/* 충돌 이벤트 막대 */}
                {dayEvents.collision > 0 && (
                  <rect
                    x={x}
                    y={yScale(dayEvents.collision)}
                    width={barWidth / 2}
                    height={chartHeight - margin.bottom - yScale(dayEvents.collision)}
                    fill="#ef4444"
                    rx="2"
                    style={{ 
                      cursor: 'pointer',
                      filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))'
                    }}
                  >
                    <title>
                      충돌 이벤트: {dayEvents.collision}개
                    </title>
                  </rect>
                )}
                
                {/* 엔진 오프 이벤트 막대 */}
                {dayEvents.engineOff > 0 && (
                  <rect
                    x={x + barWidth / 2}
                    y={yScale(dayEvents.engineOff)}
                    width={barWidth / 2}
                    height={chartHeight - margin.bottom - yScale(dayEvents.engineOff)}
                    fill="#f59e0b"
                    rx="2"
                    style={{ 
                      cursor: 'pointer',
                      filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))'
                    }}
                  >
                    <title>
                      엔진 오프 이벤트: {dayEvents.engineOff}개
                    </title>
                  </rect>
                )}
                
                {/* 날짜 라벨 */}
                <text 
                  x={xScale(i)} 
                  y={chartHeight - margin.bottom + 20} 
                  fontSize="11" 
                  fill="#9ca3af" 
                  textAnchor="middle"
                >
                  {currentDate.getDate()}
                </text>
                <text 
                  x={xScale(i)} 
                  y={chartHeight - margin.bottom + 35} 
                  fontSize="10" 
                  fill="#6b7280" 
                  textAnchor="middle"
                >
                  {currentDate.toLocaleDateString('ko-KR', { month: 'short' })}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      
      {/* 이벤트 상세 정보 */}
      <div style={{ marginTop: 24 }}>
        <h4 style={{ 
          marginBottom: 16, 
          fontSize: 16, 
          fontWeight: 600, 
          color: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          📋 이벤트 상세 정보
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...collisionEvents.map(e => ({ ...e, type: 'collision' as const })), ...engineOffEvents.map(e => ({ ...e, type: 'engine_off' as const }))]
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map((event, index) => (
            <div key={`event-${index}`} style={{ 
              padding: 16, 
              backgroundColor: event.type === 'collision' ? '#1f1f23' : '#1f1f1f', 
              border: `1px solid ${event.type === 'collision' ? '#374151' : '#4b5563'}`,
              borderRadius: 8,
              fontSize: 14,
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = event.type === 'collision' ? '#2d1b1b' : '#2d2d1b'
              e.currentTarget.style.borderColor = event.type === 'collision' ? '#ef4444' : '#f59e0b'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = event.type === 'collision' ? '#1f1f23' : '#1f1f1f'
              e.currentTarget.style.borderColor = event.type === 'collision' ? '#374151' : '#4b5563'
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ 
                  width: 12, 
                  height: 12, 
                  backgroundColor: event.type === 'collision' ? '#ef4444' : '#f59e0b', 
                  borderRadius: '50%',
                  boxShadow: `0 0 8px ${event.type === 'collision' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.5)'}`
                }}></div>
                <strong style={{ color: '#f9fafb' }}>
                  {event.type === 'collision' ? '🚗 충돌 이벤트' : '🔧 엔진 오프 이벤트'}
                </strong>
                <span style={{ 
                  color: '#9ca3af', 
                  fontSize: 12,
                  backgroundColor: '#374151',
                  padding: '2px 8px',
                  borderRadius: 4
                }}>
                  {new Date(event.timestamp).toLocaleString('ko-KR')}
                </span>
              </div>
              {event.type === 'collision' ? (
                <div style={{ color: '#d1d5db' }}>
                  💥 손상도: <span style={{ color: '#ef4444', fontWeight: 600 }}>{(event as CollisionEvent).damage}/5</span>
                </div>
              ) : (
                <div style={{ color: '#d1d5db' }}>
                  ⚙️ 기어: <span style={{ color: '#f59e0b' }}>{(event as EngineOffEvent).gear_status}</span> | 
                  📐 자이로: <span style={{ color: '#f59e0b' }}>{(event as EngineOffEvent).gyro}°</span> | 
                  📍 방향: <span style={{ color: '#f59e0b' }}>{(event as EngineOffEvent).side}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


