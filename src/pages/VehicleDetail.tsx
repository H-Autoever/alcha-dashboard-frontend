import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import { Table, Alert, Loader } from '../components/UI'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

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

type TelemetryData = {
  vehicle_id: string
  vehicle_speed: number
  engine_rpm: number
  throttle_position: number
  timestamp: string
}

export default function VehicleDetailPage() {
  const { vehicleId } = useParams()
  const [detail, setDetail] = useState<VehicleDetail | null>(null)
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 날짜 필터 상태
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [filteredDailyData, setFilteredDailyData] = useState<DailyData[]>([])

  useEffect(() => {
    if (!vehicleId) return
    setLoading(true)
    
    // 차량 상세 정보, 이벤트 데이터, 텔레메트리 데이터를 병렬로 로드
    // 텔레메트리: 실제 데이터가 있는 시간 범위 (2025-09-23 01:54:26 ~ 02:54:26 UTC)
    const telemetryStart = '2025-09-23T01:54:26Z'
    const telemetryEnd = '2025-09-23T02:54:26Z'
    
    Promise.all([
      api<VehicleDetail>(`/api/vehicles/${encodeURIComponent(vehicleId)}`),
      api<EventData>(`/api/events/${encodeURIComponent(vehicleId)}/range?start_time=${telemetryStart}&end_time=${telemetryEnd}`),
      api<TelemetryData[]>(`/api/telemetry/${encodeURIComponent(vehicleId)}?start_time=${telemetryStart}&end_time=${telemetryEnd}`)
    ])
      .then(([vehicleDetail, events, telemetry]) => {
        setDetail(vehicleDetail)
        setEventData(events)
        setTelemetryData(telemetry)
        
        // 초기 필터링된 데이터 설정 (전체 데이터)
        setFilteredDailyData(vehicleDetail.daily_data)
        
        // 날짜 범위 초기화 (전체 데이터 범위)
        if (vehicleDetail.daily_data.length > 0) {
          const dates = vehicleDetail.daily_data
            .filter(d => d.analysis_date)
            .map(d => d.analysis_date!)
            .sort()
          setStartDate(dates[0])
          setEndDate(dates[dates.length - 1])
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [vehicleId])

  // 날짜 필터링 로직
  useEffect(() => {
    if (!detail?.daily_data) return
    
    let filtered = detail.daily_data
    
    if (startDate) {
      filtered = filtered.filter(d => d.analysis_date && d.analysis_date >= startDate)
    }
    
    if (endDate) {
      filtered = filtered.filter(d => d.analysis_date && d.analysis_date <= endDate)
    }
    
    setFilteredDailyData(filtered)
  }, [detail, startDate, endDate])

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
          <div style={{ marginBottom: 24 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 16 
            }}>
              <h3 style={{ margin: 0 }}>날짜별 상세 데이터</h3>
              <div style={{ 
                fontSize: 14, 
                color: '#6b7280',
                backgroundColor: '#374151',
                padding: '4px 12px',
                borderRadius: 6
              }}>
                {filteredDailyData.length}개 레코드
              </div>
            </div>
            
            {/* 날짜 필터 UI */}
            <div style={{ 
              display: 'flex', 
              gap: 16, 
              alignItems: 'center', 
              marginBottom: 20,
              padding: 16,
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#f9fafb', fontSize: 14, fontWeight: 500 }}>📅 날짜 필터:</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ color: '#d1d5db', fontSize: 14 }}>시작일:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: 6,
                    color: '#f9fafb',
                    fontSize: 14
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ color: '#d1d5db', fontSize: 14 }}>종료일:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: 6,
                    color: '#f9fafb',
                    fontSize: 14
                  }}
                />
              </div>
              
              <button
                onClick={() => {
                  if (detail?.daily_data) {
                    const dates = detail.daily_data
                      .filter(d => d.analysis_date)
                      .map(d => d.analysis_date!)
                      .sort()
                    setStartDate(dates[0])
                    setEndDate(dates[dates.length - 1])
                  }
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                전체 기간
              </button>
            </div>
          </div>
          
          <Table headers={["분석 날짜", "총 주행거리 (km)", "평균 속도 (km/h)", "연비 (km/L)"]}>
            {filteredDailyData.map((data, index) => (
              <tr key={index}>
                <td>{data.analysis_date ? new Date(data.analysis_date).toLocaleDateString('ko-KR') : '-'}</td>
                <td>{data.total_distance ? data.total_distance.toLocaleString() : '-'}</td>
                <td>{data.average_speed ? data.average_speed.toFixed(1) : '-'}</td>
                <td>{data.fuel_efficiency ? data.fuel_efficiency.toFixed(1) : '-'}</td>
              </tr>
            ))}
          </Table>

      {/* 텔레메트리 시각화 (VHC-001, 002, 003만) */}
      {['VHC-001', 'VHC-002', 'VHC-003'].includes(detail.vehicle_id) && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ 
            color: '#f9fafb', 
            fontSize: 18, 
            fontWeight: 600, 
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            📊 실시간 텔레메트리 (최근 1시간)
            <span style={{ 
              fontSize: 12, 
              backgroundColor: '#374151', 
              color: '#9ca3af', 
              padding: '4px 8px', 
              borderRadius: 6 
            }}>
              {telemetryData.length}개 데이터 포인트
            </span>
          </h3>
          
          {telemetryData.length > 0 ? (
            <TelemetryChart 
              telemetryData={telemetryData} 
              eventData={eventData}
              vehicleId={detail.vehicle_id}
            />
          ) : (
            <div style={{ 
              border: '1px solid #374151', 
              borderRadius: 12, 
              padding: 24, 
              backgroundColor: '#1f2937',
              textAlign: 'center'
            }}>
              <p style={{ color: '#9ca3af' }}>텔레메트리 데이터를 불러오는 중...</p>
            </div>
          )}
        </div>
      )}

      {/* 이벤트 그래프 섹션 */}
      <h3>이벤트 타임라인</h3>
      {eventData && (
        <div style={{ marginTop: 16 }}>
          <EventTimeline 
            dailyData={filteredDailyData}
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
  // 상태 관리
  const [hoveredBar, setHoveredBar] = useState<{date: string, type: 'collision' | 'engineOff'} | null>(null)
  const [selectedBar, setSelectedBar] = useState<{date: string, type: 'collision' | 'engineOff'} | null>(null)
  const [eventFilter, setEventFilter] = useState<'all' | 'collision' | 'engineOff'>('all')
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // 필터링된 이벤트 데이터
  const filteredEngineOffEvents = eventFilter === 'collision' ? [] : engineOffEvents
  const filteredCollisionEvents = eventFilter === 'engineOff' ? [] : collisionEvents
  // 이벤트 데이터에서 날짜 범위 계산
  const allEventTimestamps = [
    ...filteredCollisionEvents.map(e => e.timestamp),
    ...filteredEngineOffEvents.map(e => e.timestamp)
  ].filter(t => t).map(t => new Date(t)).sort((a, b) => a.getTime() - b.getTime())
  
  if (allEventTimestamps.length === 0) {
    return (
      <div style={{ 
        border: '1px solid #374151', 
        borderRadius: 12, 
        padding: 24, 
        backgroundColor: '#1f2937',
        textAlign: 'center'
      }}>
        <p style={{ color: '#9ca3af' }}>이벤트 데이터가 없습니다.</p>
      </div>
    )
  }
  
  const startDate = allEventTimestamps[0]
  const endDate = allEventTimestamps[allEventTimestamps.length - 1]
  
  // 같은 날의 이벤트인 경우 분 단위로 처리, 다른 날이면 실제 일수 계산
  const isSameDay = startDate.toDateString() === endDate.toDateString()
  const totalMinutes = isSameDay ? 
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60)) + 1 : // 분 단위
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 // 일 단위

  // 분별/날짜별 이벤트 개수 계산
  const eventsByTime: { [key: string]: { collision: number, engineOff: number } } = {}
  
  // 초기화
  if (isSameDay) {
    // 같은 날의 이벤트인 경우 분 단위로 초기화
    for (let i = 0; i < totalMinutes; i++) {
      const currentTime = new Date(startDate)
      currentTime.setMinutes(startDate.getMinutes() + i)
      const timeStr = currentTime.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM 형식
      eventsByTime[timeStr] = { collision: 0, engineOff: 0 }
    }
  } else {
    // 여러 날의 이벤트인 경우 날짜 단위로 초기화
    for (let i = 0; i < totalMinutes; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      const dateStr = currentDate.toISOString().split('T')[0]
      eventsByTime[dateStr] = { collision: 0, engineOff: 0 }
    }
  }
  
  // 충돌 이벤트 카운트 (안전한 처리)
  filteredCollisionEvents.forEach(event => {
    if (event && event.timestamp) {
      const eventTime = new Date(event.timestamp)
      if (isSameDay) {
        // 같은 날의 경우 분 단위로 그룹화
        const timeStr = eventTime.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM 형식
        if (eventsByTime[timeStr]) {
          eventsByTime[timeStr].collision++
        }
      } else {
        // 다른 날의 경우 날짜 단위로 그룹화
        const date = eventTime.toISOString().split('T')[0]
        if (eventsByTime[date]) {
          eventsByTime[date].collision++
        }
      }
    }
  })
  
  // 엔진 오프 이벤트 카운트 (안전한 처리)
  filteredEngineOffEvents.forEach(event => {
    if (event && event.timestamp) {
      const eventTime = new Date(event.timestamp)
      if (isSameDay) {
        // 같은 날의 경우 분 단위로 그룹화
        const timeStr = eventTime.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM 형식
        if (eventsByTime[timeStr]) {
          eventsByTime[timeStr].engineOff++
        }
      } else {
        // 다른 날의 경우 날짜 단위로 그룹화
        const date = eventTime.toISOString().split('T')[0]
        if (eventsByTime[date]) {
          eventsByTime[date].engineOff++
        }
      }
    }
  })

  // 차트 설정 (분 단위 데이터에 맞게 조정)
  const chartHeight = 320
  const chartWidth = Math.max(1200, totalMinutes * 8) // 분 단위로 조정 (8px per minute)
  const margin = { top: 30, right: 40, bottom: 60, left: 80 }
  const maxEvents = Math.max(
    ...Object.values(eventsByTime).map(d => d.collision + d.engineOff),
    1
  )

  // 스케일 함수
  const xScale = (timeIndex: number) => margin.left + (timeIndex * (chartWidth - margin.left - margin.right) / (totalMinutes - 1))
  const yScale = (count: number) => chartHeight - margin.bottom - (count * (chartHeight - margin.top - margin.bottom) / maxEvents)
  const barWidth = (chartWidth - margin.left - margin.right) / totalMinutes * 0.6

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
          gap: 24,
          flexWrap: 'wrap'
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
          
          {/* 이벤트 필터 버튼들 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <span style={{ color: '#9ca3af', fontSize: 14 }}>필터:</span>
            <button
              onClick={() => setEventFilter('all')}
              style={{
                padding: '4px 12px',
                backgroundColor: eventFilter === 'all' ? '#3b82f6' : '#374151',
                border: 'none',
                borderRadius: 6,
                color: '#ffffff',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              전체
            </button>
            <button
              onClick={() => setEventFilter('collision')}
              style={{
                padding: '4px 12px',
                backgroundColor: eventFilter === 'collision' ? '#ef4444' : '#374151',
                border: 'none',
                borderRadius: 6,
                color: '#ffffff',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              충돌만
            </button>
            <button
              onClick={() => setEventFilter('engineOff')}
              style={{
                padding: '4px 12px',
                backgroundColor: eventFilter === 'engineOff' ? '#f59e0b' : '#374151',
                border: 'none',
                borderRadius: 6,
                color: '#ffffff',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              엔진만
            </button>
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
          {Array.from({ length: totalMinutes }, (_, i) => {
            let currentTime: Date
            let timeStr: string
            
            if (isSameDay) {
              // 같은 날의 이벤트인 경우 분 단위로 처리
              currentTime = new Date(startDate)
              currentTime.setMinutes(startDate.getMinutes() + i)
              timeStr = currentTime.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM 형식
            } else {
              // 여러 날의 이벤트인 경우 날짜 단위로 처리
              currentTime = new Date(startDate)
              currentTime.setDate(startDate.getDate() + i)
              timeStr = currentTime.toISOString().split('T')[0]
            }
            
            const timeEvents = eventsByTime[timeStr] || { collision: 0, engineOff: 0 }
            const x = xScale(i) - barWidth / 2
            
            // 해당 시간의 실제 이벤트들 찾기 (안전한 처리)
            const timeCollisionEvents = filteredCollisionEvents.filter(e => {
              if (!e || !e.timestamp) return false
              const eventTime = new Date(e.timestamp)
              if (isSameDay) {
                return eventTime.toISOString().slice(0, 16) === timeStr
              } else {
                return eventTime.toISOString().split('T')[0] === timeStr
              }
            })
            const timeEngineOffEvents = filteredEngineOffEvents.filter(e => {
              if (!e || !e.timestamp) return false
              const eventTime = new Date(e.timestamp)
              if (isSameDay) {
                return eventTime.toISOString().slice(0, 16) === timeStr
              } else {
                return eventTime.toISOString().split('T')[0] === timeStr
              }
            })
            
            return (
              <g key={i}>
                {/* 충돌 이벤트 막대 */}
                {timeEvents.collision > 0 && (
                  <rect
                    x={x}
                    y={yScale(timeEvents.collision)}
                    width={barWidth / 2}
                    height={chartHeight - margin.bottom - yScale(timeEvents.collision)}
                    fill={selectedBar?.date === timeStr && selectedBar?.type === 'collision' ? '#dc2626' : '#ef4444'}
                    rx="2"
                    style={{ 
                      cursor: 'pointer',
                      filter: selectedBar?.date === timeStr && selectedBar?.type === 'collision' 
                        ? 'drop-shadow(0 4px 12px rgba(239, 68, 68, 0.8))' 
                        : 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))',
                      transition: 'all 0.2s ease',
                      stroke: selectedBar?.date === timeStr && selectedBar?.type === 'collision' ? '#ffffff' : 'none',
                      strokeWidth: selectedBar?.date === timeStr && selectedBar?.type === 'collision' ? 2 : 0
                    }}
                    onMouseEnter={(e) => {
                      if (!(selectedBar?.date === timeStr && selectedBar?.type === 'collision')) {
                        e.currentTarget.style.filter = 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.5))'
                        e.currentTarget.style.fill = '#dc2626'
                      }
                      setHoveredBar({ date: timeStr, type: 'collision' })
                      setTooltipPosition({ x: e.clientX, y: e.clientY })
                    }}
                    onMouseLeave={() => {
                      setHoveredBar(null)
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (selectedBar?.date === timeStr && selectedBar?.type === 'collision') {
                        setSelectedBar(null) // 이미 선택된 막대면 해제
                      } else {
                        setSelectedBar({ date: timeStr, type: 'collision' })
                      }
                    }}
                  />
                )}
                
                {/* 엔진 오프 이벤트 막대 */}
                {timeEvents.engineOff > 0 && (
                  <rect
                    x={x + barWidth / 2}
                    y={yScale(timeEvents.engineOff)}
                    width={barWidth / 2}
                    height={chartHeight - margin.bottom - yScale(timeEvents.engineOff)}
                    fill={selectedBar?.date === timeStr && selectedBar?.type === 'engineOff' ? '#d97706' : '#f59e0b'}
                    rx="2"
                    style={{ 
                      cursor: 'pointer',
                      filter: selectedBar?.date === timeStr && selectedBar?.type === 'engineOff' 
                        ? 'drop-shadow(0 4px 12px rgba(245, 158, 11, 0.8))' 
                        : 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))',
                      transition: 'all 0.2s ease',
                      stroke: selectedBar?.date === timeStr && selectedBar?.type === 'engineOff' ? '#ffffff' : 'none',
                      strokeWidth: selectedBar?.date === timeStr && selectedBar?.type === 'engineOff' ? 2 : 0
                    }}
                    onMouseEnter={(e) => {
                      if (!(selectedBar?.date === timeStr && selectedBar?.type === 'engineOff')) {
                        e.currentTarget.style.filter = 'drop-shadow(0 4px 8px rgba(245, 158, 11, 0.5))'
                        e.currentTarget.style.fill = '#d97706'
                      }
                      setHoveredBar({ date: timeStr, type: 'engineOff' })
                      setTooltipPosition({ x: e.clientX, y: e.clientY })
                    }}
                    onMouseLeave={() => {
                      setHoveredBar(null)
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (selectedBar?.date === timeStr && selectedBar?.type === 'engineOff') {
                        setSelectedBar(null) // 이미 선택된 막대면 해제
                      } else {
                        setSelectedBar({ date: timeStr, type: 'engineOff' })
                      }
                    }}
                  />
                )}
                
                {/* 날짜/시간 라벨 */}
                <text 
                  x={xScale(i)} 
                  y={chartHeight - margin.bottom + 20} 
                  fontSize="11" 
                  fill="#9ca3af" 
                  textAnchor="middle"
                >
                  {isSameDay ? 
                    currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) :
                    currentTime.getDate()
                  }
                </text>
                <text 
                  x={xScale(i)} 
                  y={chartHeight - margin.bottom + 35} 
                  fontSize="10" 
                  fill="#6b7280" 
                  textAnchor="middle"
                >
                  {isSameDay ? 
                    currentTime.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) :
                    currentTime.toLocaleDateString('ko-KR', { month: 'short' })
                  }
                </text>
              </g>
            )
          })}
            </svg>
          </div>
          
          {/* 커스텀 툴팁 */}
          {hoveredBar && (
            <div
              style={{
                position: 'fixed',
                left: tooltipPosition.x + 10,
                top: tooltipPosition.y - 10,
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: 8,
                padding: 12,
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                zIndex: 1000,
                pointerEvents: 'none',
                maxWidth: 300
              }}
            >
              {(() => {
                const timeStr = hoveredBar.date
                const timeCollisionEvents = filteredCollisionEvents.filter(e => {
                  if (!e || !e.timestamp) return false
                  const eventTime = new Date(e.timestamp)
                  if (isSameDay) {
                    return eventTime.toISOString().slice(0, 16) === timeStr
                  } else {
                    return eventTime.toISOString().split('T')[0] === timeStr
                  }
                })
                const timeEngineOffEvents = filteredEngineOffEvents.filter(e => {
                  if (!e || !e.timestamp) return false
                  const eventTime = new Date(e.timestamp)
                  if (isSameDay) {
                    return eventTime.toISOString().slice(0, 16) === timeStr
                  } else {
                    return eventTime.toISOString().split('T')[0] === timeStr
                  }
                })
                
                if (hoveredBar.type === 'collision' && timeCollisionEvents.length > 0) {
                  return (
                    <div>
                      <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>
                        🚗 충돌 이벤트 ({timeCollisionEvents.length}개)
                      </div>
                      {timeCollisionEvents.map((event, idx) => {
                        // UTC 시간을 한국 시간(UTC+9)으로 변환
                        const utcDate = new Date(event.timestamp)
                        const koreanTime = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))
                        return (
                          <div key={idx} style={{ color: '#d1d5db', fontSize: 12, marginBottom: 4 }}>
                            • {koreanTime.toLocaleTimeString('ko-KR')} - 손상도: {event.damage}/5
                          </div>
                        )
                      })}
                    </div>
                  )
                } else if (hoveredBar.type === 'engineOff' && timeEngineOffEvents.length > 0) {
                  return (
                    <div>
                      <div style={{ color: '#f59e0b', fontWeight: 600, marginBottom: 8 }}>
                        🔧 엔진 오프 이벤트 ({timeEngineOffEvents.length}개)
                      </div>
                      {timeEngineOffEvents.map((event, idx) => {
                        // UTC 시간을 한국 시간(UTC+9)으로 변환
                        const utcDate = new Date(event.timestamp)
                        const koreanTime = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))
                        return (
                          <div key={idx} style={{ color: '#d1d5db', fontSize: 12, marginBottom: 4 }}>
                            • {koreanTime.toLocaleTimeString('ko-KR')} - 기어: {event.gear_status}, 자이로: {event.gyro}°, 방향: {event.side}
                          </div>
                        )
                      })}
                    </div>
                  )
                }
                return null
              })()}
            </div>
          )}
      
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
          {[...filteredCollisionEvents.filter(e => e && e.timestamp).map(e => ({ ...e, type: 'collision' as const })), ...filteredEngineOffEvents.filter(e => e && e.timestamp).map(e => ({ ...e, type: 'engineOff' as const }))]
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map((event, index) => {
              const eventTime = new Date(event.timestamp)
              const eventTimeStr = isSameDay ? 
                eventTime.toISOString().slice(0, 16) : // YYYY-MM-DDTHH:MM 형식
                eventTime.toISOString().split('T')[0]  // YYYY-MM-DD 형식
              const isSelected = selectedBar?.date === eventTimeStr && selectedBar?.type === event.type
              
              return (
            <div key={`event-${index}`} style={{ 
              padding: 16, 
              backgroundColor: isSelected 
                ? (event.type === 'collision' ? '#2d1b1b' : '#2d2d1b')
                : (event.type === 'collision' ? '#1f1f23' : '#1f1f1f'), 
              border: isSelected 
                ? `2px solid ${event.type === 'collision' ? '#ef4444' : '#f59e0b'}`
                : `1px solid ${event.type === 'collision' ? '#374151' : '#4b5563'}`,
              borderRadius: 8,
              fontSize: 14,
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              boxShadow: isSelected 
                ? `0 0 20px ${event.type === 'collision' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                : 'none'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = event.type === 'collision' ? '#2d1b1b' : '#2d2d1b'
                e.currentTarget.style.borderColor = event.type === 'collision' ? '#ef4444' : '#f59e0b'
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = event.type === 'collision' ? '#1f1f23' : '#1f1f1f'
                e.currentTarget.style.borderColor = event.type === 'collision' ? '#374151' : '#4b5563'
              }
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (selectedBar?.date === eventTimeStr && selectedBar?.type === event.type) {
                setSelectedBar(null) // 이미 선택된 이벤트면 해제
              } else {
                setSelectedBar({ date: eventTimeStr, type: event.type })
              }
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
                  {(() => {
                    // UTC 시간을 한국 시간(UTC+9)으로 변환
                    const utcDate = new Date(event.timestamp)
                    const koreanTime = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))
                    return koreanTime.toLocaleString('ko-KR')
                  })()}
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
                  )
                })}
        </div>
      </div>
    </div>
  )
}

// 텔레메트리 차트 컴포넌트
function TelemetryChart({ 
  telemetryData, 
  eventData,
  vehicleId 
}: { 
  telemetryData: TelemetryData[]
  eventData: EventData | null
  vehicleId: string
}) {
  // 데이터 다운샘플링 (성능 최적화 - 3600개 -> 60개로 축소)
  const downsampledData = telemetryData.filter((_, index) => index % 60 === 0).map(d => {
    // UTC 시간을 한국 시간(UTC+9)으로 변환
    const utcDate = new Date(d.timestamp)
    const koreanTime = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))
    return {
      time: koreanTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      speed: Math.round(d.vehicle_speed),
      rpm: Math.round(d.engine_rpm / 100), // 100으로 나눠서 스케일 조정
      throttle: Math.round(d.throttle_position),
      timestamp: d.timestamp
    }
  })

  // 이벤트 시간대 찾기 (텔레메트리 시간 범위 내)
  const telemetryStart = new Date(telemetryData[0]?.timestamp || '')
  const telemetryEnd = new Date(telemetryData[telemetryData.length - 1]?.timestamp || '')
  
  const eventsInRange = eventData ? [
    ...eventData.collision_events.filter(e => {
      const eventTime = new Date(e.timestamp)
      return eventTime >= telemetryStart && eventTime <= telemetryEnd
    }).map(e => ({ ...e, type: 'collision' as const })),
    ...eventData.engine_off_events.filter(e => {
      const eventTime = new Date(e.timestamp)
      return eventTime >= telemetryStart && eventTime <= telemetryEnd
    }).map(e => ({ ...e, type: 'engineOff' as const }))
  ] : []

  return (
    <div style={{ 
      border: '1px solid #374151', 
      borderRadius: 12, 
      padding: 24, 
      backgroundColor: '#1f2937',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }}>
      {/* 속도 그래프 */}
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ 
          color: '#f9fafb', 
          fontSize: 16, 
          fontWeight: 600, 
          marginBottom: 16 
        }}>
          🚗 차량 속도 (km/h)
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={downsampledData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              label={{ value: 'km/h', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: 8,
                color: '#f9fafb'
              }}
            />
            <Legend wrapperStyle={{ color: '#9ca3af' }} />
            <Line 
              type="monotone" 
              dataKey="speed" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              name="속도"
            />
            {/* 이벤트 마커 */}
            {eventsInRange.map((event, idx) => {
              // UTC 시간을 한국 시간(UTC+9)으로 변환
              const utcDate = new Date(event.timestamp)
              const koreanTime = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))
              return (
                <ReferenceLine
                  key={idx}
                  x={koreanTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  stroke={event.type === 'collision' ? '#ef4444' : '#f59e0b'}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{ 
                    value: event.type === 'collision' ? '🚨' : '🔧',
                    position: 'top',
                    fill: event.type === 'collision' ? '#ef4444' : '#f59e0b'
                  }}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* RPM 그래프 */}
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ 
          color: '#f9fafb', 
          fontSize: 16, 
          fontWeight: 600, 
          marginBottom: 16 
        }}>
          ⚙️ 엔진 RPM (×100)
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={downsampledData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              label={{ value: 'RPM ×100', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: 8,
                color: '#f9fafb'
              }}
            />
            <Legend wrapperStyle={{ color: '#9ca3af' }} />
            <Line 
              type="monotone" 
              dataKey="rpm" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
              name="RPM"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 스로틀 위치 그래프 */}
      <div>
        <h4 style={{ 
          color: '#f9fafb', 
          fontSize: 16, 
          fontWeight: 600, 
          marginBottom: 16 
        }}>
          🎛️ 스로틀 위치 (%)
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={downsampledData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              domain={[0, 100]}
              label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: 8,
                color: '#f9fafb'
              }}
            />
            <Legend wrapperStyle={{ color: '#9ca3af' }} />
            <Line 
              type="monotone" 
              dataKey="throttle" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={false}
              name="스로틀"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 이벤트 요약 */}
      {eventsInRange.length > 0 && (
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          backgroundColor: '#111827',
          borderRadius: 8,
          border: '1px solid #374151'
        }}>
          <h5 style={{ 
            color: '#f9fafb', 
            fontSize: 14, 
            fontWeight: 600, 
            marginBottom: 12 
          }}>
            📌 이벤트 요약 (최근 1시간)
          </h5>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {eventsInRange.map((event, idx) => {
              // UTC 시간을 한국 시간(UTC+9)으로 변환
              const utcDate = new Date(event.timestamp)
              const koreanTime = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))
              return (
                <div key={idx} style={{ 
                  padding: '8px 12px', 
                  backgroundColor: event.type === 'collision' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${event.type === 'collision' ? '#ef4444' : '#f59e0b'}`,
                  borderRadius: 6,
                  fontSize: 12,
                  color: event.type === 'collision' ? '#ef4444' : '#f59e0b'
                }}>
                  {event.type === 'collision' ? '🚨 충돌' : '🔧 엔진 오프'} - {koreanTime.toLocaleTimeString('ko-KR')}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}


