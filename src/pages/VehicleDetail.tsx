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

// 이벤트 타임라인 컴포넌트 (X-Y축 차트)
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

  // 모든 이벤트를 시간순으로 정렬
  const allEvents = [
    ...engineOffEvents.map(e => ({ ...e, type: 'engine_off' as const })),
    ...collisionEvents.map(e => ({ ...e, type: 'collision' as const }))
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // 차트 높이와 너비
  const chartHeight = 200
  const chartWidth = Math.max(600, totalDays * 80)
  const margin = { top: 20, right: 20, bottom: 40, left: 60 }

  // X축: 날짜
  const xScale = (dayIndex: number) => margin.left + (dayIndex * (chartWidth - margin.left - margin.right) / (totalDays - 1))
  
  // Y축: 이벤트 타입 (0: 충돌, 1: 엔진오프)
  const yScale = (eventType: 'collision' | 'engine_off') => {
    return margin.top + (eventType === 'collision' ? 50 : 150)
  }

  return (
    <div style={{ 
      border: '1px solid #e5e7eb', 
      borderRadius: 8, 
      padding: 16, 
      backgroundColor: '#f9fafb' 
    }}>
      {/* 범례 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: 16,
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ 
            width: 12, 
            height: 12, 
            backgroundColor: '#ef4444', 
            borderRadius: '50%' 
          }}></div>
          <span>충돌 이벤트 ({collisionEvents.length}개)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ 
            width: 12, 
            height: 12, 
            backgroundColor: '#f59e0b', 
            borderRadius: '50%' 
          }}></div>
          <span>엔진 오프 이벤트 ({engineOffEvents.length}개)</span>
        </div>
      </div>
      
      {/* X-Y축 차트 */}
      <div style={{ 
        border: '1px solid #d1d5db',
        borderRadius: 4,
        backgroundColor: 'white',
        padding: 16,
        overflow: 'auto'
      }}>
        <svg width={chartWidth} height={chartHeight} style={{ minWidth: '100%' }}>
          {/* Y축 라벨 */}
          <text x={10} y={margin.top + 50} fontSize="12" fill="#6b7280" textAnchor="middle" transform={`rotate(-90, 10, ${margin.top + 50})`}>
            충돌 이벤트
          </text>
          <text x={10} y={margin.top + 150} fontSize="12" fill="#6b7280" textAnchor="middle" transform={`rotate(-90, 10, ${margin.top + 150})`}>
            엔진 오프 이벤트
          </text>
          
          {/* Y축 라인 */}
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={chartHeight - margin.bottom} stroke="#e5e7eb" strokeWidth="1" />
          <line x1={margin.left} y1={margin.top + 50} x2={chartWidth - margin.right} y2={margin.top + 50} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="2,2" />
          <line x1={margin.left} y1={margin.top + 150} x2={chartWidth - margin.right} y2={margin.top + 150} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="2,2" />
          
          {/* X축 라인 */}
          <line x1={margin.left} y1={chartHeight - margin.bottom} x2={chartWidth - margin.right} y2={chartHeight - margin.bottom} stroke="#e5e7eb" strokeWidth="1" />
          
          {/* 날짜별 X축 라벨 */}
          {Array.from({ length: totalDays }, (_, i) => {
            const currentDate = new Date(startDate)
            currentDate.setDate(startDate.getDate() + i)
            const x = xScale(i)
            
            return (
              <g key={i}>
                <line x1={x} y1={chartHeight - margin.bottom} x2={x} y2={chartHeight - margin.bottom + 5} stroke="#6b7280" strokeWidth="1" />
                <text x={x} y={chartHeight - margin.bottom + 20} fontSize="10" fill="#6b7280" textAnchor="middle">
                  {currentDate.getDate()}
                </text>
              </g>
            )
          })}
          
          {/* 이벤트 포인트 */}
          {allEvents.map((event, index) => {
            const eventDate = new Date(event.timestamp)
            const dayIndex = Math.floor((eventDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            const x = xScale(dayIndex)
            const y = yScale(event.type)
            const color = event.type === 'collision' ? '#ef4444' : '#f59e0b'
            
            return (
              <g key={index}>
                <circle 
                  cx={x} 
                  cy={y} 
                  r="6" 
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                />
                {/* 이벤트 정보 툴팁 */}
                <title>
                  {event.type === 'collision' 
                    ? `충돌 이벤트\n시간: ${new Date(event.timestamp).toLocaleString('ko-KR')}\n손상도: ${event.damage}/5`
                    : `엔진 오프 이벤트\n시간: ${new Date(event.timestamp).toLocaleString('ko-KR')}\n기어: ${event.gear_status}, 자이로: ${event.gyro}°, 방향: ${event.side}`
                  }
                </title>
              </g>
            )
          })}
        </svg>
      </div>
      
      {/* 이벤트 상세 정보 */}
      <div style={{ marginTop: 16 }}>
        <h4 style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>이벤트 상세 정보</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allEvents.map((event, index) => (
            <div key={`event-${index}`} style={{ 
              padding: 12, 
              backgroundColor: event.type === 'collision' ? '#fef2f2' : '#fffbeb', 
              border: `1px solid ${event.type === 'collision' ? '#fecaca' : '#fed7aa'}`,
              borderRadius: 6,
              fontSize: 13
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ 
                  width: 8, 
                  height: 8, 
                  backgroundColor: event.type === 'collision' ? '#ef4444' : '#f59e0b', 
                  borderRadius: '50%' 
                }}></div>
                <strong>
                  {event.type === 'collision' ? '충돌 이벤트' : '엔진 오프 이벤트'}
                </strong>
                <span style={{ color: '#6b7280', fontSize: 11 }}>
                  {new Date(event.timestamp).toLocaleString('ko-KR')}
                </span>
              </div>
              {event.type === 'collision' ? (
                <div>손상도: {event.damage}/5</div>
              ) : (
                <div>기어: {event.gear_status} | 자이로: {event.gyro}° | 방향: {event.side}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


