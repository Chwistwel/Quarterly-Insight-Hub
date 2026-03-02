import { Link } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  return (
    <div className="page">
      <div className="bg-orb bg-orb-1" aria-hidden="true" />
      <div className="bg-orb bg-orb-2" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">QIH</div>
          <strong>QIH</strong>
        </div>
        <nav className="nav">
          <a href="#modules">Modules</a>
          <a href="#workflow">Workflow</a>
          <a href="#reports">Reports</a>
        </nav>
        <Link className="cta" to="/auth?mode=signup&role=teacher">Sign Up</Link>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <p className="eyebrow">Capstone System</p>
            <h1>Quarterly Item Analysis & Academic Performance Consolidation</h1>
            <p>
              Convert assessment results into clear instructional actions with role-based dashboards,
              item analytics, and quarterly reporting for teachers and administrators.
            </p>
            <div className="hero-actions">
              <Link className="hero-btn primary" to="/auth?mode=login&role=teacher">Login as Teacher</Link>
              <Link className="hero-btn ghost" to="/auth?mode=login&role=administrator">Login as Admin</Link>
            </div>
          </div>

          <article className="hero-panel">
            <div className="panel-header">
              <span>Grade 7 - Q1 Analysis</span>
              <span className="chip">Live</span>
            </div>
            <div className="panel-grid">
              <div><p>Average Score</p><h3>76.8%</h3></div>
              <div><p>Pass Rate</p><h3>79%</h3></div>
              <div><p>Students</p><h3>540</h3></div>
              <div><p>Total Items</p><h3>120</h3></div>
            </div>
            <div className="preview-bars">
              <span style={{ height: '76%' }} />
              <span style={{ height: '79%' }} />
              <span style={{ height: '82%' }} />
              <span style={{ height: '85%' }} />
            </div>
          </article>
        </section>

        <section className="modules" id="modules">
          <h2>Designed for every academic role</h2>
          <p>Workflows tailored for teachers, department heads, and admins.</p>
          <div className="module-grid">
            <article>
              <h3>Auth & Roles</h3>
              <p>Secure teacher and administrator access with dedicated screens.</p>
            </article>
            <article>
              <h3>Exam Management</h3>
              <p>Upload and validate quarterly exam results by grade and section.</p>
            </article>
            <article>
              <h3>Analytics Engine</h3>
              <p>Compute item difficulty, discrimination, and performance trends instantly.</p>
            </article>
            <article>
              <h3>Reporting Suite</h3>
              <p>Generate evidence-ready reports and track least-mastered competencies.</p>
            </article>
          </div>
        </section>

        <section className="workflow" id="workflow">
          <h2>From upload to insights in three steps</h2>
          <p>Automate the full quarterly cycle without manual spreadsheets.</p>
          <div className="timeline">
            <article>
              <span>01</span>
              <h3>Upload exam results</h3>
              <p>Teachers upload CSV and section-level scores securely.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Run item analysis</h3>
              <p>System computes indices and class-level mastery trends.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Publish reports</h3>
              <p>Admins review dashboards and generate quarterly performance summaries.</p>
            </article>
          </div>
        </section>

        <section className="reporting" id="reports">
          <div className="reporting-card">
          <h2>Ready to start your quarterly insight cycle?</h2>
          <p>Choose your role and continue to the authentication page.</p>
          <div className="hero-actions">
            <Link className="hero-btn primary" to="/auth?mode=login&role=teacher">Teacher Access</Link>
            <Link className="hero-btn ghost" to="/auth?mode=login&role=administrator">Administrator Access</Link>
          </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
