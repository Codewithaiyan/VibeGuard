import { Link } from 'react-router-dom'
import './Landing.css'

const githubUrl = 'https://github.com/Codewithaiyan/VibeGuard'

const steps = [
  {
    title: 'Write Code with AI',
    description: 'Use Codex or any AI tool to build fast',
    icon: RobotIcon,
  },
  {
    title: 'VibeGuard Scans',
    description: 'Every PR is automatically analyzed for security issues',
    icon: ShieldIcon,
  },
  {
    title: 'Ship Safe',
    description: 'Merge only when your code passes the security check',
    icon: RocketIcon,
  },
]

const catches = [
  {
    title: 'Hardcoded Secrets',
    description: 'Detects passwords, tokens, and credentials committed directly into source.',
  },
  {
    title: 'SQL Injection',
    description: 'Finds unsafe query composition before attacker input reaches your database.',
  },
  {
    title: 'Command Injection',
    description: 'Flags shell execution paths that trust unescaped user-controlled values.',
  },
  {
    title: 'Broken Authentication',
    description: 'Surfaces weak auth flows, missing checks, and risky session handling.',
  },
  {
    title: 'Missing Input Validation',
    description: 'Highlights endpoints that accept untrusted data without guardrails.',
  },
  {
    title: 'Exposed API Keys',
    description: 'Catches leaked provider keys before they land in production or logs.',
  },
]

const demoCode = [
  'import { exec } from "node:child_process";',
  'import express from "express";',
  '',
  'const app = express();',
  'const OPENAI_API_KEY = "sk-live-demo-unsafe";',
  '',
  'app.get("/users", async (req, res) => {',
  '  const query = `SELECT * FROM users WHERE email = \'${req.query.email}\'`;',
  '  exec(`tar -czf backup.tgz ${req.query.path}`);',
  '  res.json({ ok: true, query });',
  '});',
]

const vulnerabilities = [
  {
    severity: 'CRITICAL',
    title: 'SQL Injection',
    line: 8,
    description: 'User-controlled input is interpolated directly into a SQL statement.',
    fix: 'Use parameterized queries and validate the email input before query execution.',
  },
  {
    severity: 'HIGH',
    title: 'Command Injection',
    line: 9,
    description: 'Shell execution uses untrusted path input without sanitization or escaping.',
    fix: 'Replace shell execution with safe APIs or strictly validate and escape the path.',
  },
  {
    severity: 'HIGH',
    title: 'Hardcoded Secret',
    line: 5,
    description: 'A live API key is embedded in source code and would ship in the repository.',
    fix: 'Move secrets into environment variables and rotate any exposed credentials.',
  },
]

function Landing() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <Link className="landing-brand" to="/" aria-label="VibeGuard home">
          <span className="landing-brand-mark" aria-hidden="true">
            <ShieldIcon />
          </span>
          <span className="landing-brand-copy">
            <strong>VibeGuard</strong>
            <span>AI code security that keeps up</span>
          </span>
        </Link>

        <Link className="landing-button landing-button--primary landing-button--compact" to="/app">
          Try Demo
        </Link>
      </nav>

      <main className="landing-main">
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow">AI-native security for every pull request</span>
            <h1 id="landing-hero-title">
              <span>Your AI writes code fast.</span>
              <em>VibeGuard makes sure it&apos;s safe.</em>
            </h1>
            <p className="landing-subheading">
              Automated security scanning for AI-generated code. Catch vulnerabilities before they
              hit production.
            </p>

            <div className="landing-hero-actions">
              <Link className="landing-button landing-button--primary" to="/app">
                Try Demo <span aria-hidden="true">→</span>
              </Link>
              <a
                className="landing-button landing-button--secondary"
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
              >
                <GitHubIcon />
                <span>View on GitHub</span>
              </a>
            </div>

            <p className="landing-proof">
              <span className="landing-proof-pulse" aria-hidden="true"></span>
              45% of AI-generated code ships with vulnerabilities
            </p>
          </div>

          <div className="landing-hero-signal" aria-label="VibeGuard scan status preview">
            <div className="landing-terminal-chrome">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="landing-terminal-body">
              <p className="landing-terminal-label">pull-request security gate</p>
              <code>$ vibeguard scan --pr 184 --strict</code>
              <div className="landing-terminal-output">
                <span>status</span>
                <strong>blocked</strong>
              </div>
              <div className="landing-terminal-output landing-terminal-output--muted">
                <span>findings</span>
                <strong>3 exploitable issues across changed files</strong>
              </div>
              <div className="landing-terminal-tags">
                <span>secrets</span>
                <span>injection</span>
                <span>auth</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-steps" aria-labelledby="how-it-works-title">
          <div className="landing-section-heading">
            <span className="landing-eyebrow">How it works</span>
            <h2 id="how-it-works-title">Security review built directly into your AI workflow.</h2>
          </div>

          <div className="landing-steps-grid">
            {steps.map(({ title, description, icon: Icon }, index) => (
              <article className="landing-step-card" key={title}>
                <div className="landing-step-topline">
                  <span className="landing-step-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="landing-step-number">0{index + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-threats" aria-labelledby="what-we-catch-title">
          <div className="landing-section-heading">
            <span className="landing-eyebrow">What we catch</span>
            <h2 id="what-we-catch-title">The classes of issues most teams miss when moving fast.</h2>
          </div>

          <div className="landing-threat-grid">
            {catches.map(({ title, description }) => (
              <article className="landing-threat-card" key={title}>
                <div className="landing-threat-head">
                  <span className="landing-warning-icon" aria-hidden="true">
                    <WarningIcon />
                  </span>
                  <h3>{title}</h3>
                </div>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-demo" aria-labelledby="live-demo-title">
          <div className="landing-section-heading">
            <span className="landing-eyebrow">See it in action</span>
            <h2 id="live-demo-title">Live Demo Preview</h2>
          </div>

          <div className="landing-demo-frame">
            <div className="landing-demo-pane landing-demo-pane--code">
              <div className="landing-demo-pane-header">
                <span className="landing-demo-pill">routes/users.ts</span>
                <span className="landing-demo-meta">Changed in PR #184</span>
              </div>
              <div className="landing-code-block" aria-label="Vulnerable code example">
                {demoCode.map((line, index) => (
                  <div className="landing-code-line" key={`${index + 1}-${line}`}>
                    <span className="landing-code-number">{index + 1}</span>
                    <code>{line || ' '}</code>
                  </div>
                ))}
              </div>
            </div>

            <div className="landing-demo-pane landing-demo-pane--comment">
              <div className="landing-comment-card">
                <div className="landing-comment-header">
                  <div>
                    <span className="landing-comment-author">vibeguard[bot]</span>
                    <span className="landing-comment-time">commented on this PR</span>
                  </div>
                  <span className="landing-comment-status">security review</span>
                </div>

                <div className="landing-comment-summary">
                  <div>
                    <span className="landing-summary-label">Trust Score</span>
                    <strong>20/100</strong>
                  </div>
                  <span className="landing-critical-pill">CRITICAL</span>
                </div>

                <div className="landing-comment-table">
                  <div className="landing-comment-table-head">
                    <span>File</span>
                    <span>Score</span>
                    <span>Risk</span>
                  </div>
                  <div className="landing-comment-table-row">
                    <code>routes/users.ts</code>
                    <span>20/100</span>
                    <span className="landing-risk-text">CRITICAL</span>
                  </div>
                </div>

                <div className="landing-comment-findings">
                  <h3>3 vulnerabilities found</h3>
                  <ul>
                    {vulnerabilities.map((item) => (
                      <li key={`${item.title}-${item.line}`}>
                        <div className="landing-finding-title">
                          <span className={`landing-severity landing-severity--${item.severity.toLowerCase()}`}>
                            {item.severity}
                          </span>
                          <strong>
                            {item.title} · Line {item.line}
                          </strong>
                        </div>
                        <p>{item.description}</p>
                        <span className="landing-finding-fix">Fix: {item.fix}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <span>Built for the OpenAI x Outskill Hackathon</span>
        <a href={githubUrl} target="_blank" rel="noreferrer">
          <GitHubIcon />
          <span>GitHub</span>
        </a>
        <span>Ship safe. Every time.</span>
      </footer>
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3 5.5 5.7v5.9c0 4.3 2.6 8.2 6.5 9.9 3.9-1.7 6.5-5.6 6.5-9.9V5.7L12 3Z" />
      <path d="m9.2 12 1.9 1.9 3.9-4.1" />
    </svg>
  )
}

function RobotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="5" y="8" width="14" height="10" rx="3" />
      <path d="M12 4v4" />
      <path d="M9 13h.01M15 13h.01" />
      <path d="M9 18v2M15 18v2M5 13H3M21 13h-2" />
    </svg>
  )
}

function RocketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 19c2.5-.2 4.1-1 5.2-2.2 1.7-1.7 2.7-4.2 3-7.4 3.2.3 5.7 1.3 7.4 3-2.3 2-4.8 3.6-7.6 4.9L8 22l-3-3 0-5Z" />
      <path d="M14.5 9.5 19 5m-4.5 4.5 4-4" />
      <circle cx="15.5" cy="8.5" r="1.5" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 4 3.5 19h17L12 4Z" />
      <path d="M12 9v4" />
      <path d="M12 16h.01" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.23c-3.34.72-4.04-1.42-4.04-1.42-.55-1.37-1.33-1.73-1.33-1.73-1.09-.74.08-.72.08-.72 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.3.76-1.59-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.16 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.29-1.23 3.29-1.23.66 1.64.25 2.86.13 3.16.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
    </svg>
  )
}

export default Landing
