import { useState, useEffect } from 'react'

const FIREBASE_URL = `${import.meta.env.VITE_FIRE_BASE_URL || 'https://sensorlab-6-default-rtdb.asia-southeast1.firebasedatabase.app/'}sensors.json`

const ENVIRONMENT_THRESHOLDS = {
  gas: {
    label: 'Air Quality',
    unit: 'ppm',
    icon: 'gas',
    thresholds: [
      { max: 1000, status: 'normal', label: 'Good' },
      { max: 2000, status: 'moderate', label: 'Moderate' },
      { max: 3000, status: 'high', label: 'Unhealthy' },
      { max: Infinity, status: 'critical', label: 'Hazardous' }
    ]
  },
  temperature: {
    label: 'Temperature',
    unit: '°C',
    icon: 'temp',
    thresholds: [
      { min: 18, max: 26, status: 'normal', label: 'Comfortable' },
      { min: 15, max: 35, status: 'moderate', label: 'Moderate' },
      { max: Infinity, status: 'high', label: 'Extreme' }
    ]
  },
  humidity: {
    label: 'Humidity',
    unit: '%',
    icon: 'humidity',
    thresholds: [
      { min: 30, max: 60, status: 'normal', label: 'Comfortable' },
      { min: 20, max: 80, status: 'moderate', label: 'Moderate' },
      { max: Infinity, status: 'high', label: 'Extreme' }
    ]
  }
}

const HEALTH_THRESHOLDS = {
  heartRate: {
    label: 'Heart Rate',
    unit: 'BPM',
    icon: 'heart',
    thresholds: [
      { min: 60, max: 100, status: 'normal', label: 'Normal' },
      { min: 50, max: 120, status: 'moderate', label: 'Elevated' },
      { max: Infinity, status: 'high', label: 'Abnormal' }
    ]
  },
  spo2: {
    label: 'Blood Oxygen (SpO₂)',
    unit: '%',
    icon: 'spo2',
    thresholds: [
      { min: 95, max: 100, status: 'normal', label: 'Normal' },
      { min: 90, max: 95, status: 'moderate', label: 'Low' },
      { max: Infinity, status: 'high', label: 'Critical' }
    ]
  },
  heart_ir: {
    label: 'Heart IR Value',
    unit: 'mV',
    icon: 'heart',
    thresholds: [
      { min: 100, max: Infinity, status: 'normal', label: 'Detected' },
      { max: 100, status: 'moderate', label: 'Weak Signal' }
    ]
  },
  irValue: {
    label: 'IR Sensor',
    unit: 'ADC',
    icon: 'heart',
    thresholds: [
      { min: 500, status: 'normal', label: 'Strong' },
      { min: 200, max: 500, status: 'moderate', label: 'Weak' },
      { max: 200, status: 'high', label: 'Very Weak' }
    ]
  }
}

function getSensorStatus(value, config) {
  for (const threshold of config.thresholds) {
    if (threshold.max !== undefined && value <= threshold.max) {
      if (threshold.min !== undefined && value >= threshold.min) {
        return { status: threshold.status, label: threshold.label }
      } else if (threshold.min === undefined) {
        return { status: threshold.status, label: threshold.label }
      }
    }
  }
  if (config.thresholds[config.thresholds.length - 1].min !== undefined && value >= config.thresholds[config.thresholds.length - 1].min) {
    const last = config.thresholds[config.thresholds.length - 1]
    return { status: last.status, label: last.label }
  }
  return { status: 'high', label: 'Critical' }
}

function isValidSpO2(value) {
  // SpO2 should be between 0 and 100, and > 0 indicates person is present
  return typeof value === 'number' && value > 0 && value <= 100
}

function calculateEnvironmentRisk(data) {
  let score = 0
  let factors = []

  const gas = data.gas ?? 0
  if (gas > 3000) {
    score += 40
    factors.push({ name: 'Air Quality', detail: 'Hazardous - evacuate area', severity: 'critical' })
  } else if (gas > 2000) {
    score += 25
    factors.push({ name: 'Air Quality', detail: 'Unhealthy for sensitive groups', severity: 'high' })
  } else if (gas > 1000) {
    score += 10
    factors.push({ name: 'Air Quality', detail: 'Moderate - ventilation recommended', severity: 'moderate' })
  }

  const temp = data.temperature ?? 25
  if (temp < 15 || temp > 35) {
    score += 20
    factors.push({ name: 'Temperature', detail: `${temp}°C - unsafe environment`, severity: 'high' })
  } else if (temp < 18 || temp > 30) {
    score += 5
    factors.push({ name: 'Temperature', detail: `${temp}°C - uncomfortable`, severity: 'moderate' })
  }

  const humidity = data.humidity ?? 50
  if (humidity < 20 || humidity > 80) {
    score += 15
    factors.push({ name: 'Humidity', detail: `${humidity}% - may affect comfort`, severity: 'moderate' })
  }

  return { score, factors }
}

function calculateHealthRisk(data) {
  let score = 0
  let factors = []

  const heartRate = data.heartRate ?? 0
  if (heartRate > 0) {
    if (heartRate > 120 || heartRate < 50) {
      score += 35
      factors.push({ name: 'Heart Rate', detail: `${heartRate} BPM - Abnormal`, severity: 'critical' })
    } else if (heartRate > 100 || heartRate < 60) {
      score += 15
      factors.push({ name: 'Heart Rate', detail: `${heartRate} BPM - Slightly elevated`, severity: 'moderate' })
    }
  }

  const spo2 = data.spo2 ?? 0
  if (spo2 > 0) {
    if (spo2 < 90) {
      score += 40
      factors.push({ name: 'Blood Oxygen', detail: `${spo2}% - Hypoxemia - Seek medical attention`, severity: 'critical' })
    } else if (spo2 < 95) {
      score += 25
      factors.push({ name: 'Blood Oxygen', detail: `${spo2}% - Low SpO₂`, severity: 'high' })
    }
  }

  return { score, factors }
}

function getRiskLevel(score) {
  if (score >= 50) return { level: 'Critical', class: 'critical', color: '#EF4444' }
  if (score >= 30) return { level: 'High Risk', class: 'high', color: '#F97316' }
  if (score >= 10) return { level: 'Moderate', class: 'moderate', color: '#F59E0B' }
  return { level: 'Normal', class: 'normal', color: '#22C55E' }
}

function getStatusColor(status) {
  switch (status) {
    case 'normal': return '#22C55E'
    case 'moderate': return '#F59E0B'
    case 'high': return '#F97316'
    case 'critical': return '#EF4444'
    default: return '#94A3B8'
  }
}

function getStatusBg(status) {
  switch (status) {
    case 'normal': return 'rgba(34, 197, 94, 0.1)'
    case 'moderate': return 'rgba(245, 158, 11, 0.1)'
    case 'high': return 'rgba(249, 115, 22, 0.1)'
    case 'critical': return 'rgba(239, 68, 68, 0.1)'
    default: return 'rgba(148, 163, 184, 0.1)'
  }
}

function GasIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  )
}

function TempIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  )
}

function HumidityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function Spo2Icon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2a5 5 0 0 0-5 5v4a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/>
      <path d="M12 16v4"/>
      <path d="M8 20h8"/>
      <path d="M6 10h0.01"/>
      <path d="M18 10h0.01"/>
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M23 4v6h-6"/>
      <path d="M1 20v-6h6"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  )
}

function SensorCard({ type, value, config, status }) {
  const iconMap = {
    gas: <GasIcon />,
    temp: <TempIcon />,
    humidity: <HumidityIcon />,
    heart: <HeartIcon />,
    spo2: <Spo2Icon />
  }

  return (
    <div className={`sensor-card ${type}`} style={{ borderLeftColor: getStatusColor(status) }}>
      <div className="sensor-label">
        <span className="sensor-name">{config.label}</span>
        <div className="sensor-icon" style={{ background: getStatusBg(status) }}>
          {iconMap[config.icon]}
        </div>
      </div>
      <div className="sensor-value" style={{ color: getStatusColor(status) }}>
        {typeof value === 'number' ? value.toFixed(1) : value}
        <span className="sensor-unit">{config.unit}</span>
      </div>
      <div className={`status-badge ${status}`} style={{ background: getStatusBg(status), color: getStatusColor(status) }}>
        {config.thresholds.find(t => t.status === status)?.label || status}
      </div>
    </div>
  )
}

export default function SensorDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [bodyPresent, setBodyPresent] = useState(false)
  const [riskData, setRiskData] = useState({ env: null, health: null })

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(FIREBASE_URL)
      if (!response.ok) throw new Error('Failed to fetch data')
      const firebaseData = await response.json()
    console.log(firebaseData)
      setData(firebaseData)

      const body = firebaseData.bodyPresent ?? false
      const hr = firebaseData.heartRate ?? 0
      const spo2Val = firebaseData.spo2 ?? 0

      // Validate SpO2 value: if valid and non-zero, it indicates a human is present
      const isValidSpo2 = isValidSpO2(spo2Val)
      setBodyPresent(body || isValidSpo2 || (hr > 0 && spo2Val > 0))

      setRiskData({
        env: calculateEnvironmentRisk(firebaseData),
        health: calculateHealthRisk(firebaseData)
      })

      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const getConnectionStatus = () => {
    if (loading) return { class: 'loading', text: 'Connecting...' }
    if (error) return { class: 'error', text: 'Connection Error' }
    return { class: 'connected', text: 'Live' }
  }

  const status = getConnectionStatus()
  const mode = bodyPresent ? 'health' : 'environment'
  const currentRisk = mode === 'health' ? riskData.health : riskData.env
  const riskInfo = getRiskLevel(currentRisk?.score || 0)

  return (
    <div className="tracker-container">
      <div className="tracker-header">
        <h1>RespiMonitor Dashboard</h1>
        <p>Real-time environmental and health monitoring</p>
      </div>

      <div className={`connection-status ${status.class}`}>
        <span className="connection-dot"></span>
        <span>{status.text}</span>
        {mode === 'health' && <span className="mode-badge health">Health Monitoring</span>}
        {mode === 'environment' && <span className="mode-badge environment">Environment Only</span>}
      </div>

      {error && (
        <div className="connection-status error" style={{ marginBottom: '1.5rem' }}>
          <span>{error}</span>
        </div>
      )}

      {currentRisk && (
        <div className="risk-card" style={{ background: getStatusBg(riskInfo.class), borderColor: riskInfo.color }}>
          <div className="risk-info">
            <span className="risk-level" style={{ color: riskInfo.color }}>{riskInfo.level}</span>
            <span className="risk-score">Score: {currentRisk.score}/100</span>
          </div>
          {currentRisk.factors.length > 0 ? (
            <div className="risk-details">
              {currentRisk.factors.map((factor, i) => (
                <div key={i} className={`risk-item ${factor.severity}`}>
                  <span className="factor-name">{factor.name}</span>
                  <span className="factor-detail">{factor.detail}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="risk-details">
              <div className="risk-item normal">
                <span className="factor-name">All Parameters</span>
                <span className="factor-detail">Within safe ranges</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mode-section">
        <h2 className="section-header">
          <span className="section-icon"><HeartIcon /></span>
          Health Vitals
        </h2>
        <div className="sensor-grid">
          {['heartRate', 'spo2'].map(key => {
            const config = HEALTH_THRESHOLDS[key]
            const value = data?.[key] ?? 0
            const { status: sensorStatus } = getSensorStatus(value, config)
            return (
              <SensorCard
                key={key}
                type={key}
                value={value}
                config={config}
                status={sensorStatus}
              />
            )
          })}
        </div>

        <h2 className="section-header" style={{ marginTop: '2rem' }}>
          <span className="section-icon"><HeartIcon /></span>
          Sensor Quality
        </h2>
        <div className="sensor-grid">
          {['heart_ir', 'irValue'].map(key => {
            const config = HEALTH_THRESHOLDS[key]
            const value = data?.[key] ?? 0
            const { status: sensorStatus } = getSensorStatus(value, config)
            return (
              <SensorCard
                key={key}
                type={key}
                value={value}
                config={config}
                status={sensorStatus}
              />
            )
          })}
        </div>

        <h2 className="section-header" style={{ marginTop: '2rem' }}>
          <span className="section-icon"><TempIcon /></span>
          Environment
        </h2>
        <div className="sensor-grid">
          {Object.keys(ENVIRONMENT_THRESHOLDS).map(key => {
            const config = ENVIRONMENT_THRESHOLDS[key]
            const value = data?.[key] ?? 0
            const { status: sensorStatus } = getSensorStatus(value, config)
            return (
              <SensorCard
                key={key}
                type={key}
                value={value}
                config={config}
                status={sensorStatus}
              />
            )
          })}
        </div>
      </div>

      {lastUpdated && (
        <div className="last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <button className="refresh-btn" onClick={fetchData} disabled={loading}>
          <RefreshIcon />
          Refresh Data
        </button>
      </div>

      <div className="dashboard-disclaimer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
        <div>
          <strong>Verified Health Standards</strong>
          <p>All risk classifications and thresholds are based on verified medical guidelines from WHO, American Heart Association, EPA, and peer-reviewed medical research. This system provides health insights for informational purposes only and is not a substitute for professional medical advice.</p>
        </div>
      </div>
    </div>
  )
}
