import { useState, useEffect } from 'react'

const INITIAL_STATE = {
  SpO2: 97,
  AQI: 50,
  Temp: 25,
  Humidity: 50,
  BPM: 72,
  signalQuality: 'HIGH',
  dataMissing: 0,
}

const HISTORY_LENGTH = {
  SpO2: 30,
  AQI: 60,
  Temp: 60,
  Humidity: 60,
  BPM: 60,
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function randomWalk(current, min, max, volatility = 1) {
  const change = (Math.random() - 0.5) * 2 * volatility
  return clamp(current + change, min, max)
}

function simulateSensorData(prevData) {
  return {
    SpO2: randomWalk(prevData.SpO2, 80, 100, 0.5),
    AQI: randomWalk(prevData.AQI, 0, 300, 3),
    Temp: randomWalk(prevData.Temp, 18, 38, 0.2),
    Humidity: clamp(
      randomWalk(prevData.Humidity, 20, 90, 0.3) + (Math.random() > 0.95 ? 5 : 0),
      20, 90
    ),
    BPM: randomWalk(prevData.BPM, 45, 130, 1),
    signalQuality: Math.random() > 0.05 ? 'HIGH' : 'LOW',
    dataMissing: Math.random() > 0.95 ? 3 : 0,
  }
}

function rollingAverage(values, window) {
  if (values.length === 0) return null
  const relevant = values.slice(-window)
  return relevant.reduce((a, b) => a + b, 0) / relevant.length
}

export function evaluateRisk(currentData, history) {
  const { SpO2, AQI, Temp, Humidity, BPM, signalQuality, dataMissing } = currentData
  
  const signalLow = signalQuality === 'LOW' || dataMissing > 2
  if (signalLow) {
    return { status: 'INVALID', alertSuppressed: true }
  }

  const SpO2History = history.SpO2 || []
  const AQIHistory = history.AQI || []
  const TempHistory = history.Temp || []
  const HumHistory = history.Humidity || []
  const BPMHistory = history.BPM || []

  const SpO2_avg = rollingAverage(SpO2History, 5)
  const AQI_avg = rollingAverage(AQIHistory, 60)
  const Temp_avg = rollingAverage(TempHistory, 60)
  const Hum_avg = rollingAverage(HumHistory, 60)

  const getOldSpO2 = (sec) => {
    const idx = SpO2History.length - sec
    return idx >= 0 ? SpO2History[idx] : SpO2History[0]
  }
  const SpO2_10sec_ago = getOldSpO2(5)
  const SpO2_drop = SpO2 - SpO2_10sec_ago

  const countConsecutiveDrops = () => {
    let count = 0
    for (let i = SpO2History.length - 1; i > 0; i--) {
      if (SpO2History[i] < SpO2History[i - 1]) count++
      else break
    }
    return count
  }
  const SpO2_consecutive_drops = countConsecutiveDrops()
  const SpO2_total_drop = SpO2History.length >= 4 
    ? SpO2History[Math.max(0, SpO2History.length - 4)] - SpO2 
    : 0

  let STATUS = 'NORMAL'
  let alertSuppressed = false

  const countCondition = (arr, fn, minCount) => {
    let count = 0
    for (let i = arr.length - 1; i >= 0; i--) {
      if (fn(arr[i])) count++
      else break
    }
    return count >= minCount
  }

  const SpO2_low_5sec = countCondition(SpO2History, v => v <= 92, 3)
  const AQI_high_60sec = countCondition(AQIHistory, v => v > 200, 30)
  const Temp_high_120sec = countCondition(TempHistory, v => v > 32, 60)
  const Hum_high_300sec = countCondition(HumHistory, v => v > 80, 150)
  const SpO2_90_5sec = countCondition(SpO2History, v => v <= 90, 3)
  const SpO2_drop_5pct = SpO2_drop <= -5 && SpO2_consecutive_drops >= 3
  const BPM_high_10sec = countCondition(BPMHistory, v => v > 120, 5)
  const BPM_low_10sec = countCondition(BPMHistory, v => v < 50, 5)
  const AQI_101_200 = countCondition(AQIHistory, v => v > 100 && v <= 200, 30)
  const Temp_30_300sec = countCondition(TempHistory, v => v > 30, 150)
  const Hum_low_300sec = countCondition(HumHistory, v => v < 30, 150)
  const SpO2_90_93_5sec = countCondition(SpO2History, v => v >= 90 && v <= 93, 3)
  const SpO2_decreasing = SpO2_consecutive_drops >= 3 && SpO2_total_drop >= 3

  if (
    (SpO2_low_5sec && AQI_high_60sec) ||
    (SpO2_low_5sec && Temp_high_120sec) ||
    (AQI_high_60sec && Hum_high_300sec)
  ) {
    STATUS = 'CRITICAL'
  }
  else if (
    SpO2_90_5sec ||
    AQI_high_60sec ||
    SpO2_drop_5pct ||
    BPM_high_10sec ||
    BPM_low_10sec ||
    Temp_high_120sec
  ) {
    STATUS = 'HIGH RISK'
  }
  else if (
    SpO2_90_93_5sec ||
    AQI_101_200 ||
    Temp_30_300sec ||
    Hum_low_300sec ||
    Hum_high_300sec ||
    SpO2_decreasing
  ) {
    STATUS = 'WARNING'
  }

  return {
    status: STATUS,
    alertSuppressed,
    metrics: {
      SpO2_avg: SpO2_avg?.toFixed(1),
      AQI_avg: AQI_avg?.toFixed(1),
      Temp_avg: Temp_avg?.toFixed(1),
      Hum_avg: Hum_avg?.toFixed(1),
      SpO2_drop: SpO2_drop.toFixed(1),
    }
  }
}

export function useSensorSimulation() {
  const [data, setData] = useState(INITIAL_STATE)
  const [history, setHistory] = useState({
    SpO2: [INITIAL_STATE.SpO2],
    AQI: [INITIAL_STATE.AQI],
    Temp: [INITIAL_STATE.Temp],
    Humidity: [INITIAL_STATE.Humidity],
    BPM: [INITIAL_STATE.BPM],
  })
  const [risk, setRisk] = useState({ status: 'NORMAL', alertSuppressed: false })
  const [lastAlertTime, setLastAlertTime] = useState(0)
  const [previousStatus, setPreviousStatus] = useState('NORMAL')

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = simulateSensorData(prev)
        
        setHistory(h => ({
          SpO2: [...h.SpO2, newData.SpO2].slice(-HISTORY_LENGTH.SpO2),
          AQI: [...h.AQI, newData.AQI].slice(-HISTORY_LENGTH.AQI),
          Temp: [...h.Temp, newData.Temp].slice(-HISTORY_LENGTH.Temp),
          Humidity: [...h.Humidity, newData.Humidity].slice(-HISTORY_LENGTH.Humidity),
          BPM: [...h.BPM, newData.BPM].slice(-HISTORY_LENGTH.BPM),
        }))

        return newData
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const result = evaluateRisk(data, history)
    
    let finalStatus = result.status
    if (previousStatus === 'HIGH RISK') {
      const SpO2_recovered = history.SpO2.slice(-5).filter(v => v >= 92).length >= 5
      const AQI_recovered = history.AQI.slice(-30).filter(v => v <= 150).length >= 30
      if (!SpO2_recovered || !AQI_recovered) {
        finalStatus = 'HIGH RISK'
      }
    }

    const now = Date.now()
    const alertSuppressed = now - lastAlertTime < 10000

    setRisk({
      status: finalStatus,
      alertSuppressed,
      metrics: result.metrics,
      shouldAlert: !alertSuppressed && finalStatus !== 'NORMAL' && finalStatus !== 'INVALID'
    })

    if (!alertSuppressed && finalStatus !== 'NORMAL' && finalStatus !== 'INVALID') {
      setLastAlertTime(now)
    }

    setPreviousStatus(finalStatus)
  }, [data, history, lastAlertTime, previousStatus])

  return { data, history, risk }
}
