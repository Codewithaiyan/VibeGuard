import { useState } from 'react'
import './App.css'

function App() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [filename, setFilename] = useState('code.py')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleScan = async () => {
    if (!code.trim()) {
      setError('Please enter some code to scan')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('http://localhost:8000/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, filename }),
      })

      if (!response.ok) throw new Error('Scan failed')

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#00ff88'
    if (score >= 60) return '#ffd700'
    if (score >= 40) return '#ff8c00'
    return '#ff4444'
  }

  const getSeverityColor = (severity) => {
    const colors = {
      CRITICAL: '#ff4444',
      HIGH: '#ff8c00',
      MEDIUM: '#ffd700',
      LOW: '#00ff88',
    }
    return colors[severity] || '#888'
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🛡️ VibeGuard</h1>
        <p>Ship safe. Every time.</p>
      </header>

      <div className="container">
        <div className="left-panel">
          <div className="controls">
            <input
              type="text"
              placeholder="Filename (e.g., app.py)"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="filename-input"
            />
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="java">Java</option>
              <option value="go">Go</option>
            </select>
          </div>

          <textarea
            placeholder="Paste your code here..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="code-editor"
          />

          <button onClick={handleScan} disabled={loading} className="scan-button">
            {loading ? 'Scanning...' : 'Scan Code'}
          </button>

          {error && <div className="error">{error}</div>}
        </div>

        <div className="right-panel">
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Analyzing code security...</p>
            </div>
          )}

          {result && (
            <>
              <div className="trust-score" style={{ borderColor: getScoreColor(result.trust_score) }}>
                <div className="score-circle" style={{ color: getScoreColor(result.trust_score) }}>
                  {result.trust_score}
                </div>
                <div className="score-label">Trust Score</div>
              </div>

              <div className="risk-badge" style={{ backgroundColor: getSeverityColor(result.risk_level) }}>
                {result.risk_level}
              </div>

              <div className="summary">
                <h3>Summary</h3>
                <p>{result.summary}</p>
              </div>

              {result.vulnerabilities && result.vulnerabilities.length > 0 && (
                <div className="vulnerabilities">
                  <h3>Vulnerabilities ({result.vulnerabilities.length})</h3>
                  {result.vulnerabilities.map((vuln, idx) => (
                    <div key={idx} className="vulnerability">
                      <div className="vuln-header">
                        <span
                          className="severity-badge"
                          style={{ backgroundColor: getSeverityColor(vuln.severity) }}
                        >
                          {vuln.severity}
                        </span>
                        <span className="vuln-title">{vuln.title}</span>
                        <span className="line-number">Line {vuln.line_number}</span>
                      </div>
                      <p className="vuln-description">{vuln.description}</p>
                      <div className="vuln-fix">
                        <strong>Fix:</strong> {vuln.fix}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result.vulnerabilities && result.vulnerabilities.length === 0 && (
                <div className="no-vulnerabilities">✅ No vulnerabilities detected!</div>
              )}
            </>
          )}

          {!loading && !result && (
            <div className="placeholder">
              <p>👈 Paste your code and click "Scan Code" to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
