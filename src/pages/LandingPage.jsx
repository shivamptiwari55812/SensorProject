import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <div className="landing-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Real-time Respiratory<br />Health Monitoring</h1>
          <p>Advanced IoT-based environmental monitoring system using ESP32 sensors to track air quality and predict respiratory health risks using SpO2.</p>
          <Link to="/dashboard" className="cta-button">
            View Live Dashboard
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
        <div className="hero-visual">
          <div className="monitor-display">
            <div className="monitor-header">
              <span className="live-indicator"></span>
              <span>Live Monitoring</span>
            </div>
            <div className="monitor-values">
              <div className="monitor-item">
                <span className="monitor-label">Temperature</span>
                <span className="monitor-value">24.5°C</span>
              </div>
              <div className="monitor-item">
                <span className="monitor-label">Humidity</span>
                <span className="monitor-value">58%</span>
              </div>
              <div className="monitor-item">
                <span className="monitor-label">Air Quality</span>
                <span className="monitor-value good">Good</span>
              </div>
              <div className="monitor-item">
                <span className="monitor-label">Heart Rate</span>
                <span className="monitor-value">72 BPM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="4" y="4" width="16" height="16" rx="2"/>
                <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01"/>
              </svg>
            </div>
            <h3>Sensor Collection</h3>
            <p>ESP32 collects data from MAX30102, DHT11, and MQ135 sensors for comprehensive environmental analysis.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <h3>Real-time Sync</h3>
            <p>Data is instantly synced to Firebase Realtime Database for cloud access and monitoring from anywhere.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h3>Risk Analysis</h3>
            <p>Intelligent classification system categorizes air quality and health metrics into risk levels.</p>
          </div>
        </div>
      </section>

      <section className="sensors-section">
        <h2>Connected Sensors</h2>
        <div className="sensors-list">
          <div className="sensor-item">
            <div className="sensor-badge">MAX30102</div>
            <div className="sensor-info">
              <h4>Pulse Oximeter & Heart Rate</h4>
              <p>Measures SpO₂ and heart rate using infrared light</p>
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-badge">DHT11</div>
            <div className="sensor-info">
              <h4>Temperature & Humidity</h4>
              <p>Environmental conditions monitoring</p>
            </div>
          </div>
          <div className="sensor-item">
            <div className="sensor-badge">MQ135</div>
            <div className="sensor-info">
              <h4>Air Quality (Gas)</h4>
              <p>Detects CO₂, ammonia, benzene, and smoke levels</p>
            </div>
          </div>
        </div>
      </section>

      <section className="verified-section">
        <h2>Verified Health Standards</h2>
        <p className="verified-intro">
          All risk classifications and thresholds in this system are based on verified medical standards and guidelines from trusted international organizations, ensuring accurate and reliable health assessments.
        </p>
        <div className="sources-grid">
          <div className="source-card">
            <div className="source-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h4>World Health Organization (WHO)</h4>
            <p>Global air quality guidelines and health impact thresholds</p>
          </div>
          <div className="source-card">
            <div className="source-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <h4>American Heart Association</h4>
            <p>Normal heart rate ranges and cardiovascular health standards</p>
          </div>
          <div className="source-card">
            <div className="source-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h4>EPA Guidelines</h4>
            <p>Environmental Protection Agency air quality index standards</p>
          </div>
          <div className="source-card">
            <div className="source-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
              </svg>
            </div>
            <h4>Medical Research Journals</h4>
            <p>Peer-reviewed studies on SpO₂ and respiratory health</p>
          </div>
        </div>
        <div className="verification-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
          <p>Every health recommendation provided by this system is backed by scientific research and international health standards. This is not a substitute for professional medical advice.</p>
        </div>
      </section>

      <section className="risk-section">
        <h2>Risk Classification</h2>
        <p className="risk-intro">
          Based on verified thresholds from trusted medical and environmental organizations.
        </p>
        <div className="risk-grid">
          <div className="risk-card good">
            <div className="risk-level">Low Risk</div>
            <div className="risk-criteria">
              <p>Air Quality Index below 1000 ppm</p>
              <p>Temperature 18-26°C</p>
              <p>Humidity 30-60%</p>
              <p>Heart Rate 60-100 BPM</p>
              <p>SpO₂ 95-100%</p>
            </div>
          </div>
          <div className="risk-card moderate">
            <div className="risk-level">Moderate Risk</div>
            <div className="risk-criteria">
              <p>Air Quality 1000-2000 ppm</p>
              <p>Temperature 26-35°C</p>
              <p>Humidity 60-80%</p>
              <p>Heart Rate 100-120 BPM</p>
              <p>SpO₂ 90-95%</p>
            </div>
          </div>
          <div className="risk-card high">
            <div className="risk-level">High Risk</div>
            <div className="risk-criteria">
              <p>Air Quality 2000-3000 ppm</p>
              <p>Temperature 15-18°C or 35-40°C</p>
              <p>Heart Rate above 120 BPM</p>
              <p>SpO₂ 85-90%</p>
            </div>
          </div>
          <div className="risk-card critical">
            <div className="risk-level">Critical</div>
            <div className="risk-criteria">
              <p>Air Quality above 3000 ppm</p>
              <p>Temperature below 15°C or above 40°C</p>
              <p>Heart Rate above 150 or below 40 BPM</p>
              <p>SpO₂ below 85%</p>
              <p>Immediate action required</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Start Monitoring Today</h2>
        <p>Access real-time sensor data and health risk analysis from anywhere, backed by verified medical standards.</p>
        <Link to="/dashboard" className="cta-button primary">
          Open Dashboard
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </section>
    </div>
  )
}

export default LandingPage
