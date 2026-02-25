import '../styles/Home.css';
import '../styles/Buttons.css';

function Home() {
  return (
    <div className="page">
      <div className="bg-orb bg-orb-1" aria-hidden="true" />
      <div className="bg-orb bg-orb-2" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">QIH</span>
          <div className="brand-text">
            <p>Quarterly Insight</p>
            <p>Hub</p>
          </div>
        </div>
        <nav className="nav">
          <a href="#modules">Modules</a>
          <a href="#workflow">Workflow</a>
          <a href="#reports">Reports</a>
        </nav>
        <button className="cta">Request Demo</button>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <p className="eyebrow">Capstone System</p>
            <h1>
              Quarterly Item Analysis &amp; Academic Performance
              Consolidation System
            </h1>
            <p className="hero-subtitle">
              Turn raw exam results into actionable insights with automated item
              analysis, consolidated performance dashboards, and evidence-ready
              reporting.
            </p>
            <div className="hero-actions">
              <button className="cta primary">Start a new analysis</button>
              <button className="cta ghost">View sample report</button>
            </div>
            <div className="hero-metrics">
              <div>
                <span className="metric">12k+</span>
                <span className="metric-label">Items processed</span>
              </div>
              <div>
                <span className="metric">97%</span>
                <span className="metric-label">Reliability signal</span>
              </div>
              <div>
                <span className="metric">5 mins</span>
                <span className="metric-label">Average analysis time</span>
              </div>
            </div>
          </div>
          <div className="hero-panel" aria-label="Preview analytics dashboard">
            <div className="panel-header">
              <span>Grade 10 - Science</span>
              <span className="chip">Q2</span>
            </div>
            <div className="panel-grid">
              <div className="panel-card">
                <p>Difficulty Index</p>
                <h3>0.54</h3>
                <span>Balanced</span>
              </div>
              <div className="panel-card">
                <p>Discrimination</p>
                <h3>0.42</h3>
                <span>Strong</span>
              </div>
              <div className="panel-card">
                <p>Mastery Rate</p>
                <h3>78%</h3>
                <span>+6% QoQ</span>
              </div>
              <div className="panel-card">
                <p>Top Misconception</p>
                <h3>Energy</h3>
                <span>Item 14</span>
              </div>
            </div>
          </div>
        </section>

        <section className="modules" id="modules">
          <div className="section-title">
            <h2>Designed for every academic role</h2>
            <p>Workflows tailored for teachers, department heads, and admins.</p>
          </div>
          <div className="module-grid">
            <article>
              <h3>Auth &amp; Roles</h3>
              <p>Secure access for teachers, department heads, and admins.</p>
            </article>
            <article>
              <h3>Exam Management</h3>
              <p>Upload results, validate scores, and organize by quarter.</p>
            </article>
            <article>
              <h3>Analytics Engine</h3>
              <p>Automatic item analysis with reliability and validity checks.</p>
            </article>
            <article>
              <h3>Reporting Suite</h3>
              <p>Visual narratives with charts, trends, and performance gaps.</p>
            </article>
          </div>
        </section>

        <section className="workflow" id="workflow">
          <div className="section-title">
            <h2>From upload to insights in three steps</h2>
            <p>Automate the quarterly cycle without manual spreadsheets.</p>
          </div>
          <div className="timeline">
            <div>
              <span className="step">01</span>
              <h3>Upload exam results</h3>
              <p>Drag and drop CSV files with built-in validation rules.</p>
            </div>
            <div>
              <span className="step">02</span>
              <h3>Run item analysis</h3>
              <p>AI engine calculates difficulty, discrimination, and mastery.</p>
            </div>
            <div>
              <span className="step">03</span>
              <h3>Publish reports</h3>
              <p>Export branded PDF summaries and interactive dashboards.</p>
            </div>
          </div>
        </section>

        <section className="reporting" id="reports">
          <div className="reporting-card">
            <h2>Reporting that tells the whole story</h2>
            <p>
              Consolidate quarterly performance across sections, subjects, and
              campuses. Share insight-ready charts with stakeholders.
            </p>
            <ul>
              <li>Subject mastery and learning gap heatmaps</li>
              <li>Top 10 misconceptions per competency</li>
              <li>Quarter-on-quarter trend comparisons</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Built for academic leaders who want decisions backed by data.</p>
        <div className="footer-links">
          <a href="#home">Overview</a>
          <a href="#modules">Modules</a>
          <a href="#reports">Reporting</a>
        </div>
      </footer>
    </div>
  );
}

export default Home;
