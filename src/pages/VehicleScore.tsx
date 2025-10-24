import { useParams, Link, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, Cell, LineChart, Line } from 'recharts'
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

interface ScoreHistoryRecord {
  analysis_date: string
  final_score: number | null
  engine_powertrain_score: number | null
  transmission_drivetrain_score: number | null
  brake_suspension_score: number | null
  adas_safety_score: number | null
  electrical_battery_score: number | null
  other_score: number | null
}

interface ScoreHistoryResponse {
  vehicle_id: string
  start_date: string | null
  end_date: string | null
  records: ScoreHistoryRecord[]
}

type ScoreSeriesKey =
  | 'final_score'
  | 'engine_powertrain_score'
  | 'transmission_drivetrain_score'
  | 'brake_suspension_score'
  | 'adas_safety_score'
  | 'electrical_battery_score'
  | 'other_score'

const SCORE_HISTORY_SERIES: Array<{ key: ScoreSeriesKey; label: string; color: string }> = [
  { key: 'final_score', label: '종합 점수', color: '#38bdf8' },
  { key: 'engine_powertrain_score', label: '엔진/파워트레인', color: '#f97316' },
  { key: 'transmission_drivetrain_score', label: '변속/구동계', color: '#fbbf24' },
  { key: 'brake_suspension_score', label: '브레이크/서스펜션', color: '#a855f7' },
  { key: 'adas_safety_score', label: 'ADAS/안전', color: '#22d3ee' },
  { key: 'electrical_battery_score', label: '전기/배터리', color: '#34d399' },
  { key: 'other_score', label: '기타', color: '#f472b6' },
]

const getScoreColor = (score: number) => {
  if (score >= 80) return '#22c55e'  // 초록색
  if (score >= 50) return '#f97316'  // 주황색
  if (score >= 25) return '#eab308'  // 노란색
  return '#ef4444'  // 빨간색
}

const formatCategoryLabel = (label: string) => label.replace(/\//g, '\n')

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
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({})
  const [historyDays, setHistoryDays] = useState(14)
  const [historyRecords, setHistoryRecords] = useState<ScoreHistoryRecord[]>([])
  const [historyRange, setHistoryRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  })
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [activeSeries, setActiveSeries] = useState<ScoreSeriesKey[]>(['final_score'])
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const toggleSeries = (seriesKey: ScoreSeriesKey) => {
    if (seriesKey === 'final_score') {
      return
    }
    setActiveSeries((prev) =>
      prev.includes(seriesKey) ? prev.filter((key) => key !== seriesKey) : [...prev, seriesKey]
    )
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

  const fetchScoreHistory = async (daysArg: number) => {
    if (!vehicleId) return

    setHistoryLoading(true)
    setHistoryError(null)

    try {
      const params = new URLSearchParams({ days: String(daysArg) })
      const data = await api<ScoreHistoryResponse>(`/api/vehicles/${vehicleId}/score-history?${params.toString()}`)
      setHistoryRecords(data.records ?? [])
      setHistoryRange({ start: data.start_date, end: data.end_date })
    } catch (error) {
      console.error('Error fetching score history:', error)
      setHistoryError('점수 히스토리를 불러오는 중 오류가 발생했습니다.')
      setHistoryRecords([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchScoreHistoryByRange = async (startDate: string, endDate: string) => {
    if (!vehicleId) return

    setHistoryLoading(true)
    setHistoryError(null)

    try {
      const params = new URLSearchParams({ 
        start_date: startDate, 
        end_date: endDate 
      })
      const data = await api<ScoreHistoryResponse>(`/api/vehicles/${vehicleId}/score-history?${params.toString()}`)
      setHistoryRecords(data.records ?? [])
      setHistoryRange({ start: startDate, end: endDate })
    } catch (error) {
      console.error('Error fetching score history by range:', error)
      setHistoryError('점수 히스토리를 불러오는 중 오류가 발생했습니다.')
      setHistoryRecords([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const scoreChartData = scoreData
    ? [
        { key: 'engine', label: '엔진', value: scoreData.scores.engine_powertrain_score },
        { key: 'transmission', label: '변속', value: scoreData.scores.transmission_drivetrain_score },
        { key: 'brake', label: '브레이크', value: scoreData.scores.brake_suspension_score },
        { key: 'adas', label: 'ADAS', value: scoreData.scores.adas_safety_score },
        { key: 'electrical', label: '전기&배터리', value: scoreData.scores.electrical_battery_score },
        { key: 'other', label: '기타', value: scoreData.scores.other_score },
      ]
    : []

  // 디버깅용 로그
  console.log('scoreData:', scoreData)
  console.log('scoreChartData:', scoreChartData)

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

  useEffect(() => {
    if (!vehicleId) return
    // 기본값으로 최근 30일 데이터 로드
    fetchScoreHistory(30)
  }, [vehicleId])

  const historyChartData = historyRecords.map((record) => ({
    date: record.analysis_date,
    ...record,
  }))

  const activeHistorySeries = SCORE_HISTORY_SERIES.filter((series) => activeSeries.includes(series.key))

  const formatHistoryTick = (value: string) => {
    if (!value) return ''
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const day = String(parsed.getDate()).padStart(2, '0')
    return `${month}/${day}`
  }

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
      
      {/* 차량 기본 정보와 최종 점수 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 10
        }}>
          <h3 style={{ margin: '0 0 0 0', paddingTop: '20px' }}>기본 정보</h3>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '16px',
          marginBottom: 10
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
              top: '-37px', 
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
          <label style={{ color: '#e5e7eb', marginRight: 8, fontWeight: 'bold', fontSize: '18px' }}>날짜 검색:</label>
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
              fontSize: '14px',
              colorScheme: 'dark'
            }}
          />
        </div>
      </div>

      {/* 점수 데이터 표시 */}
      {scoreData ? (
        <>
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
              📊 {scoreData.analysis_date} 평가
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
            
            {/* 평가 지표와 막대 그래프 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px',
              marginTop: 16
            }}>
              {/* 왼쪽: 평가 지표 */}
              <div>
                <h4 style={{ color: '#e5e7eb', fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                  📊 평가 지표
                </h4>
                
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
                      🔧 엔진/파워트레인
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
                      ⚙️ 변속/구동계 
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
                      🛑 브레이크/서스펜션 
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
                      🛡️ ADAS/안전 
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
                      🔋 전기/배터리
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
                      📊 기타 
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

              {/* 오른쪽: 막대 그래프 */}
              <div>
                <h4 style={{ color: '#e5e7eb', fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
                  📊 지표별 점수 분포
                </h4>
                <div
                  style={{
                    backgroundColor: 'rgba(17,24,39,0.2)',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '10px 0px 10px',
                  }}
                >
                  {scoreChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={265}>
                    <BarChart
                      data={scoreChartData}
                      margin={{ top: 16, right: 12, left: 0, bottom: 10 }}
                      barCategoryGap="28%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis
                        dataKey="label"
                        interval={0}
                        tick={{ fill: '#cbd5f5', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatCategoryLabel}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tick={{ fill: '#cbd5f5', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: 8, color: '#e2e8f0' }}
                        labelStyle={{ color: '#cbd5f5', fontSize: 13 }}
                        itemStyle={{ color: '#f8fafc' }}
                        formatter={(value: number | null) => [value == null ? '데이터 없음' : `${value}점`, '점수']}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={26}>
                        <LabelList
                          dataKey="value"
                          position="top"
                          offset={10}
                          fill="#f8fafc"
                          fontSize={12}
                          formatter={(value: number | null) => (value == null ? '-' : `${value}점`)}
                        />
                        {scoreChartData.map((item) => (
                          <Cell key={item.key} fill={getScoreColor(item.value)} />
                        ))}
                      </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ 
                      height: '265px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#9ca3af',
                      fontSize: '14px'
                    }}>
                      그래프 데이터를 불러오는 중...
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '16px',
                      marginTop: '16px',
                      color: '#9ca3af',
                      fontSize: '12px',
                    }}
                  >
                    <span>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          backgroundColor: '#22c55e',
                          borderRadius: '50%',
                          marginRight: 6,
                        }}
                      ></span>
                      80점 이상
                    </span>
                    <span>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          backgroundColor: '#f97316',
                          borderRadius: '50%',
                          marginRight: 6,
                        }}
                      ></span>
                      50~79점
                    </span>
                    <span>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          backgroundColor: '#eab308',
                          borderRadius: '50%',
                          marginRight: 6,
                        }}
                      ></span>
                      25~49점
                    </span>
                    <span>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          backgroundColor: '#ef4444',
                          borderRadius: '50%',
                          marginRight: 6,
                        }}
                      ></span>
                      25점 미만
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <div
            style={{
              backgroundColor: 'rgba(17,24,39,0.5)',
              border: '1px solid #374151',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h3 style={{ margin: 0, color: '#e5e7eb', fontSize: '18px' }}>📈 날짜별 점수 추이</h3>
                <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: 4 }}>
                  {historyRange.start && historyRange.end
                    ? `${historyRange.start} ~ ${historyRange.end}`
                    : `최근 ${historyDays}일`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ color: '#cbd5f5', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  시작일
                  <input
                    type="date"
                    value={historyRange.start || ''}
                    onChange={(e) => setHistoryRange(prev => ({ ...prev, start: e.target.value }))}
                    style={{
                      backgroundColor: 'rgba(17,24,39,0.5)',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#e5e7eb',
                      fontSize: '13px',
                      colorScheme: 'dark'
                    }}
                  />
                </label>
                <label style={{ color: '#cbd5f5', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  종료일
                  <input
                    type="date"
                    value={historyRange.end || ''}
                    onChange={(e) => setHistoryRange(prev => ({ ...prev, end: e.target.value }))}
                    style={{
                      backgroundColor: 'rgba(17,24,39,0.5)',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#e5e7eb',
                      fontSize: '13px',
                      colorScheme: 'dark'
                    }}
                  />
                </label>
                <button
                  onClick={() => {
                    if (historyRange.start && historyRange.end) {
                      fetchScoreHistoryByRange(historyRange.start, historyRange.end)
                    }
                  }}
                  disabled={!historyRange.start || !historyRange.end}
                  style={{
                    backgroundColor: historyRange.start && historyRange.end ? '#3b82f6' : '#6b7280',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: 'white',
                    fontSize: '13px',
                    cursor: historyRange.start && historyRange.end ? 'pointer' : 'not-allowed',
                    opacity: historyRange.start && historyRange.end ? 1 : 0.5
                  }}
                >
                  조회
                </button>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '520px' }}>
                  {SCORE_HISTORY_SERIES.map((series) => {
                    const active = activeSeries.includes(series.key)
                    return (
                      <button
                        key={series.key}
                        type="button"
                        onClick={() => toggleSeries(series.key)}
                        disabled={series.key === 'final_score'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: '999px',
                          border: active ? `1px solid ${series.color}` : '1px solid #374151',
                          backgroundColor: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                          color: active ? series.color : '#cbd5f5',
                          fontSize: '12px',
                          cursor: series.key === 'final_score' ? 'default' : 'pointer',
                          opacity: series.key === 'final_score' ? 0.9 : 1,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: series.color,
                          }}
                        />
                        {series.key === 'final_score' ? `${series.label} (기본)` : series.label}
                      </button>
                    )
                  })}
                </div>
              </div>
      </div>

            <div style={{ marginTop: 20 }}>
              {historyLoading ? (
                <div style={{ color: '#9ca3af', textAlign: 'center', padding: '32px 0' }}>점수 히스토리를 불러오는 중입니다…</div>
              ) : historyError ? (
                <div style={{ color: '#f87171', textAlign: 'center', padding: '32px 0' }}>{historyError}</div>
              ) : historyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={historyChartData} margin={{ top: 20, right: 24, left: 0, bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatHistoryTick}
                      tick={{ fill: '#cbd5f5', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tick={{ fill: '#cbd5f5', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: 8, color: '#e2e8f0' }}
                      labelFormatter={(value) => {
                        const parsed = new Date(value)
                        return Number.isNaN(parsed.getTime())
                          ? value
                          : parsed.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
                      }}
                      formatter={(value: number | null, name) => {
                        const series = SCORE_HISTORY_SERIES.find((item) => item.key === name)
                        return [value == null ? '데이터 없음' : `${value}점`, series ? series.label : name]
                      }}
                    />
                    {activeHistorySeries.map((series) => (
                      <Line
                        key={series.key}
                        type="monotone"
                        dataKey={series.key}
                        name={series.label}
                        stroke={series.color}
                        strokeWidth={series.key === 'final_score' ? 3 : 2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: '#9ca3af', textAlign: 'center', padding: '32px 0' }}>
                  선택한 기간에 해당하는 점수 데이터가 없습니다.
                </div>
              )}
            </div>
          </div>
          </div>
        </>
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
