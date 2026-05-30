import { useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const CODE_PLACEHOLDER = 'Paste your code here...'
const DEPENDENCY_PLACEHOLDER = `# requirements.txt
fastapi==0.115.0
openai==1.52.0

# package.json
{
  "dependencies": {
    "express": "^4.21.0"
  }
}`

const STATUS_COLORS = {
  CRITICAL: '#ff4444',
  HIGH: '#ff8c00',
  MEDIUM: '#ffd700',
  LOW: '#00ff88',
  SAFE: '#00c27a',
  UNKNOWN: '#6c7486',
}

const getScoreColor = (score) => {
  if (score >= 80) return '#00ff88'
  if (score >= 60) return '#ffd700'
  if (score >= 40) return '#ff8c00'
  return '#ff4444'
}

const getStatusColor = (status) => STATUS_COLORS[status] || STATUS_COLORS.UNKNOWN

async function getErrorMessage(response, fallbackMessage) {
  try {
    const data = await response.json()
    return data.detail || data.message || fallbackMessage
  } catch {
    return fallbackMessage
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('code')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [filename, setFilename] = useState('code.py')
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeResult, setCodeResult] = useState(null)
  const [codeError, setCodeError] = useState(null)

  const [dependencyContent, setDependencyContent] = useState('')
  const [dependencyFilename, setDependencyFilename] = useState('requirements.txt')
  const [dependencyLoading, setDependencyLoading] = useState(false)
  const [dependencyResult, setDependencyResult] = useState(null)
  const [dependencyError, setDependencyError] = useState(null)

  const handleCodeScan = async () => {
    if (!code.trim()) {
      setCodeError('Please enter some code to scan')
      return
    }

    setCodeLoading(true)
    setCodeError(null)
    setCodeResult(null)

    try {
      const response = await fetch(`${API_URL}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, filename }),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Code scan failed'))
      }

      const data = await response.json()
      setCodeResult(data)
    } catch (err) {
      setCodeError(err.message)
    } finally {
      setCodeLoading(false)
    }
  }

  const handleDependencyScan = async () => {
    if (!dependencyContent.trim()) {
      setDependencyError('Please paste a dependency file to scan')
      return
    }

    if (!dependencyFilename.trim()) {
      setDependencyError('Please provide the dependency filename')
      return
    }

    setDependencyLoading(true)
    setDependencyError(null)
    setDependencyResult(null)

    try {
      const response = await fetch(`${API_URL}/scan-dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_content: dependencyContent, filename: dependencyFilename }),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Dependency scan failed'))
      }

      const data = await response.json()
      setDependencyResult(data)
    } catch (err) {
      setDependencyError(err.message)
    } finally {
      setDependencyLoading(false)
    }
  }

  const renderCodeResults = () => {
    if (codeLoading) {
      return (
        <div className="loading">
          <div className="spinner"></div>
          <p>Analyzing code security...</p>
        </div>
      )
    }

    if (!codeResult) {
      return (
        <div className="placeholder">
          <p>Paste your code and click "Scan Code" to begin.</p>
        </div>
      )
    }

    return (
      <>
        <div className="trust-score" style={{ borderColor: getScoreColor(codeResult.trust_score) }}>
          <div className="score-circle" style={{ color: getScoreColor(codeResult.trust_score) }}>
            {codeResult.trust_score}
          </div>
          <div className="score-label">Trust Score</div>
        </div>

        <div className="risk-badge" style={{ backgroundColor: getStatusColor(codeResult.risk_level) }}>
          {codeResult.risk_level}
        </div>

        <div className="summary">
          <h3>Summary</h3>
          <p>{codeResult.summary}</p>
        </div>

        {codeResult.vulnerabilities && codeResult.vulnerabilities.length > 0 ? (
          <div className="vulnerabilities">
            <h3>Vulnerabilities ({codeResult.vulnerabilities.length})</h3>
            {codeResult.vulnerabilities.map((vuln, idx) => (
              <div key={`${vuln.title}-${idx}`} className="vulnerability">
                <div className="vuln-header">
                  <span
                    className="severity-badge"
                    style={{ backgroundColor: getStatusColor(vuln.severity) }}
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
        ) : (
          <div className="no-vulnerabilities">No vulnerabilities detected.</div>
        )}
      </>
    )
  }

  const renderDependencyResults = () => {
    if (dependencyLoading) {
      return (
        <div className="loading">
          <div className="spinner"></div>
          <p>Checking dependencies against OSV.dev...</p>
        </div>
      )
    }

    if (!dependencyResult) {
      return (
        <div className="placeholder">
          <p>Paste a dependency file and click "Scan Dependencies" to begin.</p>
        </div>
      )
    }

    const notes = dependencyResult.warnings || []
    const scannedPackages = dependencyResult.scanned_packages ?? dependencyResult.total_packages
    const noteTitle = dependencyResult.scan_status === 'skipped'
      ? 'Dependency Scan Skipped'
      : dependencyResult.scan_status === 'partial'
        ? 'Dependency Scan Notes'
        : 'Dependency Scan Summary'

    return (
      <>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{scannedPackages}</div>
            <div className="stat-label">Packages Scanned</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{dependencyResult.vulnerable_packages}</div>
            <div className="stat-label">Vulnerable Packages</div>
          </div>
          <div className="stat-card" style={{ borderColor: getScoreColor(dependencyResult.dependency_score) }}>
            <div className="stat-value" style={{ color: getScoreColor(dependencyResult.dependency_score) }}>
              {dependencyResult.dependency_score}
            </div>
            <div className="stat-label">Dependency Score</div>
          </div>
        </div>

        <div className="risk-badge" style={{ backgroundColor: getStatusColor(dependencyResult.risk_level) }}>
          {dependencyResult.risk_level}
        </div>

        {notes.length > 0 && (
          <div className="notes-panel">
            <h3>{noteTitle}</h3>
            <ul className="notes-list">
              {notes.map((note, index) => (
                <li key={`${note}-${index}`}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {dependencyResult.vulnerabilities && dependencyResult.vulnerabilities.length > 0 ? (
          <div className="vulnerabilities">
            <h3>Known Vulnerabilities ({dependencyResult.vulnerabilities.length})</h3>
            {dependencyResult.vulnerabilities.map((vuln, idx) => (
              <div key={`${vuln.package_name}-${vuln.vulnerability_id}-${idx}`} className="vulnerability">
                <div className="vuln-header">
                  <span
                    className="severity-badge"
                    style={{ backgroundColor: getStatusColor(vuln.severity) }}
                  >
                    {vuln.severity}
                  </span>
                  <span className="vuln-title">{vuln.vulnerability_id}</span>
                  <span className="package-version">{vuln.package_name}@{vuln.current_version}</span>
                </div>
                <div className="vuln-meta">
                  <span className="meta-pill">{vuln.title}</span>
                  {vuln.fixed_version && <span className="meta-pill meta-pill-fix">Fix {vuln.fixed_version}</span>}
                </div>
                <p className="vuln-description">{vuln.description}</p>
                <div className="vuln-fix">
                  <strong>Fix:</strong> {vuln.fixed_version ? `Upgrade to version ${vuln.fixed_version}` : 'No fixed version published yet.'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-vulnerabilities">
            {dependencyResult.risk_level === 'UNKNOWN'
              ? 'No known dependency vulnerabilities were returned for the packages that could be checked.'
              : 'No known dependency vulnerabilities detected.'}
          </div>
        )}
      </>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🛡️ VibeGuard</h1>
        <p>Ship safe. Every time.</p>
      </header>

      <div className="tabs">
        <button
          type="button"
          className={`tab ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          Code Scanner
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'dependencies' ? 'active' : ''}`}
          onClick={() => setActiveTab('dependencies')}
        >
          Dependency Scanner
        </button>
      </div>

      <div className="container">
        <div className="left-panel">
          {activeTab === 'code' ? (
            <>
              <div className="controls">
                <input
                  type="text"
                  placeholder="Filename (e.g., app.py)"
                  value={filename}
                  onChange={(event) => setFilename(event.target.value)}
                  className="filename-input"
                />
                <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="go">Go</option>
                </select>
              </div>

              <textarea
                placeholder={CODE_PLACEHOLDER}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="code-editor"
              />

              <button onClick={handleCodeScan} disabled={codeLoading} className="scan-button">
                {codeLoading ? 'Scanning...' : 'Scan Code'}
              </button>

              {codeError && <div className="error">{codeError}</div>}
            </>
          ) : (
            <>
              <div className="controls controls-stack">
                <input
                  type="text"
                  placeholder="Filename (requirements.txt, package.json, go.mod)"
                  value={dependencyFilename}
                  onChange={(event) => setDependencyFilename(event.target.value)}
                  className="filename-input"
                />
                <p className="form-hint">
                  Supported files: <code>requirements.txt</code>, <code>package.json</code>, <code>go.mod</code>
                </p>
              </div>

              <textarea
                placeholder={DEPENDENCY_PLACEHOLDER}
                value={dependencyContent}
                onChange={(event) => setDependencyContent(event.target.value)}
                className="code-editor"
              />

              <button onClick={handleDependencyScan} disabled={dependencyLoading} className="scan-button">
                {dependencyLoading ? 'Scanning...' : 'Scan Dependencies'}
              </button>

              {dependencyError && <div className="error">{dependencyError}</div>}
            </>
          )}
        </div>

        <div className="right-panel">
          {activeTab === 'code' ? renderCodeResults() : renderDependencyResults()}
        </div>
      </div>
    </div>
  )
}

export default App
